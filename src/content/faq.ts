export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const faqs: readonly FaqItem[] = [
  {
    id: "what-is-scoping",
    question: "What is scoping?",
    answer:
      "Scoping is the process of reviewing and editing a draft transcript against the audio recording to check accuracy, consistency, and completeness. Liberty Scoping offers this as Scoping & Editing.",
  },
  {
    id: "scoping-vs-proofreading",
    question: "What is the difference between scoping and proofreading?",
    answer:
      "Scoping & Editing is performed against the audio, so the transcript is checked directly against the recording. Proofreading is a text-only review of the transcript. The Scoping + Proofreading package combines both and includes two separate stages of review.",
  },
  {
    id: "full-production",
    question: "What does full transcript production include?",
    answer:
      "Full Transcript Production from Raw Audio includes transcription, editing, formatting, and final proofreading. Basic audio preparation is included in standard production rates.",
  },
  {
    id: "pricing",
    question: "How is pricing determined?",
    answer:
      "Published starting rates are per page: Proofreading $0.50, Scoping & Editing $1.50, Scoping + Proofreading $1.85, and Full Transcript Production from Raw Audio $3.00. Each service has a minimum invoice. Expedited services, extensive audio preparation, and unusually complex projects are quoted individually.",
  },
  {
    id: "page-counting",
    question: "How are pages counted?",
    answer:
      "Rates are based on standard 25-line transcript pages. If you have questions about how a specific transcript will be counted, ask when you request a quote.",
  },
  {
    id: "file-formats",
    question: "Which file formats do you support?",
    answer:
      "Finished transcripts can be delivered as DOCX, RTF, PDF, or TXT. Various audio and video formats can be accommodated, and additional file formats and compatibility requirements may be discussed individually.",
  },
  {
    id: "cat-software",
    question: "Do you work with my CAT software?",
    answer:
      "Liberty Scoping works primarily in Microsoft Word and is familiar with industry-standard CAT software and a wide range of court reporting and audio capture platforms. Because requirements vary, please tell us what you use when requesting a quote so compatibility can be confirmed for your project.",
  },
  {
    id: "rush",
    question: "Do you offer rush services?",
    answer:
      "Yes. Priority and rush turnaround are available subject to availability, and expedited services cost extra. Next-day full transcript production may be available by custom quote. Please contact Liberty Scoping before submitting a time-sensitive project to confirm scheduling.",
  },
  {
    id: "turnaround-calculation",
    question: "How is turnaround calculated?",
    answer:
      "Turnaround begins the next business day after all required files and instructions have been received. Deadlines depend on project length, complexity, and audio quality, and large trials, appeals, and complex projects receive individually agreed deadlines.",
  },
  {
    id: "weekends",
    question: "Are you available on weekends?",
    answer:
      "Weekend work does not automatically incur an additional fee. Availability for any specific weekend deadline is subject to confirmation, so please ask before submitting. Holiday expedited services may carry an additional premium.",
  },
  {
    id: "deposits",
    question: "Do you require a deposit?",
    answer:
      "New clients generally pay a 50% deposit before production begins, and the balance is due before delivery. Other terms may be negotiated.",
  },
  {
    id: "agency-pricing",
    question: "Is agency or volume pricing available?",
    answer:
      "Volume pricing and negotiated rates are available for established agencies and recurring clients. Approved established agencies may also qualify for Net 15 or Net 30 invoicing.",
  },
  {
    id: "cancellations",
    question: "What is your cancellation policy?",
    answer:
      "Clients are responsible for work completed before cancellation. Deposits are applied toward completed work, and any unused balance is refunded.",
  },
  {
    id: "complex-proceedings",
    question: "Can you handle complex proceedings?",
    answer:
      "Yes. Liberty Scoping has particular expertise in complex criminal and appellate matters, including multi-day trials, voir dire, multi-speaker recordings, and challenging audio. Large trials, appeals, and complex projects receive individually agreed deadlines and quotes.",
  },
  {
    id: "nationwide",
    question: "Do you serve clients nationwide?",
    answer:
      "Yes. Liberty Scoping serves court reporters, attorneys, and legal professionals nationwide.",
  },
  {
    id: "request-quote",
    question: "How do I request a quote?",
    answer:
      "Email Jennifer@libertyscoping.com with the service you need, the type of proceeding, the estimated length, the audio format, and your deadline. Sending project details is an inquiry, not an accepted assignment; a project begins once the quote, schedule, and payment terms are confirmed. Please do not email confidential case files until delivery arrangements have been confirmed.",
  },
];
