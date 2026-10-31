import { Mail, MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { IconBadge } from "@/components/ui/IconBadge";
import { PageHero } from "@/components/ui/PageHero";
import { PolicyList } from "@/components/ui/PolicyList";
import { PortalButton } from "@/components/ui/PortalButton";
import { Section } from "@/components/ui/Section";
import { business, generalMailto, quoteMailto } from "@/content/business";
import { createMetadata } from "@/lib/metadata";
import { portalConfigured } from "@/lib/portal";
import { JsonLd, breadcrumbSchema } from "@/lib/jsonld";

export const metadata = createMetadata({
  title: "Contact & Request a Quote",
  description:
    "Contact Liberty Scoping by email to request a quote for legal scoping, proofreading, audio transcription, or transcript production. Serving clients nationwide.",
  path: "/contact",
});

const quoteChecklist = [
  "The service you need: proofreading, scoping & editing, scoping + proofreading, or full transcript production",
  "The type of proceeding",
  "Estimated length, in pages or audio hours",
  "Audio or file formats involved",
  "Your requested deadline",
  "Any special requirements or software compatibility needs",
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <PageHero
        eyebrow="Contact"
        title="Let us know about your project."
        description="The fastest way to start is by email. Share the details of your project and we will confirm availability, scheduling, and a quote."
      />

      <Section tone="ink" labelledBy="contact-details-title">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-14">
          <div className="card-surface self-start p-7 sm:p-9">
            <IconBadge name="contact" size="lg" />
            <h2 id="contact-details-title" className="display-3 mt-6">
              {business.name}
            </h2>
            <div aria-hidden="true" className="gold-rule mt-4 w-20" />
            <ul className="mt-6 grid gap-3 text-lg">
              <li className="flex items-start gap-3">
                <Mail
                  size={22}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="mt-3 shrink-0 text-gold"
                />
                <a
                  href={generalMailto}
                  className="inline-flex min-h-11 items-center break-all text-ivory underline decoration-gold-muted underline-offset-4 hover:text-gold-bright"
                >
                  {business.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-fog">
                <MapPin
                  size={22}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-gold"
                />
                <span>{business.serviceArea}</span>
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href={generalMailto} variant="secondary">
                Email Jennifer
              </ButtonLink>
            </div>
          </div>

          <div id="request-quote" className="scroll-mt-28">
            <p className="eyebrow mb-4">Request a quote</p>
            <h2 className="display-2">How to start a project</h2>
            <div aria-hidden="true" className="gold-rule mt-6 w-28" />
            <p className="prose-measure mt-6 text-lg leading-relaxed text-fog">
              Send an email with the details below. We will review them, confirm
              availability for your deadline, and provide a quote. Sending
              project details is an inquiry and does not by itself constitute an
              accepted assignment.
            </p>
            <div className="mt-8">
              <PolicyList items={quoteChecklist} />
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={quoteMailto}>
                <Mail size={18} strokeWidth={1.75} aria-hidden="true" />
                Email a Quote Request
              </ButtonLink>
              {portalConfigured ? (
                <PortalButton route="newProject" variant="secondary">
                  Start a New Project
                </PortalButton>
              ) : null}
            </div>
            <p className="mt-5 max-w-[62ch] text-sm leading-relaxed text-fog">
              The button opens your email app with a template. If it does not,
              write to{" "}
              <a
                href={generalMailto}
                className="text-gold-bright underline underline-offset-4"
              >
                {business.email}
              </a>
              .
            </p>
          </div>
        </div>
      </Section>

      <Section
        tone="ink-2"
        labelledBy="confidential-title"
        className="border-y border-line"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
          <IconBadge name="confidentiality" size="lg" />
          <div>
            <h2 id="confidential-title" className="display-3">
              Please keep confidential materials out of first emails
            </h2>
            <p className="mt-3 text-[1.0625rem] leading-relaxed text-fog">
              Please do not send confidential case files, recordings, or
              transcripts in your first message. Describe the project, and
              delivery arrangements for your files can be confirmed with you
              before anything is sent.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="ink" labelledBy="client-portal-title" id="client-portal">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="client-portal-title" className="display-2">
            Client portal
          </h2>
          <div aria-hidden="true" className="gold-rule mx-auto mt-6 w-28" />
          {portalConfigured ? (
            <>
              <p className="mx-auto mt-6 max-w-[56ch] text-lg text-fog">
                Existing clients can sign in to the client portal, and new
                clients can create an account.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <PortalButton route="login">Client Portal Login</PortalButton>
                <PortalButton route="signup" variant="secondary">
                  Sign Up
                </PortalButton>
              </div>
            </>
          ) : (
            <>
              <p className="mx-auto mt-6 max-w-[56ch] text-lg text-fog">
                The online client portal is not available from this website yet.
                In the meantime, please email Jennifer to start a project or to
                ask about your existing work.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <ButtonLink href={generalMailto}>
                  Email {business.email}
                </ButtonLink>
              </div>
            </>
          )}
        </div>
      </Section>
    </>
  );
}
