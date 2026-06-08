import path from "node:path";
import { defaultGameDataPaths, refreshGeneratedCatalogs } from "../core/index.js";

async function main(): Promise<void> {
  const projectRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const paths = defaultGameDataPaths(projectRoot);
  const manifest = await refreshGeneratedCatalogs({ paths });

  console.log("RMG Game Data Refresh");
  console.log(`projectRoot=${projectRoot}`);
  console.log(`coreZipPath=${manifest.coreZipPath}`);
  console.log(`generatedDataDir=${paths.generatedDataDir}`);
  console.log(`sourceHash=${manifest.sourceHash}`);
  console.log(`artifacts=${manifest.catalogs.artifacts.entries}`);
  console.log(`rmgContent=${manifest.catalogs.rmgContent.entries}`);
  console.log(`contentPools=${manifest.catalogs.contentPools.entries}`);
  console.log(`contentLists=${manifest.catalogs.contentLists.entries}`);
  console.log(`factions=${manifest.catalogs.factions.entries}`);
  console.log(`biomes=${manifest.catalogs.biomes.entries}`);
  console.log(`heroes=${manifest.catalogs.heroes.entries}`);
  console.log(`magics=${manifest.catalogs.magics.entries}`);
  console.log(`units=${manifest.catalogs.units.entries}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
