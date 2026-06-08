import type { RmgTemplate } from "../rmg/rmgTypes.js";
import type { MutationResult } from "./mutationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";

export interface TransactionFrame {
  label: string;
  before: RmgTemplate;
  after: RmgTemplate;
  result: MutationResult;
  timestamp: number;
}

export interface TransactionHistory {
  stack: TransactionFrame[];
  index: number;
}

export function createTransactionHistory(): TransactionHistory {
  return { stack: [], index: -1 };
}

export function pushTransaction(
  history: TransactionHistory,
  label: string,
  before: RmgTemplate,
  result: MutationResult,
): TransactionHistory {
  if (!result.ok) {
    return history;
  }

  const newStack = history.stack.slice(0, history.index + 1);
  newStack.push({
    label,
    before: cloneTemplate(before),
    after: cloneTemplate(result.value),
    result: {
      ...result,
      value: cloneTemplate(result.value),
    },
    timestamp: Date.now(),
  });

  return {
    stack: newStack,
    index: history.index + 1,
  };
}

export function canUndo(history: TransactionHistory): boolean {
  return history.index >= 0;
}

export function undo(
  history: TransactionHistory,
): { template: RmgTemplate; history: TransactionHistory } | undefined {
  if (!canUndo(history)) {
    return undefined;
  }

  const frame = history.stack[history.index];
  if (frame === undefined) {
    return undefined;
  }
  return {
    template: cloneTemplate(frame.before),
    history: {
      stack: history.stack,
      index: history.index - 1,
    },
  };
}

export function canRedo(history: TransactionHistory): boolean {
  return history.index < history.stack.length - 1;
}

export function redo(
  history: TransactionHistory,
): { template: RmgTemplate; history: TransactionHistory } | undefined {
  if (!canRedo(history)) {
    return undefined;
  }

  const newIndex = history.index + 1;
  const frame = history.stack[newIndex];
  if (frame === undefined) {
    return undefined;
  }
  return {
    template: cloneTemplate(frame.after),
    history: {
      stack: history.stack,
      index: newIndex,
    },
  };
}

export function getCurrentTemplate(history: TransactionHistory): RmgTemplate | undefined {
  if (history.index < 0) {
    return undefined;
  }
  const template = history.stack[history.index]?.after;
  return template ? cloneTemplate(template) : undefined;
}

export function clearHistory(history: TransactionHistory): TransactionHistory {
  return { stack: [], index: -1 };
}
