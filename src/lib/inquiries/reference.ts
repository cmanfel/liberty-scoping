export function formatReference(year: number, sequence: number): string {
  return `LS-${year}-${String(sequence).padStart(6, "0")}`;
}
