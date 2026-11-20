"""Client for the (unofficial) BTS train time arrival API used by bts.co.th.

The arrival endpoint expects an encrypted body:

1. The JSON request is encrypted with a fresh AES-256-GCM key and a 12 byte IV.
   The IV is prepended to the ciphertext and the result is base64 encoded.
2. ``{"key": <b64 aes key>, "iv": <b64 iv>}`` is RSA encrypted (PKCS#1 v1.5)
   with the public key embedded in the website and sent as the ``Authkey``
   header.

Responses come back as plain JSON.
"""

from __future__ import annotations

import base64
from dataclasses import dataclass, field
import json
import os
from typing import Any

import aiohttp
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .const import API_BASE_URL

SERVER_PUBLIC_PEM = b"""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8zsT7DJXT2PGXFYp56Wy
wZiROQMLii+oyko8rGrW3+TlSq7VuuJfsBffMoypk/MTkBC3zCww3/1Sgt2LTF1q
xNExEXeKekS/JzyfKQ2f8YNAfdw60PMX6STQt7RQQwvM/MHMOIFp5hQnl8TQoc2w
z3G4o5jrXMFDMALbN3l2iAQCWUEFY9YJJFYIHrnQds62P6iIoCujMgC0hTbafnjw
32tTIh8j1+rJ8pTz3PzAqnVhThTISHIGAXsmn8FyAcO6ebBiKkQKQ+BNRVJbZTS/
Xud2jDkJg+22IHgOZyuQ85VNSnvBWm6PM0LXL1GiMHdBbqqUryyUImkSmB7q6YKC
gQIDAQAB
-----END PUBLIC KEY-----"""

ERR_STATION_NOT_FOUND = 22
ERR_LINE_UNAVAILABLE = 33

REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=15)

_PUBLIC_KEY: RSAPublicKey | None = None


def _public_key() -> RSAPublicKey:
    global _PUBLIC_KEY  # noqa: PLW0603
    if _PUBLIC_KEY is None:
        key = serialization.load_pem_public_key(SERVER_PUBLIC_PEM)
        assert isinstance(key, RSAPublicKey)
        _PUBLIC_KEY = key
    return _PUBLIC_KEY


class BtsApiError(Exception):
    """Base error for the BTS API."""


class BtsConnectionError(BtsApiError):
    """The API could not be reached or returned an unexpected response."""


class BtsStationNotFoundError(BtsApiError):
    """The station key is not known to the API."""


class BtsLineUnavailableError(BtsApiError):
    """The API does not publish arrival times for this station's line."""


def split_name(value: str | None) -> tuple[str, str]:
    """Split ``"ไทย | English"`` into ``(english, thai)``."""
    if not value:
        return "", ""
    if "|" in value:
        thai, english = value.split("|", 1)
        return english.strip(), " ".join(thai.split())
    return value.strip(), value.strip()


@dataclass(frozen=True, slots=True)
class Station:
    """A station from the station list."""

    key: str
    name_en: str
    name_th: str
    line_id: int
    line_name_en: str
    order: int


@dataclass(frozen=True, slots=True)
class Train:
    """One upcoming train on a platform."""

    train_no: str
    destination_key: str
    destination_en: str
    destination_th: str
    minutes: int
    minutes_exact: float
    status: str

    @property
    def is_arriving(self) -> bool:
        return self.status in ("arriving", "arrival")


@dataclass(frozen=True, slots=True)
class Platform:
    """A platform (direction) at a station."""

    platform: str
    line_id: int
    destination_key: str
    destination_en: str
    destination_th: str
    line_color: str = ""
    trains: list[Train] = field(default_factory=list)

    @property
    def direction_id(self) -> str:
        return make_direction_id(self.line_id, self.destination_key)


@dataclass(frozen=True, slots=True)
class StationArrivals:
    """Arrival information for a station."""

    station_key: str
    name_en: str
    name_th: str
    updated: str
    platforms: list[Platform]

    def platform_for(self, direction_id: str) -> Platform | None:
        for platform in self.platforms:
            if platform.direction_id == direction_id:
                return platform
        return None


def make_direction_id(line_id: int, destination_key: str) -> str:
    return f"{line_id}:{destination_key}"


def parse_direction_id(direction_id: str) -> tuple[int, str]:
    line_id, destination_key = direction_id.split(":", 1)
    return int(line_id), destination_key


