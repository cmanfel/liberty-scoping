import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "group/btn inline-flex items-center justify-center gap-2 rounded-[3px] text-center text-[0.9375rem] font-semibold tracking-[0.02em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out active:translate-y-px focus-visible:outline-offset-4";

const sizes = {
  md: "min-h-12 px-6 py-3",
  sm: "min-h-11 px-5 py-2",
} as const;

const variants: Record<Variant, string> = {
  primary:
    "border border-gold-bright/40 bg-gradient-to-b from-gold-bright to-gold text-ink shadow-[0_8px_24px_-12px_rgb(196_154_96/0.7)] hover:from-[#efc98a] hover:to-gold-bright hover:shadow-[0_10px_30px_-10px_rgb(229_189_122/0.75)]",
  secondary:
    "border border-gold-muted bg-transparent text-ivory hover:border-gold-bright hover:bg-gold/10 hover:text-gold-bright",
  ghost:
    "px-3 text-gold-bright hover:text-ivory underline-offset-4 hover:underline",
};

interface ButtonLinkProps extends Omit<
  ComponentProps<"a">,
  "href" | "className" | "children"
> {
  href: string;
  variant?: Variant;
  size?: keyof typeof sizes;
  external?: boolean;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  external,
  className = "",
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = `${base} ${variant === "ghost" ? "min-h-11" : sizes[size]} ${variants[variant]} ${className}`;
  const isExternal = external ?? /^(https?:|mailto:|tel:)/.test(href);
  if (isExternal) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
