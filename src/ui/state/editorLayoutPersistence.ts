import { Effect } from "effect";
import type { CanvasPosition, EditorLayoutState } from "./editorSession.js";
import { LayoutStorageError } from "../effect/errors.js";
import { runUiEffectSync } from "../effect/runtime.js";

const STORAGE_PREFIX = "olden-era-rmg-editor:layout:";

export function createLayoutStorageKey(input: {
  sourceFileName: string | undefined;
  templateName: string | undefined;
}): string {
  const identity = input.sourceFileName ?? input.templateName ?? "untitled";
  return `${STORAGE_PREFIX}${identity}`;
}

export function loadEditorLayout(storageKey: string): EditorLayoutState {
  return runUiEffectSync(
    loadEditorLayoutEffect(storageKey).pipe(Effect.catchAll(() => Effect.succeed(createEmptyEditorLayout()))),
  );
}

export function loadEditorLayoutEffect(storageKey: string): Effect.Effect<EditorLayoutState, LayoutStorageError, never> {
  const empty = createEmptyEditorLayout();
  return Effect.try({
    try: () => {
      const storage = getLocalStorage();
      if (!storage) {
        return empty;
      }
      const raw = storage.getItem(storageKey);
      if (!raw) {
        return empty;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!isRecord(parsed)) {
        return empty;
      }
      return {
        canvasPositions: readPositionRecord(parsed.canvasPositions),
        zoneObjectPositions: readNestedPositionRecord(parsed.zoneObjectPositions),
      };
    },
    catch: (cause) => new LayoutStorageError({ message: `Could not load editor layout ${storageKey}.`, cause }),
  }).pipe(Effect.catchAll(() => Effect.succeed(empty)));
}

export function saveEditorLayout(storageKey: string, layout: EditorLayoutState): void {
  runUiEffectSync(saveEditorLayoutEffect(storageKey, layout).pipe(Effect.catchAll(() => Effect.void)));
}

export function saveEditorLayoutEffect(
  storageKey: string,
  layout: EditorLayoutState,
): Effect.Effect<void, LayoutStorageError, never> {
  return Effect.try({
    try: () => {
      const storage = getLocalStorage();
      if (!storage) {
        return;
      }
      storage.setItem(storageKey, JSON.stringify(layout));
    },
    catch: (cause) => new LayoutStorageError({ message: `Could not save editor layout ${storageKey}.`, cause }),
  });
}

export function createEmptyEditorLayout(): EditorLayoutState {
  return {
    canvasPositions: {},
    zoneObjectPositions: {},
  };
}

function readNestedPositionRecord(value: unknown): Record<string, Record<string, CanvasPosition>> {
  if (!isRecord(value)) {
    return {};
  }
  const result: Record<string, Record<string, CanvasPosition>> = {};
  for (const [key, nested] of Object.entries(value)) {
    result[key] = readPositionRecord(nested);
  }
  return result;
}

function readPositionRecord(value: unknown): Record<string, CanvasPosition> {
  if (!isRecord(value)) {
    return {};
  }
  const result: Record<string, CanvasPosition> = {};
  for (const [key, position] of Object.entries(value)) {
    if (isPosition(position)) {
      result[key] = position;
    }
  }
  return result;
}

function isPosition(value: unknown): value is CanvasPosition {
  return isRecord(value) &&
    typeof value.x === "number" &&
    Number.isFinite(value.x) &&
    typeof value.y === "number" &&
    Number.isFinite(value.y);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getLocalStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
