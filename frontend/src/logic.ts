import { STRINGS } from "./strings";
import type { CardConfig, HassEntity, Language, RowState } from "./types";

const API_UPDATED_RE = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;
const BANGKOK_UTC_OFFSET_HOURS = 7;
const STALE_AFTER_MS = 3 * 60 * 1000;
const MAX_TRAINS = 3;
const LANGUAGES = ["auto", "en", "th"] as const;

/** Parse BTS's `DD/MM/YYYY HH:MM` (Asia/Bangkok) into epoch ms. */
export function parseApiUpdated(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = API_UPDATED_RE.exec(value.trim());
  if (!match) return null;
  const [day, month, year, hour, minute] = match.slice(1).map(Number);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }
  return Date.UTC(
    year,
    month - 1,
    day,
    hour - BANGKOK_UTC_OFFSET_HOURS,
    minute,
  );
}

export function oldestUpdated(values: unknown[]): number | null {
  const parsed = values
    .map(parseApiUpdated)
    .filter((v): v is number => v !== null);
  return parsed.length ? Math.min(...parsed) : null;
}

export function minutesAgo(updatedMs: number, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - updatedMs) / 60_000));
}

export function isStale(updatedMs: number, nowMs: number): boolean {
  return nowMs - updatedMs > STALE_AFTER_MS;
}

export function resolveLanguage(
  setting: CardConfig["language"] | undefined,
  hassLanguage: string,
): Language {
  if (setting === "en" || setting === "th") return setting;
  return hassLanguage.toLowerCase().startsWith("th") ? "th" : "en";
}

export function rowState(stateObj: HassEntity | undefined): RowState {
  // With no trains the sensor's state is `unknown` but `no_service` is set,
  // so `unknown` only means unavailable when that flag is absent.
  if (
    !stateObj ||
    stateObj.state === "unavailable" ||
    (stateObj.state === "unknown" && stateObj.attributes.no_service !== true)
  ) {
    return "unavailable";
  }
  if (stateObj.attributes.platform_missing === true) return "direction_missing";
  if (stateObj.attributes.no_service === true) return "no_service";
  return "ok";
}

export function trainLabels(
  upcoming: unknown,
  count: number,
  lang: Language,
): string[] {
  if (!Array.isArray(upcoming)) return [];
  return upcoming.slice(0, count).map((train) => {
    const status = train?.status;
    if (status === "arriving" || status === "arrival") {
      return STRINGS[lang].arriving;
    }
    return String(train?.minutes ?? "");
  });
}

export function normalizeConfig(config: unknown): CardConfig {
  const raw = (config ?? {}) as Record<string, unknown>;
  const entities = raw.entities;
  if (
    !Array.isArray(entities) ||
    entities.length === 0 ||
    !entities.every((e) => typeof e === "string" && e.length > 0)
  ) {
    throw new Error("entities must be a non-empty list of entity ids");
  }
  const trains =
    typeof raw.trains === "number" && Number.isFinite(raw.trains)
      ? Math.min(MAX_TRAINS, Math.max(1, Math.round(raw.trains)))
      : MAX_TRAINS;
  const language = LANGUAGES.includes(raw.language as CardConfig["language"])
    ? (raw.language as CardConfig["language"])
    : "auto";
  const result: CardConfig = {
    type: typeof raw.type === "string" ? raw.type : "custom:bts-arrival-card",
    entities: [...entities],
    trains,
    language,
  };
  if (typeof raw.title === "string" && raw.title) result.title = raw.title;
  return result;
}

/**
 * Apply editor changes on top of the card's raw config. Keys the editor does
 * not manage (grid_options, visibility, card_mod, ...) are preserved, and
 * options set back to their defaults are removed.
 */
export function mergeEditorConfig(
  raw: Record<string, unknown>,
  patch: Partial<CardConfig>,
): Record<string, unknown> {
  const config: Record<string, unknown> = { ...raw, ...patch };
  if (!config.title) delete config.title;
  if (config.trains === MAX_TRAINS) delete config.trains;
  if (config.language === "auto") delete config.language;
  return config;
}
