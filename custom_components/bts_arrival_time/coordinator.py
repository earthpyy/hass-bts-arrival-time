"""Data update coordinator for BTS arrivals."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_SCAN_INTERVAL
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import BtsApiClient, BtsApiError, Platform, StationArrivals
from .const import CONF_DIRECTION, CONF_STATION_KEY, DEFAULT_SCAN_INTERVAL, DOMAIN

_LOGGER = logging.getLogger(__name__)

type BtsConfigEntry = ConfigEntry[BtsArrivalCoordinator]


@dataclass(slots=True)
class ArrivalData:
    """Result of one poll."""

    fetched_at: datetime
    arrivals: StationArrivals
    platform: Platform | None


class BtsArrivalCoordinator(DataUpdateCoordinator[ArrivalData]):
    """Polls arrivals for one station and direction."""

    config_entry: BtsConfigEntry

    def __init__(
        self, hass: HomeAssistant, entry: BtsConfigEntry, client: BtsApiClient
    ) -> None:
        seconds = entry.options.get(CONF_SCAN_INTERVAL)
        interval = timedelta(seconds=seconds) if seconds else DEFAULT_SCAN_INTERVAL
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} {entry.data[CONF_STATION_KEY]}",
            update_interval=interval,
        )
        self.client = client
        self.station_key: str = entry.data[CONF_STATION_KEY]
        self.direction_id: str = entry.data[CONF_DIRECTION]

    async def _async_update_data(self) -> ArrivalData:
        try:
            arrivals = await self.client.async_get_arrivals(self.station_key)
        except BtsApiError as err:
            raise UpdateFailed(str(err)) from err
        return ArrivalData(
            fetched_at=dt_util.utcnow(),
            arrivals=arrivals,
            platform=arrivals.platform_for(self.direction_id),
        )
