import { eq } from "drizzle-orm";
import { db } from "@/db";
import { media } from "@/db/schema";
import { jsonError, jsonOk, readJson } from "@/lib/api";
import { guard } from "@/lib/auth";
import { removeUpload, storeImage } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await guard(req, "media.manage");
    const { id } = await ctx.params;
    const body = await readJson<{ alt?: string; folder?: string }>(req);
    await db
      .update(media)
      .set({
        ...(body.alt != null ? { alt: String(body.alt).slice(0, 180) } : {}),
        ...(body.folder != null ? { folder: String(body.folder).slice(0, 40) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(media.id, id));
    return jsonOk({ id });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await guard(req, "media.manage");
    const { id } = await ctx.params;
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError(new Error("لم يتم إرفاق صورة."));
    await storeImage(file, "general", id);
    return jsonOk({ id, url: `/api/files/${id}?v=${Date.now()}` });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await guard(req, "media.manage");
    const { id } = await ctx.params;
    await removeUpload(id);
    return jsonOk({ id });
  } catch (error) {
    return jsonError(error);
  }
}
