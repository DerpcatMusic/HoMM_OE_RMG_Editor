import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordDelete, recordValueChange } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";
import { type Diagnostic } from "../validation/validationTypes.js";

export interface GlobalBansSettings {
  magics?: string[] | null;
  items?: string[] | null;
  skills?: string[] | null;
  heroes?: string[] | null;
  units?: string[] | null;
}

export interface UpdateGlobalBansInput extends TemplateMutationInput {
  settings: GlobalBansSettings;
}

export function updateGlobalBans(input: UpdateGlobalBansInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const globalBans = (template.globalBans ??= {});

  for (const key of ["magics", "items", "skills", "heroes", "units"] as const) {
    const value = input.settings[key];
    if (value === undefined) {
      continue;
    }
    if (value === null) {
      recordDelete(globalBans, key, `$.globalBans.${key}`, changes, "global bans field removed");
    } else {
      recordValueChange(globalBans, key, `$.globalBans.${key}`, value, changes, "global bans updated");
    }
  }

  if (Object.keys(globalBans).length === 0) {
    recordDelete(template, "globalBans", "$.globalBans", changes, "global bans removed");
  }

  return buildMutationResult(template, changes, diagnostics);
}
