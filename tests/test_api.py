"""Tests for the API client."""

from __future__ import annotations

import base64
import json

from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from homeassistant.helpers.aiohttp_client import async_get_clientsession
import pytest

from custom_components.bts_arrival_time import api
from custom_components.bts_arrival_time.api import (
    BtsApiClient,
    BtsConnectionError,
    BtsLineUnavailableError,
    BtsStationNotFoundError,
    encrypt_body,
    parse_arrivals,
    parse_stations,
    split_name,
)
from custom_components.bts_arrival_time.const import API_BASE_URL

from .conftest import load_fixture

ARRIVAL_URL = f"{API_BASE_URL}/TTA/TrainTimeArrival"
STATIONS_URL = f"{API_BASE_URL}/RouteMap/StationList"


def test_split_name() -> None:
    assert split_name("เคหะฯ  | Kheha") == ("Kheha", "เคหะฯ")
    assert split_name("Asok") == ("Asok", "Asok")
    assert split_name(None) == ("", "")


def test_encrypt_body_round_trip(monkeypatch: pytest.MonkeyPatch) -> None:
    """The body decrypts with the key/iv wrapped in the auth key."""
    private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    monkeypatch.setattr(api, "_public_key", private.public_key)

    auth_key, body = encrypt_body({"StationKey": "E4"})

    key_iv = json.loads(private.decrypt(base64.b64decode(auth_key), padding.PKCS1v15()))
    key = base64.b64decode(key_iv["key"])
    iv = base64.b64decode(key_iv["iv"])
    combined = base64.b64decode(body)
    assert len(key) == 32
    assert combined[:12] == iv
    plain = AESGCM(key).decrypt(iv, combined[12:], None)
    assert json.loads(plain) == {"StationKey": "E4"}


def test_real_public_key_loads() -> None:
    auth_key, _ = encrypt_body({"StationKey": "E4"})
    assert len(base64.b64decode(auth_key)) == 256


def test_parse_stations() -> None:
    stations = parse_stations(load_fixture("stations.json")["data"])
    keys = [s.key for s in stations]
    assert keys[0] == "N24"
    assert keys.count("CEN") == 2
    assert {s.line_id for s in stations} == {1, 2, 3, 4, 5}


def test_parse_arrivals_interchange() -> None:
    arrivals = parse_arrivals(load_fixture("arrivals_cen.json")["data"])
    assert arrivals.name_en == "Siam"
    assert len(arrivals.platforms) == 4
    first = arrivals.platforms[0]
    assert first.direction_id == "1:E23"
    assert first.destination_en == "Kheha"
    assert len(first.trains) == 3
    assert arrivals.platform_for("2:W1") is not None
    assert arrivals.platform_for("9:XX") is None


def test_parse_arrivals_line_color() -> None:
    raw = load_fixture("arrivals_e4.json")["data"]
    assert parse_arrivals(raw).platforms[0].line_color == "#7AB420"
    del raw["platform_list"][0]["LineColor"]
    assert parse_arrivals(raw).platforms[0].line_color == ""


async def test_client_arrivals(hass, aioclient_mock) -> None:
    aioclient_mock.post(ARRIVAL_URL, json=load_fixture("arrivals_e4.json"))
    client = BtsApiClient(async_get_clientsession(hass))

    arrivals = await client.async_get_arrivals("e4")

    assert arrivals.station_key == "E4"
    assert [p.direction_id for p in arrivals.platforms] == ["1:E23", "1:N24"]
    _, url, body, headers = aioclient_mock.mock_calls[0]
    assert body["lang"] == "th"
    assert "data" in body
    assert headers["Authkey"]


@pytest.mark.parametrize(
    ("code", "error"),
    [
        (22, BtsStationNotFoundError),
        (33, BtsLineUnavailableError),
        (99, BtsConnectionError),
    ],
)
async def test_client_arrival_errors(hass, aioclient_mock, code, error) -> None:
    aioclient_mock.post(
        ARRIVAL_URL,
        json={"ErrCode": code, "IsSuccess": False, "ErrMessage": "x", "data": None},
    )
    client = BtsApiClient(async_get_clientsession(hass))
    with pytest.raises(error):
        await client.async_get_arrivals("G1")


async def test_client_http_error(hass, aioclient_mock) -> None:
    aioclient_mock.post(ARRIVAL_URL, status=500)
    client = BtsApiClient(async_get_clientsession(hass))
    with pytest.raises(BtsConnectionError):
        await client.async_get_arrivals("E4")


async def test_client_stations(hass, aioclient_mock) -> None:
    aioclient_mock.post(STATIONS_URL, json=load_fixture("stations.json"))
    client = BtsApiClient(async_get_clientsession(hass))
    stations = await client.async_get_stations()
    assert len(stations) == 119


def test_parse_arrivals_midnight_and_late() -> None:
    raw = load_fixture("arrivals_e4.json")["data"]
    trains = raw["platform_list"][0]["train_list"]
    # 23:58 now, train due 00:03 -> API reports about -1435 minutes.
    trains[0].update(
        time_come="-1435",
        time_come_num=-1435,
        time_come_double=-1434.6,
        status="pending",
    )
    # Train running a little late.
    trains[1].update(
        time_come="-1", time_come_num=-1, time_come_double=-0.8, status="pending"
    )
    platform = parse_arrivals(raw).platforms[0]
    minutes = [t.minutes for t in platform.trains]
    assert all(m >= 0 for m in minutes)
    assert minutes[:2] == [0, 5]
    assert platform.trains[1].minutes_exact == pytest.approx(5.4)
