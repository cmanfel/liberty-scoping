import { handleInquiryRequest } from "@/lib/inquiries/http";
import { runtimeDeps } from "@/lib/inquiries/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export function POST(request: Request): Promise<Response> {
  return handleInquiryRequest(request, runtimeDeps);
}
