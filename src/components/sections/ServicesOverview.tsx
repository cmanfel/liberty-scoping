import { ServiceCard } from "@/components/ui/ServiceCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Section, SectionHeading } from "@/components/ui/Section";
import { services } from "@/content/services";

export function ServicesOverview() {
  return (
    <Section
      labelledBy="services-title"
      tone="ink-2"
      className="border-y border-line"
    >
      <SectionHeading
        id="services-title"
        eyebrow="Services"
        title="Transcript services, from capture to final record."
        description="Scoping, proofreading, audio transcription, and full transcript production for court reporters, attorneys, and legal professionals."
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {services.map((s, i) => (
          <li
            key={s.slug}
            className={i < 3 ? "lg:col-span-2" : "lg:col-span-3"}
          >
            <ServiceCard service={s} href="/services" />
          </li>
        ))}
      </ul>
      <div className="mt-10 text-center">
        <ButtonLink href="/services" variant="secondary">
          View All Services
        </ButtonLink>
      </div>
    </Section>
  );
}
