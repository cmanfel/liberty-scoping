import { processSteps } from "@/content/business";

interface ProcessStepsProps {
  detailed?: boolean;
}

export function ProcessSteps({ detailed = false }: ProcessStepsProps) {
  return (
    <ol
      className={`grid gap-5 ${detailed ? "" : "sm:grid-cols-2 lg:grid-cols-4"}`}
    >
      {processSteps.map((step, i) => (
        <li
          key={step.title}
          className={`card-surface relative p-6 sm:p-7 ${detailed ? "md:grid md:grid-cols-[4.5rem_1fr] md:gap-6" : ""}`}
        >
          <span
            aria-hidden="true"
            className="font-serif text-5xl font-semibold lining-nums leading-none text-gold/70"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className={detailed ? "mt-3 md:mt-1" : "mt-4"}>
            <h3 className="display-3">
              <span className="sr-only">Step {i + 1}: </span>
              {step.title}
            </h3>
            <p className="mt-3 text-[1.0625rem] leading-relaxed text-fog">
              {detailed ? step.detail : step.summary}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
