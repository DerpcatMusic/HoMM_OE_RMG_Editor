export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  path: string;
  sourcePath?: string;
}

export function diagnostic(
  severity: DiagnosticSeverity,
  code: string,
  message: string,
  path: string,
  sourcePath?: string,
): Diagnostic {
  return sourcePath === undefined
    ? { severity, code, message, path }
    : { severity, code, message, path, sourcePath };
}

export function countDiagnostics(diagnostics: readonly Diagnostic[]): Record<DiagnosticSeverity, number> {
  return diagnostics.reduce<Record<DiagnosticSeverity, number>>(
    (counts, item) => {
      counts[item.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0 },
  );
}
