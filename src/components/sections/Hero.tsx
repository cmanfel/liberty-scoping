import { ButtonLink } from "@/components/ui/ButtonLink";
import { business } from "@/content/business";

const HERO_ALT =
  "Engraved illustration of Lady Justice in profile, one arm raised holding ornate golden scales before a golden moon and halo";

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-stage">
        <div className="hero-art">
          <picture>
            <source
              media="(max-width: 639px)"
              type="image/avif"
              srcSet="/images/lady-justice-mobile-780.avif 780w, /images/lady-justice-mobile.avif 1160w"
              sizes="100vw"
            />
            <source
              media="(max-width: 639px)"
              type="image/webp"
              srcSet="/images/lady-justice-mobile-780.webp 780w, /images/lady-justice-mobile.webp 1160w"
              sizes="100vw"
            />
            <source type="image/avif" srcSet="/images/lady-justice-hero.avif" />
            <source type="image/webp" srcSet="/images/lady-justice-hero.webp" />
            <img
              src="/images/lady-justice-hero.webp"
              alt={HERO_ALT}
              width={1536}
              height={1024}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>
      </div>

      <div className="hero-copy container-page">
        <div className="hero-copy-inner">
          <div className="hero-head">
            <p className="rise-in flex items-center gap-4">
              <span aria-hidden="true" className="h-px w-10 bg-gold sm:w-14" />
              <span className="eyebrow">Liberty Scoping</span>
            </p>

            <h1
              id="hero-title"
              className="hero-title rise-in rise-in-2 mt-5 text-[clamp(1.5rem,9vw-0.25rem,3.25rem)] leading-[1.06] xl:[font-size:calc(var(--hero-col)/11.3)]"
            >
              <span className="block">
                Accuracy in <span className="gold-text">Every Word.</span>
              </span>
              <span className="block">
                Integrity in <span className="gold-text">Every Record.</span>
              </span>
            </h1>
          </div>

          <div className="hero-body">
            <p className="rise-in rise-in-2 mt-5 max-w-[46ch] text-base leading-relaxed text-fog min-[380px]:text-[1.0625rem] sm:text-lg">
              {business.heroIntro}
            </p>

            <div className="rise-in rise-in-3 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <ButtonLink href="/contact#request-quote">
                Request a Quote
              </ButtonLink>
              <ButtonLink href="/services" variant="secondary">
                Explore Our Services
              </ButtonLink>
            </div>

            <p className="rise-in rise-in-3 mt-7 border-t border-line pt-5 text-sm leading-relaxed text-fog">
              {business.audience}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
