import { jsonError, jsonOk, readJson } from "@/lib/api";
import { guard, requirePermission } from "@/lib/auth";
import { saveProperty } from "@/lib/mutations";
import { listProperties } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await guard(req, "properties.view");
    const url = new URL(req.url);
    const data = await listProperties({
      q: url.searchParams.get("q") || undefined,
      type: url.searchParams.get("type") || undefined,
      transaction: url.searchParams.get("transaction") || undefined,
      area: url.searchParams.get("area") || undefined,
      status: url.searchParams.get("status") || undefined,
    });
    return jsonOk({ properties: data, user });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await guard(req, "properties.create");
    const body = await readJson<Record<string, unknown>>(req);
    if (body.published || body.featured) await requirePermission(user, "properties.publish");
    const id = await saveProperty(body, user);
    return jsonOk({ id }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
