"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { buttonClasses } from "@/components/ui/ButtonLink";

const MESSAGE_MAX = 5000;

type FieldName = "email" | "message";
type FieldErrors = Partial<Record<FieldName, string>>;

interface Success {
  referenceNumber: string;
}

const inputClasses =
  "mt-2 block w-full rounded-[3px] border border-line bg-ink px-4 py-3 text-base text-ivory placeholder:text-fog/60 transition-colors duration-200 hover:border-gold-muted focus:border-gold-bright aria-[invalid=true]:border-[#d9826b]";

function newIdempotencyKey(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function InquiryForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<Success | null>(null);

  // One key per logical submission: a retry of unchanged content reuses it, so
  // the server can never create a second inquiry for the same attempt. Edited
  // content is a new submission and gets a new key.
  const attempt = useRef<{ key: string; email: string; message: string } | null>(null);
  const openedAt = useRef<number>(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) errors.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      errors.email = "Enter a valid email address.";
    if (!message.trim()) errors.message = "Enter your inquiry.";
    else if (message.length > MESSAGE_MAX)
      errors.message = `Please keep your inquiry under ${MESSAGE_MAX.toLocaleString("en-US")} characters.`;
    return errors;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const errors = validate();
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    submittingRef.current = true;
    setSubmitting(true);
    const trimmedEmail = email.trim();
    if (
      !attempt.current ||
      attempt.current.email !== trimmedEmail ||
      attempt.current.message !== message
    ) {
      attempt.current = { key: newIdempotencyKey(), email: trimmedEmail, message };
    }

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          message,
          website,
          idempotencyKey: attempt.current.key,
          fillMillis: Date.now() - openedAt.current,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        referenceNumber?: string;
        message?: string;
        fieldErrors?: FieldErrors;
      } | null;

      if (response.ok && data?.ok && data.referenceNumber) {
        setSuccess({ referenceNumber: data.referenceNumber });
        return;
      }
      if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
      setFormError(
        data?.message ??
          "We could not submit your inquiry right now. Please try again in a moment or email us directly.",
      );
    } catch {
      setFormError(
        "We could not reach the server. Please check your connection and try again, or email us directly.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        className="card-surface p-7 sm:p-9"
        data-testid="inquiry-success"
      >
        <CheckCircle2
          size={32}
          strokeWidth={1.5}
          aria-hidden="true"
          className="text-gold-bright"
        />
        <h3 className="display-3 mt-5">Inquiry submitted</h3>
        <div aria-hidden="true" className="gold-rule mt-4 w-20" />
        <p className="mt-5 text-lg leading-relaxed text-fog">
          Your inquiry has been submitted successfully. Reference number:{" "}
          <strong className="font-semibold tracking-wide text-gold-bright">
            {success.referenceNumber}
          </strong>
          . A confirmation email will be sent to your address.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-fog">
          Please keep this reference number for future correspondence.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="card-surface p-7 sm:p-9"
      aria-describedby={formError ? "inquiry-form-error" : undefined}
    >
      <div>
        <label htmlFor="inquiry-email" className="text-sm font-semibold tracking-wide text-ivory">
          Your email
        </label>
        <input
          id="inquiry-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? "inquiry-email-error" : undefined}
          placeholder="you@example.com"
          className={inputClasses}
        />
        {fieldErrors.email ? (
          <p id="inquiry-email-error" className="mt-2 text-sm text-[#e8a08c]">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <label htmlFor="inquiry-message" className="text-sm font-semibold tracking-wide text-ivory">
          Your inquiry
        </label>
        <textarea
          id="inquiry-message"
          name="message"
          rows={7}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={
            fieldErrors.message ? "inquiry-message-error" : "inquiry-message-hint"
          }
          placeholder="Tell us about your project: service needed, proceeding type, length, and deadline."
          className={`${inputClasses} resize-y`}
        />
        <div className="mt-2 flex items-start justify-between gap-4 text-sm">
          {fieldErrors.message ? (
            <p id="inquiry-message-error" className="text-[#e8a08c]">
              {fieldErrors.message}
            </p>
          ) : (
            <p id="inquiry-message-hint" className="text-fog">
              Please do not include confidential case files in this message.
            </p>
          )}
          <span
            aria-hidden="true"
            className={`shrink-0 tabular-nums ${message.length > MESSAGE_MAX ? "text-[#e8a08c]" : "text-fog"}`}
          >
            {message.length.toLocaleString("en-US")} / {MESSAGE_MAX.toLocaleString("en-US")}
          </span>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="inquiry-website">Website</label>
        <input
          id="inquiry-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {formError ? (
        <p
          id="inquiry-form-error"
          role="alert"
          className="mt-6 rounded-[3px] border border-[#d9826b]/50 bg-[#d9826b]/10 px-4 py-3 text-sm leading-relaxed text-[#f0b8a8]"
        >
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className={`${buttonClasses("primary", "md", "mt-8 w-full sm:w-auto")} disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {submitting ? (
          <>
            <Loader2 size={18} strokeWidth={1.75} aria-hidden="true" className="animate-spin" />
            Submitting&hellip;
          </>
        ) : (
          <>
            <Send size={18} strokeWidth={1.75} aria-hidden="true" />
            Inquire
          </>
        )}
      </button>
    </form>
  );
}
