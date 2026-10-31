import { Hero } from "@/components/sections/Hero";
import { WhyLiberty } from "@/components/sections/WhyLiberty";
import { ServicesOverview } from "@/components/sections/ServicesOverview";
import { AboutIntro } from "@/components/sections/AboutIntro";
import { PricingOverview } from "@/components/sections/PricingOverview";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { CtaSection } from "@/components/ui/CtaSection";
import { createMetadata } from "@/lib/metadata";
import { business } from "@/content/business";

export const metadata = createMetadata({
  title: "Liberty Scoping | Professional Legal Scoping & Transcript Production",
  description: business.description,
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhyLiberty />
      <ServicesOverview />
      <AboutIntro />
      <PricingOverview />
      <HowItWorks />
      <CtaSection />
    </>
  );
}
