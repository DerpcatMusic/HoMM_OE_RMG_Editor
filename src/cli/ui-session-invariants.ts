import assert from "node:assert/strict";
import { computeTopologyPackedLayout, type GraphLayoutZoneInput } from "../ui/data/graphLayout.js";
import { projectTemplateToShellData } from "../ui/data/templateProjection.js";
import {
  addConnectionBetweenZones,
  addDefaultRoadToSelectedZone,
  addMainObjectToSelectedZone,
  addZoneToSession,
  canRedoSession,
  canUndoSession,
  createInitialEditorSession,
  moveZoneInSession,
  moveZoneObjectInSession,
  pasteZoneClipboardIntoSelectedZone,
  reassignZoneOwner,
  redoSession,
  removeSelectedZoneFromSession,
  serializeSessionTemplate,
  selectZone,
  undoSession,
  updateSelectedConnectionInSession,
  updateGlobalSettingsInSession,
  updateSelectedZoneMainObjectInSession,
  updateSelectedZoneRoadInSession,
  updateSelectedZoneInSession,
} from "../ui/state/editorSession.js";
import { copyZone, getClipboard } from "../ui/state/clipboard.js";

function graphZone(name: string, index: number, role: GraphLayoutZoneInput["role"] = "neutral"): GraphLayoutZoneInput {
  return { name, index, role, size: 1 };
}

function assertAlmostEqual(actual: number, expected: number, message: string): void {
  assert.ok(Math.abs(actual - expected) <= 0.01, `${message}: expected ${actual} ~= ${expected}`);
}

function assertInSafeBounds(value: number, message: string): void {
  assert.ok(value >= 6 && value <= 82, `${message}: expected ${value} within 6..82`);
}

function requireLayoutPosition(layout: Readonly<Record<string, { x: number; y: number }>>, name: string): { x: number; y: number } {
  const position = layout[name];
  assert.ok(position, `layout position exists for ${name}`);
  return position;
}

const serialLayout = computeTopologyPackedLayout(
  [graphZone("A", 0), graphZone("B", 1), graphZone("C", 2)],
  [{ from: "A", to: "B" }, { from: "B", to: "C" }],
);
const serialA = requireLayoutPosition(serialLayout, "A");
const serialB = requireLayoutPosition(serialLayout, "B");
const serialC = requireLayoutPosition(serialLayout, "C");
assertAlmostEqual(serialA.y, serialB.y, "serial line A/B y");
assertAlmostEqual(serialB.y, serialC.y, "serial line B/C y");
assert.ok(serialA.x < serialB.x && serialB.x < serialC.x, "serial line x order");

const longSerialZones = Array.from({ length: 9 }, (_, index) => graphZone(`L${index}`, index));
const longSerialConnections = Array.from({ length: longSerialZones.length - 1 }, (_, index) => ({
  from: `L${index}`,
  to: `L${index + 1}`,
}));
const longSerialLayout = computeTopologyPackedLayout(longSerialZones, longSerialConnections);
const longSerialRows = new Set(Object.values(longSerialLayout).map((position) => position.y));
assert.ok(longSerialRows.size >= 2, "long serial chain wraps to multiple rows");
for (const [name, position] of Object.entries(longSerialLayout)) {
  assertInSafeBounds(position.x, `${name} x`);
  assertInSafeBounds(position.y, `${name} y`);
}

const triangleLayout = computeTopologyPackedLayout(
  [graphZone("A", 0), graphZone("B", 1), graphZone("C", 2)],
  [{ from: "A", to: "B" }, { from: "B", to: "C" }, { from: "A", to: "C", connectionType: "Portal" }],
);
const triangleA = requireLayoutPosition(triangleLayout, "A");
const triangleB = requireLayoutPosition(triangleLayout, "B");
const triangleC = requireLayoutPosition(triangleLayout, "C");
const doubledArea = Math.abs(
  triangleA.x * (triangleB.y - triangleC.y)
    + triangleB.x * (triangleC.y - triangleA.y)
    + triangleC.x * (triangleA.y - triangleB.y),
);
assert.ok(doubledArea > 1, "triangle layout is not collinear");

