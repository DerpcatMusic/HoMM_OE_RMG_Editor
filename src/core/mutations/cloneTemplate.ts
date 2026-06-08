import type { RmgTemplate } from "../rmg/rmgTypes.js";

export function cloneTemplate(template: RmgTemplate): RmgTemplate {
  return JSON.parse(JSON.stringify(template)) as RmgTemplate;
}
