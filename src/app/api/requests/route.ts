import { assertSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";
import { guard } from "@/lib/auth";
import { createRequest } from "@/lib/mutations";
import { listRequests } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await guard(req, "requests.view");
    const url = new URL(req.url);
    const data = await listRequests(url.searchParams.get("status") || undefined, url.searchParams.get("kind") || undefined);
    return jsonOk(data);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await readJson<Record<string, unknown>>(req);
    const result = await createRequest(body);
    return jsonOk(result, 201);
  } catch (error) {
    return jsonError(error);
  }
}