const singleEdgeLayout = computeTopologyPackedLayout(
  [graphZone("A", 0), graphZone("B", 1)],
  [{ from: "A", to: "B" }],
);
const parallelEdgeLayout = computeTopologyPackedLayout(
  [graphZone("A", 0), graphZone("B", 1)],
  [{ from: "A", to: "B" }, { from: "B", to: "A" }, { from: "A", to: "B" }],
);
assert.deepEqual(parallelEdgeLayout, singleEdgeLayout);

const manualLayout = computeTopologyPackedLayout(
  [graphZone("A", 0), graphZone("B", 1)],
  [{ from: "A", to: "B" }],
  { A: { x: 2.5, y: 88.5 } },
);
assert.deepEqual(manualLayout.A, { x: 2.5, y: 88.5 });

const disconnectedLayout = computeTopologyPackedLayout(
  [graphZone("A", 0), graphZone("B", 1), graphZone("C", 2), graphZone("D", 3)],
  [{ from: "A", to: "B" }, { from: "C", to: "D" }],
);
for (const [name, position] of Object.entries(disconnectedLayout)) {
  assertInSafeBounds(position.x, `${name} disconnected x`);
  assertInSafeBounds(position.y, `${name} disconnected y`);
}

const christmasTreeLayout = computeTopologyPackedLayout(
  [
    graphZone("Spawn-A", 0, "spawn"),
    graphZone("Spawn-B", 1, "spawn"),
    graphZone("Trunk-1", 2, "connector"),
    graphZone("Trunk-2", 3, "connector"),
    graphZone("Trunk-3", 4, "connector"),
    graphZone("Branch-1", 5),
    graphZone("Branch-2", 6),
    graphZone("Branch-3", 7),
    graphZone("Branch-4", 8),
    graphZone("Branch-5", 9),
    graphZone("Branch-6", 10),
  ],
  [
    { from: "Spawn-A", to: "Trunk-1" },
    { from: "Trunk-1", to: "Trunk-2" },
    { from: "Trunk-1", to: "Branch-1" },
    { from: "Trunk-1", to: "Branch-2" },
    { from: "Branch-1", to: "Branch-3" },
    { from: "Branch-2", to: "Branch-4" },
    { from: "Trunk-2", to: "Branch-3" },
    { from: "Trunk-2", to: "Branch-4" },
    { from: "Trunk-2", to: "Trunk-3" },
    { from: "Branch-3", to: "Branch-5" },
    { from: "Branch-4", to: "Branch-6" },
    { from: "Trunk-3", to: "Branch-5" },
    { from: "Trunk-3", to: "Branch-6" },
    { from: "Trunk-3", to: "Spawn-B" },
    { from: "Branch-5", to: "Spawn-B" },
    { from: "Branch-6", to: "Spawn-B" },
  ],
);
const christmasTrunk1 = requireLayoutPosition(christmasTreeLayout, "Trunk-1");
const christmasTrunk2 = requireLayoutPosition(christmasTreeLayout, "Trunk-2");
const christmasTrunk3 = requireLayoutPosition(christmasTreeLayout, "Trunk-3");
const christmasLeft1 = requireLayoutPosition(christmasTreeLayout, "Branch-1");
const christmasLeft3 = requireLayoutPosition(christmasTreeLayout, "Branch-3");
const christmasLeft5 = requireLayoutPosition(christmasTreeLayout, "Branch-5");
const christmasRight2 = requireLayoutPosition(christmasTreeLayout, "Branch-2");
const christmasRight4 = requireLayoutPosition(christmasTreeLayout, "Branch-4");
const christmasRight6 = requireLayoutPosition(christmasTreeLayout, "Branch-6");
assert.ok(christmasTrunk1.y < christmasTrunk2.y && christmasTrunk2.y < christmasTrunk3.y, "Christmas Tree trunk descends vertically");
assert.ok(christmasLeft1.x < christmasTrunk1.x && christmasLeft3.x < christmasTrunk2.x && christmasLeft5.x < christmasTrunk3.x, "Christmas Tree left branches stay left of trunk");
assert.ok(christmasRight2.x > christmasTrunk1.x && christmasRight4.x > christmasTrunk2.x && christmasRight6.x > christmasTrunk3.x, "Christmas Tree right branches stay right of trunk");
assert.ok(Math.abs(christmasTrunk1.x - christmasTrunk2.x) < 8 && Math.abs(christmasTrunk2.x - christmasTrunk3.x) < 8, "Christmas Tree trunk remains a central column");

