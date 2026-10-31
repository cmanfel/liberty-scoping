import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { portalLink, type PortalRoute } from "@/lib/portal";

interface PortalButtonProps {
  route: PortalRoute;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "sm";
  className?: string;
  children: ReactNode;
}

/** Button that points at the external portal app, or at the contact page when
 * the portal is not configured. */
export function PortalButton({
  route,
  variant = "primary",
  size,
  className,
  children,
}: PortalButtonProps) {
  const link = portalLink(route);
  return (
    <ButtonLink
      href={link.href}
      external={link.external}
      variant={variant}
      size={size}
      className={className}
    >
      {children}
    </ButtonLink>
  );
}
