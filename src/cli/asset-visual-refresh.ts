import path from "node:path";
import { defaultGameDataPaths, refreshAssetVisualCatalog } from "../core/index.js";

async function main(): Promise<void> {
  const projectRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const textureDir = process.argv[3] ? path.resolve(process.argv[3]) : path.join(projectRoot, ".cache", "assets", "Texture2D");
  const paths = defaultGameDataPaths(projectRoot);
  const catalog = await refreshAssetVisualCatalog({
    projectRoot,
    textureDir,
    generatedDataDir: paths.generatedDataDir,
  });

  console.log("RMG Asset Visual Refresh");
  console.log(`projectRoot=${projectRoot}`);
  console.log(`textureDir=${catalog.textureDir}`);
  console.log(`generatedDataDir=${catalog.generatedDataDir}`);
  console.log(`textures=${catalog.textureCount}`);
  console.log(`mappings=${catalog.mappingCount}`);
  console.log(`high=${catalog.mappedHighConfidenceCount}`);
  console.log(`medium=${catalog.mappedMediumConfidenceCount}`);
  console.log(`low=${catalog.mappedLowConfidenceCount}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