const roadProjection = projectTemplateToShellData(
  {
    name: "Road Projection Probe",
    variants: [
      {
        zones: [
          {
            name: "Road-Zone",
            mainObjects: [{ type: "City" }],
            roads: [
              {
                from: { type: "MainObject", args: ["0"] },
                to: { type: "Crossroads" },
              },
            ],
          },
        ],
        connections: [],
      },
    ],
  },
  0,
  "Road-Zone",
  undefined,
);
assert.equal(roadProjection.selectedZone?.zoneRoads.length, 1);
assert.equal(roadProjection.selectedZone?.zoneRoads[0]?.type, "Dirt");

let session = createInitialEditorSession();
const initialZoneCount = session.template.variants?.[0]?.zones?.length ?? 0;
const initialConnectionCount = session.template.variants?.[0]?.connections?.length ?? 0;

session = updateGlobalSettingsInSession(session, {
  gameMode: "Classic",
  sizeX: 144,
  sizeZ: 136,
  displayWinCondition: "win_condition_5",
  heroCountMin: 3,
  heroCountMax: 7,
  heroCountIncrement: 1,
  heroHireBan: false,
  encounterHoles: true,
  disableFactionLaws: false,
  disableMagicGuild: false,
  disableMagicCustomLearning: false,
  tournamentRules: false,
  factionLawsExpModifier: 1,
  astrologyExpModifier: 1,
  classic: true,
  desertion: true,
  desertionDay: 21,
  desertionValue: 1000,
  heroLighting: false,
  heroLightingDay: undefined,
  lostStartCity: false,
  lostStartCityDay: undefined,
  lostStartHero: false,
  gladiatorArena: false,
  gladiatorArenaDaysDelayStart: undefined,
  gladiatorArenaCountDay: undefined,
  championSelectRule: "",
  cityHold: false,
  cityHoldDays: undefined,
  tournament: false,
  tournamentPointsToWin: undefined,
});
assert.equal(session.template.gameRules?.heroCountMin, 3);
assert.equal(session.template.gameRules?.heroCountMax, 7);
assert.equal(session.template.gameRules?.winConditions?.desertion, true);
assert.equal(session.template.gameRules?.winConditions?.desertionDay, 21);
assert.equal(session.template.sizeX, 144);
assert.equal(session.template.sizeZ, 136);
assert.equal(session.template.displayWinCondition, "win_condition_5");

session = updateGlobalSettingsInSession(session, {
  gameMode: "SingleHero",
  sizeX: 144,
  sizeZ: 136,
  displayWinCondition: "win_condition_5",
  heroCountMin: 4,
  heroCountMax: 9,
  heroCountIncrement: 2,
  heroHireBan: false,
  encounterHoles: true,
  disableFactionLaws: false,
  disableMagicGuild: false,
  disableMagicCustomLearning: false,
  tournamentRules: false,
  factionLawsExpModifier: 1,
  astrologyExpModifier: 1,
  classic: true,
  desertion: false,
  desertionDay: undefined,
  desertionValue: undefined,
  heroLighting: false,
  heroLightingDay: undefined,
  lostStartCity: false,
  lostStartCityDay: undefined,
  lostStartHero: false,
  gladiatorArena: false,
  gladiatorArenaDaysDelayStart: undefined,
  gladiatorArenaCountDay: undefined,
  championSelectRule: "",
  cityHold: false,
  cityHoldDays: undefined,
  tournament: false,
  tournamentPointsToWin: undefined,
});
assert.equal(session.template.gameMode, "SingleHero");
assert.equal(session.template.gameRules?.heroCountMin, 1);
assert.equal(session.template.gameRules?.heroCountMax, 1);
assert.equal(session.template.gameRules?.heroCountIncrement, 1);
assert.equal(session.template.gameRules?.heroHireBan, true);
assert.equal(session.template.gameRules?.encounterHoles, false);
assert.equal(session.template.gameRules?.winConditions?.lostStartHero, true);

