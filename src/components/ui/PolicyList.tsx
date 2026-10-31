import { Check } from "lucide-react";

export function PolicyList({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid gap-3.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 text-[1.0625rem] leading-relaxed text-fog"
        >
          <Check
            size={20}
            strokeWidth={2}
            aria-hidden="true"
            className="mt-1 shrink-0 text-gold"
          />
          <span className="max-w-[62ch]">{item}</span>
        </li>
      ))}
    </ul>
  );
}
