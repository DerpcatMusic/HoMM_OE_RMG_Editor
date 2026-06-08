const REMEMBERED_CORE_ARCHIVE_KEY = "olden-era-rmg-editor:last-core-archive";

export interface RememberedCoreArchive {
  name: string;
  size: number;
  lastModified: number;
  rememberedAt: string;
}

export async function pickTemplateFile(): Promise<File | undefined> {
  return pickFile(".rmg.json,application/json");
}

export async function pickCoreArchiveFile(): Promise<File | undefined> {
  return pickFile(".zip,application/zip,application/x-zip-compressed");
}

export function downloadTextFile(fileName: string, text: string, mimeType: string): void {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function rememberCoreArchiveFile(file: File): RememberedCoreArchive {
  const remembered: RememberedCoreArchive = {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    rememberedAt: new Date().toISOString(),
  };
  try {
    globalThis.localStorage?.setItem(REMEMBERED_CORE_ARCHIVE_KEY, JSON.stringify(remembered));
  } catch {
    // The editor still works when browser storage is disabled.
  }
  return remembered;
}

export function loadRememberedCoreArchive(): RememberedCoreArchive | undefined {
  try {
    const raw = globalThis.localStorage?.getItem(REMEMBERED_CORE_ARCHIVE_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as Partial<RememberedCoreArchive>;
    if (typeof parsed.name !== "string" || typeof parsed.size !== "number" || typeof parsed.lastModified !== "number") {
      return undefined;
    }
    return {
      name: parsed.name,
      size: parsed.size,
      lastModified: parsed.lastModified,
      rememberedAt: typeof parsed.rememberedAt === "string" ? parsed.rememberedAt : "",
    };
  } catch {
    return undefined;
  }
}

function pickFile(accept: string): Promise<File | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("change", () => resolve(input.files?.[0]));
    input.click();
  });
}
