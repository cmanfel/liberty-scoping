import { PageHero } from "@/components/ui/PageHero";
import { PolicyList } from "@/components/ui/PolicyList";
import { TurnaroundTable } from "@/components/ui/TurnaroundTable";
import { Section } from "@/components/ui/Section";
import { IconBadge } from "@/components/ui/IconBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { turnaroundPolicies } from "@/content/turnaround";
import { createMetadata } from "@/lib/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/jsonld";

export const metadata = createMetadata({
  title: "Turnaround Times & Availability",
  description:
    "Standard, priority, and rush turnaround times for transcript proofreading, scoping and editing, and full transcript production, with expedited availability policies.",
  path: "/turnaround",
});

export default function TurnaroundPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Turnaround", path: "/turnaround" },
        ])}
      />
      <PageHero
        eyebrow="Turnaround & availability"
        title="Deadlines you can plan around."
        description="Standard, priority, and rush timelines for every service. Expedited requests are subject to availability, so contact us before submitting anything time-sensitive."
      />

      <Section tone="ink" labelledBy="times-title">
        <h2 id="times-title" className="display-2">
          Turnaround times
        </h2>
        <div aria-hidden="true" className="gold-rule mt-6 mb-10 w-28" />
        <TurnaroundTable />
      </Section>

      <Section
        tone="ink-2"
        labelledBy="turnaround-policies-title"
        className="border-y border-line"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-20">
          <div>
            <h2 id="turnaround-policies-title" className="display-2">
              Turnaround policies
            </h2>
            <div aria-hidden="true" className="gold-rule mt-6 mb-8 w-28" />
            <PolicyList items={turnaroundPolicies} />
          </div>
          <aside className="card-surface self-start p-7 sm:p-8">
            <IconBadge name="expedited" />
            <h3 className="display-3 mt-5">Time-sensitive project?</h3>
            <p className="mt-3 text-[1.0625rem] leading-relaxed text-fog">
              Contact Liberty Scoping before submitting a time-sensitive project
              so scheduling can be confirmed. Next-day full transcript
              production may be available by custom quote.
            </p>
            <div className="mt-6">
              <ButtonLink href="/contact#request-quote">
                Request a Quote
              </ButtonLink>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
