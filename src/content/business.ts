export const business = {
  name: "Liberty Scoping",
  legalName: "Liberty Scoping",
  domain: "libertyscoping.com",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://libertyscoping.com",
  email: "Jennifer@libertyscoping.com",
  tagline: "Accuracy in Every Word. Integrity in Every Record.",
  serviceArea: "Serving clients nationwide",
  audience:
    "Serving court reporters, attorneys, and legal professionals nationwide.",
  description:
    "Professional legal scoping, proofreading, audio transcription, and transcript production services. Accurate, dependable support for court reporters and legal professionals nationwide.",
  heroIntro:
    "Professional legal transcription, scoping, editing, and transcript production services dedicated to preserving the accuracy, completeness, and integrity of the legal record.",
} as const;

export const quoteMailto = (() => {
  const subject = encodeURIComponent("Quote request - Liberty Scoping");
  const body = encodeURIComponent(
    [
      "Hello Jennifer,",
      "",
      "I would like a quote for a transcript project.",
      "",
      "Service needed (proofreading, scoping & editing, scoping + proofreading, or full transcript production):",
      "Type of proceeding:",
      "Estimated length (pages or audio hours):",
      "Audio / file format:",
      "Requested deadline:",
      "Any special requirements:",
      "",
      "Thank you,",
    ].join("\n"),
  );
  return `mailto:${business.email}?subject=${subject}&body=${body}`;
})();

export const generalMailto = `mailto:${business.email}`;

export const primaryNav = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Turnaround", href: "/turnaround" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;

export const legalNav = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Policies", href: "/terms" },
] as const;

export const aboutParagraphs = [
  "Liberty Scoping was founded on a commitment to preserving the integrity of the legal record through meticulous, reliable transcript production.",
  "Built on a professional foundation in court reporting, transcript production, operations, and quality assurance, our expertise encompasses the entire life cycle of the legal record, from initial capture through final production and delivery.",
  "Our experience spans a broad range of legal proceedings, with particular expertise in complex criminal and appellate matters. From multi-day trials and voir dire to challenging audio recordings and audio exhibits, we understand the precision, patience, and attention to detail that demanding records require.",
  "At Liberty Scoping, we believe that an accurate, complete, and accessible record is fundamental to the administration of justice. Every word has the potential to matter. We take the responsibility of preserving that record seriously, and that responsibility is what gives our work a deeper sense of purpose.",
  "As the court reporting industry continues to evolve and new methods of capture emerge, our commitment remains unchanged: maintaining the highest standards of accuracy, consistency, and integrity in every transcript.",
  "We are dedicated to supporting court reporters, attorneys, and legal professionals with dependable transcript production services, grounded in firsthand industry experience and a genuine passion for the work.",
] as const;

export const values = [
  {
    icon: "accuracy",
    title: "Accuracy & Precision",
    description:
      "Transcripts are reviewed against the audio for accuracy, consistency, and completeness, because every word has the potential to matter.",
  },
  {
    icon: "experience",
    title: "Industry Experience",
    description:
      "A professional foundation in court reporting, transcript production, operations, and quality assurance, from initial capture through final delivery.",
  },
  {
    icon: "complex",
    title: "Complex Proceedings",
    description:
      "Particular expertise in complex criminal and appellate matters, multi-day trials, voir dire, and challenging audio.",
  },
  {
    icon: "turnaround",
    title: "Reliable Turnaround",
    description:
      "Clearly published standard, priority, and rush timelines, with scheduling confirmed before you commit a time-sensitive project.",
  },
] as const;

export const processSteps = [
  {
    title: "Share Your Project Details",
    summary:
      "Tell us about the proceeding, the service you need, the estimated length, the audio format, and your deadline.",
    detail:
      "Email Jennifer with the proceeding type, estimated page count or audio length, the service you are interested in, the audio or file formats involved, and your requested deadline. Please do not send confidential case files until delivery arrangements have been confirmed.",
  },
  {
    title: "Receive a Quote & Confirm Availability",
    summary:
      "We review your details, confirm our availability for your deadline, and provide a quote.",
    detail:
      "Sending project details is an inquiry, not an accepted assignment. A project is accepted only once the quote, schedule, and payment terms have been confirmed. New clients generally pay a 50% deposit before production begins.",
  },
  {
    title: "Transcript Production & Quality Review",
    summary:
      "Your transcript is prepared, formatted, and reviewed for accuracy, consistency, and completeness.",
    detail:
      "Full transcript production includes transcription, editing, formatting, and final proofreading. Scoping and proofreading packages include two separate stages of review.",
  },
  {
    title: "Secure Delivery",
    summary: "The finished transcript is delivered in the format you need.",
    detail:
      "Completed transcripts are available as DOCX, RTF, PDF, or TXT, and other formats can be discussed individually. For new clients the balance is due before delivery; approved established agencies may qualify for Net 15 or Net 30 invoicing.",
  },
] as const;

export const compatibility = {
  intro:
    "Liberty Scoping works primarily in Microsoft Word and is familiar with industry-standard CAT software and a wide range of court reporting and audio capture platforms.",
  media: "Various audio and video formats can be accommodated.",
  deliveryFormats: ["DOCX", "RTF", "PDF", "TXT"],
  note: "Additional file formats and compatibility requirements may be discussed individually.",
} as const;
