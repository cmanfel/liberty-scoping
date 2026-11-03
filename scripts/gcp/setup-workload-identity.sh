#!/usr/bin/env bash
# Creates the Workload Identity Federation pool/provider that lets the Vercel
# project mint short-lived Google credentials for the inquiries service account.
# NOT run automatically. Review, then run with the three required inputs set.
#
#   VERCEL_TEAM_SLUG=my-team VERCEL_PROJECT_NAME=liberty-scoping \
#     VERCEL_OIDC_ISSUER_MODE=team ./scripts/gcp/setup-workload-identity.sh
#
# Set DRY_RUN=1 to print the commands instead of running them.
set -euo pipefail

: "${VERCEL_TEAM_SLUG:?Vercel team slug is required}"
: "${VERCEL_PROJECT_NAME:?Vercel project name is required}"
: "${VERCEL_OIDC_ISSUER_MODE:?Set to 'team' (recommended) or 'global'}"

GCP_PROJECT_ID="${GCP_PROJECT_ID:-stenofy-4e684}"
POOL_ID="${POOL_ID:-liberty-scoping-vercel}"
PROVIDER_ID="${PROVIDER_ID:-vercel}"
SA_EMAIL="${SA_EMAIL:-liberty-scoping-inquiries@${GCP_PROJECT_ID}.iam.gserviceaccount.com}"
VERCEL_ENVIRONMENT="${VERCEL_ENVIRONMENT:-production}"

case "$VERCEL_OIDC_ISSUER_MODE" in
  team)   ISSUER="https://oidc.vercel.com/${VERCEL_TEAM_SLUG}"; AUDIENCE="https://vercel.com/${VERCEL_TEAM_SLUG}" ;;
  global) ISSUER="https://oidc.vercel.com"; AUDIENCE="https://vercel.com" ;;
  *) echo "VERCEL_OIDC_ISSUER_MODE must be 'team' or 'global'" >&2; exit 1 ;;
esac

SUBJECT="owner:${VERCEL_TEAM_SLUG}:project:${VERCEL_PROJECT_NAME}:environment:${VERCEL_ENVIRONMENT}"
run() { if [[ "${DRY_RUN:-0}" == "1" ]]; then echo "+ $*"; else "$@"; fi; }

PROJECT_NUMBER="$(gcloud projects describe "$GCP_PROJECT_ID" --format='value(projectNumber)')"

# 1. The STS API must be enabled on the project that owns the pool.
run gcloud services enable sts.googleapis.com --project "$GCP_PROJECT_ID"

# 2. Pool.
run gcloud iam workload-identity-pools create "$POOL_ID" \
  --project "$GCP_PROJECT_ID" --location global \
  --display-name "Liberty Scoping (Vercel)" \
  --description "Vercel OIDC for the libertyscoping.com inquiry form"

# 3. OIDC provider, restricted to exactly one Vercel project + environment.
run gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
  --project "$GCP_PROJECT_ID" --location global --workload-identity-pool "$POOL_ID" \
  --issuer-uri "$ISSUER" \
  --allowed-audiences "$AUDIENCE" \
  --attribute-mapping "google.subject=assertion.sub,attribute.project=assertion.project,attribute.environment=assertion.environment" \
  --attribute-condition "assertion.sub == '${SUBJECT}'"

# 4. Let only that subject impersonate the inquiries service account.
run gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project "$GCP_PROJECT_ID" \
  --role roles/iam.workloadIdentityUser \
  --member "principal://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/subject/${SUBJECT}"

echo
echo "Vercel env vars:"
echo "  FIREBASE_PROJECT_ID=${GCP_PROJECT_ID}"
echo "  GCP_PROJECT_NUMBER=${PROJECT_NUMBER}"
echo "  GCP_WORKLOAD_IDENTITY_POOL_ID=${POOL_ID}"
echo "  GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID=${PROVIDER_ID}"
echo "  GCP_SERVICE_ACCOUNT_EMAIL=${SA_EMAIL}"
