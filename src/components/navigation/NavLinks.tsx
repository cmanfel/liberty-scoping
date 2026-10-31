"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/content/business";

export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-0.5 xl:gap-1.5">
      {primaryNav.map((item) => {
        const active = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative inline-flex min-h-11 items-center px-3 text-[0.9375rem] font-medium tracking-wide transition-colors duration-200 after:absolute after:inset-x-3 after:bottom-1.5 after:h-px after:origin-left after:bg-gold-bright after:transition-transform after:duration-300 hover:text-gold-bright ${
                active
                  ? "text-gold-bright after:scale-x-100"
                  : "text-ivory after:scale-x-0 hover:after:scale-x-100"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
