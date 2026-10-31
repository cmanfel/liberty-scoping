import { CtaSection } from "@/components/ui/CtaSection";
import { IconBadge } from "@/components/ui/IconBadge";
import { PageHero } from "@/components/ui/PageHero";
import { Section, SectionHeading } from "@/components/ui/Section";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { compatibility } from "@/content/business";
import { services } from "@/content/services";
import { createMetadata } from "@/lib/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/jsonld";

export const metadata = createMetadata({
  title: "Legal Scoping & Transcript Production Services",
  description:
    "Transcript production, scoping and editing, audio transcription, complex proceedings, and expedited services for court reporters, attorneys, and legal professionals nationwide.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />
      <PageHero
        eyebrow="Services"
        title="Legal scoping and transcript production."
        description="From digital audio to a finished, reviewed transcript, Liberty Scoping supports court reporters, attorneys, and legal professionals nationwide."
      />

      <Section tone="ink" labelledBy="services-list-title">
        <h2 id="services-list-title" className="sr-only">
          Our services
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {services.map((s, i) => (
            <li
              key={s.slug}
              id={s.slug}
              className={i < 3 ? "lg:col-span-2" : "lg:col-span-3"}
            >
              <ServiceCard service={s} headingLevel="h3" />
            </li>
          ))}
        </ul>
        <div className="mx-auto mt-14 flex max-w-3xl gap-5 rounded-md border border-gold-muted/60 bg-gold/5 p-6 sm:p-8">
          <IconBadge name="quality" className="hidden sm:inline-flex" />
          <div>
            <h3 className="display-3">Two stages of review</h3>
            <p className="mt-2 text-[1.0625rem] leading-relaxed text-fog">
              Scoping and proofreading packages include two separate stages of
              review. Full transcript production includes transcription,
              editing, formatting, and final proofreading.
            </p>
          </div>
        </div>
      </Section>

      <Section
        tone="ink-2"
        labelledBy="compat-title"
        className="border-y border-line"
      >
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              id="compat-title"
              align="left"
              eyebrow="Software & compatibility"
              title="Works the way your files do."
            />
            <div className="prose-measure mt-8 grid gap-5 text-lg leading-relaxed text-fog">
              <p>{compatibility.intro}</p>
              <p>{compatibility.media}</p>
              <p>{compatibility.note}</p>
            </div>
          </div>
          <div className="card-surface self-start p-7 sm:p-8">
            <IconBadge name="formats" />
            <h3 className="display-3 mt-5">Delivery formats</h3>
            <ul className="mt-5 flex flex-wrap gap-3">
              {compatibility.deliveryFormats.map((f) => (
                <li
                  key={f}
                  className="rounded-[3px] border border-gold-muted px-5 py-2 font-semibold tracking-[0.12em] text-gold-bright"
                >
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-fog">
              Need something else? Compatibility requirements can be discussed
              individually when you request a quote.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="ink" labelledBy="rates-teaser">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="rates-teaser" className="display-2">
            See rates and turnaround
          </h2>
          <div aria-hidden="true" className="gold-rule mx-auto mt-6 w-28" />
          <p className="mx-auto mt-6 max-w-[56ch] text-lg text-fog">
            Published starting rates and turnaround times are listed for every
            service. Custom quotes are available for complex or expedited work.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/pricing">View Pricing</ButtonLink>
            <ButtonLink href="/turnaround" variant="secondary">
              View Turnaround Times
            </ButtonLink>
          </div>
        </div>
      </Section>

      <CtaSection />
    </>
  );
}
