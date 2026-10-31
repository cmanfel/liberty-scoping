import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { business } from "@/content/business";
import { JsonLd, organizationSchema, websiteSchema } from "@/lib/jsonld";
import { OG_IMAGE, SITE_URL } from "@/lib/metadata";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Liberty Scoping | Professional Legal Scoping & Transcript Production",
    template: `%s | ${business.name}`,
  },
  description: business.description,
  applicationName: business.name,
  authors: [{ name: business.name }],
  keywords: [
    "legal scoping services",
    "court reporter scoping",
    "transcript production",
    "legal transcription",
    "transcript proofreading",
    "audio transcription",
    "digital court reporting transcription",
    "appellate transcript production",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: business.name,
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[3px] focus:bg-gold-bright focus:px-4 focus:py-3 focus:font-semibold focus:text-ink"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </body>
    </html>
  );
}
