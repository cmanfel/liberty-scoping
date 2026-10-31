import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PortalButton } from "@/components/ui/PortalButton";
import { business, legalNav, primaryNav } from "@/content/business";
import { services } from "@/content/services";

const linkClass =
  "inline-flex min-h-11 items-center text-fog transition-colors hover:text-gold-bright";

export function Footer() {
  return (
    <footer className="border-t border-line bg-[#060606] pb-[max(2rem,env(safe-area-inset-bottom))] pt-14 sm:pt-16">
      <div className="container-page">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="md:col-span-2 lg:col-span-1">
            <Link
              href="/"
              aria-label="Liberty Scoping, home"
              className="inline-block"
            >
              <BrandMark size={56} />
            </Link>
            <p className="mt-6 max-w-[34ch] font-serif text-xl leading-snug text-gold-bright">
              {business.tagline}
            </p>
            <p className="mt-4 max-w-[40ch] text-sm leading-relaxed text-fog">
              Professional legal transcription, scoping, editing, and transcript
              production. {business.serviceArea}.
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="eyebrow mb-3 !font-sans">Explore</h2>
            <ul>
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Services">
            <h2 className="eyebrow mb-3 !font-sans">Services</h2>
            <ul>
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href="/services" className={linkClass}>
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow mb-3 !font-sans">Contact</h2>
            <p className="text-fog">
              <a
                href={`mailto:${business.email}`}
                className="inline-flex min-h-11 items-center break-all text-ivory underline decoration-gold-muted underline-offset-4 hover:text-gold-bright"
              >
                {business.email}
              </a>
              <br />
              {business.serviceArea}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href="/contact#request-quote" size="sm">
                Request a Quote
              </ButtonLink>
              <PortalButton route="login" variant="secondary" size="sm">
                Client Login
              </PortalButton>
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="gold-rule mt-12" />
        <div className="mt-6 flex flex-col gap-2 text-sm text-fog sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {business.legalName}. All rights
            reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
