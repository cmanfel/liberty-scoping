import { ButtonLink } from "@/components/ui/ButtonLink";

export default function NotFound() {
  return (
    <section className="section-pad">
      <div className="container-page text-center">
        <p className="eyebrow mb-4">Error 404</p>
        <h1 className="display-1">This page is not part of the record.</h1>
        <div aria-hidden="true" className="gold-rule mx-auto mt-7 w-32" />
        <p className="mx-auto mt-7 max-w-[52ch] text-lg text-fog">
          The page you are looking for may have moved. Return to the homepage or
          get in touch and we will point you in the right direction.
        </p>
        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/">Back to Home</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Contact Liberty Scoping
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
