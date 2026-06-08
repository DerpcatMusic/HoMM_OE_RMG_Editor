import fs from "node:fs/promises";
import path from "node:path";
import type { JsonFile } from "./jsonTypes.js";

export async function readJsonFile<T>(filePath: string): Promise<JsonFile<T>> {
  const text = await fs.readFile(filePath, "utf8");
  return {
    path: filePath,
    data: JSON.parse(stripBom(text)) as T,
  };
}

export async function listJsonFiles(rootDir: string, recursive = true): Promise<string[]> {
  const results: string[] = [];
  await walk(rootDir, recursive, results);
  return results.sort();
}

async function walk(dir: string, recursive: boolean, results: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        await walk(fullPath, recursive, results);
      }
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(fullPath);
    }
  }
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
