import { CtaSection } from "@/components/ui/CtaSection";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { faqs } from "@/content/faq";
import { createMetadata } from "@/lib/metadata";
import { JsonLd, breadcrumbSchema, faqSchema } from "@/lib/jsonld";

export const metadata = createMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers about legal scoping, proofreading, full transcript production, pricing, page counts, file formats, rush services, deposits, cancellations, and requesting a quote.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ])}
      />
      <PageHero
        eyebrow="FAQ"
        title="Frequently asked questions."
        description="Straightforward answers about scoping, proofreading, pricing, and turnaround."
      />
      <Section tone="ink" labelledBy="faq-list-title">
        <h2 id="faq-list-title" className="sr-only">
          Questions and answers
        </h2>
        <FaqAccordion items={faqs} />
      </Section>
      <CtaSection
        title="Still have a question?"
        description="Email Jennifer and we will be glad to help with your project."
      />
    </>
  );
}
