"""Config flow for BTS Skytrain Arrival Time."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.const import CONF_SCAN_INTERVAL
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
)
import voluptuous as vol

from .api import (
    BtsApiClient,
    BtsConnectionError,
    BtsLineUnavailableError,
    BtsStationNotFoundError,
    Platform,
    Station,
    parse_direction_id,
)
from .const import (
    CONF_DESTINATION_KEY,
    CONF_DESTINATION_NAME,
    CONF_DIRECTION,
    CONF_LINE_ID,
    CONF_STATION_KEY,
    CONF_STATION_NAME,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    HIDDEN_LINE_IDS,
    MIN_SCAN_INTERVAL_SECONDS,
)

_LOGGER = logging.getLogger(__name__)


def build_station_options(stations: list[Station]) -> dict[str, str]:
    """Return ``{station_key: label}`` in route order, deduplicated, Gold hidden.

    The API lists each line's stations end to end in route order (its
    ``Orderlist`` field counts outward from Siam, so it is not used). The sort
    is stable and only groups by line. Keeping the first occurrence lists
    interchange stations (Siam) once, under the first line.
    """
    options: dict[str, str] = {}
    for station in sorted(stations, key=lambda s: s.line_id):
        if station.line_id in HIDDEN_LINE_IDS or station.key in options:
            continue
        options[station.key] = f"{station.name_en} ({station.key})"
    return options


def direction_label(platform: Platform) -> str:
    label = f"towards {platform.destination_en or platform.destination_key}"
    if platform.platform:
        label += f" (Platform {platform.platform})"
    return label


class BtsArrivalConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow: pick a station, then a direction."""

    VERSION = 1

    def __init__(self) -> None:
        self._stations: dict[str, str] = {}
        self._station_key: str | None = None
        self._station_name: str = ""
        self._platforms: dict[str, Platform] = {}

    def _client(self) -> BtsApiClient:
        return BtsApiClient(async_get_clientsession(self.hass))

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Pick a station."""
        errors: dict[str, str] = {}

        if user_input is not None:
            station_key: str = user_input[CONF_STATION_KEY]
            try:
                arrivals = await self._client().async_get_arrivals(station_key)
            except BtsLineUnavailableError:
                errors[CONF_STATION_KEY] = "line_unavailable"
            except BtsStationNotFoundError:
                errors[CONF_STATION_KEY] = "station_not_found"
            except BtsConnectionError:
                errors["base"] = "cannot_connect"
            except Exception:
                _LOGGER.exception("Unexpected error fetching arrivals")
                errors["base"] = "unknown"
            else:
                if not arrivals.platforms:
                    errors[CONF_STATION_KEY] = "no_platforms"
                else:
                    self._station_key = station_key
                    label = self._stations.get(station_key, station_key)
                    self._station_name = arrivals.name_en or label.rsplit(" (", 1)[0]
                    self._platforms = {p.direction_id: p for p in arrivals.platforms}
                    return await self.async_step_direction()

        if not self._stations:
            try:
                stations = await self._client().async_get_stations()
            except BtsConnectionError:
                return self.async_abort(reason="cannot_connect")
            except Exception:
                _LOGGER.exception("Unexpected error fetching stations")
                return self.async_abort(reason="unknown")
            self._stations = build_station_options(stations)
            if not self._stations:
                return self.async_abort(reason="no_stations")

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_STATION_KEY): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(value=key, label=label)
                                for key, label in self._stations.items()
                            ],
                            mode=SelectSelectorMode.DROPDOWN,
                            sort=False,
                        )
                    )
                }
            ),
            errors=errors,
        )

    async def async_step_direction(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Pick a direction (platform) at the chosen station."""
        assert self._station_key is not None

        if user_input is not None:
            direction_id: str = user_input[CONF_DIRECTION]
            platform = self._platforms[direction_id]
            line_id, destination_key = parse_direction_id(direction_id)
            await self.async_set_unique_id(f"{self._station_key}:{direction_id}")
            self._abort_if_unique_id_configured()
            destination = platform.destination_en or destination_key
            return self.async_create_entry(
                title=f"{self._station_name} → {destination}",
                data={
                    CONF_STATION_KEY: self._station_key,
                    CONF_STATION_NAME: self._station_name,
                    CONF_DIRECTION: direction_id,
                    CONF_LINE_ID: line_id,
                    CONF_DESTINATION_KEY: destination_key,
                    CONF_DESTINATION_NAME: destination,
                },
            )

        return self.async_show_form(
            step_id="direction",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_DIRECTION): SelectSelector(
                        SelectSelectorConfig(
                            options=[
                                SelectOptionDict(value=key, label=direction_label(p))
                                for key, p in self._platforms.items()
                            ],
                            mode=SelectSelectorMode.LIST,
                            sort=False,
                        )
                    )
                }
            ),
            description_placeholders={"station": self._station_name},
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return BtsArrivalOptionsFlow()


class BtsArrivalOptionsFlow(OptionsFlow):
    """Options: polling interval."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(
                data={CONF_SCAN_INTERVAL: int(user_input[CONF_SCAN_INTERVAL])}
            )

        current = self.config_entry.options.get(
            CONF_SCAN_INTERVAL, int(DEFAULT_SCAN_INTERVAL.total_seconds())
        )
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_SCAN_INTERVAL, default=current): NumberSelector(
                        NumberSelectorConfig(
                            min=MIN_SCAN_INTERVAL_SECONDS,
                            max=3600,
                            step=1,
                            unit_of_measurement="s",
                            mode=NumberSelectorMode.BOX,
                        )
                    )
                }
            ),
        )
