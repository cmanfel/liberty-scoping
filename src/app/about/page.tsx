import Image from "next/image";
import { CtaSection } from "@/components/ui/CtaSection";
import { IconBadge } from "@/components/ui/IconBadge";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { BrandMark } from "@/components/ui/BrandMark";
import { aboutParagraphs, business, values } from "@/content/business";
import { createMetadata } from "@/lib/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/jsonld";

export const metadata = createMetadata({
  title: "About Liberty Scoping",
  description:
    "Liberty Scoping preserves the integrity of the legal record through meticulous transcript production, grounded in firsthand court reporting, transcript production, and quality assurance experience.",
  path: "/about",
});

export default function AboutPage() {
  const [lead, ...rest] = aboutParagraphs;
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <PageHero
        eyebrow="About"
        title="Preserving the integrity of the legal record."
        description={business.tagline}
      />

      <Section tone="ink" labelledBy="story-title">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-20">
          <div>
            <h2 id="story-title" className="display-2">
              Our commitment
            </h2>
            <div aria-hidden="true" className="gold-rule mt-6 w-28" />
            <p className="prose-measure mt-8 font-serif text-2xl font-medium leading-snug text-ivory sm:text-[1.75rem]">
              {lead}
            </p>
            <div className="prose-measure mt-8 grid gap-6 text-lg leading-[1.8] text-fog">
              {rest.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>

          <aside
            aria-label="Liberty Scoping brand"
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <div className="card-surface overflow-hidden p-8 text-center">
              <div className="relative mx-auto w-full max-w-[15rem]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-0 bg-[radial-gradient(closest-side,rgb(196_154_96/0.2),transparent)]"
                />
                <Image
                  src="/logo/liberty-scoping-monogram-mark.png"
                  alt="Liberty Scoping monogram: a gold letter L with balanced scales inside a circle"
                  width={320}
                  height={320}
                  sizes="240px"
                  className="relative h-auto w-full"
                />
              </div>
              <div className="mt-8 flex justify-center">
                <BrandMark size={44} showWordmark />
              </div>
              <div aria-hidden="true" className="gold-rule mx-auto mt-6 w-24" />
              <p className="mt-5 font-serif text-xl text-gold-bright">
                {business.tagline}
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <Section
        tone="ink-2"
        labelledBy="principles-title"
        className="border-y border-line"
      >
        <h2 id="principles-title" className="display-2 text-center">
          What guides our work
        </h2>
        <div aria-hidden="true" className="gold-rule mx-auto mt-6 w-28" />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <li key={v.title} className="card-surface p-6 sm:p-7">
              <IconBadge name={v.icon} />
              <h3 className="display-3 mt-5">{v.title}</h3>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-fog">
                {v.description}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <CtaSection />
    </>
  );
}