def encrypt_body(payload: dict[str, Any]) -> tuple[str, str]:
    """Return ``(auth_key, body_b64)`` for an encrypted API request."""
    aes_key = AESGCM.generate_key(bit_length=256)
    iv = os.urandom(12)
    ciphertext = AESGCM(aes_key).encrypt(iv, json.dumps(payload).encode(), None)
    body_b64 = base64.b64encode(iv + ciphertext).decode()
    key_iv = json.dumps(
        {
            "key": base64.b64encode(aes_key).decode(),
            "iv": base64.b64encode(iv).decode(),
        }
    ).encode()
    auth_key = base64.b64encode(
        _public_key().encrypt(key_iv, padding.PKCS1v15())
    ).decode()
    return auth_key, body_b64


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_float(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def parse_stations(data: list[dict[str, Any]]) -> list[Station]:
    """Parse the StationList ``data`` array into a flat list of stations."""
    stations: list[Station] = []
    for line in data:
        line_id = _to_int(line.get("LineId"))
        line_name = line.get("LineName_EN", "")
        for item in line.get("StationList") or []:
            key = item.get("StationKey")
            if not key:
                continue
            stations.append(
                Station(
                    key=str(key).upper(),
                    name_en=item.get("StationNameEN") or key,
                    name_th=item.get("StationNameTH") or "",
                    line_id=_to_int(item.get("StationLineId"), line_id),
                    line_name_en=item.get("LineNameEN") or line_name,
                    order=_to_int(item.get("Orderlist")),
                )
            )
    return stations


def parse_arrivals(data: dict[str, Any]) -> StationArrivals:
    """Parse the TrainTimeArrival ``data`` object."""
    platforms: list[Platform] = []
    for item in data.get("platform_list") or []:
        dest_en, dest_th = split_name(item.get("DestinationStation"))
        trains: list[Train] = []
        for raw in item.get("train_list") or []:
            t_en, t_th = split_name(raw.get("station"))
            minutes = _to_int(raw.get("time_come_num", raw.get("time_come")))
            trains.append(
                Train(
                    train_no=str(raw.get("trainNo", "")),
                    destination_key=str(raw.get("station_key", "")),
                    destination_en=t_en,
                    destination_th=t_th,
                    minutes=minutes,
                    minutes_exact=_to_float(raw.get("time_come_double"), minutes),
                    status=str(raw.get("status", "")),
                )
            )
        platforms.append(
            Platform(
                platform=str(item.get("platform", "")),
                line_id=_to_int(item.get("LineId")),
                destination_key=str(item.get("DestinationStation_key", "")),
                destination_en=dest_en,
                destination_th=dest_th,
                line_color=str(item.get("LineColor") or ""),
                trains=trains,
            )
        )
    return StationArrivals(
        station_key=str(data.get("StationKey", "")),
        name_en=data.get("StationName_EN", ""),
        name_th=data.get("StationName_TH", ""),
        updated=data.get("time", ""),
        platforms=platforms,
    )


class BtsApiClient:
    """Async client for the BTS route map API."""

    def __init__(
        self, session: aiohttp.ClientSession, base_url: str = API_BASE_URL
    ) -> None:
        self._session = session
        self._base_url = base_url

    async def _post(
        self,
        path: str,
        *,
        json_body: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        params: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        url = f"{self._base_url}{path}"
        try:
            async with self._session.post(
                url,
                json=json_body if json_body is not None else {},
                headers=headers,
                params=params,
                timeout=REQUEST_TIMEOUT,
            ) as resp:
                resp.raise_for_status()
                result = await resp.json(content_type=None)
        except (TimeoutError, aiohttp.ClientError, ValueError) as err:
            raise BtsConnectionError(f"Error calling {path}: {err}") from err
        if not isinstance(result, dict):
            raise BtsConnectionError(f"Unexpected response from {path}")
        return result

    async def async_get_stations(self) -> list[Station]:
        result = await self._post("/RouteMap/StationList", params={"lang": "en"})
        data = result.get("data")
        if not result.get("IsSuccess") or not isinstance(data, list):
            raise BtsConnectionError(f"Station list failed: {result.get('ErrMessage')}")
        return parse_stations(data)

    async def async_get_arrivals(self, station_key: str) -> StationArrivals:
        auth_key, body = encrypt_body({"StationKey": station_key.upper()})
        result = await self._post(
            "/TTA/TrainTimeArrival",
            json_body={"data": body, "lang": "th"},
            headers={"Authkey": auth_key},
        )
        if not result.get("IsSuccess"):
            code = result.get("ErrCode")
            message = result.get("ErrMessage")
            if code == ERR_STATION_NOT_FOUND:
                raise BtsStationNotFoundError(message)
            if code == ERR_LINE_UNAVAILABLE:
                raise BtsLineUnavailableError(message)
            raise BtsConnectionError(f"Arrival request failed ({code}): {message}")
        data = result.get("data")
        if not isinstance(data, dict):
            raise BtsConnectionError("Arrival response has no data")
        return parse_arrivals(data)
