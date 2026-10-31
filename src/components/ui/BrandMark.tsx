import Image from "next/image";

interface BrandMarkProps {
  size?: number;
  priority?: boolean;
  showWordmark?: boolean;
  className?: string;
}

/** Monogram plus HTML wordmark (the full illustrated logo was not supplied). */
export function BrandMark({
  size = 44,
  priority = false,
  showWordmark = true,
  className = "",
}: BrandMarkProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/logo/liberty-scoping-monogram-mark.png"
        alt={showWordmark ? "" : "Liberty Scoping monogram"}
        width={size}
        height={size}
        sizes={`${size}px`}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className="shrink-0"
      />
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[1.375rem] font-semibold uppercase tracking-[0.2em] text-ivory sm:text-2xl">
            Liberty
          </span>
          <span className="mt-1 font-serif text-[0.8125rem] font-semibold uppercase tracking-[0.5em] text-gold sm:text-sm">
            Scoping
          </span>
        </span>
      ) : null}
    </span>
  );
}
