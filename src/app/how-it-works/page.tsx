import { CtaSection } from "@/components/ui/CtaSection";
import { PageHero } from "@/components/ui/PageHero";
import { ProcessSteps } from "@/components/ui/ProcessSteps";
import { Section } from "@/components/ui/Section";
import { createMetadata } from "@/lib/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/jsonld";

export const metadata = createMetadata({
  title: "How It Works | Client Workflow",
  description:
    "How Liberty Scoping works with clients: share project details, receive a quote and confirm availability, transcript production and quality review, and delivery.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "How It Works", path: "/how-it-works" },
        ])}
      />
      <PageHero
        eyebrow="How it works"
        title="From inquiry to delivered transcript."
        description="Sharing project details is an inquiry, not an accepted assignment. Work begins once the quote, schedule, and terms are confirmed."
      />
      <Section tone="ink" labelledBy="steps-title">
        <h2 id="steps-title" className="sr-only">
          The four steps
        </h2>
        <div className="mx-auto max-w-4xl">
          <ProcessSteps detailed />
        </div>
      </Section>
      <CtaSection />
    </>
  );
}
