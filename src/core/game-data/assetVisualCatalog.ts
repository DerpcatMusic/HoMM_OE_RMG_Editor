import fs from "node:fs/promises";
import path from "node:path";

export type VisualCatalogKind = "artifact" | "rmgContent" | "biome" | "faction" | "hero" | "magic" | "unit";

export interface RefreshAssetVisualCatalogInput {
  projectRoot: string;
  textureDir?: string;
  generatedDataDir?: string;
  outputPath?: string;
  maxCandidatesPerEntry?: number;
}

export interface AssetTextureEntry {
  fileName: string;
  path: string;
  width: number;
  height: number;
  normalizedName: string;
  tokens: string[];
  categories: string[];
}

export interface AssetVisualCandidate {
  fileName: string;
  path: string;
  width: number;
  height: number;
  score: number;
  confidence: "high" | "medium" | "low";
  reasons: string[];
}

export interface AssetVisualMapping {
  kind: VisualCatalogKind;
  id: string;
  label?: string;
  searchKeys: string[];
  candidates: AssetVisualCandidate[];
}

export interface GeneratedAssetVisualCatalogFile {
  generatedAt: string;
  textureDir: string;
  generatedDataDir: string;
  textureCount: number;
  mappingCount: number;
  mappedHighConfidenceCount: number;
  mappedMediumConfidenceCount: number;
  mappedLowConfidenceCount: number;
  textures: AssetTextureEntry[];
  mappings: AssetVisualMapping[];
}

interface EntitySpec {
  kind: VisualCatalogKind;
  id: string;
  label?: string;
  searchKeys: string[];
}

interface RawCatalogFile {
  entries?: unknown[];
}

const CATALOG_FILES: Array<{ kind: VisualCatalogKind; fileName: string; idKey: "id" | "sid" }> = [
  { kind: "artifact", fileName: "artifacts.json", idKey: "id" },
  { kind: "rmgContent", fileName: "rmg-content.json", idKey: "sid" },
  { kind: "biome", fileName: "biomes.json", idKey: "id" },
  { kind: "faction", fileName: "factions.json", idKey: "id" },
  { kind: "hero", fileName: "heroes.json", idKey: "id" },
  { kind: "magic", fileName: "magics.json", idKey: "id" },
  { kind: "unit", fileName: "units.json", idKey: "id" },
];

const STOP_TOKENS = new Set([
  "a",
  "an",
  "and",
  "back",
  "background",
  "button",
  "card",
  "diffuse",
  "emissive",
  "artifact",
  "campaign",
  "frame",
  "faction",
  "fraction",
  "glow",
  "hero",
  "icon",
  "low",
  "magic",
  "mask",
  "mouseover",
  "overlay",
  "pressed",
  "selected",
  "state",
  "texture",
  "the",
  "top",
  "unit",
  "upg",
  "window",
]);

