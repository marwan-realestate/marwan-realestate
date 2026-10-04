import { ApiError, assertSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";
import { changePassword, getSessionUser, getUserPermissions, login, logout } from "@/lib/auth";
import { logActivity } from "@/lib/mutations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return jsonOk({ user: null, permissions: [] });
    const permissions = await getUserPermissions(user);
    return jsonOk({ user, permissions });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await readJson<{ action?: string; identifier?: string; password?: string; currentPassword?: string; nextPassword?: string }>(req);
    if (body.action === "logout") {
      await logout();
      return jsonOk({ ok: true });
    }
    if (body.action === "password") {
      const user = await getSessionUser();
      if (!user) throw new ApiError(401, "يلزم تسجيل الدخول.");
      await changePassword(user.id, body.currentPassword || "", body.nextPassword || "");
      await logActivity(user.id, "password.change", "user", user.id);
      return jsonOk({ ok: true });
    }
    const user = await login(body.identifier || "", body.password || "", req);
    await logActivity(user.id, "login", "user", user.id);
    const permissions = await getUserPermissions(user);
    return jsonOk({ user, permissions });
  } catch (error) {
    return jsonError(error);
  }
}
