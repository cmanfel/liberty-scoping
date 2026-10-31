# Liberty Scoping — marketing website

Public marketing site for **Liberty Scoping** (https://libertyscoping.com), a nationwide legal transcription and transcript production business. Black-and-antique-gold design built around the supplied Lady Justice artwork.

Stack: Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · Lucide React · `next/font` (Cormorant Garamond + Inter). Everything is statically prerendered; the only client JavaScript is the mobile menu and the active-link highlighting.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start   # production build
npm run lint
```

Copy `.env.example` to `.env.local` to configure environment variables.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin used for metadata, sitemap, robots, and structured data. Defaults to `https://libertyscoping.com`. |
| `NEXT_PUBLIC_PORTAL_URL` | Origin of the separate customer portal (for example `https://portal.libertyscoping.com`). Leave blank until the portal is live. |

## Pages

`/`, `/about`, `/services`, `/pricing`, `/turnaround`, `/how-it-works`, `/faq`, `/contact`, `/privacy`, `/terms`, plus `sitemap.xml`, `robots.txt`, and a branded 404.

## Customer portal links

The marketing site never implements login, uploads, projects, or billing. All Login / Sign Up / New Project actions go through `src/lib/portal.ts`:

- Expected portal routes (edit `portalPaths` when the portal app is built): `/login`, `/signup`, `/projects/new`.
- **`NEXT_PUBLIC_PORTAL_URL` set:** buttons link to `${NEXT_PUBLIC_PORTAL_URL}/login`, `/signup`, `/projects/new`.
- **`NEXT_PUBLIC_PORTAL_URL` blank (current default):** no dead links. Login and Get Started go to `/contact#client-portal`, which explains that the online portal is not available yet and offers an email link. The "New Project" action goes to `/contact#request-quote`.

`NEXT_PUBLIC_*` values are inlined at build time, so rebuild/redeploy after changing them.

## Editing content

All business content is typed and centralised in `src/content/`; pages and components read from it, so one edit updates every page.

| File | Contents |
| --- | --- |
| `business.ts` | Name, email, tagline, about copy, value propositions, process steps, software/format info, navigation |
| `services.ts` | The five services |
| `pricing.ts` | Rate table, pricing policies, payment terms, cancellation policy |
| `turnaround.ts` | Turnaround table and policies |
| `faq.ts` | FAQ questions and answers (also emitted as FAQPage JSON-LD) |

The `/privacy` and `/terms` pages are written only from the published business policies and should be reviewed by counsel before launch.

## Brand assets

Originals are kept untouched in `assets-src/`:

| File | Asset |
| --- | --- |
| `assets-src/lady-justice-hero-original.png` | Asset A — Lady Justice hero artwork (1536 × 1024) |
| `assets-src/liberty-scoping-monogram-original.png` | Asset C — monogram (389 × 555) |

**Asset B (the main illustrated logo, `liberty_scoping_main_logo.png`) was not supplied.** Wherever the brief calls for the full logo (header, footer, About brand showcase) the site uses the monogram plus an HTML wordmark (`src/components/ui/BrandMark.tsx`). No logo was generated. If the illustrated logo is supplied later, add it as `public/logo/liberty-scoping-logo.png` and use it in the About page showcase and the OG image.

### Derived images

Every derived raster is produced from the two originals by image processing only (crop, downscale, encode); nothing is redrawn:

```bash
node scripts/build-images.mjs                           # hero crops, monogram mark, favicons (needs sharp)
CHROME_PATH=/usr/bin/google-chrome node scripts/build-og.mjs   # 1200×630 social card (needs Chrome + network for Google Fonts)
```

| Output | Source / treatment |
| --- | --- |
| `public/images/lady-justice-hero.{webp,avif}` | Full artwork at native 1536 × 1024 (no upscaling) |
| `public/images/lady-justice-mobile.{webp,avif}` | Mobile art direction: 1160 × 1024 crop (face, halo, raised arm, both scale pans) |
| `public/images/lady-justice-mobile-780.{webp,avif}` | Downscaled mobile variant for 1×–2× phones |
| `public/logo/liberty-scoping-monogram.png` | Original monogram copy |
| `public/logo/liberty-scoping-monogram-mark.{png,webp}` | Square crop of the circular emblem with a circular alpha mask |
| `src/app/icon.png`, `apple-icon.png`, `favicon.ico` | Favicon / Apple touch icon from the mark |
| `public/images/og-liberty-scoping.jpg` | Open Graph card: hero crop + monogram + HTML typography |

### Hero implementation

`src/components/sections/Hero.tsx` uses an art-directed `<picture>` (AVIF → WebP, mobile crop below 640 px) with `fetchpriority="high"` and reserved dimensions (no layout shift). CSS in `src/styles/globals.css` (`.hero*`) controls composition:

- **≥ 1280 px:** art on the left sized by hero height (never stretched), shifted left slightly so the scales clear the copy column; copy on the right; edge gradients blend the art into `#080808`.
- **900–1279 px:** art on top, headline and body in two columns beneath it.
- **< 900 px:** art on top, copy below; the art fades into the page background.

**Resolution limit:** the supplied hero is 1536 px wide. On 1×–1.5× displays it is displayed at or below native size and is sharp. On a 2× (Retina) desktop it is shown at roughly 1.6–1.9× upscaling, which is softer at 100 % zoom (no blocky pixelation, but fine engraving lines lose crispness). Phones are 1:1 or better. A higher-resolution original would improve large Retina displays; it can be dropped in by re-running `scripts/build-images.mjs`.

## Accessibility & performance notes

- Semantic landmarks, skip link, visible gold focus ring, `aria-current` on active nav, reduced-motion support.
- Mobile menu is a native modal `<dialog>`: focus trap, Escape to close, closes on navigation, backdrop inert, body scroll locked.
- FAQ uses native `<details>/<summary>`.
- Pricing and turnaround render as proper `<table>`s from 768 px up and as labelled cards below.
- No third-party scripts; fonts are self-hosted by `next/font`.
- Contact is email-based by design: no public form, so no confidential records can be submitted through an unsecured form.

## Deployment

Deploys to Vercel (or any Node host) with no extra configuration: set `NEXT_PUBLIC_SITE_URL` and, once live, `NEXT_PUBLIC_PORTAL_URL`, then `npm run build`.