export async function refreshAssetVisualCatalog(input: RefreshAssetVisualCatalogInput): Promise<GeneratedAssetVisualCatalogFile> {
  const projectRoot = path.resolve(input.projectRoot);
  const textureDir = path.resolve(input.textureDir ?? path.join(projectRoot, ".cache", "assets", "Texture2D"));
  const generatedDataDir = path.resolve(input.generatedDataDir ?? path.join(projectRoot, ".cache", "game-data"));
  const outputPath = path.resolve(input.outputPath ?? path.join(generatedDataDir, "asset-visual-mappings.json"));
  const maxCandidatesPerEntry = input.maxCandidatesPerEntry ?? 5;

  const [textures, entities] = await Promise.all([
    scanTexture2DDirectory(textureDir, projectRoot),
    loadEntitySpecs(generatedDataDir),
  ]);
  const mappings = entities.map((entity) => mapEntityToTextures(entity, textures, maxCandidatesPerEntry));
  const file: GeneratedAssetVisualCatalogFile = {
    generatedAt: new Date().toISOString(),
    textureDir,
    generatedDataDir,
    textureCount: textures.length,
    mappingCount: mappings.length,
    mappedHighConfidenceCount: mappings.filter((mapping) => mapping.candidates[0]?.confidence === "high").length,
    mappedMediumConfidenceCount: mappings.filter((mapping) => mapping.candidates[0]?.confidence === "medium").length,
    mappedLowConfidenceCount: mappings.filter((mapping) => mapping.candidates[0]?.confidence === "low").length,
    textures,
    mappings,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  return file;
}

export async function scanTexture2DDirectory(textureDir: string, projectRoot = process.cwd()): Promise<AssetTextureEntry[]> {
  const fileNames = await fs.readdir(textureDir);
  const entries: AssetTextureEntry[] = [];
  for (const fileName of fileNames) {
    if (path.extname(fileName).toLowerCase() !== ".png") {
      continue;
    }
    const absolutePath = path.join(textureDir, fileName);
    const dimensions = await readPngDimensions(absolutePath);
    if (!dimensions) {
      continue;
    }
    const stem = path.basename(fileName, path.extname(fileName));
    const tokens = tokenize(stem);
    entries.push({
      fileName,
      path: path.relative(projectRoot, absolutePath),
      width: dimensions.width,
      height: dimensions.height,
      normalizedName: normalizeCompact(stem),
      tokens,
      categories: categorizeTexture(fileName, tokens),
    });
  }
  return entries.sort((left, right) => left.fileName.localeCompare(right.fileName));
}

async function loadEntitySpecs(generatedDataDir: string): Promise<EntitySpec[]> {
  const specs: EntitySpec[] = [];
  for (const catalog of CATALOG_FILES) {
    const file = await readJsonFile<RawCatalogFile>(path.join(generatedDataDir, catalog.fileName));
    for (const entry of file.entries ?? []) {
      if (!isRecord(entry)) {
        continue;
      }
      const id = stringValue(entry[catalog.idKey]);
      if (!id) {
        continue;
      }
      const label = stringValue(entry.name);
      specs.push({
        kind: catalog.kind,
        id,
        ...(label ? { label } : {}),
        searchKeys: buildSearchKeys(catalog.kind, entry, id),
      });
    }
  }
  return specs;
}

function buildSearchKeys(kind: VisualCatalogKind, entry: Record<string, unknown>, id: string): string[] {
  const keys = new Set<string>();
  addKey(keys, id);
  addKey(keys, stringValue(entry.name));
  addKey(keys, stringValue(entry.icon));
  addKey(keys, basenameLike(stringValue(entry.prefab)));
  if (kind === "faction") {
    addKey(keys, stringValue(entry.resourceName));
    addKey(keys, stringValue(entry.biome));
  }
  if (kind === "biome") {
    addKey(keys, stringValue(entry.waterObject));
  }
  return [...keys];
}

function mapEntityToTextures(entity: EntitySpec, textures: readonly AssetTextureEntry[], maxCandidates: number): AssetVisualMapping {
  const candidates = textures
    .map((texture) => scoreTexture(entity, texture))
    .filter((candidate): candidate is AssetVisualCandidate => candidate !== undefined)
    .sort((left, right) => right.score - left.score || left.fileName.localeCompare(right.fileName))
    .slice(0, maxCandidates);
  return {
    kind: entity.kind,
    id: entity.id,
    ...(entity.label ? { label: entity.label } : {}),
    searchKeys: entity.searchKeys,
    candidates,
  };
}

function scoreTexture(entity: EntitySpec, texture: AssetTextureEntry): AssetVisualCandidate | undefined {
  let score = 0;
  const reasons: string[] = [];
  for (const key of entity.searchKeys) {
    const keyCompact = normalizeCompact(key);
    const keyTokens = meaningfulTokens(tokenize(key));
    if (keyCompact.length < 3) {
      continue;
    }
    if (texture.normalizedName === keyCompact) {
      score = Math.max(score, 100);
      reasons.push(`exact:${key}`);
      continue;
    }
    if (texture.normalizedName.endsWith(keyCompact) && keyCompact.length >= 6) {
      score = Math.max(score, 84);
      reasons.push(`suffix:${key}`);
    } else if (texture.normalizedName.includes(keyCompact) && keyCompact.length >= 6) {
      score = Math.max(score, 76);
      reasons.push(`contains:${key}`);
    } else if (keyCompact.includes(texture.normalizedName) && texture.normalizedName.length >= 8) {
      score = Math.max(score, 62);
      reasons.push(`reverse-contains:${key}`);
    }
    const overlap = countOverlap(keyTokens, meaningfulTokens(texture.tokens));
    if (overlap > 0) {
      const singleTokenIdentity = keyTokens.length === 1 && keyTokens[0] && texture.tokens.includes(keyTokens[0]);
      const tokenScore = singleTokenIdentity && (entity.kind === "biome" || entity.kind === "faction")
        ? 68
        : Math.min(58, 20 + overlap * 12);
      score = Math.max(score, tokenScore);
      reasons.push(`token-overlap:${key}:${overlap}`);
    }
  }

  if (score === 0) {
    return undefined;
  }

  score += categoryScore(entity.kind, texture);
  score += dimensionScore(entity.kind, texture);
  score = Math.max(1, Math.min(100, score));

  return {
    fileName: texture.fileName,
    path: texture.path,
    width: texture.width,
    height: texture.height,
    score,
    confidence: score >= 88 ? "high" : score >= 65 ? "medium" : "low",
    reasons: [...new Set(reasons)],
  };
}

function categoryScore(kind: VisualCatalogKind, texture: AssetTextureEntry): number {
  if (texture.categories.includes(kind)) {
    return 6;
  }
  if (kind === "rmgContent" && (texture.categories.includes("map") || texture.categories.includes("resource"))) {
    return 3;
  }
  if (kind === "biome" && texture.categories.includes("terrain")) {
    return 4;
  }
  return 0;
}

function dimensionScore(kind: VisualCatalogKind, texture: AssetTextureEntry): number {
  const maxSide = Math.max(texture.width, texture.height);
  const area = texture.width * texture.height;
  if ((kind === "hero" || kind === "unit" || kind === "artifact" || kind === "magic") && maxSide <= 512 && area >= 1024) {
    return 3;
  }
  if (texture.fileName.toLowerCase().includes("diffuse") || texture.fileName.toLowerCase().includes("emissive")) {
    return kind === "biome" || kind === "rmgContent" ? -4 : -12;
  }
  if (maxSide >= 1024 && kind !== "biome") {
    return -8;
  }
  return 0;
}

function categorizeTexture(fileName: string, tokens: readonly string[]): string[] {
  const lower = fileName.toLowerCase();
  const categories = new Set<string>();
  for (const category of ["artifact", "biome", "faction", "hero", "magic", "spell", "unit", "resource", "terrain", "map"]) {
    if (lower.includes(category)) {
      categories.add(category === "spell" ? "magic" : category);
    }
  }
  if (tokens.some((token) => ["grass", "lava", "sand", "snow", "death", "dirt", "autumn"].includes(token))) {
    categories.add("biome");
    categories.add("terrain");
  }
  if (tokens.some((token) => ["portrait", "portret"].includes(token))) {
    categories.add("hero");
  }
  if (tokens.some((token) => ["gold", "wood", "ore", "gem", "crystal", "sulfur", "mercury"].includes(token))) {
    categories.add("resource");
  }
  return [...categories].sort();
}

async function readPngDimensions(filePath: string): Promise<{ width: number; height: number } | undefined> {
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(24);
    await handle.read(buffer, 0, buffer.length, 0);
    if (buffer.subarray(0, 8).compare(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) !== 0) {
      return undefined;
    }
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  } finally {
    await handle.close();
  }
}

function tokenize(value: string): string[] {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
}

function meaningfulTokens(tokens: readonly string[]): string[] {
  return tokens.filter((token) => token.length > 1 && !STOP_TOKENS.has(token));
}

function normalizeCompact(value: string): string {
  return tokenize(value).join("");
}

function countOverlap(left: readonly string[], right: readonly string[]): number {
  const rightSet = new Set(right);
  return new Set(left.filter((token) => rightSet.has(token))).size;
}

function basenameLike(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.split(/[\\/]/u).filter(Boolean).at(-1);
}

function addKey(keys: Set<string>, value: string | undefined): void {
  const trimmed = value?.trim();
  if (trimmed) {
    keys.add(trimmed);
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}
