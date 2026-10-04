import { jsonError, jsonOk, readJson } from "@/lib/api";
import { guard, requirePermission } from "@/lib/auth";
import { saveAd } from "@/lib/mutations";
import { buildAdPayload, listAds } from "@/lib/queries";
import { getPropertyById } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await guard(req, "templates.manage");
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("propertyId");
    const template = url.searchParams.get("template") || "property";
    if (propertyId) {
      const property = await getPropertyById(propertyId);
      if (!property) return jsonOk(null);
      return jsonOk(await buildAdPayload(property, template));
    }
    return jsonOk(await listAds());
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await guard(req, "templates.manage");
    const body = await readJson<Record<string, unknown>>(req);
    if (body.published) await requirePermission(user, "templates.publish");
    const id = await saveAd(body, user);
    return jsonOk({ id }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
