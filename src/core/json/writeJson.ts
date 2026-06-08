import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RmgTemplate } from "../rmg/rmgTypes.js";

export function stringifyRmgTemplate(template: RmgTemplate): string {
  return `${JSON.stringify(template, null, "\t")}\n`;
}

export async function writeRmgTemplateFile(filePath: string, template: RmgTemplate): Promise<void> {
  if (!filePath.endsWith(".rmg.json")) {
    throw new Error(`RMG template path must end with .rmg.json: ${filePath}`);
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, stringifyRmgTemplate(template), "utf8");
}
