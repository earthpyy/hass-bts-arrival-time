import { describe, expect, it } from "vitest";

import {
  isStale,
  mergeEditorConfig,
  minutesAgo,
  normalizeConfig,
  oldestUpdated,
  parseApiUpdated,
  resolveLanguage,
  rowState,
  trainLabels,
} from "../src/logic";
import type { HassEntity } from "../src/types";

const entity = (
  state: string,
  attributes: Record<string, unknown> = {},
): HassEntity => ({ entity_id: "sensor.x", state, attributes });

describe("parseApiUpdated", () => {
  it("parses Bangkok local time", () => {
    expect(parseApiUpdated("20/11/2026 15:16")).toBe(
      Date.UTC(2026, 10, 20, 8, 16),
    );
  });

  it.each(["", "n/a", undefined, 42, "32/13/2026 25:99"])(
    "returns null for %s",
    (value) => {
      expect(parseApiUpdated(value)).toBeNull();
    },
  );
});

describe("oldestUpdated", () => {
  it("returns the oldest parseable value", () => {
    expect(oldestUpdated(["20/11/2026 15:16", "20/11/2026 15:14", "bad"])).toBe(
      Date.UTC(2026, 10, 20, 8, 14),
    );
  });

  it("returns null when nothing parses", () => {
    expect(oldestUpdated(["", undefined])).toBeNull();
  });
});

describe("minutesAgo / isStale", () => {
  const t = Date.UTC(2026, 10, 20, 8, 16);

  it("floors and never goes negative", () => {
    expect(minutesAgo(t, t + 59_000)).toBe(0);
    expect(minutesAgo(t, t + 120_000)).toBe(2);
    expect(minutesAgo(t, t - 60_000)).toBe(0);
  });

  it("is stale only after 3 minutes", () => {
    expect(isStale(t, t + 180_000)).toBe(false);
    expect(isStale(t, t + 180_001)).toBe(true);
  });
});

describe("resolveLanguage", () => {
  it.each([
    ["auto", "th", "th"],
    ["auto", "th-TH", "th"],
    ["auto", "en-GB", "en"],
    ["en", "th", "en"],
    [undefined, "fr", "en"],
  ] as const)("%s + %s → %s", (setting, hassLang, expected) => {
    expect(resolveLanguage(setting, hassLang)).toBe(expected);
  });
});

describe("rowState", () => {
  it("treats missing, unavailable and unknown as unavailable", () => {
    expect(rowState(undefined)).toBe("unavailable");
    expect(rowState(entity("unavailable"))).toBe("unavailable");
    expect(rowState(entity("unknown"))).toBe("unavailable");
  });

  it("detects missing direction", () => {
    expect(
      rowState(entity("unknown", { platform_missing: true, no_service: true })),
    ).toBe("direction_missing");
  });

  it("detects no service", () => {
    expect(rowState(entity("unknown", { no_service: true }))).toBe(
      "no_service",
    );
  });

  it("is ok otherwise", () => {
    expect(rowState(entity("2", { no_service: false }))).toBe("ok");
  });
});

describe("trainLabels", () => {
  const upcoming = [
    { minutes: 0, status: "arriving" },
    { minutes: 6, status: "pending" },
    { minutes: 12, status: "pending" },
  ];

  it("formats arriving and minutes", () => {
    expect(trainLabels(upcoming, 3, "en")).toEqual(["Arriving", "6", "12"]);
    expect(trainLabels(upcoming, 2, "en")).toHaveLength(2);
    expect(trainLabels(upcoming, 1, "th")).toEqual(["มาถึงแล้ว"]);
  });

  it("handles short or invalid lists", () => {
    expect(trainLabels([{ minutes: 4, status: "pending" }], 3, "en")).toEqual([
      "4",
    ]);
    expect(trainLabels(undefined, 3, "en")).toEqual([]);
  });

  it("shows zero or negative minutes as arriving", () => {
    expect(
      trainLabels(
        [
          { minutes: 0, status: "pending" },
          { minutes: -1435, status: "pending" },
          { minutes: 5, status: "pending" },
        ],
        3,
        "en",
      ),
    ).toEqual(["Arriving", "Arriving", "5"]);
  });
});

describe("normalizeConfig", () => {
  it.each([{ type: "x" }, { entities: [] }, { entities: [1] }, null])(
    "rejects %j",
    (config) => {
      expect(() => normalizeConfig(config)).toThrow(
        "entities must be a non-empty list of entity ids",
      );
    },
  );

  it("applies defaults", () => {
    const config = normalizeConfig({ entities: ["sensor.a"] });
    expect(config.trains).toBe(3);
    expect(config.language).toBe("auto");
    expect(config.title).toBeUndefined();
    expect(config.auto_refresh).toBe(false);
  });

  it("reads auto_refresh", () => {
    expect(
      normalizeConfig({ entities: ["sensor.a"], auto_refresh: true })
        .auto_refresh,
    ).toBe(true);
  });

  it.each([
    [7, 3],
    [0, 1],
    ["x", 3],
  ])("clamps trains %j → %d", (trains, expected) => {
    expect(normalizeConfig({ entities: ["sensor.a"], trains }).trains).toBe(
      expected,
    );
  });

  it("falls back to auto for unknown language", () => {
    expect(
      normalizeConfig({ entities: ["sensor.a"], language: "jp" }).language,
    ).toBe("auto");
  });
});

describe("mergeEditorConfig", () => {
  it("keeps unknown keys like grid_options and visibility", () => {
    const raw = {
      type: "custom:bts-arrival-card",
      entities: ["sensor.a"],
      grid_options: { columns: 6 },
      visibility: [{ condition: "screen" }],
    };
    expect(mergeEditorConfig(raw, { title: "Commute" })).toEqual({
      ...raw,
      title: "Commute",
    });
  });

  it("drops keys set back to their defaults", () => {
    const raw = {
      type: "custom:bts-arrival-card",
      entities: ["sensor.a"],
      title: "Old",
      trains: 2,
      language: "th",
      auto_refresh: true,
    };
    expect(
      mergeEditorConfig(raw, {
        title: "",
        trains: 3,
        language: "auto",
        auto_refresh: false,
      }),
    ).toEqual({ type: "custom:bts-arrival-card", entities: ["sensor.a"] });
  });
});
