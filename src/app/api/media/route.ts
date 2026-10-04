import { jsonError, jsonOk } from "@/lib/api";
import { guard } from "@/lib/auth";
import { listMedia } from "@/lib/queries";
import { storeImage } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await guard(req, "media.manage");
    const url = new URL(req.url);
    return jsonOk(await listMedia(url.searchParams.get("folder") || undefined));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    await guard(req, "media.manage");
    const form = await req.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "general");
    if (!(file instanceof File)) return jsonError(new Error("لم يتم إرفاق صورة."));
    const id = await storeImage(file, folder);
    return jsonOk({ id, url: `/api/files/${id}` }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
