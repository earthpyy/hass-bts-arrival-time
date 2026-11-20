import { css, html, LitElement, nothing } from "lit";

import { btsEntityIds } from "./bts-arrival-card";
import { mergeEditorConfig, normalizeConfig } from "./logic";
import type { CardConfig, HomeAssistant } from "./types";

type EditorConfig = Omit<CardConfig, "entities"> & { entities: string[] };

const SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "trains", selector: { number: { min: 1, max: 3, mode: "box" } } },
  {
    name: "language",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "auto", label: "Auto (follow user language)" },
          { value: "en", label: "English" },
          { value: "th", label: "ไทย" },
        ],
      },
    },
  },
];

const LABELS: Record<string, string> = {
  title: "Title",
  trains: "Trains per row",
  language: "Language",
};

interface HelpersCard {
  getConfigElement?: () => Promise<unknown>;
}

/** Make HA lazy-load ha-form / ha-entity-picker by asking a built-in card for its editor. */
async function loadHaComponents(): Promise<void> {
  if (customElements.get("ha-entity-picker")) return;
  const card = customElements.get("hui-entities-card") as unknown as
    HelpersCard | undefined;
  await card?.getConfigElement?.();
}

export class BtsArrivalCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  hass?: HomeAssistant;
  private _config?: EditorConfig;
  private _raw: Record<string, unknown> = {};

  setConfig(config: Record<string, unknown>): void {
    this._raw = config;
    let normalized: CardConfig;
    try {
      normalized = normalizeConfig(config);
    } catch {
      normalized = normalizeConfig({ ...config, entities: ["placeholder"] });
      normalized.entities = [];
    }
    this._config = normalized;
  }

  connectedCallback(): void {
    super.connectedCallback();
    loadHaComponents().then(() => this.requestUpdate());
  }

  protected render() {
    if (!this.hass || !this._config) return nothing;
    const candidates = btsEntityIds(this.hass);
    const entities = this._config.entities;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${SCHEMA}
        .computeLabel=${(s: { name: string }) => LABELS[s.name] ?? s.name}
        @value-changed=${this._formChanged}
      ></ha-form>
      <div class="entities">
        <div class="heading">Stations</div>
        ${entities.map(
          (entityId, index) => html`
            <div class="entity">
              <ha-entity-picker
                .hass=${this.hass}
                .value=${entityId}
                .includeEntities=${candidates}
                allow-custom-entity
                @value-changed=${(ev: CustomEvent) =>
                  this._entityChanged(index, ev.detail.value)}
              ></ha-entity-picker>
              <ha-icon-button
                .label=${"Move up"}
                .disabled=${index === 0}
                @click=${() => this._move(index, -1)}
                ><ha-icon icon="mdi:arrow-up"></ha-icon
              ></ha-icon-button>
              <ha-icon-button
                .label=${"Move down"}
                .disabled=${index === entities.length - 1}
                @click=${() => this._move(index, 1)}
                ><ha-icon icon="mdi:arrow-down"></ha-icon
              ></ha-icon-button>
              <ha-icon-button
                .label=${"Remove"}
                @click=${() => this._remove(index)}
                ><ha-icon icon="mdi:close"></ha-icon
              ></ha-icon-button>
            </div>
          `,
        )}
        <ha-entity-picker
          .hass=${this.hass}
          .value=${""}
          .includeEntities=${candidates}
          @value-changed=${this._added}
        ></ha-entity-picker>
      </div>
    `;
  }

  private _formChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const value = ev.detail.value as Partial<EditorConfig>;
    this._update({
      title: value.title,
      trains: value.trains ?? 3,
      language: value.language ?? "auto",
    });
  }

  private _entityChanged(index: number, value: string): void {
    if (!value) {
      this._remove(index);
      return;
    }
    const entities = [...this._config!.entities];
    entities[index] = value;
    this._update({ entities });
  }

  private _added(ev: CustomEvent): void {
    ev.stopPropagation();
    const value = ev.detail.value as string;
    if (!value) return;
    (ev.target as HTMLElement & { value: string }).value = "";
    this._update({ entities: [...this._config!.entities, value] });
  }

  private _move(index: number, delta: number): void {
    const entities = [...this._config!.entities];
    const target = index + delta;
    if (target < 0 || target >= entities.length) return;
    [entities[index], entities[target]] = [entities[target], entities[index]];
    this._update({ entities });
  }

  private _remove(index: number): void {
    const entities = this._config!.entities.filter((_, i) => i !== index);
    this._update({ entities });
  }

  private _update(patch: Partial<EditorConfig>): void {
    this._config = { ...this._config!, ...patch };
    const config = mergeEditorConfig(this._raw, patch);
    this._raw = config;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  static styles = css`
    .entities {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .heading {
      font-weight: 500;
    }
    .entity {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .entity ha-entity-picker {
      flex: 1;
    }
  `;
}
