export interface RmgContentSemanticsInput {
  id?: string;
  sourcePaths?: readonly string[];
}

const MINE_ROUTED_SOURCE_MARKERS = [
  "objects_logic/res_mines/",
  "objects_logic/res_trade_labs/",
  "objects_logic/unit_res_trade_labs/",
  "objects_logic/magic_mines/",
] as const;

const KNOWN_MINE_ROUTED_SIDS = new Set([
  "alchemy_lab",
  "magic_amplifier_1",
  "magic_amplifier_2",
  "magic_amplifier_3",
  "magic_amplifier_4",
  "mine_crystals",
  "mine_gemstones",
  "mine_gold",
  "mine_mercury",
  "mine_ore",
  "mine_wood",
  "unit_trade_lab_gnat",
  "unit_trade_lab_kitten_horn",
]);

export function isMineRoutedContent(
  content: RmgContentSemanticsInput | string | undefined,
  fallbackSid = "",
): boolean {
  const sid = typeof content === "string" ? content : (content?.id ?? fallbackSid);
  const normalizedSid = sid.trim();
  if (normalizedSid.startsWith("mine_") || KNOWN_MINE_ROUTED_SIDS.has(normalizedSid)) {
    return true;
  }

  const sourceText = typeof content === "string"
    ? ""
    : (content?.sourcePaths ?? []).join(" ").toLowerCase();
  return MINE_ROUTED_SOURCE_MARKERS.some((marker) => sourceText.includes(marker));
}
