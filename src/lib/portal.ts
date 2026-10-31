import { business } from "@/content/business";

/**
 * The customer portal is a separate application. Paths are expected to be
 * verified/updated when that app ships. Set NEXT_PUBLIC_PORTAL_URL (for
 * example https://portal.libertyscoping.com) to turn the portal links on.
 */
export const portalPaths = {
  login: "/login",
  signup: "/signup",
  newProject: "/projects/new",
} as const;

export type PortalRoute = keyof typeof portalPaths;

const portalBase = (process.env.NEXT_PUBLIC_PORTAL_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

export const portalConfigured = portalBase.length > 0;

const fallbackHref: Record<PortalRoute, string> = {
  login: "/contact#client-portal",
  signup: "/contact#client-portal",
  newProject: "/contact#request-quote",
};

export interface PortalLink {
  href: string;
  external: boolean;
  configured: boolean;
}

/**
 * Returns the portal URL for a route, or an on-site contact alternative when
 * the portal has not been configured, so no CTA is ever a dead link.
 */
export function portalLink(route: PortalRoute): PortalLink {
  if (portalConfigured) {
    return {
      href: `${portalBase}${portalPaths[route]}`,
      external: true,
      configured: true,
    };
  }
  return { href: fallbackHref[route], external: false, configured: false };
}

export const portalContactEmail = business.email;
