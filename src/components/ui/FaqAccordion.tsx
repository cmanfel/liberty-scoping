import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/content/faq";

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="mx-auto grid max-w-3xl gap-3">
      {items.map((item) => (
        <details
          key={item.id}
          id={item.id}
          className="faq-item group rounded-md border border-line bg-surface/70 transition-colors open:bg-surface"
        >
          <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-md px-5 py-4 text-left font-serif text-xl font-semibold leading-snug text-ivory hover:text-gold-bright sm:px-6 sm:text-[1.375rem]">
            <span>{item.question}</span>
            <ChevronDown
              size={22}
              strokeWidth={1.75}
              aria-hidden="true"
              className="faq-chevron shrink-0 text-gold transition-transform duration-200"
            />
          </summary>
          <div className="px-5 pb-6 text-[1.0625rem] leading-relaxed text-fog sm:px-6">
            <p className="max-w-[62ch]">{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
