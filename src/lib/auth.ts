import { cookies } from "next/headers";
import { and, eq, gt, or, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { ApiError, assertSameOrigin } from "@/lib/api";
import { hashPassword, newToken, sha256, verifyPassword } from "@/lib/password";
import { ensureSeed } from "@/lib/seed";
import { PERMISSIONS, ROLE_LABELS, type PermissionKey, type Role, type SessionUser } from "@/lib/shared";

export const SESSION_COOKIE = "mm_session";
const SESSION_DAYS = 14;

export function sessionCookieOptions(req?: Request) {
  const proto = req?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: proto === "https",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  };
}

function toSessionUser(row: { id: string; name: string; email: string; phone: string | null; role: string }): SessionUser {
  const role = (row.role in ROLE_LABELS ? row.role : "employee") as Role;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role,
    roleLabel: ROLE_LABELS[role],
  };
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  await ensureSeed();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      active: users.active,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date()), eq(users.active, true)))
    .limit(1);
  if (!row) return null;
  return toSessionUser(row);
});

export async function getUserPermissions(user: SessionUser): Promise<PermissionKey[]> {
  if (user.role === "owner") return PERMISSIONS.map((item) => item.key);
  const result = await db.execute<{ key: string }>(sql`
    select p.key as key
    from permissions p
    where app_can(${user.id}::uuid, p.key)
  `);
  const rows = Array.isArray(result) ? result : result.rows || [];
  return rows.map((row) => row.key).filter((key): key is PermissionKey => PERMISSIONS.some((item) => item.key === key));
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "يلزم تسجيل الدخول.");
  return user;
}

export async function guard(req: Request, permission?: PermissionKey) {
  assertSameOrigin(req);
  const user = await requireUser();
  if (permission) await requirePermission(user, permission);
  return user;
}

export async function requirePermission(user: SessionUser, permission: PermissionKey) {
  const result = await db.execute<{ ok: boolean }>(sql`select app_can(${user.id}::uuid, ${permission}) as ok`);
  const rows = Array.isArray(result) ? result : result.rows || [];
  const ok = Boolean(rows[0]?.ok);
  if (!ok) throw new ApiError(403, "ليست لديك صلاحية لهذا الإجراء.");
}

export async function login(identifier: string, password: string, req?: Request) {
  await ensureSeed();
  const value = identifier.trim().toLowerCase();
  const phone = identifier.replace(/\s/g, "");
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, value), eq(users.phone, phone)))
    .limit(1);
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    throw new ApiError(401, "بيانات الدخول غير صحيحة.");
  }
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ userId: user.id, tokenHash: sha256(token), expiresAt });
  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions(req));
  return toSessionUser(user);
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  }
  jar.delete(SESSION_COOKIE);
}

export async function changePassword(userId: string, currentPassword: string, nextPassword: string) {
  if (nextPassword.trim().length < 8) throw new ApiError(400, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.");
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    throw new ApiError(400, "كلمة المرور الحالية غير صحيحة.");
  }
  await db.update(users).set({ passwordHash: hashPassword(nextPassword), updatedAt: new Date() }).where(eq(users.id, userId));
}
