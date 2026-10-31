import type { Metadata } from "next";
import { business } from "@/content/business";

export const SITE_URL = business.siteUrl.replace(/\/+$/, "");
export const OG_IMAGE = {
  url: "/images/og-liberty-scoping.jpg",
  width: 1200,
  height: 630,
  alt: "Liberty Scoping: Lady Justice and golden scales with the tagline Accuracy in Every Word. Integrity in Every Record.",
} as const;

interface PageMeta {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}

export function createMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: PageMeta): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${business.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: business.name,
      locale: "en_US",
      title: fullTitle,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
