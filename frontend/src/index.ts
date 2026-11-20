import { BtsArrivalCard, CARD_TAG, EDITOR_TAG } from "./bts-arrival-card";
import { BtsArrivalCardEditor } from "./editor";

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, BtsArrivalCard);
}
if (!customElements.get(EDITOR_TAG)) {
  customElements.define(EDITOR_TAG, BtsArrivalCardEditor);
}

window.customCards = window.customCards ?? [];
if (!window.customCards.some((card) => card.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: "BTS Arrivals",
    description: "Upcoming BTS Skytrain trains for one or more stations.",
    preview: true,
  });
}