session = addZoneToSession(session);
assert.equal(session.lastMessage.startsWith("Add Zone"), true);
assert.equal(session.template.variants?.[0]?.zones?.length, initialZoneCount + 1);
assert.equal(session.selectedZoneName, "Zone");

session = updateSelectedZoneInSession(session, {
  name: "Edited-Zone",
  size: 1.5,
  layout: "zone_layout_default",
  zoneBiomeType: "FromList",
  zoneBiomeArgs: ["Grass"],
  contentBiomeType: "MatchZone",
  contentBiomeArgs: [],
  metaObjectsBiomeType: "MatchZone",
  metaObjectsBiomeArgs: [],
  crossroadsPosition: 0,
  diplomacyModifier: -0.5,
  guardCutoffValue: 250,
  guardMultiplier: 1.25,
  guardRandomization: 0.2,
  guardWeeklyIncrement: 0.1,
  guardReactionDistribution: [1, 2, 3, 4, 5, 6],
  guardedContentValue: 1000,
  guardedContentValuePerArea: 10,
  unguardedContentValue: 500,
  unguardedContentValuePerArea: 5,
  resourcesValue: 250,
  resourcesValuePerArea: 2,
  guardedPools: ["content_pool_default_guarded"],
  unguardedPools: ["content_pool_default_unguarded"],
  resourcesPools: ["content_pool_default_resources"],
  mandatoryContent: [],
  contentCountLimits: [],
});
assert.equal(session.selectedZoneName, "Edited-Zone");
const editedZone = session.template.variants?.[0]?.zones?.find((zone) => zone.name === "Edited-Zone");
assert.equal(editedZone?.size, 1.5);
assert.equal(editedZone?.layout, "zone_layout_default");
assert.deepEqual(editedZone?.zoneBiome, { type: "FromList", args: ["Grass"] });
assert.equal(editedZone?.guardMultiplier, 1.25);
assert.equal(editedZone?.guardedContentValue, 1000);
assert.deepEqual(editedZone?.guardedContentPool, ["content_pool_default_guarded"]);

session = moveZoneInSession(session, "Edited-Zone", { x: 25.123, y: 65.987 });
assert.deepEqual(session.canvasPositions["Edited-Zone"], { x: 25.12, y: 65.99 });

session = addConnectionBetweenZones(session, "Edited-Zone", "Spawn-A");
assert.equal(session.template.variants?.[0]?.connections?.length, initialConnectionCount + 1);
assert.equal(session.selectedConnectionName, "Edited-Zone-Spawn-A");
assert.equal(
  session.template.variants?.[0]?.connections?.some((connection) => connection.from === "Edited-Zone" || connection.to === "Edited-Zone"),
  true,
);

session = updateSelectedConnectionInSession(session, {
  originalName: "Edited-Zone-Spawn-A",
  name: "Edited-Link",
  from: "Edited-Zone",
  to: "Spawn-A",
  connectionType: "Portal",
  length: 2,
  portalFromEnabled: true,
  portalToEnabled: true,
  guardZone: "Edited-Zone",
  guardValue: 1000,
  guardWeeklyIncrement: 50,
  guardReaction: "Aggressive",
  guardEscape: false,
  gatePlacement: "Random",
  road: true,
  simTurnSquad: true,
  guardRandomization: 0.15,
});
const editedConnection = session.template.variants?.[0]?.connections?.find((connection) => connection.name === "Edited-Link");
assert.equal(editedConnection?.connectionType, "Portal");
assert.equal(editedConnection?.portalFromEnabled, true);
assert.equal(editedConnection?.guardZone, "Edited-Zone");
assert.equal(editedConnection?.guardValue, 1000);
assert.equal(canUndoSession(session), true);
session = undoSession(session);
assert.equal(canRedoSession(session), true);
assert.equal(session.template.variants?.[0]?.connections?.some((connection) => connection.name === "Edited-Link"), false);
session = redoSession(session);
assert.equal(session.template.variants?.[0]?.connections?.some((connection) => connection.name === "Edited-Link"), true);

