"""Tests for the dashboard card registration."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from unittest.mock import patch

from homeassistant.components.frontend import DATA_EXTRA_MODULE_URL
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
import pytest

from custom_components.bts_arrival_time import CARD_PATH
from custom_components.bts_arrival_time.const import CARD_URL, DOMAIN


def _card_urls(hass: HomeAssistant) -> list[str]:
    return [url for url in hass.data[DATA_EXTRA_MODULE_URL].urls if CARD_URL in url]


async def test_card_registered(hass: HomeAssistant, hass_client) -> None:
    assert await async_setup_component(hass, DOMAIN, {})
    await hass.async_block_till_done()

    bundle = CARD_PATH.read_bytes()
    digest = hashlib.sha256(bundle).hexdigest()[:8]
    assert _card_urls(hass) == [f"{CARD_URL}?v={digest}"]

    client = await hass_client()
    resp = await client.get(CARD_URL)
    assert resp.status == 200
    assert await resp.read() == bundle


async def test_missing_bundle_skips_registration(
    hass: HomeAssistant, caplog: pytest.LogCaptureFixture
) -> None:
    with (
        caplog.at_level(logging.WARNING),
        patch("custom_components.bts_arrival_time._file_hash", return_value=None),
    ):
        assert await async_setup_component(hass, DOMAIN, {})
        await hass.async_block_till_done()

    assert _card_urls(hass) == []
    assert "card bundle not found" in caplog.text


async def test_unreadable_bundle_skips_registration(
    hass: HomeAssistant, caplog: pytest.LogCaptureFixture
) -> None:
    with (
        caplog.at_level(logging.WARNING),
        patch.object(Path, "read_bytes", side_effect=PermissionError),
    ):
        assert await async_setup_component(hass, DOMAIN, {})
        await hass.async_block_till_done()

    assert _card_urls(hass) == []
    assert "card bundle not found" in caplog.text
