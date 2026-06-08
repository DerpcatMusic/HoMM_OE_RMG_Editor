import path from "node:path";
import {
  buildEditorModel,
  defaultGameDataPaths,
  firstTemplateSelection,
  indexGameData,
  indexTemplates,
  listTemplateCards,
  resolveEditorSelection,
} from "../core/index.js";

async function main(): Promise<void> {
  const projectRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const paths = defaultGameDataPaths(projectRoot);
  const [gameData, templates] = await Promise.all([indexGameData(paths), indexTemplates(paths.liveTemplatesDir)]);
  const model = buildEditorModel({ gameData, templates });
  const firstSelection = firstTemplateSelection(model);
  const resolvedSelection = resolveEditorSelection(model, firstSelection);
  const cards = listTemplateCards(model);

  console.log("RMG Editor Model Scan");
  console.log(`projectRoot=${projectRoot}`);
  console.log(`templates=${model.stats.templates}`);
  console.log(`variants=${model.stats.variants}`);
  console.log(`zones=${model.stats.zones}`);
  console.log(`connections=${model.stats.connections}`);
  console.log(`contentPools=${model.stats.contentPools}`);
  console.log(`contentLists=${model.stats.contentLists}`);
  console.log(`zoneLayouts=${model.stats.zoneLayouts}`);
  console.log(`artifacts=${model.stats.artifacts}`);
  console.log(`rmgContent=${model.stats.rmgContent}`);
  console.log(`diagnostics.errors=${model.stats.diagnostics.errors}`);
  console.log(`diagnostics.warnings=${model.stats.diagnostics.warnings}`);
  console.log(`firstSelection=${JSON.stringify(firstSelection)}`);
  console.log(`firstSelectionResolved=${Boolean(resolvedSelection.template && resolvedSelection.variant)}`);
  console.log("firstCards=");
  for (const card of cards.slice(0, 10)) {
    console.log(
      `- ${card.name} variants=${card.variants} zones=${card.zones} connections=${card.connections} players=${card.players.join(",")}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
