import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Section } from "@/components/ui/Section";
import { aboutParagraphs } from "@/content/business";

export function AboutIntro() {
  return (
    <Section labelledBy="about-title" tone="ink">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-20">
        <div className="mx-auto flex w-full max-w-xs flex-col items-center sm:max-w-sm">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-full bg-[radial-gradient(closest-side,rgb(196_154_96/0.22),transparent)]"
            />
            <Image
              src="/logo/liberty-scoping-monogram-mark.png"
              alt="Liberty Scoping monogram: a gold letter L with balanced scales inside a circle"
              width={320}
              height={320}
              sizes="(min-width: 1024px) 384px, 320px"
              className="relative h-auto w-full"
            />
          </div>
        </div>

        <div>
          <p className="eyebrow mb-4">About Liberty Scoping</p>
          <h2 id="about-title" className="display-2">
            Built on a commitment to the integrity of the legal record.
          </h2>
          <div aria-hidden="true" className="gold-rule mt-6 w-28" />
          <div className="prose-measure mt-6 grid gap-5 text-lg leading-relaxed text-fog">
            <p>{aboutParagraphs[0]}</p>
            <p>{aboutParagraphs[1]}</p>
          </div>
          <div className="mt-8">
            <ButtonLink href="/about" variant="secondary">
              Read Our Story
            </ButtonLink>
          </div>
        </div>
      </div>
    </Section>
  );
}
