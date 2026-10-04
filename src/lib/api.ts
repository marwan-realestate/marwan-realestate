export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function jsonOk(data: unknown, status = 200) {
  return Response.json({ ok: true, data }, { status });
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ ok: false, error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ ok: false, error: "حدث خطأ غير متوقع. حاول مرة أخرى." }, { status: 500 });
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "تعذر قراءة البيانات المرسلة.");
  }
}

export function assertSameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "same-site" && site !== "none") {
    throw new ApiError(403, "مصدر الطلب غير مسموح.");
  }
}

export function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function asBool(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

export function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(number)) return null;
  return number;
}

export function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}
