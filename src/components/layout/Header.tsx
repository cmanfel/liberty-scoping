import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";
import { PortalButton } from "@/components/ui/PortalButton";
import { NavLinks } from "@/components/navigation/NavLinks";
import { MobileNav } from "@/components/navigation/MobileNav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/92 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="container-page flex h-[var(--header-h)] items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="Liberty Scoping, home"
          className="rounded-[3px] focus-visible:outline-offset-4"
        >
          <BrandMark priority size={44} />
        </Link>

        <nav aria-label="Primary" className="hidden nav:block">
          <NavLinks />
        </nav>

        <div className="hidden items-center gap-2 nav:flex">
          <PortalButton route="login" variant="ghost">
            Login
          </PortalButton>
          <PortalButton route="signup" size="sm">
            Get Started
          </PortalButton>
        </div>

        <div className="nav:hidden">
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