session = addMainObjectToSelectedZone(session);
let editedZoneAfterObject = session.template.variants?.[0]?.zones?.find((zone) => zone.name === "Edited-Zone");
assert.equal(editedZoneAfterObject?.mainObjects?.length, 1);

session = moveZoneObjectInSession(session, "Edited-Zone", "main:0", { x: 33.337, y: 44.445 });
assert.deepEqual(session.zoneObjectPositions["Edited-Zone"]?.["main:0"], { x: 33.34, y: 44.45 });

session = updateSelectedZoneMainObjectInSession(session, {
  objectIndex: 0,
  type: "Spawn",
  spawn: "Player1",
  owner: "",
  isKeyObject: true,
  holdCityWinCon: false,
  placement: "Connection",
  placementArgs: ["Edited-Link"],
  factionType: "FromList",
  factionArgs: ["human", "differentFrom: 0 Spawn-A"],
  enableWeeklyUnitIncrement: true,
  initialUnitIncrement: 2,
  guardChance: 0.5,
  guardValue: 500,
  guardWeeklyIncrement: 25,
  guardRandomization: 0.1,
  removeGuardIfHasOwner: true,
  buildingsConstructionSid: "building_set_default",
  buildingsBanSid: "",
});
editedZoneAfterObject = session.template.variants?.[0]?.zones?.find((zone) => zone.name === "Edited-Zone");
assert.equal(editedZoneAfterObject?.mainObjects?.[0]?.type, "Spawn");
assert.equal(editedZoneAfterObject?.mainObjects?.[0]?.spawn, "Player1");
assert.deepEqual(editedZoneAfterObject?.mainObjects?.[0]?.placementArgs, ["Edited-Link"]);
assert.deepEqual(editedZoneAfterObject?.mainObjects?.[0]?.faction, { type: "FromList", args: ["human", "differentFrom: 0 Spawn-A"] });
assert.equal(editedZoneAfterObject?.mainObjects?.[0]?.guardValue, 500);

session = addDefaultRoadToSelectedZone(session);
editedZoneAfterObject = session.template.variants?.[0]?.zones?.find((zone) => zone.name === "Edited-Zone");
assert.equal(editedZoneAfterObject?.roads?.length, 1);

session = updateSelectedZoneRoadInSession(session, {
  roadIndex: 0,
  type: "Dirt",
  from: { type: "Crossroads", args: ["ignored"] },
  to: { type: "Connection", args: ["Edited-Link"] },
});
editedZoneAfterObject = session.template.variants?.[0]?.zones?.find((zone) => zone.name === "Edited-Zone");
assert.equal(editedZoneAfterObject?.roads?.[0]?.type, "Dirt");
assert.deepEqual(editedZoneAfterObject?.roads?.[0]?.from, { type: "Crossroads", args: [] });
assert.deepEqual(editedZoneAfterObject?.roads?.[0]?.to, { type: "Connection", args: ["Edited-Link"] });

session = removeSelectedZoneFromSession(session);
assert.equal(session.template.variants?.[0]?.zones?.some((zone) => zone.name === "Edited-Zone"), false);
assert.equal(
  session.template.variants?.[0]?.connections?.some((connection) => connection.from === "Edited-Zone" || connection.to === "Edited-Zone"),
  false,
);

assert.doesNotThrow(() => JSON.parse(serializeSessionTemplate(session)) as unknown);
assert.equal(session.dirty, true);

