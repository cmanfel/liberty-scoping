import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { business } from "@/content/business";
import {
  cancellationPolicy,
  paymentTerms,
  pricingPolicies,
} from "@/content/pricing";
import { turnaroundPolicies } from "@/content/turnaround";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Terms & Service Policies",
  description:
    "Liberty Scoping service policies: quotes and acceptance, pricing, payment terms, turnaround, expedited services, and cancellation.",
  path: "/terms",
});

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid list-disc gap-2 pl-6 marker:text-gold">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms & Service Policies"
        description="Last updated October 2026."
      />
      <Section tone="ink">
        <div className="prose-measure mx-auto grid gap-10 text-[1.0625rem] leading-[1.8] text-fog">
          <section>
            <h2 className="display-3 text-ivory">Quotes and acceptance</h2>
            <p className="mt-3">
              Information you send about a project is an inquiry and does not by
              itself constitute an accepted assignment. A project is accepted
              once the quote, schedule, and payment terms have been confirmed
              with you. Published rates are starting rates; see the{" "}
              <Link
                href="/pricing"
                className="text-gold-bright underline underline-offset-4"
              >
                pricing page
              </Link>
              .
            </p>
          </section>
          <section>
            <h2 className="display-3 text-ivory">Pricing</h2>
            <div className="mt-3">
              <Bullets items={pricingPolicies} />
            </div>
          </section>
          <section>
            <h2 className="display-3 text-ivory">Payment terms</h2>
            <div className="mt-3">
              <Bullets
                items={[
                  ...paymentTerms.newClients,
                  paymentTerms.agencies,
                  paymentTerms.other,
                ]}
              />
            </div>
          </section>
          <section>
            <h2 className="display-3 text-ivory">
              Turnaround and expedited services
            </h2>
            <div className="mt-3">
              <Bullets items={turnaroundPolicies} />
            </div>
          </section>
          <section>
            <h2 className="display-3 text-ivory">Cancellation</h2>
            <div className="mt-3">
              <Bullets items={cancellationPolicy} />
            </div>
          </section>
          <section>
            <h2 className="display-3 text-ivory">Confidential materials</h2>
            <p className="mt-3">
              Please do not send confidential case files, recordings, or
              transcripts in an initial inquiry. See our{" "}
              <Link
                href="/privacy"
                className="text-gold-bright underline underline-offset-4"
              >
                privacy policy
              </Link>
              .
            </p>
          </section>
          <section>
            <h2 className="display-3 text-ivory">Questions</h2>
            <p className="mt-3">
              Questions about these policies can be sent to {business.email}.
            </p>
          </section>
        </div>
      </Section>
    </>
  );
}
