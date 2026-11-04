export const REFERENCE_TIME_ZONE = "America/New_York";

const yearFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: REFERENCE_TIME_ZONE,
  year: "numeric",
});

/** Calendar year in the business time zone (America/New_York), not UTC. */
export function referenceYearFor(date: Date): number {
  return Number(yearFormatter.format(date));
}

export function formatReference(year: number, sequence: number): string {
  return `LS-${year}-${String(sequence).padStart(6, "0")}`;
}
