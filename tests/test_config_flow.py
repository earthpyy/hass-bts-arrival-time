"""Tests for the config flow."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

from homeassistant.config_entries import SOURCE_USER
from homeassistant.const import CONF_SCAN_INTERVAL
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.bts_arrival_time.api import (
    BtsConnectionError,
    BtsLineUnavailableError,
    parse_arrivals,
    parse_stations,
)
from custom_components.bts_arrival_time.config_flow import build_station_options
from custom_components.bts_arrival_time.const import (
    CONF_DIRECTION,
    CONF_STATION_KEY,
    DOMAIN,
)

from .conftest import load_fixture

CLIENT = "custom_components.bts_arrival_time.config_flow.BtsApiClient"


@pytest.fixture
def stations():
    return parse_stations(load_fixture("stations.json")["data"])


@pytest.fixture
def mock_client(stations):
    with patch(CLIENT, autospec=True) as cls:
        client = cls.return_value
        client.async_get_stations = AsyncMock(return_value=stations)
        client.async_get_arrivals = AsyncMock(
            return_value=parse_arrivals(load_fixture("arrivals_cen.json")["data"])
        )
        yield client


@pytest.fixture
def mock_setup_entry():
    with patch(
        "custom_components.bts_arrival_time.async_setup_entry", return_value=True
    ) as mock:
        yield mock


def test_station_options(stations) -> None:
    options = build_station_options(stations)
    keys = list(options)
    assert options["E4"] == "Asok (E4)"
    assert keys.count("CEN") == 1
    assert not any(k.startswith("G") for k in keys)
    # Route order: Sukhumvit, then Silom, then Yellow, then Pink.
    assert keys[0] == "N24"
    assert (
        keys.index("E23") < keys.index("W1") < keys.index("YL01") < keys.index("PK01")
    )


async def test_full_flow(hass: HomeAssistant, mock_client, mock_setup_entry) -> None:
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_STATION_KEY: "CEN"}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "direction"
    mock_client.async_get_arrivals.assert_awaited_with("CEN")

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_DIRECTION: "2:S12"}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Siam → Bang Wa"
    assert result["result"].unique_id == "CEN:2:S12"
    assert result["data"][CONF_STATION_KEY] == "CEN"
    assert result["data"][CONF_DIRECTION] == "2:S12"


async def test_duplicate_aborts(
    hass: HomeAssistant, mock_client, mock_setup_entry
) -> None:
    MockConfigEntry(domain=DOMAIN, unique_id="CEN:2:S12").add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_STATION_KEY: "CEN"}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_DIRECTION: "2:S12"}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_station_list_failure_aborts(hass: HomeAssistant, mock_client) -> None:
    mock_client.async_get_stations.side_effect = BtsConnectionError
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "cannot_connect"


@pytest.mark.parametrize(
    ("side_effect", "errors"),
    [
        (BtsLineUnavailableError, {CONF_STATION_KEY: "line_unavailable"}),
        (BtsConnectionError, {"base": "cannot_connect"}),
    ],
)
async def test_station_step_errors(
    hass: HomeAssistant, mock_client, mock_setup_entry, side_effect, errors
) -> None:
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    good = mock_client.async_get_arrivals.return_value
    mock_client.async_get_arrivals.side_effect = side_effect
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_STATION_KEY: "E4"}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == errors

    # Recovers on retry.
    mock_client.async_get_arrivals.side_effect = None
    mock_client.async_get_arrivals.return_value = good
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_STATION_KEY: "CEN"}
    )
    assert result["step_id"] == "direction"


async def test_options_flow(hass: HomeAssistant, mock_setup_entry) -> None:
    entry = MockConfigEntry(domain=DOMAIN, unique_id="E4:1:E23")
    entry.add_to_hass(hass)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_SCAN_INTERVAL: 45}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert entry.options == {CONF_SCAN_INTERVAL: 45}
