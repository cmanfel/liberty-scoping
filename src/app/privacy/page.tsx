import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { business } from "@/content/business";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description:
    "How the Liberty Scoping website handles information, including email correspondence and confidential materials.",
  path: "/privacy",
});

const sections: { title: string; body: string[] }[] = [
  {
    title: "Scope",
    body: [
      `This policy describes how the ${business.name} marketing website (${business.domain}) handles information. The customer portal, if and when it is available, is a separate application and may have its own terms and privacy information.`,
    ],
  },
  {
    title: "Information you send us",
    body: [
      `This website does not have accounts or submission forms. If you contact us, you do so by email at ${business.email}. Information you include in an email, such as your name, contact details, and project description, is used to respond to your inquiry, prepare a quote, and, if you engage us, perform the work.`,
    ],
  },
  {
    title: "Confidential materials",
    body: [
      "Please do not send confidential case files, recordings, or transcripts in an initial inquiry. Delivery arrangements for project files can be confirmed with you before anything is sent.",
    ],
  },
  {
    title: "Cookies and analytics",
    body: [
      "This website does not set advertising or tracking cookies and does not include third-party analytics or advertising scripts. Fonts are served from this website.",
    ],
  },
  {
    title: "Server logs",
    body: [
      "Like most websites, the hosting infrastructure may automatically record technical information about requests, such as IP address, browser type, and pages requested, for security and reliability purposes.",
    ],
  },
  {
    title: "Changes",
    body: [
      "If the website adds features that collect information, this policy will be updated before those features are used.",
    ],
  },
  {
    title: "Questions",
    body: [`Questions about this policy can be sent to ${business.email}.`],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="Last updated October 2026."
      />
      <Section tone="ink">
        <div className="prose-measure mx-auto grid gap-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="display-3">{s.title}</h2>
              <div className="mt-3 grid gap-4 text-[1.0625rem] leading-[1.8] text-fog">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
