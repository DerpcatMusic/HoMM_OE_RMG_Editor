import type { CanvasPosition } from "../state/editorSession.js";
import type { ShellZoneItem } from "./shellData.js";

const MIN_PERCENT = 6;
const MAX_PERCENT = 82;
const SAFE_SPAN = MAX_PERCENT - MIN_PERCENT;
const DEFAULT_MAX_CHAIN_ROW_LENGTH = 6;
const CYCLE_POLYGON_LIMIT = 8;
const SINGLE_VALUE_EPSILON = 0.0001;

export interface GraphLayoutZoneInput {
  name: string;
  index: number;
  role: ShellZoneItem["role"];
  size: number;
}

export interface GraphLayoutConnectionInput {
  from?: string;
  to?: string;
  connectionType?: string;
}

export interface GraphLayoutOptions {
  maxChainRowLength?: number;
}

interface NormalizedEdge {
  a: string;
  b: string;
  count: number;
}

interface GraphModel {
  zones: GraphLayoutZoneInput[];
  zoneByName: Map<string, GraphLayoutZoneInput>;
  adjacency: Map<string, Set<string>>;
  edges: NormalizedEdge[];
}

interface RawPosition {
  x: number;
  y: number;
}

interface ComponentLayout {
  names: string[];
  rawPositions: Map<string, RawPosition>;
}

export function computeTopologyPackedLayout(
  zones: readonly GraphLayoutZoneInput[],
  connections: readonly GraphLayoutConnectionInput[],
  savedPositions: Readonly<Record<string, CanvasPosition>> = {},
  options: GraphLayoutOptions = {},
): Record<string, CanvasPosition> {
  const graph = normalizeGraph(zones, connections);
  const maxChainRowLength = Math.max(2, Math.floor(options.maxChainRowLength ?? DEFAULT_MAX_CHAIN_ROW_LENGTH));
  const components = discoverComponents(graph).map((component) => layoutComponent(component, graph, maxChainRowLength));
  const packed = packComponents(components);
  const relaxed = relaxPackedLayout(packed, graph);
  const result: Record<string, CanvasPosition> = {};

  for (const zone of graph.zones) {
    const saved = savedPositions[zone.name];
    if (saved) {
      result[zone.name] = saved;
      continue;
    }
    result[zone.name] = relaxed[zone.name] ?? fallbackPosition(zone.index, graph.zones.length, zone.role);
  }

  return result;
}

function normalizeGraph(zones: readonly GraphLayoutZoneInput[], connections: readonly GraphLayoutConnectionInput[]): GraphModel {
  const sortedZones = [...zones].filter((zone) => zone.name).sort((a, b) => a.index - b.index || a.name.localeCompare(b.name));
  const zoneByName = new Map(sortedZones.map((zone) => [zone.name, zone]));
  const adjacency = new Map(sortedZones.map((zone) => [zone.name, new Set<string>()]));
  const edgeByKey = new Map<string, NormalizedEdge>();

  for (const connection of connections) {
    const from = connection.from;
    const to = connection.to;
    if (!from || !to || from === to || !zoneByName.has(from) || !zoneByName.has(to)) {
      continue;
    }
    const [a, b] = from < to ? [from, to] : [to, from];
    const key = `${a}\u0000${b}`;
    const edge = edgeByKey.get(key);
    if (edge) {
      edge.count += 1;
    } else {
      edgeByKey.set(key, { a, b, count: 1 });
    }
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  }

  return { zones: sortedZones, zoneByName, adjacency, edges: [...edgeByKey.values()] };
}

function discoverComponents(graph: GraphModel): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const zone of graph.zones) {
    if (visited.has(zone.name)) {
      continue;
    }
    const component: string[] = [];
    const queue = [zone.name];
    visited.add(zone.name);

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const name = queue[cursor];
      if (!name) {
        continue;
      }
      component.push(name);
      const neighbors = sortedNeighbors(name, graph);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    component.sort((a, b) => compareZoneNames(a, b, graph));
    components.push(component);
  }

  components.sort((a, b) => compareZoneNames(a[0] ?? "", b[0] ?? "", graph));
  return components;
}

