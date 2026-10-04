import { jsonError, jsonOk, readJson } from "@/lib/api";
import { guard, requirePermission } from "@/lib/auth";
import { deleteAd, saveAd } from "@/lib/mutations";
import { getAd } from "@/lib/queries";
import { db } from "@/db";
import { adCards } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await guard(req, "templates.manage");
    const { id } = await ctx.params;
    return jsonOk(await getAd(id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await guard(req, "templates.manage");
    const { id } = await ctx.params;
    const body = await readJson<Record<string, unknown>>(req);
    const [existing] = await db.select({ published: adCards.published }).from(adCards).where(eq(adCards.id, id)).limit(1);
    if (existing && Boolean(body.published) !== existing.published) await requirePermission(user, "templates.publish");
    await saveAd(body, user, id);
    return jsonOk({ id });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await guard(req, "templates.manage");
    const { id } = await ctx.params;
    await deleteAd(id, user);
    return jsonOk({ id });
  } catch (error) {
    return jsonError(error);
  }
}