let pasteSession = createInitialEditorSession();
const pasteVariant = pasteSession.template.variants?.[0];
const pasteSourceZone = pasteVariant?.zones?.find((zone) => zone.name === "Spawn-A");
assert.ok(pasteVariant);
assert.ok(pasteSourceZone);
pasteSession.template.mandatoryContent = [
  {
    name: "Spawn-A_mandatory",
    content: [
      {
        name: "gold_mine",
        sid: "mine_gold",
        isMine: true,
        owner: "Player1",
      },
    ],
  },
];
pasteSourceZone.mandatoryContent = ["Spawn-A_mandatory"];
pasteSourceZone.roads = [
  {
    type: "Stone",
    from: { type: "MainObject", args: ["0"] },
    to: { type: "MandatoryContent", args: ["gold_mine"] },
  },
  {
    type: "Dirt",
    from: { type: "MandatoryContent", args: ["gold_mine"] },
    to: { type: "Connection", args: ["Spawn-A-Center"] },
  },
];
copyZone(pasteSourceZone, {
  mandatoryPresets: pasteSession.template.mandatoryContent,
  zoneObjectPositions: {
    "main:0": { x: 20, y: 30 },
    "mandatory:gold_mine": { x: 56.5, y: 42.25 },
    "connection:Spawn-A-Center": { x: 80, y: 50 },
  },
});
const copiedZoneEntry = getClipboard();
assert.ok(copiedZoneEntry?.kind === "zone");
pasteSession = selectZone(pasteSession, "Spawn-B");
pasteSession = pasteZoneClipboardIntoSelectedZone(pasteSession, copiedZoneEntry.data);
const pastedZone = pasteSession.template.variants?.[0]?.zones?.find((zone) => zone.name === "Spawn-B");
assert.equal(pastedZone?.mainObjects?.[0]?.spawn, "Player2");
assert.equal(pastedZone?.mandatoryContent?.length, 1);
assert.notEqual(pastedZone?.mandatoryContent?.[0], "Spawn-A_mandatory");
const pastedPreset = pasteSession.template.mandatoryContent?.find((preset) => preset.name === pastedZone?.mandatoryContent?.[0]);
assert.equal(pastedPreset?.content?.[0]?.name, "gold_mine");
assert.equal(pastedPreset?.content?.[0]?.owner, "Player2");
assert.equal(pastedZone?.roads?.length, 2);
assert.deepEqual(pastedZone?.roads?.[0]?.to, { type: "MandatoryContent", args: ["gold_mine"] });
assert.deepEqual(pastedZone?.roads?.[1]?.to, { type: "Connection", args: ["Spawn-B-Center"] });
assert.deepEqual(pasteSession.zoneObjectPositions["Spawn-B"]?.["mandatory:gold_mine"], { x: 56.5, y: 42.25 });
assert.deepEqual(pasteSession.zoneObjectPositions["Spawn-B"]?.["connection:Spawn-B-Center"], { x: 80, y: 50 });

let fallbackPasteSession = createInitialEditorSession();
const fallbackVariant = fallbackPasteSession.template.variants?.[0];
const fallbackSourceZone = fallbackVariant?.zones?.find((zone) => zone.name === "Spawn-A");
assert.ok(fallbackVariant);
assert.ok(fallbackSourceZone);
fallbackPasteSession.template.mandatoryContent = [
  {
    name: "Spawn-A_fallback_mandatory",
    content: [
      {
        name: "crystal_mine",
        sid: "mine_crystals",
        isMine: true,
        owner: "Player1",
      },
      {
        name: "enemy_cache",
        sid: "object_enemy_cache",
        owner: "Player3",
      },
    ],
  },
];
fallbackSourceZone.mandatoryContent = ["Spawn-A_fallback_mandatory"];
copyZone(fallbackSourceZone);
const fallbackCopiedZoneEntry = getClipboard();
assert.ok(fallbackCopiedZoneEntry?.kind === "zone");
fallbackPasteSession = selectZone(fallbackPasteSession, "Spawn-B");
fallbackPasteSession = pasteZoneClipboardIntoSelectedZone(fallbackPasteSession, fallbackCopiedZoneEntry.data);
const fallbackPastedZone = fallbackPasteSession.template.variants?.[0]?.zones?.find((zone) => zone.name === "Spawn-B");
assert.equal(fallbackPastedZone?.mandatoryContent?.length, 1);
assert.notEqual(fallbackPastedZone?.mandatoryContent?.[0], "Spawn-A_fallback_mandatory");
const fallbackPastedPreset = fallbackPasteSession.template.mandatoryContent?.find((preset) => preset.name === fallbackPastedZone?.mandatoryContent?.[0]);
assert.equal(fallbackPastedPreset?.content?.[0]?.owner, "Player2");
assert.equal(fallbackPastedPreset?.content?.[1]?.owner, "Player3");

