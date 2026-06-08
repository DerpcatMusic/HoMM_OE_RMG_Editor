export function normalizeStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

export function isStringArrayCompatible(value: unknown): value is string | string[] | undefined {
  return (
    value === undefined ||
    typeof value === "string" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

export function stringReferenceIncludes(value: unknown, expected: string): boolean {
  if (typeof value === "string") {
    return value === expected;
  }
  return Array.isArray(value) && value.includes(expected);
}
