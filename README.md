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

### Only update during certain hours

By default the integration checks the API all day. To check it only when you
need it, for example on weekday mornings:

1. Go to **Settings > Devices & services > BTS Skytrain Arrival Time**, open
   the **⋮** menu on the entry, select **System options** and turn off
   **Enable polling for updates**.
2. Add an automation that refreshes the sensors during your time window:

```yaml
automation:
  - alias: "BTS arrivals: morning refresh"
    triggers:
      - trigger: time_pattern
        seconds: "/30"
    conditions:
      - condition: time
        after: "06:30:00"
        before: "09:30:00"
        weekday: [mon, tue, wed, thu, fri]
    actions:
      - action: homeassistant.update_entity
        target:
          entity_id: sensor.asok_kheha_next_train
```

Updating one sensor refreshes all the sensors of that station and direction.
Outside the window the sensors keep their last values, so they will be out of
date until the window starts again. You can also update them at any time with
the refresh button on the [dashboard card](#dashboard-card).

## Dashboard card

The integration includes a **BTS Arrivals** dashboard card. It loads
automatically once the integration is set up, so you don't need to add a
dashboard resource. Refresh your browser after installing or updating.

Edit a dashboard, select **Add card** and pick **BTS Arrivals**, or use YAML:

```yaml
type: custom:bts-arrival-card
title: My commute
entities:
  - sensor.asok_kheha_next_train
  - sensor.asok_khu_khot_next_train
trains: 3
language: auto
auto_refresh: true
```

<!-- TODO: screenshot -->

| Option         | Default  | Description                                                                |
| -------------- | -------- | -------------------------------------------------------------------------- |
| `entities`     | required | The **Next train** sensors to show, one row each. Any stations, any order. |
| `title`        | none     | Card title.                                                                |
| `trains`       | `3`      | How many upcoming trains to show per row (1 to 3).                         |
| `language`     | `auto`   | `auto` follows your Home Assistant language; `en` or `th` forces one.      |
| `auto_refresh` | `false`  | Refresh the sensors when the dashboard opens or comes back into view.      |

Each row shows the line colour, the station and direction, and the minutes
until the next trains. A row shows **No service** when no trains are
running, **Direction not found** when BTS no longer lists that direction,
and **Unavailable** when the sensor can't be updated. A train due in under
a minute shows as **Arriving**.

The footer shows when BTS last updated the data. It turns orange when the
data is more than 3 minutes old. The refresh button updates every row
straight away.

## Development

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements_test.txt ruff
pytest
ruff check custom_components tests && ruff format --check custom_components tests
```

The dashboard card's source is in `frontend/`. After changing it, rebuild the
bundle and commit `custom_components/bts_arrival_time/frontend/bts-arrival-card.js`:

```bash
cd frontend
npm install
npm run lint && npm test
npm run build
```

## Disclaimer

This project is not affiliated with or endorsed by BTS Group or Bangkok Mass
Transit System. Arrival times come from BTS's public website and may be
inaccurate.