function layoutComponent(names: readonly string[], graph: GraphModel, maxChainRowLength: number): ComponentLayout {
  if (names.length === 0) {
    return { names: [], rawPositions: new Map() };
  }
  if (names.length === 1) {
    return { names: [...names], rawPositions: new Map([[names[0] as string, { x: 0, y: 0 }]]) };
  }

  const pathOrder = getPathOrder(names, graph);
  if (pathOrder) {
    return { names: [...names], rawPositions: layoutSnake(pathOrder, maxChainRowLength) };
  }

  if (isSimpleCycle(names, graph) && names.length <= CYCLE_POLYGON_LIMIT) {
    return { names: [...names], rawPositions: layoutCycle(names, graph) };
  }

  if (isHub(names, graph)) {
    return { names: [...names], rawPositions: layoutHub(names, graph) };
  }

  return { names: [...names], rawPositions: layoutMixed(names, graph, maxChainRowLength) };
}

function getPathOrder(names: readonly string[], graph: GraphModel): string[] | undefined {
  const nameSet = new Set(names);
  const endpoints = names.filter((name) => degreeWithin(name, nameSet, graph) === 1).sort((a, b) => compareZoneNames(a, b, graph));
  const hasPathDegrees = names.every((name) => degreeWithin(name, nameSet, graph) <= 2);
  if (!hasPathDegrees || endpoints.length !== 2) {
    return undefined;
  }

  const order: string[] = [];
  const visited = new Set<string>();
  let current: string | undefined = endpoints[0];
  let previous: string | undefined;
  while (current) {
    order.push(current);
    visited.add(current);
    const next = sortedNeighbors(current, graph).find((neighbor) => nameSet.has(neighbor) && neighbor !== previous && !visited.has(neighbor));
    previous = current;
    current = next;
  }

  return order.length === names.length ? order : undefined;
}

function isSimpleCycle(names: readonly string[], graph: GraphModel): boolean {
  const nameSet = new Set(names);
  return names.length >= 3 && names.every((name) => degreeWithin(name, nameSet, graph) === 2);
}

function isHub(names: readonly string[], graph: GraphModel): boolean {
  const nameSet = new Set(names);
  const highestDegree = Math.max(...names.map((name) => degreeWithin(name, nameSet, graph)));
  return highestDegree >= Math.max(3, names.length - 1);
}

function layoutSnake(names: readonly string[], maxRowLength: number): Map<string, RawPosition> {
  const positions = new Map<string, RawPosition>();
  for (let index = 0; index < names.length; index += 1) {
    const row = Math.floor(index / maxRowLength);
    const columnInRow = index % maxRowLength;
    const rowLength = Math.min(maxRowLength, names.length - row * maxRowLength);
    const column = row % 2 === 0 ? columnInRow : rowLength - 1 - columnInRow;
    const name = names[index];
    if (name) {
      positions.set(name, { x: column * 18, y: row * 16 });
    }
  }
  return positions;
}

