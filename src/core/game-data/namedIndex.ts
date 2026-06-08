export interface IndexedByName<T> {
  byName: Map<string, IndexedEntry<T>>;
  duplicates: DuplicateName[];
}

export interface IndexedEntry<T> {
  name: string;
  value: T;
  sourcePath: string;
}

export interface DuplicateName {
  name: string;
  firstSourcePath: string;
  duplicateSourcePath: string;
}

export function createNamedIndex<T>(
  entries: Iterable<{ name: string | undefined; value: T; sourcePath: string }>,
): IndexedByName<T> {
  const byName = new Map<string, IndexedEntry<T>>();
  const duplicates: DuplicateName[] = [];

  for (const entry of entries) {
    if (!entry.name) {
      continue;
    }
    const existing = byName.get(entry.name);
    if (existing) {
      duplicates.push({
        name: entry.name,
        firstSourcePath: existing.sourcePath,
        duplicateSourcePath: entry.sourcePath,
      });
      continue;
    }
    byName.set(entry.name, {
      name: entry.name,
      value: entry.value,
      sourcePath: entry.sourcePath,
    });
  }

  return { byName, duplicates };
}
