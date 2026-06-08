import { cloneTemplate } from "../mutations/cloneTemplate.js";
import type { MutationResult } from "../mutations/mutationTypes.js";
import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic } from "../validation/validationTypes.js";

export function actionError(
  template: RmgTemplate,
  code: string,
  message: string,
  path = "$",
): MutationResult<RmgTemplate> {
  return {
    value: cloneTemplate(template),
    changes: [],
    diagnostics: [diagnostic("error", code, message, path)],
    ok: false,
  };
}

export function cloneActionValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
