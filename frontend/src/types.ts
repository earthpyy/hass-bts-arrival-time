export type Language = "en" | "th";

export interface CardConfig {
  type: string;
  title?: string;
  entities: string[];
  trains: number;
  language: "auto" | Language;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export interface HassEntityRegistryEntry {
  entity_id: string;
  platform: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  entities: Record<string, HassEntityRegistryEntry>;
  locale: { language: string };
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
  ): Promise<unknown>;
}

export type RowState =
  "ok" | "unavailable" | "direction_missing" | "no_service";
