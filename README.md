# BTS Skytrain Arrival Time for Home Assistant

A Home Assistant custom integration that shows live train arrival times for the
Bangkok BTS Skytrain (Sukhumvit, Silom, Yellow and Pink lines).

It uses the same (unofficial, undocumented) API as the train time arrival
feature on [bts.co.th](https://www.bts.co.th/eng/routemap.html). BTS can change
or block it at any time.

## Installation

### Marketplace (Home Assistant 2026.11 and later) or HACS

1. Go to **Settings > Marketplace**, select **Add from link** in the top right
   corner, and enter `earthpyy/hass-bts-arrival-time`. On older versions, use
   HACS > Custom repositories with the category **Integration**.
2. Install **BTS Skytrain Arrival Time** and restart Home Assistant if asked.

### Manual

Copy `custom_components/bts_arrival_time` into your Home Assistant
`config/custom_components` folder and restart.

## Setup

**Settings > Devices & services > Add integration > BTS Skytrain Arrival Time**

1. **Station**: pick a station, for example `Asok (E4)`. The list is loaded
   live from BTS. The Gold Line is hidden because BTS does not publish arrival
   times for it.
2. **Direction**: pick a platform, for example `towards Kheha (Platform 1)`.

Add the integration again for each extra station or direction you want.

### Options

**Update interval**: how often the integration checks the API. The default is
30 seconds and the minimum is 15.

## Entities

Each station and direction becomes one device (for example "Asok → Kheha")
with these sensors:

| Sensor | Example | Description |
| --- | --- | --- |
| Next train | `4` min | Minutes until the next train. `0` when it is arriving. |
| Following train | `10` min | Minutes until the train after that. |
| Next arrival | `2026-11-20T12:29:32+07:00` | Estimated arrival time of the next train. |

Attributes include `platform`, `destination_name`, `destination_name_th`,
`station_name_th`, `api_updated` (the API's own timestamp) and `no_service`.
**Next train** also has `upcoming`, which lists every announced train with its
number, destination, minutes and status.

Every train stopping at the platform counts, including any that terminate
before the end of the line. Check `upcoming[].destination` for each train's
destination.

Outside service hours, when no trains are announced, the sensors show
`unknown` with `no_service: true`. If the API cannot be reached, they become
`unavailable`.

### Example automation

```yaml
automation:
  - alias: "Leave for the BTS"
    triggers:
      - trigger: numeric_state
        entity_id: sensor.asok_kheha_next_train
        below: 7
    actions:
      - action: notify.mobile_app_phone
        data:
          message: "Next train to Kheha in {{ states('sensor.asok_kheha_next_train') }} min"
```

## How the API works

- `POST https://www.ebm.co.th/mobapi-routemap/api/RouteMap/StationList?lang=en`
  returns every line and station. The request is not encrypted.
- `POST https://www.ebm.co.th/mobapi-routemap/api/TTA/TrainTimeArrival`
  returns platforms and upcoming trains for one station. The request body
  `{"StationKey": "E4"}` is encrypted with a random AES-256-GCM key. The key
  and IV are encrypted with the RSA public key embedded in the BTS website
  (PKCS#1 v1.5) and sent in the `Authkey` header. Responses are plain JSON.
  See [`api.py`](custom_components/bts_arrival_time/api.py).

## Development

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements_test.txt ruff
pytest
ruff check custom_components tests && ruff format --check custom_components tests
```

## Disclaimer

This project is not affiliated with or endorsed by BTS Group or Bangkok Mass
Transit System. Arrival times come from BTS's public website and may be
inaccurate.
