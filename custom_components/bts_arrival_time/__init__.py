"""The BTS Skytrain Arrival Time integration."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

from .api import BtsApiClient
from .const import CARD_FILENAME, CARD_URL, DOMAIN
from .coordinator import BtsArrivalCoordinator, BtsConfigEntry

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

CARD_PATH = Path(__file__).parent / "frontend" / CARD_FILENAME


def _file_hash(path: Path) -> str | None:
    """Return a short content hash of ``path``, or None when it is missing."""
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()[:8]
    except OSError:
        return None


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the dashboard card and load it on every dashboard."""
    digest = await hass.async_add_executor_job(_file_hash, CARD_PATH)
    if digest is None:
        _LOGGER.warning(
            "BTS arrival card bundle not found; the dashboard card will not be available"
        )
        return True
    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_URL, str(CARD_PATH), True)]
    )
    add_extra_js_url(hass, f"{CARD_URL}?v={digest}")
    return True


async def async_setup_entry(hass: HomeAssistant, entry: BtsConfigEntry) -> bool:
    """Set up a station/direction from a config entry."""
    client = BtsApiClient(async_get_clientsession(hass))
    coordinator = BtsArrivalCoordinator(hass, entry, client)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    entry.async_on_unload(entry.add_update_listener(_async_reload_entry))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: BtsConfigEntry) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def _async_reload_entry(hass: HomeAssistant, entry: BtsConfigEntry) -> None:
    """Reload when options change."""
    await hass.config_entries.async_reload(entry.entry_id)
