import type { MutationResult } from "../mutations/mutationTypes.js";
import { pushTransaction } from "../mutations/transactionManager.js";
import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { applyEntityAction } from "./entityActionRouter.js";
import type { ApplyEditorActionInput, EditorActionResult } from "./editorActionTypes.js";
import { applyFieldUpdate } from "./fieldActionRouter.js";

export function applyEditorAction(input: ApplyEditorActionInput): EditorActionResult {
  const result = runAction(input);
  const shouldPushTransaction = Boolean(input.history && result.ok && result.changes.length > 0);
  const nextHistory = shouldPushTransaction && input.history
    ? pushTransaction(input.history, input.transactionLabel ?? input.action.type, input.template, result)
    : input.history;

  const output: EditorActionResult = {
    ...result,
    actionType: input.action.type,
    transactionPushed: shouldPushTransaction,
  };
  if (nextHistory) {
    output.history = nextHistory;
  }
  return output;
}

function runAction(input: ApplyEditorActionInput): MutationResult<RmgTemplate> {
  if (input.action.type === "field.update") {
    return applyFieldUpdate(input.template, input.action, input.options ?? {});
  }
  return applyEntityAction(input.template, input.action);
}
