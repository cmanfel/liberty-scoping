import { IconBadge } from "@/components/ui/IconBadge";
import { Section, SectionHeading } from "@/components/ui/Section";
import { values } from "@/content/business";

export function WhyLiberty() {
  return (
    <Section labelledBy="why-title" tone="ink">
      <SectionHeading
        id="why-title"
        eyebrow="Why Liberty Scoping"
        title="Meticulous work for a record that matters."
      />
      <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v) => (
          <li
            key={v.title}
            className="flex flex-col items-center text-center sm:items-start sm:text-left"
          >
            <IconBadge name={v.icon} size="lg" />
            <h3 className="display-3 mt-6">{v.title}</h3>
            <div
              aria-hidden="true"
              className="gold-rule mt-4 w-16 sm:mr-auto"
            />
            <p className="mt-4 max-w-[34ch] text-[1.0625rem] leading-relaxed text-fog">
              {v.description}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
