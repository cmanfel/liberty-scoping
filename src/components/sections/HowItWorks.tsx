import { ButtonLink } from "@/components/ui/ButtonLink";
import { ProcessSteps } from "@/components/ui/ProcessSteps";
import { Section, SectionHeading } from "@/components/ui/Section";

export function HowItWorks() {
  return (
    <Section labelledBy="how-title" tone="ink">
      <SectionHeading
        id="how-title"
        eyebrow="How It Works"
        title="A straightforward path from inquiry to delivery."
        description="Sharing project details is an inquiry. Work begins once the quote, schedule, and terms are confirmed."
      />
      <div className="mt-14">
        <ProcessSteps />
      </div>
      <div className="mt-10 text-center">
        <ButtonLink href="/how-it-works" variant="secondary">
          See the Full Process
        </ButtonLink>
      </div>
    </Section>
  );
}