function layoutCycle(names: readonly string[], graph: GraphModel): Map<string, RawPosition> {
  const ordered = orderCycle(names, graph);
  const positions = new Map<string, RawPosition>();
  const radius = Math.max(18, ordered.length * 4);
  for (let index = 0; index < ordered.length; index += 1) {
    const name = ordered[index];
    if (!name) {
      continue;
    }
    const angle = (Math.PI * 2 * index) / ordered.length - Math.PI / 2;
    positions.set(name, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }
  return positions;
}

function orderCycle(names: readonly string[], graph: GraphModel): string[] {
  const nameSet = new Set(names);
  const start = [...names].sort((a, b) => compareZoneNames(a, b, graph))[0];
  if (!start) {
    return [];
  }
  const order = [start];
  let previous: string | undefined;
  let current = start;

  while (order.length < names.length) {
    const next = sortedNeighbors(current, graph).find((neighbor) => nameSet.has(neighbor) && neighbor !== previous && !order.includes(neighbor));
    if (!next) {
      break;
    }
    previous = current;
    current = next;
    order.push(current);
  }

  return order.length === names.length ? order : [...names].sort((a, b) => compareZoneNames(a, b, graph));
}

function layoutHub(names: readonly string[], graph: GraphModel): Map<string, RawPosition> {
  const nameSet = new Set(names);
  const hub = [...names].sort((a, b) => degreeWithin(b, nameSet, graph) - degreeWithin(a, nameSet, graph) || compareZoneNames(a, b, graph))[0] as string;
  const leaves = names.filter((name) => name !== hub).sort((a, b) => compareZoneNames(a, b, graph));
  const positions = new Map<string, RawPosition>([[hub, { x: 0, y: 0 }]]);
  const radius = Math.max(20, leaves.length * 4);

  for (let index = 0; index < leaves.length; index += 1) {
    const name = leaves[index];
    if (!name) {
      continue;
    }
    const angle = (Math.PI * 2 * index) / leaves.length - Math.PI / 2;
    positions.set(name, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }

  return positions;
}

function layoutMixed(names: readonly string[], graph: GraphModel, maxRowLength: number): Map<string, RawPosition> {
  const nameSet = new Set(names);
  const root = chooseMixedRoot(names, graph);
  const depths = new Map<string, number>([[root, 0]]);
  const queue = [root];

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (!current) {
      continue;
    }
    const currentDepth = depths.get(current) ?? 0;
    for (const neighbor of sortedNeighbors(current, graph)) {
      if (nameSet.has(neighbor) && !depths.has(neighbor)) {
        depths.set(neighbor, currentDepth + 1);
        queue.push(neighbor);
      }
    }
  }

  for (const name of names) {
    if (!depths.has(name)) {
      depths.set(name, 0);
    }
  }

  const layers = new Map<number, string[]>();
  for (const name of names) {
    const depth = depths.get(name) ?? 0;
    const layer = layers.get(depth) ?? [];
    layer.push(name);
    layers.set(depth, layer);
  }

  const positions = new Map<string, RawPosition>();
  for (const [depth, layer] of [...layers.entries()].sort((a, b) => a[0] - b[0])) {
    layer.sort((a, b) => compareZoneNames(a, b, graph));
    for (let index = 0; index < layer.length; index += 1) {
      const rowOffset = Math.floor(index / maxRowLength);
      const column = index % maxRowLength;
      const rowWidth = Math.min(maxRowLength, layer.length - rowOffset * maxRowLength);
      const x = (column - (rowWidth - 1) / 2) * 18;
      const y = (depth + rowOffset) * 16;
      const name = layer[index];
      if (name) {
        positions.set(name, { x, y });
      }
    }
  }

  return positions;
}

function chooseMixedRoot(names: readonly string[], graph: GraphModel): string {
  const nameSet = new Set(names);
  return [...names].sort((a, b) => rootScore(b, nameSet, graph) - rootScore(a, nameSet, graph) || compareZoneNames(a, b, graph))[0] as string;
}

function rootScore(name: string, nameSet: ReadonlySet<string>, graph: GraphModel): number {
  const zone = graph.zoneByName.get(name);
  const roleScore = zone?.role === "center" ? 1000 : zone?.role === "connector" ? 250 : 0;
  return roleScore + degreeWithin(name, nameSet, graph) * 10 - (zone?.index ?? 0) / 1000;
}

function packComponents(components: readonly ComponentLayout[]): Record<string, CanvasPosition> {
  const nonEmpty = components.filter((component) => component.names.length > 0);
  if (nonEmpty.length === 0) {
    return {};
  }

  const columns = Math.ceil(Math.sqrt(nonEmpty.length));
  const rows = Math.ceil(nonEmpty.length / columns);
  const cellWidth = SAFE_SPAN / columns;
  const cellHeight = SAFE_SPAN / rows;
  const positions: Record<string, CanvasPosition> = {};

  for (let componentIndex = 0; componentIndex < nonEmpty.length; componentIndex += 1) {
    const component = nonEmpty[componentIndex];
    if (!component) {
      continue;
    }
    const column = componentIndex % columns;
    const row = Math.floor(componentIndex / columns);
    const cellX = MIN_PERCENT + column * cellWidth;
    const cellY = MIN_PERCENT + row * cellHeight;
    const box = rawBounds(component.rawPositions);
    const innerPaddingX = Math.min(8, cellWidth * 0.2);
    const innerPaddingY = Math.min(8, cellHeight * 0.2);
    const availableWidth = Math.max(1, cellWidth - innerPaddingX * 2);
    const availableHeight = Math.max(1, cellHeight - innerPaddingY * 2);

    for (const name of component.names) {
      const raw = component.rawPositions.get(name) ?? { x: 0, y: 0 };
      const x = normalizeAxis(raw.x, box.minX, box.maxX, cellX + innerPaddingX, availableWidth);
      const y = normalizeAxis(raw.y, box.minY, box.maxY, cellY + innerPaddingY, availableHeight);
      positions[name] = { x: clampPercent(x), y: clampPercent(y) };
    }
  }

  return positions;
}

function rawBounds(positions: ReadonlyMap<string, RawPosition>): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const position of positions.values()) {
    minX = Math.min(minX, position.x);
    maxX = Math.max(maxX, position.x);
    minY = Math.min(minY, position.y);
    maxY = Math.max(maxY, position.y);
  }

  if (!Number.isFinite(minX)) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  return { minX, maxX, minY, maxY };
}

