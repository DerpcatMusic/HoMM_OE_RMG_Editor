import { Data } from "effect";

export class TemplateFileError extends Data.TaggedError("TemplateFileError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class TemplateParseError extends Data.TaggedError("TemplateParseError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class CoreArchiveError extends Data.TaggedError("CoreArchiveError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class LayoutStorageError extends Data.TaggedError("LayoutStorageError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type UiEffectError = TemplateFileError | TemplateParseError | CoreArchiveError | LayoutStorageError;

export function formatUiEffectError(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Editor command failed.";
}
