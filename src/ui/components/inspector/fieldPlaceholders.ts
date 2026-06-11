// Placeholder examples based on shipped Olden Era RMG templates.
// Values are intentionally rounded/typical examples, not exhaustive.

export const FIELD_PLACEHOLDERS: Record<string, string> = {
  // --- Global settings: game rules ---
  "gs-sizex": "96–240 (e.g. 128)",
  "gs-sizez": "96–240 (e.g. 128)",
  "gs-hero-min": "0–8 (e.g. 3)",
  "gs-hero-max": "1–10 (e.g. 6)",
  "gs-hero-step": "0–2 (e.g. 1)",
  "gs-faction-exp": "0.5–2.0 (e.g. 1.0)",
  "gs-astro-exp": "0.5–2.0 (e.g. 1.0)",

  // --- Global settings: win conditions ---
  "gs-desert-day": "e.g. 3",
  "gs-desert-val": "e.g. 3000",
  "gs-hero-light-day": "e.g. 1",
  "gs-lost-city-day": "e.g. 3",
  "gs-glad-delay": "e.g. 21",
  "gs-glad-count": "e.g. 8",
  "gs-champ": "e.g. Mirror",
  "gs-city-hold-days": "e.g. 7",
  "gs-tourn-pts": "e.g. 1000",

  // --- Zone form: identity ---
  "zf-name": "e.g. Start Zone",
  "zf-size": "0.5–2.0 (e.g. 1.25)",
  "zf-layout": "e.g. template_layout_start",
  "zf-crossroads": "0.0–1.0 (e.g. 0.5)",
  "zf-diplomacy": "-1.0–1.0 (e.g. 0)",

  // --- Zone form: guard settings (percentage fields show as %, e.g. 15 means 15%) ---
  "zf-guard-cutoff": "500–2500 (e.g. 1500)",
  "zf-guard-multiplier": "Multiplicative % (e.g. 160)",
  "zf-guard-random": "Multiplicative % (e.g. 5)",
  "zf-guard-weekly": "Multiplicative % (e.g. 15)",
  "zf-reaction-weights": "6 weights, e.g. 6 2 1 0 0 0",

  // --- Zone form: content budgets ---
  "zf-guarded-value": "e.g. 175000",
  "zf-guarded-per-area": "e.g. 2000",
  "zf-unguarded-value": "e.g. 40000",
  "zf-unguarded-per-area": "e.g. 0",
  "zf-resources-value": "e.g. 15000",
  "zf-resources-per-area": "e.g. 0",

  // --- Zone form: pools / presets ---
  "zf-mandatory": "e.g. random_resource_gold_large",
  "zf-count-limits": "e.g. random_building_town 4",

  // --- Connection form (percentage fields show as %) ---
  "cf-guard-value": "e.g. 5000",
  "cf-guard-weekly": "Multiplicative % (e.g. 15)",
  "cf-guard-random": "Multiplicative % (e.g. 5)",

  // --- Object form (percentage fields show as %) ---
  "of-guard-value": "e.g. 5000",
  "of-guard-chance": "Multiplicative % (e.g. 100)",
  "of-guard-weekly": "Multiplicative % (e.g. 10)",
  "of-guard-random": "Multiplicative % (e.g. 5)",

  // --- Pool form ---
  "pf-pool-id": "e.g. template_pool_guarded_treasure",
  "pf-group-content": "e.g. random_resource_gold_large",
  "pf-group-weight": "e.g. 10",
  "pf-list-ref": "e.g. template_list_creatures",
  "pf-ban-sid": "e.g. random_creature_dragon",

  // --- Road form ---
  "rf-road-type": "e.g. Dirt",
  "rf-from-id": "e.g. main:0",
  "rf-to-id": "e.g. connection:north",
};
