import path from "node:path";
import {
  countDiagnostics,
  defaultGameDataPaths,
  indexGameData,
  indexTemplates,
  resolveTemplate,
  validateGameDataIndex,
  validateResolvedTemplate,
  type Diagnostic,
} from "../core/index.js";

async function main(): Promise<void> {
  const projectRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const paths = defaultGameDataPaths(projectRoot);
  const [gameData, templates] = await Promise.all([indexGameData(paths), indexTemplates(paths.liveTemplatesDir)]);

  const allDiagnostics: Diagnostic[] = [...validateGameDataIndex(gameData)];
  const poolRefs = new Set<string>();
  const connectionTypes = new Map<string, number>();
  let zones = 0;
  let connections = 0;

  for (const templateFile of templates.templates) {
    const resolved = resolveTemplate({
      template: templateFile.template,
      sourcePath: templateFile.sourcePath,
      gameData,
    });
    allDiagnostics.push(...validateResolvedTemplate(resolved, gameData));

    for (const variant of resolved.variants) {
      zones += variant.zones.length;
      connections += variant.connections.length;
      for (const connection of variant.connections) {
        const type = connection.connection.connectionType ?? "Default";
        connectionTypes.set(type, (connectionTypes.get(type) ?? 0) + 1);
      }
      for (const zone of variant.zones) {
        for (const ref of [
          ...zone.guardedContentPools,
          ...zone.unguardedContentPools,
          ...zone.resourcesContentPools,
        ]) {
          poolRefs.add(ref.id);
        }
      }
    }
  }

  const unresolvedPools = [...poolRefs].filter((id) => !gameData.contentPools.byName.has(id));
  const counts = countDiagnostics(allDiagnostics);

  console.log("RMG Core Scan");
  console.log(`projectRoot=${projectRoot}`);
  console.log(`templates=${templates.templates.length}`);
  console.log(`variants=${templates.templates.reduce((total, item) => total + (item.template.variants?.length ?? 0), 0)}`);
  console.log(`zones=${zones}`);
  console.log(`connections=${connections}`);
  console.log(`contentPoolDefinitions=${gameData.contentPools.byName.size}`);
  console.log(`contentListDefinitions=${gameData.contentLists.byName.size}`);
  console.log(`zoneLayoutDefinitions=${gameData.zoneLayouts.byName.size}`);
  console.log(`artifactDefinitions=${gameData.artifacts.entries.length}`);
  console.log(`rmgContentDefinitions=${gameData.rmgContent.entries.length}`);
  console.log(`uniquePoolRefs=${poolRefs.size}`);
  console.log(`unresolvedPoolRefs=${unresolvedPools.length}`);
  console.log(`diagnostics.error=${counts.error}`);
  console.log(`diagnostics.warning=${counts.warning}`);
  console.log(`diagnostics.info=${counts.info}`);
  console.log("connectionTypes=" + JSON.stringify(Object.fromEntries([...connectionTypes.entries()].sort())));

  const important = allDiagnostics.filter((item) => item.severity === "error").slice(0, 20);
  if (important.length > 0) {
    console.log("firstErrors=");
    for (const item of important) {
      console.log(`- ${item.code} ${item.path} ${item.message}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
