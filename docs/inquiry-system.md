# Contact inquiry system

`POST /api/inquiries` stores a contact-form inquiry in Firestore (the existing Stenofy Firebase project, `stenofy-4e684`), assigns a reference number `LS-YYYY-NNNNNN`, then emails the business and acknowledges the inquirer.

## Flow

1. Validate (email, 5-5000 char message, 16 KB body cap), same-origin check, honeypot + minimum fill time.
2. If the idempotency key was already used: return the existing reference and retry only unsent emails.
3. Rate limit (5 / hour / IP, 3 / hour / email address; Firestore-backed fixed windows).
4. One Firestore transaction: increment `libertyScopingCounters/inquiries-<year>`, create `libertyScopingInquiries/<autoId>`, create `libertyScopingIdempotency/<hash>`.
5. Send both emails (each claimed with a lease so concurrent calls never double-send); record status per email.
6. Respond `{ ok, referenceNumber, duplicate }`. Email failures never fail the request or delete the inquiry.

Reference numbers use the **UTC** calendar year.

## Firestore structure (all new top-level collections; nothing under `users/`)

| Path | Purpose |
| --- | --- |
| `libertyScopingInquiries/{autoId}` | The inquiry: `referenceNumber`, `referenceYear`, `referenceSequence`, `email`, `message` (original text), `status` (`new`), `source`, `createdAt`, `updatedAt`, per-email fields `businessEmail*` / `confirmationEmail*` (`Status` = `pending/sending/sent/failed`, `Attempts`, `LastAttemptAt`, `SentAt`, `LastError`, `ProviderMessageId`), `idempotencyKeyHash`, `contentHash`, `clientIpHash` (salted hash), `userAgent`. |
| `libertyScopingCounters/inquiries-{year}` | `{ year, lastSequence, updatedAt }`. |
| `libertyScopingIdempotency/{hash}` | `{ inquiryId, referenceNumber, contentHash, createdAt }`. |
| `libertyScopingRateLimits/{scope-hash-window}` | `{ scope, count, windowStart, expireAt, updatedAt }`. Optional: add a Firestore TTL policy on `expireAt` to auto-delete (not required). |

No rules or index changes are needed: `firestore.rules` in Stenofy already denies every path except `users/**` to clients, the server uses IAM, and all queries are single-field.

## Authentication (no stored key)

Vercel OIDC token -> Google STS (Workload Identity Federation) -> impersonates `liberty-scoping-inquiries@stenofy-4e684.iam.gserviceaccount.com`, which has only `roles/datastore.user`. See `src/lib/inquiries/firestore.ts`. With `FIRESTORE_EMULATOR_HOST` set (local/tests) it talks to the emulator only.

## Environment variables

| Name | Value |
| --- | --- |
| `FIREBASE_PROJECT_ID` | `stenofy-4e684` |
| `GCP_PROJECT_NUMBER` | `406362886994` |
| `GCP_WORKLOAD_IDENTITY_POOL_ID` | `liberty-scoping-vercel` |
| `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID` | `vercel` |
| `GCP_SERVICE_ACCOUNT_EMAIL` | `liberty-scoping-inquiries@stenofy-4e684.iam.gserviceaccount.com` |
| `INQUIRY_BUSINESS_EMAIL` | address that receives inquiries (not hardcoded) |
| `INQUIRY_FROM_EMAIL` | `contact@libertyscoping.com` |
| `INQUIRY_MAIL_PROVIDER` | unset until a provider adapter exists; `mock` is for local use only and is refused when `VERCEL_ENV=production` |
| `INQUIRY_HASH_SALT` | long random string |
| `INQUIRY_RETRY_TOKEN` | optional; enables `POST /api/inquiries/retry` |
| provider API key | name decided with the provider (proposed `INQUIRY_MAIL_API_KEY`) |

All are server-only (no `NEXT_PUBLIC_` prefix). Until the mail provider is configured, inquiries are still stored and returned a reference number, and both emails are recorded as `failed` with `mailer_not_configured`; they are sent later by the retry endpoint or a repeat submission.

## Email provider

`src/lib/inquiries/mailer.ts` defines `Mailer.send({from,to,replyTo,subject,text,html}) -> {providerMessageId}`. To add a provider (an HTTP API), implement that interface in a new file and return it from `getMailer()` for its `INQUIRY_MAIL_PROVIDER` name. Throw `MailerError(message, code)` on failure. Nothing else changes.

## Retrying unsent emails

- Re-submitting the same form (same idempotency key) retries only unsent emails.
- `POST /api/inquiries/retry` with `Authorization: Bearer $INQUIRY_RETRY_TOKEN` retries every inquiry older than 5 minutes with an unsent email (max 5 attempts per email). Wire to a Vercel Cron if desired.

## Tests

```bash
npm test                 # unit tests (integration tests skip without the emulator)
npm run test:emulator    # everything, against the local Firestore emulator (needs Java 21+)
```

The emulator project is `demo-liberty-scoping`; tests refuse to run against anything but a local emulator host and use only the mock mailer.

## One-time Google Cloud / Vercel setup

See `scripts/gcp/setup-workload-identity.sh` (creates the pool, provider, and impersonation binding) and the checklist in the pull request.
