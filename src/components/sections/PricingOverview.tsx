import { ButtonLink } from "@/components/ui/ButtonLink";
import { Section, SectionHeading } from "@/components/ui/Section";
import { pricingRows } from "@/content/pricing";

export function PricingOverview() {
  return (
    <Section
      labelledBy="pricing-title"
      tone="ink-2"
      className="border-y border-line"
    >
      <SectionHeading
        id="pricing-title"
        eyebrow="Pricing"
        title="Clear starting rates, per page."
        description="Rates are based on standard 25-line transcript pages. Custom quotes are available for complex projects, expedited work, and established agencies."
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {pricingRows.map((row) => (
          <li
            key={row.id}
            className="card-surface flex flex-col p-6 text-center sm:p-7"
          >
            <h3 className="font-serif text-xl font-semibold leading-snug text-ivory">
              {row.service}
            </h3>
            <p className="mt-auto pt-6">
              <span className="sr-only">Starting at </span>
              <span className="font-serif text-5xl font-semibold lining-nums text-gold-bright">
                {row.rate}
              </span>
              <span className="text-fog">{row.unit}</span>
            </p>
            <p className="mt-2 text-sm text-fog">
              Minimum invoice {row.minimumInvoice}
            </p>
          </li>
        ))}
      </ul>
      <div className="mx-auto mt-10 max-w-2xl rounded-md border border-gold-muted/60 bg-gold/5 p-6 text-center">
        <p className="font-serif text-2xl font-semibold text-ivory">
          Custom quotes available
        </p>
        <p className="mt-2 text-fog">
          Expedited services, holiday requests, extensive audio preparation, and
          unusually complex projects are quoted individually.
        </p>
      </div>
      <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <ButtonLink href="/contact#request-quote">Request a Quote</ButtonLink>
        <ButtonLink href="/pricing" variant="secondary">
          Rates &amp; Policies
        </ButtonLink>
      </div>
    </Section>
  );
}
