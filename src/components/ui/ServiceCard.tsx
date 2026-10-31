import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IconBadge } from "@/components/ui/IconBadge";
import type { Service } from "@/content/services";

interface ServiceCardProps {
  service: Service;
  href?: string;
  headingLevel?: "h2" | "h3";
}

export function ServiceCard({
  service,
  href,
  headingLevel: Heading = "h3",
}: ServiceCardProps) {
  return (
    <article className="card-surface relative flex h-full flex-col p-6 sm:p-7">
      <IconBadge name={service.icon} />
      <Heading className="display-3 mt-5">{service.title}</Heading>
      <p className="mt-3 flex-1 text-[1.0625rem] leading-relaxed text-fog">
        {service.description}
      </p>
      {href ? (
        <Link
          href={href}
          className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold tracking-wide text-gold-bright after:absolute after:inset-0 after:content-[''] hover:text-ivory"
        >
          Learn more
          <span className="sr-only"> about {service.title}</span>
          <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      ) : null}
    </article>
  );
}
