export interface PricingRow {
  id: string;
  service: string;
  rate: string;
  unit: string;
  minimumInvoice: string;
}

export const pricingRows: readonly PricingRow[] = [
  {
    id: "proofreading",
    service: "Proofreading (text-only)",
    rate: "$0.50",
    unit: "/page",
    minimumInvoice: "$25",
  },
  {
    id: "scoping-editing",
    service: "Scoping & Editing (against audio)",
    rate: "$1.50",
    unit: "/page",
    minimumInvoice: "$35",
  },
  {
    id: "scoping-proofreading",
    service: "Scoping + Proofreading",
    rate: "$1.85",
    unit: "/page",
    minimumInvoice: "$40",
  },
  {
    id: "full-production",
    service: "Full Transcript Production from Raw Audio",
    rate: "$3.00",
    unit: "/page",
    minimumInvoice: "$50",
  },
];

export const pricingPolicies: readonly string[] = [
  "Rates are based on standard 25-line transcript pages.",
  "Full transcript production includes transcription, editing, formatting, and final proofreading.",
  "Scoping and proofreading packages include two separate stages of review.",
  "Expedited services cost extra.",
  "Holiday expedited requests are quoted individually.",
  "Extensive audio preparation and unusually complex projects are quoted individually.",
  "Basic audio preparation is included in standard production rates.",
  "Volume pricing and negotiated rates are available for established agencies and recurring clients.",
  "Minimum invoice amounts are not additional surcharges.",
];

export const paymentTerms = {
  newClients: [
    "New clients generally pay a 50% deposit before production begins.",
    "The balance is due before delivery.",
  ],
  agencies:
    "Approved established agencies may qualify for Net 15 or Net 30 invoicing.",
  other: "Other terms may be negotiated.",
} as const;

export const cancellationPolicy: readonly string[] = [
  "Clients are responsible for work completed before cancellation.",
  "Deposits are applied toward completed work, and any unused balance is refunded.",
];
