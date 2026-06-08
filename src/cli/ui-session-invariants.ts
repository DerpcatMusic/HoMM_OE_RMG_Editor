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
  redoSession,
  removeSelectedZoneFromSession,
  serializeSessionTemplate,
  undoSession,
  updateSelectedConnectionInSession,
  updateGlobalSettingsInSession,
  updateSelectedZoneMainObjectInSession,
  updateSelectedZoneRoadInSession,
  updateSelectedZoneInSession,
} from "../ui/state/editorSession.js";

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

session = updateGlobalSettingsInSession(session, {
  gameMode: "SingleHero",
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

console.log(
  `ui-session invariants: zones=${session.template.variants?.[0]?.zones?.length ?? 0}, connections=${session.template.variants?.[0]?.connections?.length ?? 0}`,
);
