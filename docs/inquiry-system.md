# Contact inquiry system

`POST /api/inquiries` stores a contact-form inquiry in Firestore (the existing Stenofy Firebase project, `stenofy-4e684`), assigns a reference number `LS-YYYY-NNNNNN`, then emails the business and acknowledges the inquirer.

## Flow

1. Validate (email, 5-5000 char message, 16 KB body cap), same-origin check, honeypot + minimum fill time.
2. If the idempotency key was already used: return the existing reference and retry only unsent emails.
3. Rate limit (5 / hour / IP, 3 / hour / email address; Firestore-backed fixed windows).
4. One Firestore transaction: increment `libertyScopingCounters/inquiries-<year>`, create `libertyScopingInquiries/<autoId>`, create `libertyScopingIdempotency/<hash>`.
5. Send both emails (each claimed with a lease so concurrent calls never double-send); record status per email.
6. Respond `{ ok, referenceNumber, duplicate }`. Email failures never fail the request or delete the inquiry.

Reference numbers use the **America/New_York** calendar year (EST in winter, EDT in summer; the new-year rollover is always EST, i.e. UTC-5). `LS-2026-...` therefore ends at 2026-12-31 23:59:59 ET (2027-01-01 04:59:59 UTC) and `LS-2027-000001` is issued from 2027-01-01 00:00:00 ET. Between 19:00 and 24:00 ET on Dec 31 the UTC date is already the next year but references still use the old year. The counter document records `timeZone`.

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

### Transport notes (REST, bundling, contention)

- The client uses the REST transport (`preferRest: true`). `next.config.ts` lists `@google-cloud/firestore`, `google-gax`, `google-auth-library`, `proto3-json-serializer`, `protobufjs` and `long` in `serverExternalPackages`. **Do not remove this**: when bundled, the minifier renames `Long`, `proto3-json-serializer` no longer recognises integers, and every write fails with `toProto3JSON: don't know how to convert value N` (stage `rate_limit`). The `test:e2e` suite reproduces this against the production bundle.
- Transactions go through `runTransactionWithRetry` (`src/lib/inquiries/transactions.ts`): the client's own retry treats REST HTTP 409 like RESOURCE_EXHAUSTED and waits up to a minute, longer than a serverless request. We run each attempt with `maxAttempts: 1` and retry contention ourselves with short jittered backoff (max 8 attempts).
- The two emails of one inquiry are sent sequentially, not concurrently, to avoid claim-transaction contention on the same document.

## Environment variables

Set in Vercel for the **Production** environment only. All are server-only (no `NEXT_PUBLIC_` prefix).

| Name | Value |
| --- | --- |
| `FIREBASE_PROJECT_ID` | `stenofy-4e684` |
| `GCP_PROJECT_NUMBER` | `406362886994` |
| `GCP_WORKLOAD_IDENTITY_POOL_ID` | `liberty-scoping-vercel` |
| `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID` | `vercel` |
| `GCP_SERVICE_ACCOUNT_EMAIL` | `liberty-scoping-inquiries@stenofy-4e684.iam.gserviceaccount.com` |
| `INQUIRY_MAIL_PROVIDER` | `resend` |
| `INQUIRY_MAIL_API_KEY` | Resend API key (sending access only, scoped to libertyscoping.com). Secret. |
| `INQUIRY_FROM_EMAIL` | `contact@libertyscoping.com` |
| `INQUIRY_BUSINESS_EMAIL` | Address that receives inquiries. **Set to a testing mailbox for now; replace this Vercel value with the real business mailbox later (no code change; redeploy after saving).** It is never hardcoded in the repo. |
| `INQUIRY_HASH_SALT` | Long random string (hashing of IPs, idempotency keys, rate-limit subjects) |
| `INQUIRY_RETRY_TOKEN` | Optional random string; enables `POST /api/inquiries/retry` |

`INQUIRY_MAIL_PROVIDER=mock` is for local development only and is refused when `VERCEL_ENV=production`. If the provider or key is missing, inquiries are still stored and given a reference number, and both emails are recorded as `failed` with `mailer_not_configured`; they are sent later by the retry endpoint or a repeat submission. Note: after changing env vars in Vercel, redeploy so they take effect.

## Resend setup

1. Create a Resend account and **add the domain** `libertyscoping.com` (Resend -> Domains). Use the region closest to the Vercel functions.
2. Add the DNS records Resend shows for the domain at the DNS host: the **SPF** record (a TXT, and an MX for the `send` return-path subdomain) and the **DKIM** record (TXT at `resend._domainkey`). Copy the exact names/values from the Resend dashboard; they are account-specific. Wait until the domain shows **Verified**. Optionally add a DMARC TXT (`_dmarc`), e.g. `v=DMARC1; p=none; rua=mailto:<reports address>`.
3. Create an **API key** (Resend -> API Keys) with permission **Sending access** (not Full access) and the **domain restricted to libertyscoping.com**. Store it only in Vercel as `INQUIRY_MAIL_API_KEY`.
4. Set the Vercel env vars above, redeploy, and send one real test inquiry from a mailbox you control. Check the business mail arrives with Reply-To set to the inquirer, the acknowledgment arrives, both show the same reference, and the Firestore statuses are `sent`.

Resend errors are mapped to stored codes (`resend_auth`, `resend_rate_limited`, `resend_server_error`, `resend_rejected`, `resend_timeout`, `resend_network`) and the email is marked `failed` and retryable; visitors never see provider details and still receive their reference number.

## Troubleshooting a generic submit error

Server failures log `[inquiries] failure { stage, name, code, message }` (no request bodies or email addresses) in Vercel runtime logs. `stage` is one of `firestore_client`, `idempotency_lookup`, `rate_limit`, `create_inquiry`, `email_delivery`. Typical causes: missing/incorrect `GCP_*` or `FIREBASE_PROJECT_ID` env vars, OIDC federation not enabled (or no redeploy after enabling), STS `invalid_grant` (issuer/audience/subject mismatch with the provider condition), or the service account lacking `roles/datastore.user`. Google-side evidence: successful token impersonation shows up in Cloud Logging as `iamcredentials.googleapis.com GenerateAccessToken` for the service account.

## Retrying unsent emails

- Re-submitting the same form (same idempotency key) retries only unsent emails.
- `POST /api/inquiries/retry` with `Authorization: Bearer $INQUIRY_RETRY_TOKEN` retries every inquiry older than 5 minutes with an unsent email (max 5 attempts per email). Wire to a Vercel Cron if desired.

## Tests

```bash
npm test                 # unit tests (integration tests skip without the emulator)
npm run test:emulator    # everything, against the local Firestore emulator (needs Java 21+)
npm run test:e2e         # builds, starts the production server (`next start`) and posts inquiries against the emulator over REST
```

Integration tests use the REST transport so they exercise the same serialization as production.

The emulator project is `demo-liberty-scoping`; tests refuse to run against anything but a local emulator host and use only the mock mailer or a mocked `fetch` (no real Resend calls).

## One-time Google Cloud / Vercel setup

Done on 2026-11-04 with `scripts/gcp/setup-workload-identity.sh` (pool `liberty-scoping-vercel`, provider `vercel`, impersonation restricted to `owner:cmanfels-projects:project:liberty-scoping:environment:production`). In Vercel, OIDC federation (Team issuer) must be enabled for the project.
