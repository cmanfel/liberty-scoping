"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { business, primaryNav } from "@/content/business";
import { portalLink } from "@/lib/portal";

export function MobileNav() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const menuId = useId();

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const login = portalLink("login");
  const signup = portalLink("signup");

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          dialogRef.current?.showModal();
          closeRef.current?.focus();
          setOpen(true);
        }}
        className="inline-flex size-12 items-center justify-center rounded-[3px] border border-line text-gold-bright transition-colors hover:border-gold-muted hover:bg-gold/10"
      >
        <Menu size={26} strokeWidth={1.5} aria-hidden="true" />
      </button>

      <dialog
        ref={dialogRef}
        id={menuId}
        aria-label="Site menu"
        className="nav-dialog"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div
          className="flex min-h-full flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) close();
          }}
        >
          <div className="flex h-[3.5rem] items-center justify-between">
            <Link href="/" aria-label="Liberty Scoping home">
              <BrandMark size={40} />
            </Link>
            <button
              type="button"
              ref={closeRef}
              aria-label="Close menu"
              onClick={close}
              className="inline-flex size-12 items-center justify-center rounded-[3px] border border-line text-gold-bright transition-colors hover:border-gold-muted hover:bg-gold/10"
            >
              <X size={26} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <div aria-hidden="true" className="gold-rule my-4" />

          <nav aria-label="Mobile">
            <ul className="grid">
              {primaryNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href} className="border-b border-line/60">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-14 items-center justify-between py-3 font-serif text-[1.75rem] font-semibold leading-none transition-colors hover:text-gold-bright ${
                        active ? "text-gold-bright" : "text-ivory"
                      }`}
                    >
                      {item.label}
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="size-1.5 rounded-full bg-gold-bright"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-8 grid gap-3">
            <ButtonLink
              href={signup.href}
              external={signup.external}
              variant="primary"
            >
              Get Started
            </ButtonLink>
            <ButtonLink
              href={login.href}
              external={login.external}
              variant="secondary"
            >
              Login
            </ButtonLink>
          </div>

          <p className="mt-auto pt-10 text-sm text-fog">
            <a
              href={`mailto:${business.email}`}
              className="inline-flex min-h-11 items-center text-gold-bright underline-offset-4 hover:underline"
            >
              {business.email}
            </a>
            <br />
            {business.serviceArea}
          </p>
        </div>
      </dialog>
    </>
  );
}
