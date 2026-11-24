import { css, html, LitElement, nothing, type PropertyValues } from "lit";

import {
  isStale,
  minutesAgo,
  normalizeConfig,
  oldestUpdated,
  resolveLanguage,
  rowState,
  trainLabels,
} from "./logic";
import { STRINGS } from "./strings";
import type {
  CardConfig,
  HassEntity,
  HomeAssistant,
  Language,
  RowState,
} from "./types";

export const DOMAIN = "bts_arrival_time";
export const CARD_TAG = "bts-arrival-card";
export const EDITOR_TAG = "bts-arrival-card-editor";

const FOOTER_TICK_MS = 30_000;
const REFRESH_COOLDOWN_MS = 5_000;

/** Entity ids of this integration's sensors that carry the `upcoming` list. */
export function btsEntityIds(hass: HomeAssistant): string[] {
  return Object.values(hass.entities ?? {})
    .filter(
      (entry) =>
        entry.platform === DOMAIN &&
        Array.isArray(hass.states[entry.entity_id]?.attributes.upcoming),
    )
    .map((entry) => entry.entity_id)
    .sort();
}

function attr(stateObj: HassEntity | undefined, key: string): string {
  const value = stateObj?.attributes[key];
  return typeof value === "string" ? value : "";
}

export class BtsArrivalCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _refreshing: { state: true },
    _cooldown: { state: true },
  };

  hass?: HomeAssistant;
  private _config?: CardConfig;
  private _refreshing = false;
  private _cooldown = false;
  private _tick?: ReturnType<typeof setInterval>;
  private _cooldownTimer?: ReturnType<typeof setTimeout>;
  private _autoRefreshPending = false;

  static getConfigElement(): HTMLElement {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig(hass: HomeAssistant): Partial<CardConfig> {
    return { entities: btsEntityIds(hass).slice(0, 1) };
  }

  setConfig(config: unknown): void {
    this._config = normalizeConfig(config);
  }

  getCardSize(): number {
    if (!this._config) return 1;
    return this._config.entities.length + (this._config.title ? 1 : 0) + 1;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._tick = setInterval(() => this.requestUpdate(), FOOTER_TICK_MS);
    this._autoRefreshPending = true;
    document.addEventListener("visibilitychange", this._onVisibilityChange);
    this._maybeAutoRefresh();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._tick);
    clearTimeout(this._cooldownTimer);
    this._cooldown = false;
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
  }

  /**
   * Refresh once when the card is shown, if `auto_refresh` is on.
   *
   * When the dashboard opens, or the app comes back from the background,
   * the frontend is often still (re)connecting to Home Assistant. Calling
   * the action then fails with a "Failed to perform the action" toast, so
   * wait until the connection is up and the action is known.
   */
  private _maybeAutoRefresh(): void {
    if (!this._autoRefreshPending || !this._config) return;
    if (!this._config.auto_refresh || document.visibilityState === "hidden") {
      this._autoRefreshPending = false;
      return;
    }
    if (!this._hassReady()) return; // retried on the next `hass` update
    this._autoRefreshPending = false;
    // Errors are not actionable here; the footer shows stale data anyway.
    this._refresh(true).catch(() => undefined);
  }

  private _hassReady(): boolean {
    const hass = this.hass;
    if (!hass || hass.connected === false) return false;
    return !hass.services || !!hass.services.homeassistant?.update_entity;
  }

  private _onVisibilityChange = (): void => {
    if (document.visibilityState !== "visible") return;
    this._autoRefreshPending = true;
    this._maybeAutoRefresh();
  };

  protected shouldUpdate(changed: PropertyValues): boolean {
    // Runs on every `hass` change (render may be skipped below), so this is
    // where a pending auto refresh notices the connection is back.
    this._maybeAutoRefresh();
    if (!this._config) return false;
    if (!changed.has("hass") || changed.size > 1) return true;
    const old = changed.get("hass") as HomeAssistant | undefined;
    if (!old || !this.hass) return true;
    return (
      old.locale?.language !== this.hass.locale?.language ||
      this._config.entities.some(
        (id) => old.states[id] !== this.hass!.states[id],
      )
    );
  }

  private get _lang(): Language {
    return resolveLanguage(
      this._config?.language,
      this.hass?.locale?.language ?? "en",
    );
  }

  protected render() {
    if (!this._config || !this.hass) return nothing;
    const lang = this._lang;
    const states = this._config.entities.map((id) => this.hass!.states[id]);
    return html`
      <ha-card .header=${this._config.title}>
        <div class="rows ${this._config.title ? "" : "no-header"}">
          ${this._config.entities.map((id, i) =>
            this._renderRow(id, states[i], lang),
          )}
        </div>
        ${this._renderFooter(states, lang)}
      </ha-card>
    `;
  }

  private _renderRow(
    entityId: string,
    stateObj: HassEntity | undefined,
    lang: Language,
  ) {
    const state: RowState = rowState(stateObj);
    const strings = STRINGS[lang];
    const station =
      (lang === "th" && attr(stateObj, "station_name_th")) ||
      attr(stateObj, "station_name");
    const destination =
      (lang === "th" && attr(stateObj, "destination_name_th")) ||
      attr(stateObj, "destination_name");
    const label =
      station && destination
        ? `${station} → ${destination}`
        : station || entityId;
    const color = attr(stateObj, "line_color") || "var(--primary-color)";

    let times;
    if (state === "ok") {
      const labels = trainLabels(
        stateObj!.attributes.upcoming,
        this._config!.trains,
        lang,
      );
      const allArriving = labels.every((l) => l === strings.arriving);
      times = html`<span class="times"
        >${labels.join(" · ")}${
          labels.length && !allArriving ? ` ${strings.min}` : ""
        }</span
      >`;
    } else {
      const message = {
        unavailable: strings.unavailable,
        direction_missing: strings.directionMissing,
        no_service: strings.noService,
      }[state];
      times = html`<span class="times muted">${message}</span>`;
    }

    return html`
      <div class="row">
        <span class="stripe" style="background: ${color}"></span>
        <span class="label">${label}</span>
        ${times}
      </div>
    `;
  }

  private _renderFooter(states: (HassEntity | undefined)[], lang: Language) {
    const strings = STRINGS[lang];
    const updated = oldestUpdated(states.map((s) => s?.attributes.api_updated));
    const now = Date.now();
    let text: string | typeof nothing = nothing;
    let stale = false;
    if (updated !== null) {
      const ago = minutesAgo(updated, now);
      text = ago === 0 ? strings.updatedJustNow : strings.updatedAgo(ago);
      stale = isStale(updated, now);
    }
    return html`
      <div class="footer">
        <span class="updated ${stale ? "stale" : ""}">${text}</span>
        <ha-icon-button
          class=${this._refreshing ? "spinning" : ""}
          .label=${strings.refresh}
          title=${strings.refresh}
          .disabled=${this._refreshing || this._cooldown}
          @click=${() => this._refresh()}
        >
          <ha-icon icon="mdi:refresh"></ha-icon>
        </ha-icon-button>
      </div>
    `;
  }

  private async _refresh(silent = false): Promise<void> {
    if (!this.hass || !this._config || this._refreshing || this._cooldown) {
      return;
    }
    this._refreshing = true;
    try {
      await this.hass.callService(
        "homeassistant",
        "update_entity",
        { entity_id: this._config.entities },
        undefined,
        !silent,
      );
    } finally {
      this._refreshing = false;
      this._cooldown = true;
      clearTimeout(this._cooldownTimer);
      this._cooldownTimer = setTimeout(() => {
        this._cooldown = false;
      }, REFRESH_COOLDOWN_MS);
    }
  }

  static styles = css`
    .rows {
      padding: 8px 16px 0;
    }
    .rows.no-header {
      padding-top: 16px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 40px;
    }
    .row + .row {
      border-top: 1px solid var(--divider-color);
    }
    .stripe {
      flex: none;
      width: 4px;
      align-self: stretch;
      margin: 6px 0;
      border-radius: 2px;
    }
    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--primary-text-color);
    }
    .times {
      flex: none;
      font-variant-numeric: tabular-nums;
      color: var(--primary-text-color);
      font-weight: 500;
    }
    .muted {
      color: var(--secondary-text-color);
      font-weight: normal;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      padding: 0 4px 0 16px;
      color: var(--secondary-text-color);
      font-size: 0.85em;
    }
    .updated {
      flex: 1;
    }
    .updated.stale {
      color: var(--warning-color);
    }
    ha-icon-button {
      --mdc-icon-button-size: 36px;
      --mdc-icon-size: 20px;
      color: var(--secondary-text-color);
    }
    .spinning ha-icon {
      display: inline-flex;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;
}
