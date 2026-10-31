import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  tone?: "ink" | "ink-2" | "surface";
  className?: string;
  labelledBy?: string;
  children: ReactNode;
}

const tones = {
  ink: "bg-ink",
  "ink-2": "bg-ink-2",
  surface: "bg-surface",
} as const;

export function Section({
  id,
  tone = "ink",
  className = "",
  labelledBy,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`section-pad ${tones[tone]} ${className}`}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}

interface SectionHeadingProps {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "center",
  as: Tag = "h2",
  className = "",
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={`${centered ? "mx-auto text-center" : ""} max-w-3xl ${className}`}
    >
      {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
      <Tag id={id} className="display-2">
        {title}
      </Tag>
      <div
        aria-hidden="true"
        className={`gold-rule mt-6 w-28 ${centered ? "mx-auto" : ""}`}
      />
      {description ? (
        <p
          className={`mt-6 text-lg leading-relaxed text-fog ${centered ? "mx-auto" : ""} max-w-[62ch]`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
