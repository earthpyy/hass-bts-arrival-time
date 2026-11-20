"""Tests for the sensors."""

from __future__ import annotations

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.bts_arrival_time.api import BtsConnectionError, parse_arrivals
from custom_components.bts_arrival_time.const import (
    CONF_DESTINATION_KEY,
    CONF_DESTINATION_NAME,
    CONF_DIRECTION,
    CONF_LINE_ID,
    CONF_STATION_KEY,
    CONF_STATION_NAME,
    DOMAIN,
)

from .conftest import load_fixture

CLIENT = "custom_components.bts_arrival_time.BtsApiClient"
NOW = datetime(2026, 11, 20, 5, 0, 0, tzinfo=dt_util.UTC)


def _arrivals(mutate=None):
    raw = load_fixture("arrivals_e4.json")["data"]
    if mutate:
        mutate(raw)
    return parse_arrivals(raw)


@pytest.fixture
def entry(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(
        domain=DOMAIN,
        unique_id="E4:1:E23",
        title="Asok → Kheha",
        data={
            CONF_STATION_KEY: "E4",
            CONF_STATION_NAME: "Asok",
            CONF_DIRECTION: "1:E23",
            CONF_LINE_ID: 1,
            CONF_DESTINATION_KEY: "E23",
            CONF_DESTINATION_NAME: "Kheha",
        },
    )
    entry.add_to_hass(hass)
    return entry


@pytest.fixture
def mock_client():
    with patch(CLIENT, autospec=True) as cls:
        client = cls.return_value
        client.async_get_arrivals = AsyncMock(return_value=_arrivals())
        yield client


async def _setup(hass, entry, freezer):
    freezer.move_to(NOW)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()


async def test_sensors(
    hass: HomeAssistant, entry, mock_client, freezer: FrozenDateTimeFactory
) -> None:
    await _setup(hass, entry, freezer)
    assert entry.state is ConfigEntryState.LOADED

    trains = load_fixture("arrivals_e4.json")["data"]["platform_list"][0]["train_list"]

    nxt = hass.states.get("sensor.asok_kheha_next_train")
    assert nxt.state == str(trains[0]["time_come_num"])
    assert nxt.attributes["unit_of_measurement"] == "min"
    assert nxt.attributes["platform"] == "1"
    assert nxt.attributes["destination_name"] == "Kheha"
    assert nxt.attributes["station_name_th"] == "อโศก"
    assert nxt.attributes["no_service"] is False
    assert len(nxt.attributes["upcoming"]) == 3

    following = hass.states.get("sensor.asok_kheha_following_train")
    assert following.state == str(trains[1]["time_come_num"])

    arrival = hass.states.get("sensor.asok_kheha_next_arrival")
    expected = NOW + timedelta(minutes=trains[0]["time_come_double"])
    assert dt_util.parse_datetime(arrival.state) == expected.replace(microsecond=0)


async def test_arriving_counts_as_zero(
    hass: HomeAssistant, entry, mock_client, freezer: FrozenDateTimeFactory
) -> None:
    def arriving(raw):
        train = raw["platform_list"][0]["train_list"][0]
        train.update(
            status="arriving", time_come="0", time_come_num=0, time_come_double=0.4
        )

    mock_client.async_get_arrivals.return_value = _arrivals(arriving)
    await _setup(hass, entry, freezer)
    assert hass.states.get("sensor.asok_kheha_next_train").state == "0"
    assert (
        dt_util.parse_datetime(hass.states.get("sensor.asok_kheha_next_arrival").state)
        == NOW
    )


async def test_no_service(
    hass: HomeAssistant, entry, mock_client, freezer: FrozenDateTimeFactory
) -> None:
    def empty(raw):
        for platform in raw["platform_list"]:
            platform["train_list"] = []

    mock_client.async_get_arrivals.return_value = _arrivals(empty)
    await _setup(hass, entry, freezer)
    state = hass.states.get("sensor.asok_kheha_next_train")
    assert state.state == STATE_UNKNOWN
    assert state.attributes["no_service"] is True
    assert hass.states.get("sensor.asok_kheha_next_arrival").state == STATE_UNKNOWN


async def test_api_failure_marks_unavailable(
    hass: HomeAssistant, entry, mock_client, freezer: FrozenDateTimeFactory
) -> None:
    await _setup(hass, entry, freezer)
    mock_client.async_get_arrivals.side_effect = BtsConnectionError
    freezer.tick(timedelta(seconds=31))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert hass.states.get("sensor.asok_kheha_next_train").state == STATE_UNAVAILABLE

    mock_client.async_get_arrivals.side_effect = None
    freezer.tick(timedelta(seconds=31))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert hass.states.get("sensor.asok_kheha_next_train").state != STATE_UNAVAILABLE


async def test_setup_retries_on_failure(
    hass: HomeAssistant, entry, mock_client, freezer: FrozenDateTimeFactory
) -> None:
    mock_client.async_get_arrivals.side_effect = BtsConnectionError
    freezer.move_to(NOW)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.SETUP_RETRY


async def test_unload(
    hass: HomeAssistant, entry, mock_client, freezer: FrozenDateTimeFactory
) -> None:
    await _setup(hass, entry, freezer)
    assert await hass.config_entries.async_unload(entry.entry_id)
    assert entry.state is ConfigEntryState.NOT_LOADED
