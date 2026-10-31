import { business } from "@/content/business";
import { services } from "@/content/services";
import { faqs } from "@/content/faq";
import { SITE_URL } from "@/lib/metadata";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#organization`,
  name: business.name,
  url: SITE_URL,
  logo: `${SITE_URL}/logo/liberty-scoping-monogram-mark.png`,
  image: `${SITE_URL}/images/og-liberty-scoping.jpg`,
  slogan: business.tagline,
  description: business.description,
  email: business.email,
  areaServed: "Nationwide",
  knowsAbout: [
    "Legal transcription",
    "Transcript production",
    "Court reporter scoping",
    "Transcript proofreading",
    "Audio transcription",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: `${business.name} services`,
    itemListElement: services.map((s) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: s.title,
        description: s.description,
      },
    })),
  },
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: business.name,
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
