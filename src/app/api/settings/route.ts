import { eq } from "drizzle-orm";
import { db } from "@/db";
import { websiteSettings } from "@/db/schema";
import { jsonError, jsonOk, readJson } from "@/lib/api";
import { guard } from "@/lib/auth";
import { updateSeo, updateSettings } from "@/lib/mutations";
import { getSettings } from "@/lib/queries";
import { mediaPath } from "@/lib/shared";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("scope") === "seo") await guard(req, "seo.manage");
    else await guard(req, "settings.manage");
    const [row] = await db.select().from(websiteSettings).where(eq(websiteSettings.id, 1)).limit(1);
    const publicSettings = await getSettings();
    return jsonOk({
      ...row,
      logoUrl: mediaPath(row?.logoMediaId, publicSettings.logoUrl),
      faviconUrl: mediaPath(row?.faviconMediaId, publicSettings.faviconUrl),
      coverUrl: mediaPath(row?.coverMediaId, publicSettings.coverUrl),
      personalPhotoUrl: mediaPath(row?.personalPhotoMediaId, ""),
      ogImageUrl: mediaPath(row?.ogImageMediaId, publicSettings.ogImageUrl),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await readJson<Record<string, unknown>>(req);
    if (body.action === "seo") {
      const user = await guard(req, "seo.manage");
      await updateSeo(body, user);
      return jsonOk({ ok: true });
    }
    const user = await guard(req, "settings.manage");
    await updateSettings(body, user);
    return jsonOk(await getSettings());
  } catch (error) {
    return jsonError(error);
  }
}
