import { Effect } from "effect";
import { downloadTextFile, pickCoreArchiveFile, pickTemplateFile } from "../state/browserFiles.js";
import type { EditorSession } from "../state/editorSession.js";
import { getSessionSaveFileName, serializeSessionTemplate } from "../state/editorSession.js";
import { TemplateFileError } from "./errors.js";

export const pickTemplateFileEffect = Effect.tryPromise({
  try: () => pickTemplateFile(),
  catch: (cause) => new TemplateFileError({ message: "Template file picker failed.", cause }),
});

export const pickCoreArchiveFileEffect = Effect.tryPromise({
  try: () => pickCoreArchiveFile(),
  catch: (cause) => new TemplateFileError({ message: "Core archive file picker failed.", cause }),
});

export function readFileTextEffect(file: File): Effect.Effect<string, TemplateFileError, never> {
  return Effect.tryPromise({
    try: () => file.text(),
    catch: (cause) => new TemplateFileError({ message: `Could not read ${file.name}.`, cause }),
  });
}

export function downloadSessionTemplateEffect(session: EditorSession): Effect.Effect<void, TemplateFileError, never> {
  return Effect.try({
    try: () => downloadTextFile(getSessionSaveFileName(session), serializeSessionTemplate(session), "application/json"),
    catch: (cause) => new TemplateFileError({ message: "Template download failed.", cause }),
  });
}
