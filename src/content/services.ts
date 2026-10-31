export type IconKey =
  | "transcript"
  | "scoping"
  | "audio"
  | "complex"
  | "expedited"
  | "accuracy"
  | "experience"
  | "turnaround"
  | "confidentiality"
  | "quality"
  | "formats"
  | "contact";

export interface Service {
  slug: string;
  icon: IconKey;
  title: string;
  description: string;
}

export const services: readonly Service[] = [
  {
    slug: "transcript-production",
    icon: "transcript",
    title: "Transcript Production",
    description:
      "Preparing transcripts from digital audio recordings, including hearings, depositions, trials, and other legal proceedings.",
  },
  {
    slug: "scoping-editing",
    icon: "scoping",
    title: "Scoping & Editing",
    description:
      "Reviewing and editing draft transcripts against audio for accuracy, consistency, and completeness.",
  },
  {
    slug: "audio-transcription",
    icon: "audio",
    title: "Audio Transcription",
    description:
      "Police interviews, interrogations, recorded statements, body-worn camera recordings, audio exhibits, and other recordings.",
  },
  {
    slug: "complex-proceedings",
    icon: "complex",
    title: "Complex Proceedings",
    description:
      "Multi-day trials, voir dire, multi-speaker recordings, and challenging audio.",
  },
  {
    slug: "expedited-services",
    icon: "expedited",
    title: "Expedited Services",
    description: "Rush and priority turnaround, subject to availability.",
  },
];
