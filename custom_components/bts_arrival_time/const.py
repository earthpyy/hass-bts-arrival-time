"""Constants for the BTS Skytrain Arrival Time integration."""

from __future__ import annotations

from datetime import timedelta
from typing import Final

DOMAIN: Final = "bts_arrival_time"

API_BASE_URL: Final = "https://www.ebm.co.th/mobapi-routemap/api"

CONF_STATION_KEY: Final = "station_key"
CONF_DIRECTION: Final = "direction"
CONF_LINE_ID: Final = "line_id"
CONF_DESTINATION_KEY: Final = "destination_key"

# Display names stored in entry data so entities can be named without an API call.
CONF_STATION_NAME: Final = "station_name"
CONF_DESTINATION_NAME: Final = "destination_name"

DEFAULT_SCAN_INTERVAL: Final = timedelta(seconds=30)
MIN_SCAN_INTERVAL_SECONDS: Final = 15

# Line IDs hidden from the station picker. 3 is the Gold Line, for which the
# arrival API answers "this Line is unavailable".
HIDDEN_LINE_IDS: Final = frozenset({3})