function normalizeAxis(value: number, min: number, max: number, start: number, span: number): number {
  if (Math.abs(max - min) <= SINGLE_VALUE_EPSILON) {
    return start + span / 2;
  }
  return start + ((value - min) / (max - min)) * span;
}

function relaxPackedLayout(positions: Record<string, CanvasPosition>, graph: GraphModel): Record<string, CanvasPosition> {
  const result: Record<string, CanvasPosition> = {};
  for (const [name, position] of Object.entries(positions)) {
    result[name] = { ...position };
  }

  for (let iteration = 0; iteration < 12; iteration += 1) {
    const deltas = new Map<string, { x: number; y: number }>();
    for (const name of Object.keys(result)) {
      deltas.set(name, { x: 0, y: 0 });
    }

    const names = Object.keys(result).sort((a, b) => compareZoneNames(a, b, graph));
    for (let aIndex = 0; aIndex < names.length; aIndex += 1) {
      for (let bIndex = aIndex + 1; bIndex < names.length; bIndex += 1) {
        const a = names[aIndex] as string;
        const b = names[bIndex] as string;
        const aPosition = result[a];
        const bPosition = result[b];
        if (!aPosition || !bPosition) {
          continue;
        }
        const dx = bPosition.x - aPosition.x;
        const dy = bPosition.y - aPosition.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared >= 81 || distanceSquared <= 0.0001) {
          continue;
        }
        const distance = Math.sqrt(distanceSquared);
        const push = (9 - distance) * 0.015;
        const ux = dx / distance;
        const uy = dy / distance;
        const deltaA = deltas.get(a);
        const deltaB = deltas.get(b);
        if (deltaA && deltaB) {
          deltaA.x -= ux * push;
          deltaA.y -= uy * push;
          deltaB.x += ux * push;
          deltaB.y += uy * push;
        }
      }
    }

    for (const edge of graph.edges) {
      const aPosition = result[edge.a];
      const bPosition = result[edge.b];
      const deltaA = deltas.get(edge.a);
      const deltaB = deltas.get(edge.b);
      if (!aPosition || !bPosition || !deltaA || !deltaB) {
        continue;
      }
      const dx = bPosition.x - aPosition.x;
      const dy = bPosition.y - aPosition.y;
      const distance = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
      const pull = (distance - 28) * 0.002;
      const ux = dx / distance;
      const uy = dy / distance;
      deltaA.x += ux * pull;
      deltaA.y += uy * pull;
      deltaB.x -= ux * pull;
      deltaB.y -= uy * pull;
    }

    for (const name of names) {
      const position = result[name];
      const delta = deltas.get(name);
      if (!position || !delta) {
        continue;
      }
      const zone = graph.zoneByName.get(name);
      const centerGravity = zone?.role === "center" ? 0.003 : 0;
      const nextX = position.x + delta.x + (48 - position.x) * centerGravity;
      const nextY = position.y + delta.y + (42 - position.y) * centerGravity;
      result[name] = { x: clampPercent(nextX), y: clampPercent(nextY) };
    }
  }

  return result;
}

function fallbackPosition(index: number, zoneCount: number, role: ShellZoneItem["role"]): CanvasPosition {
  if (role === "center") {
    return { x: 48, y: 42 };
  }
  if (zoneCount <= 1) {
    return { x: 46, y: 42 };
  }
  const angle = (Math.PI * 2 * index) / zoneCount - Math.PI / 2;
  return {
    x: clampPercent(48 + Math.cos(angle) * 34),
    y: clampPercent(44 + Math.sin(angle) * 28),
  };
}

function sortedNeighbors(name: string, graph: GraphModel): string[] {
  return [...(graph.adjacency.get(name) ?? [])].sort((a, b) => compareZoneNames(a, b, graph));
}

function degreeWithin(name: string, names: ReadonlySet<string>, graph: GraphModel): number {
  let degree = 0;
  for (const neighbor of graph.adjacency.get(name) ?? []) {
    if (names.has(neighbor)) {
      degree += 1;
    }
  }
  return degree;
}

function compareZoneNames(a: string, b: string, graph: GraphModel): number {
  const zoneA = graph.zoneByName.get(a);
  const zoneB = graph.zoneByName.get(b);
  return (zoneA?.index ?? Number.MAX_SAFE_INTEGER) - (zoneB?.index ?? Number.MAX_SAFE_INTEGER) || a.localeCompare(b);
}

function clampPercent(value: number): number {
  return Math.max(MIN_PERCENT, Math.min(MAX_PERCENT, Number(value.toFixed(2))));
}
