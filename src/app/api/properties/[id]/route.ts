import { ApiError, jsonError, jsonOk, readJson } from "@/lib/api";
import { guard, requirePermission } from "@/lib/auth";
import { deleteProperty, duplicateProperty, saveProperty } from "@/lib/mutations";
import { getPropertyById } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await guard(req, "properties.view");
    const { id } = await ctx.params;
    const property = await getPropertyById(id);
    if (!property) return jsonOk(null);
    return jsonOk(property);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await guard(req, "properties.edit");
    const { id } = await ctx.params;
    const body = await readJson<Record<string, unknown>>(req);
    const existing = await getPropertyById(id);
    if (!existing) throw new ApiError(404, "العقار غير موجود.");
    const publishChanged = Boolean(body.published) !== existing.published || Boolean(body.featured) !== existing.featured;
    const statusChanged = typeof body.status === "string" && body.status !== existing.status && (body.status === "sold" || body.status === "rented" || body.status === "archived");
    if (publishChanged || statusChanged) await requirePermission(user, "properties.publish");
    await saveProperty({ ...body, published: body.published ?? existing.published, featured: body.featured ?? existing.featured }, user, id);
    return jsonOk({ id });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await guard(req, "properties.create");
    const { id } = await ctx.params;
    const body = await readJson<{ action?: string }>(req);
    if (body.action !== "duplicate") throw new ApiError(400, "إجراء غير معروف.");
    const copyId = await duplicateProperty(id, user);
    return jsonOk({ id: copyId });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await guard(req, "properties.delete");
    const { id } = await ctx.params;
    await deleteProperty(id, user);
    return jsonOk({ id });
  } catch (error) {
    return jsonError(error);
  }
}
