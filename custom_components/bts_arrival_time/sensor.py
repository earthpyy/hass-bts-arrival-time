"""Sensors for BTS Skytrain Arrival Time."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .api import Train
from .const import (
    CONF_DESTINATION_NAME,
    CONF_STATION_KEY,
    CONF_STATION_NAME,
    DOMAIN,
)
from .coordinator import ArrivalData, BtsArrivalCoordinator, BtsConfigEntry

PARALLEL_UPDATES = 0


def _trains(data: ArrivalData) -> list[Train]:
    return data.platform.trains if data.platform else []


def _train_minutes(index: int) -> Callable[[ArrivalData], int | None]:
    def value(data: ArrivalData) -> int | None:
        trains = _trains(data)
        if len(trains) <= index:
            return None
        train = trains[index]
        return 0 if train.is_arriving else max(train.minutes, 0)

    return value


def _next_arrival(data: ArrivalData) -> datetime | None:
    trains = _trains(data)
    if not trains:
        return None
    train = trains[0]
    minutes = 0.0 if train.is_arriving else max(train.minutes_exact, 0.0)
    return (data.fetched_at + timedelta(minutes=minutes)).replace(microsecond=0)


@dataclass(frozen=True, kw_only=True)
class BtsSensorDescription(SensorEntityDescription):
    value_fn: Callable[[ArrivalData], Any]


SENSORS: tuple[BtsSensorDescription, ...] = (
    BtsSensorDescription(
        key="next_train_minutes",
        translation_key="next_train_minutes",
        native_unit_of_measurement=UnitOfTime.MINUTES,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:train",
        value_fn=_train_minutes(0),
    ),
    BtsSensorDescription(
        key="following_train_minutes",
        translation_key="following_train_minutes",
        native_unit_of_measurement=UnitOfTime.MINUTES,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:train-variant",
        value_fn=_train_minutes(1),
    ),
    BtsSensorDescription(
        key="next_arrival",
        translation_key="next_arrival",
        device_class=SensorDeviceClass.TIMESTAMP,
        value_fn=_next_arrival,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: BtsConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    coordinator = entry.runtime_data
    async_add_entities(BtsArrivalSensor(coordinator, desc) for desc in SENSORS)


class BtsArrivalSensor(CoordinatorEntity[BtsArrivalCoordinator], SensorEntity):
    """A BTS arrival sensor."""

    _attr_has_entity_name = True
    entity_description: BtsSensorDescription

    def __init__(
        self, coordinator: BtsArrivalCoordinator, description: BtsSensorDescription
    ) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        entry = coordinator.config_entry
        assert entry.unique_id is not None
        self._attr_unique_id = f"{entry.unique_id}_{description.key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.unique_id)},
            name=f"{entry.data[CONF_STATION_NAME]} → {entry.data[CONF_DESTINATION_NAME]}",
            manufacturer="BTS Skytrain",
            model=f"Station {entry.data[CONF_STATION_KEY]}",
            entry_type=DeviceEntryType.SERVICE,
        )

    @property
    def native_value(self) -> Any:
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        data = self.coordinator.data
        platform = data.platform
        attrs: dict[str, Any] = {
            "station_key": data.arrivals.station_key,
            "station_name": data.arrivals.name_en,
            "station_name_th": data.arrivals.name_th,
            "api_updated": data.arrivals.updated,
            "no_service": not _trains(data),
        }
        if platform is None:
            attrs["platform_missing"] = True
            return attrs
        attrs.update(
            {
                "platform": platform.platform,
                "line_id": platform.line_id,
                "destination_key": platform.destination_key,
                "destination_name": platform.destination_en,
                "destination_name_th": platform.destination_th,
                "line_color": platform.line_color,
            }
        )
        if self.entity_description.key == "next_train_minutes":
            attrs["upcoming"] = [
                {
                    "train_no": t.train_no,
                    "destination_key": t.destination_key,
                    "destination": t.destination_en,
                    "destination_th": t.destination_th,
                    "minutes": 0 if t.is_arriving else t.minutes,
                    "status": t.status,
                }
                for t in platform.trains
            ]
        return attrs
