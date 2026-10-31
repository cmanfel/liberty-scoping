export interface TurnaroundRow {
  id: string;
  service: string;
  standard: string;
  priority: string;
  rush: string;
}

export const turnaroundRows: readonly TurnaroundRow[] = [
  {
    id: "proofreading",
    service: "Proofreading",
    standard: "3 business days",
    priority: "24–48 hours",
    rush: "Same day",
  },
  {
    id: "scoping-editing",
    service: "Scoping & Editing",
    standard: "5 business days",
    priority: "3–4 business days",
    rush: "24–48 hours",
  },
  {
    id: "scoping-proofreading",
    service: "Scoping + Proofreading",
    standard: "5–7 business days",
    priority: "3–4 business days",
    rush: "24–48 hours",
  },
  {
    id: "full-production",
    service: "Full Transcript Production",
    standard: "7 business days",
    priority: "4–5 business days",
    rush: "2–3 business days",
  },
];

export const turnaroundPolicies: readonly string[] = [
  "Next-day full transcript production may be available by custom quote.",
  "Turnaround begins the next business day after all required files and instructions have been received.",
  "Deadlines depend on project length, complexity, and audio quality.",
  "Large trials, appeals, and complex projects receive individually agreed deadlines.",
  "Weekend work does not automatically incur an additional fee.",
  "Expedited pricing applies when shortened turnaround is requested.",
  "Holiday expedited services may carry an additional premium.",
  "All expedited requests are subject to availability.",
  "Clients should contact Liberty Scoping before submitting time-sensitive projects to confirm scheduling.",
];
