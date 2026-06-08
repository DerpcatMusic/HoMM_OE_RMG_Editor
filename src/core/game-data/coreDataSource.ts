import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CoreDataSource {
  readonly sourceId: string;
  readJson<T>(relativePath: string): Promise<T>;
  listJsonFiles(relativeDir: string, recursive?: boolean): Promise<string[]>;
  sourcePath(relativePath: string): string;
}

export function createFileSystemCoreDataSource(coreRoot: string): CoreDataSource {
  return {
    sourceId: coreRoot,
    async readJson<T>(relativePath: string): Promise<T> {
      const text = await fs.readFile(path.join(coreRoot, fromZipPath(relativePath)), "utf8");
      return JSON.parse(stripBom(text)) as T;
    },
    async listJsonFiles(relativeDir: string, recursive = true): Promise<string[]> {
      const results: string[] = [];
      try {
        await walk(path.join(coreRoot, fromZipPath(relativeDir)), relativeDir, recursive, results);
      } catch (error) {
        if (isNodeError(error) && error.code === "ENOENT") {
          return [];
        }
        throw error;
      }
      return results.sort();
    },
    sourcePath(relativePath: string): string {
      return path.join(coreRoot, fromZipPath(relativePath));
    },
  };
}

export function createZipCoreDataSource(coreZipPath: string): CoreDataSource {
  let entriesPromise: Promise<string[]> | undefined;

  async function entries(): Promise<string[]> {
    entriesPromise ??= listZipEntries(coreZipPath);
    return entriesPromise;
  }

  return {
    sourceId: coreZipPath,
    async readJson<T>(relativePath: string): Promise<T> {
      const text = await readZipEntry(coreZipPath, toZipPath(relativePath));
      return JSON.parse(stripBom(text)) as T;
    },
    async listJsonFiles(relativeDir: string, recursive = true): Promise<string[]> {
      const prefix = withTrailingSlash(toZipPath(relativeDir));
      const allEntries = await entries();
      return allEntries
        .filter((entry) => entry.startsWith(prefix) && entry.endsWith(".json"))
        .filter((entry) => recursive || !entry.slice(prefix.length).includes("/"))
        .sort();
    },
    sourcePath(relativePath: string): string {
      return `${coreZipPath}:${toZipPath(relativePath)}`;
    },
  };
}

async function walk(absoluteDir: string, relativeDir: string, recursive: boolean, results: string[]): Promise<void> {
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry.name);
    const relativePath = toZipPath(path.join(relativeDir, entry.name));
    if (entry.isDirectory()) {
      if (recursive) {
        await walk(absolutePath, relativePath, recursive, results);
      }
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(relativePath);
    }
  }
}

async function listZipEntries(coreZipPath: string): Promise<string[]> {
  const { stdout } = await execFileAsync("unzip", ["-Z1", coreZipPath], { maxBuffer: 64 * 1024 * 1024 });
  return stdout
    .split(/\r?\n/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

async function readZipEntry(coreZipPath: string, entryPath: string): Promise<string> {
  const { stdout } = await execFileAsync("unzip", ["-p", coreZipPath, entryPath], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  return stdout;
}

function toZipPath(value: string): string {
  return value.split(path.sep).join("/");
}

function fromZipPath(value: string): string {
  return value.split("/").join(path.sep);
}

function withTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
