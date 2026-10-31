import { PageHero } from "@/components/ui/PageHero";
import { PolicyList } from "@/components/ui/PolicyList";
import { PricingTable } from "@/components/ui/PricingTable";
import { Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  cancellationPolicy,
  paymentTerms,
  pricingPolicies,
} from "@/content/pricing";
import { createMetadata } from "@/lib/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/jsonld";

export const metadata = createMetadata({
  title: "Rates & Policies | Transcript Proofreading, Scoping & Production",
  description:
    "Starting per-page rates for transcript proofreading, scoping and editing, and full transcript production, plus minimum invoices, payment terms, and cancellation policy.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      <PageHero
        eyebrow="Rates & policies"
        title="Clear starting rates, per page."
        description="Rates are based on standard 25-line transcript pages. Custom quotes are available for complex projects, expedited work, and established agencies."
      />

      <Section tone="ink" labelledBy="rates-title">
        <h2 id="rates-title" className="display-2">
          Starting rates
        </h2>
        <div aria-hidden="true" className="gold-rule mt-6 mb-10 w-28" />
        <PricingTable />
        <p className="mt-5 text-sm text-fog">
          Minimum invoice amounts are not additional surcharges.
        </p>
      </Section>

      <Section
        tone="ink-2"
        labelledBy="policies-title"
        className="border-y border-line"
      >
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="policies-title" className="display-2">
              Pricing policies
            </h2>
            <div aria-hidden="true" className="gold-rule mt-6 mb-8 w-28" />
            <PolicyList items={pricingPolicies} />
          </div>
          <div className="grid content-start gap-12">
            <div>
              <h2 className="display-2">Payment terms</h2>
              <div aria-hidden="true" className="gold-rule mt-6 mb-8 w-28" />
              <div className="grid gap-3 text-[1.0625rem] leading-relaxed text-fog">
                {paymentTerms.newClients.map((t) => (
                  <p key={t}>{t}</p>
                ))}
                <p>{paymentTerms.agencies}</p>
                <p>{paymentTerms.other}</p>
              </div>
            </div>
            <div>
              <h2 className="display-2">Cancellation policy</h2>
              <div aria-hidden="true" className="gold-rule mt-6 mb-8 w-28" />
              <div className="grid gap-3 text-[1.0625rem] leading-relaxed text-fog">
                {cancellationPolicy.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="ink" labelledBy="quote-title">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="quote-title" className="display-2">
            Need a custom quote?
          </h2>
          <div aria-hidden="true" className="gold-rule mx-auto mt-6 w-28" />
          <p className="mx-auto mt-6 max-w-[56ch] text-lg text-fog">
            Tell us about your project, including the service, estimated length,
            and deadline, and we will confirm availability and pricing.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/contact#request-quote">
              Request a Quote
            </ButtonLink>
            <ButtonLink href="/turnaround" variant="secondary">
              View Turnaround Times
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
