import { ButtonLink } from "@/components/ui/ButtonLink";

interface CtaSectionProps {
  title?: string;
  description?: string;
}

export function CtaSection({
  title = "Your Record Deserves Careful Attention.",
  description = "Tell us about your project and we will confirm availability, scheduling, and a quote.",
}: CtaSectionProps) {
  return (
    <section
      aria-labelledby="cta-title"
      className="relative isolate overflow-hidden border-t border-line bg-ink-2 section-pad"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_20rem_at_50%_0%,rgb(196_154_96/0.18),transparent_70%)]"
      />
      <div className="container-page text-center">
        <div aria-hidden="true" className="gold-rule mx-auto mb-10 w-40" />
        <h2 id="cta-title" className="display-2 mx-auto max-w-3xl">
          {title}
        </h2>
        <p className="mx-auto mt-5 max-w-[56ch] text-lg text-fog">
          {description}
        </p>
        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <ButtonLink href="/contact#request-quote">Request a Quote</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Contact Liberty Scoping
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
