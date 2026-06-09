import { Effect } from "effect";
import type { EditorSession } from "../state/editorSession.js";
import {
  createSessionFromTemplateText,
  markSessionSaved,
  setCoreArchiveCatalogSummary,
} from "../state/editorSession.js";
import { parseCoreArchiveCatalogSummaryEffect } from "./coreArchiveCatalogService.js";
import type { UiEffectError } from "./errors.js";
import { TemplateParseError } from "./errors.js";
import {
  downloadSessionTemplateEffect,
  pickCoreArchiveFileEffect,
  pickTemplateFileEffect,
  readFileTextEffect,
} from "./fileService.js";
import { rememberCoreArchiveFile } from "../state/browserFiles.js";

export function loadTemplateProgram(currentSession?: EditorSession): Effect.Effect<EditorSession | undefined, UiEffectError, never> {
  return Effect.gen(function* () {
    const file = yield* pickTemplateFileEffect;
    if (!file) {
      return undefined;
    }
    const text = yield* readFileTextEffect(file);
    return yield* Effect.try({
      try: () => {
        const session = createSessionFromTemplateText(text, file.name);
        // Preserve core archive from previous session
        if (currentSession?.coreArchive) {
          return { ...session, coreArchive: currentSession.coreArchive };
        }
        return session;
      },
      catch: (cause) => new TemplateParseError({ message: parseTemplateErrorMessage(cause), cause }),
    });
  });
}

export function saveTemplateProgram(session: EditorSession): Effect.Effect<EditorSession, UiEffectError, never> {
  return Effect.gen(function* () {
    yield* downloadSessionTemplateEffect(session);
    return markSessionSaved(session);
  });
}

export function attachCoreArchiveProgram(
  session: EditorSession,
  providedFile?: File,
): Effect.Effect<EditorSession | undefined, UiEffectError, never> {
  return Effect.gen(function* () {
    const file = providedFile ?? (yield* pickCoreArchiveFileEffect);
    if (!file) {
      return undefined;
    }
    const result = yield* parseCoreArchiveCatalogSummaryEffect(file);
    yield* Effect.sync(() => rememberCoreArchiveFile(file));
    return setCoreArchiveCatalogSummary(session, file, result.catalogSummary, result.contentPoolIndex, result.contentListIndex);
  });
}

function parseTemplateErrorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Template parse failed.";
}
