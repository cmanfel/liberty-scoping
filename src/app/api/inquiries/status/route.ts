import { runtimeDeps } from "@/lib/inquiries/runtime";
import { handleStatusRequest } from "@/lib/inquiries/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export function GET(request: Request): Promise<Response> {
  return handleStatusRequest(request, runtimeDeps);
}
