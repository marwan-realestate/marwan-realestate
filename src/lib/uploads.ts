import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { del, get, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { media } from "@/db/schema";
import { ApiError } from "@/lib/api";

const uploadDir = path.join(process.cwd(), "data", "uploads");

function blobToken() {
  return (process.env.BLOB_READ_WRITE_TOKEN || "").trim();
}

export function uploadPath(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ApiError(400, "معرّف ملف غير صالح.");
  return path.join(uploadDir, `${id}.webp`);
}

async function persistBuffer(id: string, output: Buffer) {
  if (blobToken()) {
    await put(id, output, { access: "public", contentType: "image/webp" });
    return;
  }
  await mkdir(uploadDir, { recursive: true });
  await writeFile(uploadPath(id), output);
}

export async function fetchUpload(id: string): Promise<Buffer | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (blobToken()) {
    try {
      const res = await get(id, { access: "public", token: blobToken() });
      if (!res || !res.stream) return null;
      const reader = res.stream.getReader();
      const chunks: Buffer[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(Buffer.from(value));
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }
  try {
    return await (await import("fs/promises")).readFile(uploadPath(id));
  } catch {
    return null;
  }
}

export async function storeImage(file: File, folder: string, replaceId?: string) {
  if (!file || !file.size) throw new ApiError(400, "اختر صورة.");
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") throw new ApiError(400, "يُسمح بصور JPG أو PNG أو WEBP فقط.");
  if (file.size > 8 * 1024 * 1024) throw new ApiError(400, "الحد الأقصى للصورة 8 ميغابايت.");
  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  let width: number | null = null;
  let height: number | null = null;
  try {
    const image = sharp(input).rotate();
    const meta = await image.metadata();
    width = meta.width || null;
    height = meta.height || null;
    output = await image.resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch {
    throw new ApiError(400, "تعذر معالجة الصورة.");
  }
  const id = replaceId || crypto.randomUUID();
  await persistBuffer(id, output);
  if (replaceId) {
    await db
      .update(media)
      .set({ originalName: file.name.slice(0, 180), mime: "image/webp", size: output.length, width, height, updatedAt: new Date() })
      .where(eq(media.id, replaceId));
    return replaceId;
  }
  await db.insert(media).values({
    id,
    filename: `${id}.webp`,
    originalName: file.name.slice(0, 180),
    mime: "image/webp",
    size: output.length,
    width,
    height,
    alt: "",
    folder: folder || "general",
  });
  return id;
}

export async function removeUpload(id: string) {
  await db.delete(media).where(eq(media.id, id));
  if (blobToken()) {
    await del(id, { token: blobToken() }).catch(() => undefined);
    return;
  }
  await unlink(uploadPath(id)).catch(() => undefined);
}
