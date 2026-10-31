import {
  AudioLines,
  BadgeCheck,
  ClipboardCheck,
  Clock,
  FileSearch,
  FileText,
  Files,
  Landmark,
  LifeBuoy,
  Scale,
  ShieldCheck,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "@/content/services";

export const iconMap: Record<IconKey, LucideIcon> = {
  transcript: FileText,
  scoping: FileSearch,
  audio: AudioLines,
  complex: Scale,
  expedited: Timer,
  accuracy: Target,
  experience: Landmark,
  turnaround: Clock,
  confidentiality: ShieldCheck,
  quality: ClipboardCheck,
  formats: Files,
  contact: LifeBuoy,
};

export const FallbackIcon = BadgeCheck;

interface IconBadgeProps {
  name: IconKey;
  size?: "md" | "lg";
  className?: string;
}

/** Branded icon treatment: gold line icon in a restrained engraved frame. */
export function IconBadge({
  name,
  size = "md",
  className = "",
}: IconBadgeProps) {
  const Icon = iconMap[name] ?? FallbackIcon;
  const box = size === "lg" ? "size-16" : "size-12";
  const icon = size === "lg" ? 30 : 24;
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex ${box} shrink-0 items-center justify-center rounded-full border border-gold-muted/70 bg-gradient-to-b from-gold/15 to-transparent text-gold-bright shadow-[inset_0_0_0_3px_#0d0b09,inset_0_0_0_4px_rgb(75_56_36/0.8)] ${className}`}
    >
      <Icon size={icon} strokeWidth={1.5} absoluteStrokeWidth />
    </span>
  );
}
