import path from "node:path";
import { defaultGameDataPaths, indexGameData, listArtifactOptions } from "../core/index.js";

async function main(): Promise<void> {
  const projectRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const paths = defaultGameDataPaths(projectRoot);
  const gameData = await indexGameData(paths);
  const artifacts = gameData.artifacts;
  const directArtifacts = listArtifactOptions({ catalog: artifacts });

  console.log("RMG Artifact Catalog Scan");
  console.log(`projectRoot=${projectRoot}`);
  console.log(`language=${artifacts.language}`);
  console.log(`mapArtifacts=${artifacts.stats.totalMapArtifacts}`);
  console.log(`wearableArtifacts=${artifacts.stats.wearableArtifacts}`);
  console.log(`scrollContainers=${artifacts.stats.scrollContainers}`);
  console.log(`globallyBanned=${artifacts.stats.globallyBanned}`);
  console.log(`withLocalizedName=${artifacts.stats.withLocalizedName}`);
  console.log(`slots=${JSON.stringify(artifacts.stats.bySlot)}`);
  console.log(`rarities=${JSON.stringify(artifacts.stats.byRarity)}`);
  console.log("firstDirectArtifacts=");
  for (const artifact of directArtifacts.slice(0, 12)) {
    console.log(
      `- ${artifact.name ?? artifact.id} sid=${artifact.id} slot=${artifact.slotName ?? artifact.slot ?? "n/a"} rarity=${artifact.rarity ?? "n/a"} value=${artifact.goodsValue ?? "n/a"}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
