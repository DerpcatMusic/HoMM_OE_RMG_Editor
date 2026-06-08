import path from "node:path";
import { listJsonFiles, readJsonFile } from "../json/readJson.js";
import type { RmgTemplate } from "../rmg/rmgTypes.js";

export interface TemplateIndex {
  templates: TemplateFile[];
  byName: Map<string, TemplateFile>;
  duplicates: TemplateDuplicate[];
}

export interface TemplateFile {
  fileName: string;
  sourcePath: string;
  template: RmgTemplate;
}

export interface TemplateDuplicate {
  name: string;
  firstSourcePath: string;
  duplicateSourcePath: string;
}

export async function indexTemplates(templateDir: string): Promise<TemplateIndex> {
  const files = (await listJsonFiles(templateDir, false)).filter((file) => file.endsWith(".rmg.json"));
  const templates: TemplateFile[] = [];
  const byName = new Map<string, TemplateFile>();
  const duplicates: TemplateDuplicate[] = [];

  for (const file of files) {
    const json = await readJsonFile<RmgTemplate>(file);
    const templateFile: TemplateFile = {
      fileName: path.basename(file),
      sourcePath: file,
      template: json.data,
    };
    templates.push(templateFile);

    const name = json.data.name ?? path.basename(file, ".rmg.json");
    const existing = byName.get(name);
    if (existing) {
      duplicates.push({
        name,
        firstSourcePath: existing.sourcePath,
        duplicateSourcePath: file,
      });
    } else {
      byName.set(name, templateFile);
    }
  }

  return {
    templates,
    byName,
    duplicates,
  };
}
