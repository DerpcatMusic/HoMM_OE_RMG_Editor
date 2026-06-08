import path from "node:path";
import {
  buildRmgGraph,
  defaultGameDataPaths,
  indexGameData,
  indexTemplates,
  resolveTemplate,
} from "../core/index.js";

async function main(): Promise<void> {
  const projectRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const paths = defaultGameDataPaths(projectRoot);
  const [gameData, templates] = await Promise.all([indexGameData(paths), indexTemplates(paths.liveTemplatesDir)]);

  let graphCount = 0;
  let nodeCount = 0;
  let edgeCount = 0;
  const connectionTypes = new Map<string, number>();
  const zoneRoles = new Map<string, number>();
  const biggestGraphs: Array<{ template: string; variant: number; nodes: number; edges: number }> = [];

  for (const templateFile of templates.templates) {
    const resolved = resolveTemplate({
      template: templateFile.template,
      sourcePath: templateFile.sourcePath,
      gameData,
    });

    for (const variant of resolved.variants) {
      const graph = buildRmgGraph(variant, {
        templateName: templateFile.template.name ?? templateFile.fileName,
      });
      graphCount += 1;
      nodeCount += graph.nodes.length;
      edgeCount += graph.edges.length;
      mergeCounts(connectionTypes, graph.stats.connectionTypes);
      mergeCounts(zoneRoles, graph.stats.zoneRoles);
      biggestGraphs.push({
        template: templateFile.fileName,
        variant: variant.index,
        nodes: graph.nodes.length,
        edges: graph.edges.length,
      });
    }
  }

  biggestGraphs.sort((a, b) => b.nodes + b.edges - (a.nodes + a.edges));

  console.log("RMG Graph Scan");
  console.log(`projectRoot=${projectRoot}`);
  console.log(`graphs=${graphCount}`);
  console.log(`nodes=${nodeCount}`);
  console.log(`edges=${edgeCount}`);
  console.log("connectionTypes=" + JSON.stringify(sortedRecord(connectionTypes)));
  console.log("zoneRoles=" + JSON.stringify(sortedRecord(zoneRoles)));
  console.log("largestGraphs=");
  for (const graph of biggestGraphs.slice(0, 10)) {
    console.log(`- ${graph.template} variant=${graph.variant} nodes=${graph.nodes} edges=${graph.edges}`);
  }
}

function mergeCounts(target: Map<string, number>, counts: Record<string, number>): void {
  for (const [key, value] of Object.entries(counts)) {
    target.set(key, (target.get(key) ?? 0) + value);
  }
}

function sortedRecord(map: Map<string, number>): Record<string, number> {
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
