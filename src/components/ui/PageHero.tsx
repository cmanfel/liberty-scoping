import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
}

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <header className="page-hero">
      <div className="container-page py-16 sm:py-20 lg:py-24">
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h1 className="display-1 max-w-4xl">{title}</h1>
        <div aria-hidden="true" className="gold-rule mt-7 w-32" />
        {description ? (
          <p className="mt-7 max-w-[62ch] text-lg leading-relaxed text-fog sm:text-xl">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
