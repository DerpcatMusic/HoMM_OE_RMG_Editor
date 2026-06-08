const REMEMBERED_CORE_ARCHIVE_KEY = "olden-era-rmg-editor:last-core-archive";
const CORE_ARCHIVE_IDB_DB = "olden-era-rmg-editor";
const CORE_ARCHIVE_IDB_STORE = "core-archives";
const CORE_ARCHIVE_IDB_KEY = "current";

let coreDirectoryHandle: FileSystemDirectoryHandle | undefined;

export interface RememberedCoreArchive {
  name: string;
  size: number;
  lastModified: number;
  rememberedAt: string;
}

function openCoreArchiveDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CORE_ARCHIVE_IDB_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(CORE_ARCHIVE_IDB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheCoreArchiveFile(file: File): Promise<void> {
  const db = await openCoreArchiveDB();
  const tx = db.transaction(CORE_ARCHIVE_IDB_STORE, "readwrite");
  const store = tx.objectStore(CORE_ARCHIVE_IDB_STORE);
  store.put(file, CORE_ARCHIVE_IDB_KEY);
  rememberCoreArchiveFile(file);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadCachedCoreArchiveFile(): Promise<File | undefined> {
  try {
    const db = await openCoreArchiveDB();
    const tx = db.transaction(CORE_ARCHIVE_IDB_STORE, "readonly");
    const store = tx.objectStore(CORE_ARCHIVE_IDB_STORE);
    const request = store.get(CORE_ARCHIVE_IDB_KEY);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => { db.close(); resolve(request.result as File | undefined); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  } catch {
    return undefined;
  }
}

export async function pickTemplateFile(): Promise<File | undefined> {
  return pickFile(".rmg.json,application/json");
}

export async function pickCoreArchiveFile(): Promise<File | undefined> {
  const w = window as any;
  if (typeof w.showOpenFilePicker === "function") {
    try {
      const [handle] = await w.showOpenFilePicker({
        types: [{ description: "Core Archive", accept: { "application/zip": [".zip"] } }],
      });
      const file = await handle.getFile();
      try {
        coreDirectoryHandle = await handle.getParent?.();
      } catch {
        // getParent not available in all browsers
      }
      return file;
    } catch {
      return undefined;
    }
  }
  return pickFile(".zip,application/zip,application/x-zip-compressed");
}
export async function saveTextFile(fileName: string, text: string, mimeType: string): Promise<void> {
  const w = window as any;
  if (typeof w.showSaveFilePicker === "function" && coreDirectoryHandle) {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: fileName,
        startIn: coreDirectoryHandle,
        types: [{ description: "RMG Template", accept: { "application/json": [".rmg.json", ".json"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(new Blob([text], { type: mimeType }));
      await writable.close();
      return;
    } catch {
      // User cancelled or API failed — fall through to download
    }
  }
  downloadTextFile(fileName, text, mimeType);
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
