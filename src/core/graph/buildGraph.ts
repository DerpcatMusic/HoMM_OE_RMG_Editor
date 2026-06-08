import type { ResolvedConnection, ResolvedVariant, ResolvedZone } from "../resolver/resolvedTypes.js";
import { countDiagnostics } from "../validation/validationTypes.js";
import { connectionBehavior } from "./connectionBehavior.js";
import type { RmgGraph, RmgGraphEdge, RmgGraphNode, RmgGraphStats, ZoneRole } from "./graphTypes.js";
import { inferZoneRole } from "./zoneRole.js";

export interface BuildGraphOptions {
  templateName: string;
}

export function buildRmgGraph(variant: ResolvedVariant, options: BuildGraphOptions): RmgGraph {
  const nodeByZone = new Map<ResolvedZone, RmgGraphNode>();
  const nodes = variant.zones.map((zone) => {
    const node = buildNode(zone, options.templateName, variant.index);
    nodeByZone.set(zone, node);
    return node;
  });

  const edges = variant.connections.flatMap((connection) => buildEdge(connection, options.templateName, variant.index, nodeByZone));
  const stats = buildStats(nodes, edges, variant);

  return {
    templateName: options.templateName,
    variantIndex: variant.index,
    nodes,
    edges,
    stats,
  };
}

function buildNode(zone: ResolvedZone, templateName: string, variantIndex: number): RmgGraphNode {
  const role = inferZoneRole(zone);
  const diagnostics = countDiagnostics(zone.diagnostics);
  const ownerRefs = new Set<string>();
  const spawnRefs = new Set<string>();

  for (const mainObject of zone.zone.mainObjects ?? []) {
    if (mainObject.owner) {
      ownerRefs.add(mainObject.owner);
    }
    if (mainObject.spawn) {
      spawnRefs.add(mainObject.spawn);
    }
  }

  return {
    id: zoneNodeId(templateName, variantIndex, zone.index),
    zoneIndex: zone.index,
    name: zone.zone.name ?? `Zone ${zone.index}`,
    role,
    size: zone.zone.size ?? 0,
    ...(zone.zone.layout ? { layout: zone.zone.layout } : {}),
    ownerRefs: [...ownerRefs].sort(),
    spawnRefs: [...spawnRefs].sort(),
    poolRefs: {
      guarded: zone.guardedContentPools.map((ref) => ref.id),
      unguarded: zone.unguardedContentPools.map((ref) => ref.id),
      resources: zone.resourcesContentPools.map((ref) => ref.id),
    },
    mandatoryContentRefs: zone.mandatoryContentPresets.map((ref) => ref.id),
    contentCountLimitRefs: zone.contentCountLimitPresets.map((ref) => ref.id),
    budgets: {
      guardedContentValue: zone.zone.guardedContentValue ?? 0,
      guardedContentValuePerArea: zone.zone.guardedContentValuePerArea ?? 0,
      unguardedContentValue: zone.zone.unguardedContentValue ?? 0,
      unguardedContentValuePerArea: zone.zone.unguardedContentValuePerArea ?? 0,
      resourcesValue: zone.zone.resourcesValue ?? 0,
      resourcesValuePerArea: zone.zone.resourcesValuePerArea ?? 0,
    },
    diagnostics: {
      errors: diagnostics.error,
      warnings: diagnostics.warning,
    },
  };
}

function buildEdge(
  connection: ResolvedConnection,
  templateName: string,
  variantIndex: number,
  nodeByZone: Map<ResolvedZone, RmgGraphNode>,
): RmgGraphEdge[] {
  if (!connection.fromZone || !connection.toZone) {
    return [];
  }
  const source = nodeByZone.get(connection.fromZone);
  const target = nodeByZone.get(connection.toZone);
  if (!source || !target) {
    return [];
  }
  const diagnostics = countDiagnostics(connection.diagnostics);
  return [
    {
      id: connectionEdgeId(templateName, variantIndex, connection.index),
      connectionIndex: connection.index,
      ...(connection.connection.name ? { name: connection.connection.name } : {}),
      source: source.id,
      target: target.id,
      connectionType: connection.connection.connectionType ?? "Default",
      behavior: connectionBehavior(connection.connection.connectionType),
      guard: {
        ...(connection.connection.guardZone ? { guardZone: connection.connection.guardZone } : {}),
        guardValue: connection.connection.guardValue ?? 0,
        guardWeeklyIncrement: connection.connection.guardWeeklyIncrement ?? 0,
        ...(connection.connection.guardReaction ? { guardReaction: connection.connection.guardReaction } : {}),
        guardEscape: connection.connection.guardEscape ?? true,
        ...(connection.connection.guardMatchGroup ? { guardMatchGroup: connection.connection.guardMatchGroup } : {}),
      },
      portal: {
        fromEnabled: connection.connection.portalFromEnabled ?? true,
        toEnabled: connection.connection.portalToEnabled ?? true,
      },
      diagnostics: {
        errors: diagnostics.error,
        warnings: diagnostics.warning,
      },
    },
  ];
}

function buildStats(nodes: RmgGraphNode[], edges: RmgGraphEdge[], variant: ResolvedVariant): RmgGraphStats {
  const connectionTypes = new Map<string, number>();
  const zoneRoles = new Map<ZoneRole, number>();
  const playerRefs = new Map<string, number>();
  let errors = countDiagnostics(variant.diagnostics).error;
  let warnings = countDiagnostics(variant.diagnostics).warning;

  for (const node of nodes) {
    zoneRoles.set(node.role, (zoneRoles.get(node.role) ?? 0) + 1);
    errors += node.diagnostics.errors;
    warnings += node.diagnostics.warnings;
    for (const player of [...node.ownerRefs, ...node.spawnRefs]) {
      playerRefs.set(player, (playerRefs.get(player) ?? 0) + 1);
    }
  }

  for (const edge of edges) {
    connectionTypes.set(edge.connectionType, (connectionTypes.get(edge.connectionType) ?? 0) + 1);
    errors += edge.diagnostics.errors;
    warnings += edge.diagnostics.warnings;
  }

  return {
    zones: nodes.length,
    connections: edges.length,
    connectionTypes: sortedRecord(connectionTypes),
    zoneRoles: sortedRecord(zoneRoles),
    playerRefs: sortedRecord(playerRefs),
    diagnostics: {
      errors,
      warnings,
    },
  };
}

function zoneNodeId(templateName: string, variantIndex: number, zoneIndex: number): string {
  return `${slug(templateName)}:v${variantIndex}:zone:${zoneIndex}`;
}

function connectionEdgeId(templateName: string, variantIndex: number, connectionIndex: number): string {
  return `${slug(templateName)}:v${variantIndex}:connection:${connectionIndex}`;
}

function slug(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "");
}

function sortedRecord<K extends string>(map: Map<K, number>): Record<string, number> {
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}