let ownerOnlyPasteSession = createInitialEditorSession();
const ownerOnlyVariant = ownerOnlyPasteSession.template.variants?.[0];
const ownerOnlySourceZone = ownerOnlyVariant?.zones?.find((zone) => zone.name === "Spawn-A");
const ownerOnlyTargetZone = ownerOnlyVariant?.zones?.find((zone) => zone.name === "Spawn-B");
assert.ok(ownerOnlySourceZone);
assert.ok(ownerOnlyTargetZone);
ownerOnlySourceZone.mainObjects = [{ type: "City", owner: "Player1", placement: "Uniform" }];
ownerOnlyTargetZone.mainObjects = [{ type: "City", owner: "Player2", placement: "Uniform" }];
ownerOnlyPasteSession.template.mandatoryContent = [
  {
    name: "Spawn-A_owner_mandatory",
    content: [
      {
        name: "gold_mine",
        sid: "mine_gold",
        isMine: true,
        owner: "Player1",
      },
    ],
  },
];
ownerOnlySourceZone.mandatoryContent = ["Spawn-A_owner_mandatory"];
copyZone(ownerOnlySourceZone, { mandatoryPresets: ownerOnlyPasteSession.template.mandatoryContent });
const ownerOnlyCopiedZoneEntry = getClipboard();
assert.ok(ownerOnlyCopiedZoneEntry?.kind === "zone");
ownerOnlyPasteSession = selectZone(ownerOnlyPasteSession, "Spawn-B");
ownerOnlyPasteSession = pasteZoneClipboardIntoSelectedZone(ownerOnlyPasteSession, ownerOnlyCopiedZoneEntry.data);
const ownerOnlyPastedZone = ownerOnlyPasteSession.template.variants?.[0]?.zones?.find((zone) => zone.name === "Spawn-B");
const ownerOnlyPastedPreset = ownerOnlyPasteSession.template.mandatoryContent?.find((preset) => preset.name === ownerOnlyPastedZone?.mandatoryContent?.[0]);
assert.equal(ownerOnlyPastedZone?.mainObjects?.[0]?.owner, "Player2");
assert.equal(ownerOnlyPastedPreset?.content?.[0]?.owner, "Player2");

let reassignOwnerSession = createInitialEditorSession();
const reassignOwnerVariant = reassignOwnerSession.template.variants?.[0];
const reassignOwnerZone = reassignOwnerVariant?.zones?.find((zone) => zone.name === "Spawn-A");
assert.ok(reassignOwnerZone);
reassignOwnerSession.template.mandatoryContent = [
  {
    name: "Spawn-A_reassign_mandatory",
    content: [
      {
        name: "gold_mine",
        sid: "mine_gold",
        isMine: true,
        owner: "Player1",
      },
      {
        name: "third_player_cache",
        sid: "object_third_player_cache",
        owner: "Player3",
      },
    ],
  },
];
reassignOwnerZone.mandatoryContent = ["Spawn-A_reassign_mandatory"];
reassignOwnerSession = reassignZoneOwner(reassignOwnerSession, "Spawn-A", "Player2");
const reassignedPreset = reassignOwnerSession.template.mandatoryContent?.find((preset) => preset.name === "Spawn-A_reassign_mandatory");
assert.equal(reassignedPreset?.content?.[0]?.owner, "Player2");
assert.equal(reassignedPreset?.content?.[1]?.owner, "Player3");

console.log(
  `ui-session invariants: zones=${session.template.variants?.[0]?.zones?.length ?? 0}, connections=${session.template.variants?.[0]?.connections?.length ?? 0}`,
);
