import { Effect } from "effect";
import type { CoreDataSource } from "../../core/game-data/coreDataSource.js";
import { CoreArchiveError } from "./errors.js";

interface ZipEntry {
  readonly name: string;
  readonly compressionMethod: number;
  readonly compressedSize: number;
  readonly uncompressedSize: number;
  readonly localHeaderOffset: number;
}

interface ParsedZipArchive {
  readonly fileName: string;
  readonly bytes: Uint8Array;
  readonly entries: ReadonlyMap<string, ZipEntry>;
}

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP64_SENTINEL = 0xffffffff;

export function createBrowserZipCoreDataSource(file: File): Effect.Effect<CoreDataSource, CoreArchiveError, never> {
  return Effect.tryPromise({
    try: async () => {
      const archive = parseZipArchive(file.name, await file.arrayBuffer());
      return {
        sourceId: file.name,
        async readJson<T>(relativePath: string): Promise<T> {
          const text = await readZipTextEntry(archive, toZipPath(relativePath));
          return JSON.parse(stripBom(text)) as T;
        },
        async listJsonFiles(relativeDir: string, recursive = true): Promise<string[]> {
          const prefix = withTrailingSlash(toZipPath(relativeDir));
          return [...archive.entries.keys()]
            .filter((entry) => entry.startsWith(prefix) && entry.endsWith(".json"))
            .filter((entry) => recursive || !entry.slice(prefix.length).includes("/"))
            .sort();
        },
        sourcePath(relativePath: string): string {
          return `${file.name}:${toZipPath(relativePath)}`;
        },
      };
    },
    catch: (cause) => toCoreArchiveError(cause, `Could not read ${file.name} as Core.zip.`),
  });
}

function parseZipArchive(fileName: string, buffer: ArrayBuffer): ParsedZipArchive {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(view);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  if (centralDirectoryOffset === ZIP64_SENTINEL || entryCount === 0xffff) {
    throw new Error("ZIP64 archives are not supported by the browser parser yet.");
  }

  const entries = new Map<string, ZipEntry>();
  let offset = centralDirectoryOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(offset, true) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error(`Invalid central directory header at offset ${offset}.`);
    }
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    if (
      compressedSize === ZIP64_SENTINEL ||
      uncompressedSize === ZIP64_SENTINEL ||
      localHeaderOffset === ZIP64_SENTINEL
    ) {
      throw new Error("ZIP64 entry metadata is not supported by the browser parser yet.");
    }
    const name = decodeUtf8(bytes.subarray(offset + 46, offset + 46 + fileNameLength));
    if (!name.endsWith("/")) {
      entries.set(name, {
        name,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset,
      });
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return { fileName, bytes, entries };
}

async function readZipTextEntry(archive: ParsedZipArchive, entryPath: string): Promise<string> {
  const entry = archive.entries.get(entryPath);
  if (!entry) {
    throw new Error(`Core.zip entry not found: ${entryPath}`);
  }
  const view = new DataView(archive.bytes.buffer, archive.bytes.byteOffset, archive.bytes.byteLength);
  if (view.getUint32(entry.localHeaderOffset, true) !== LOCAL_FILE_HEADER_SIGNATURE) {
    throw new Error(`Invalid local file header for ${entryPath}.`);
  }
  const fileNameLength = view.getUint16(entry.localHeaderOffset + 26, true);
  const extraLength = view.getUint16(entry.localHeaderOffset + 28, true);
  const dataOffset = entry.localHeaderOffset + 30 + fileNameLength + extraLength;
  const compressed = archive.bytes.subarray(dataOffset, dataOffset + entry.compressedSize);
  const inflated = entry.compressionMethod === 0
    ? compressed
    : entry.compressionMethod === 8
      ? await inflateRaw(compressed)
      : unsupportedCompression(entry);
  if (entry.uncompressedSize !== 0 && inflated.byteLength !== entry.uncompressedSize) {
    throw new Error(`Unexpected uncompressed size for ${entryPath}.`);
  }
  return decodeUtf8(inflated);
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (!("DecompressionStream" in globalThis)) {
    throw new Error("This browser does not expose DecompressionStream.");
  }
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function unsupportedCompression(entry: ZipEntry): never {
  throw new Error(`Unsupported ZIP compression method ${entry.compressionMethod} for ${entry.name}.`);
}

function findEndOfCentralDirectory(view: DataView): number {
  const minOffset = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let offset = view.byteLength - 22; offset >= minOffset; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) {
      return offset;
    }
  }
  throw new Error("End of central directory record was not found.");
}

function toCoreArchiveError(cause: unknown, fallbackMessage: string): CoreArchiveError {
  return new CoreArchiveError({
    message: cause instanceof Error ? cause.message : fallbackMessage,
    cause,
  });
}

function toZipPath(value: string): string {
  return value.replace(/\\/gu, "/").replace(/^\/+/u, "");
}

function withTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
