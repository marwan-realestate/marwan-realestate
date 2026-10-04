import { assertSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";
import { trackEvent } from "@/lib/mutations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await readJson<{ type?: string; propertyId?: string; adId?: string; path?: string }>(req);
    await trackEvent(body.type || "", body.propertyId, body.adId, body.path);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
