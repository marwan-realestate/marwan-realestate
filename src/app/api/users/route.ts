import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { rolePermissions, userPermissionOverrides, users } from "@/db/schema";
import { jsonError, jsonOk, readJson } from "@/lib/api";
import { guard } from "@/lib/auth";
import { createUser, deleteUser, saveRolePermissions, updateUser } from "@/lib/mutations";
import { PERMISSIONS } from "@/lib/shared";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await guard(req, "users.manage");
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        active: users.active,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.createdAt));
    const roles = await db.select().from(rolePermissions);
    const overrides = await db.select().from(userPermissionOverrides);
    return jsonOk({
      users: rows.map((row) => ({ ...row, lastLoginAt: row.lastLoginAt?.toISOString() || null, createdAt: row.createdAt.toISOString() })),
      rolePermissions: roles,
      overrides,
      permissions: PERMISSIONS,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await guard(req, "users.manage");
    const body = await readJson<Record<string, unknown>>(req);
    const action = String(body.action || "create");
    if (action === "permissions") {
      await saveRolePermissions(String(body.role || ""), Array.isArray(body.keys) ? body.keys.map(String) : [], user);
      return jsonOk({ ok: true });
    }
    if (action === "update") {
      await updateUser(String(body.id || ""), body, user);
      return jsonOk({ id: body.id });
    }
    if (action === "delete") {
      await deleteUser(String(body.id || ""), user);
      return jsonOk({ id: body.id });
    }
    const id = await createUser(body, user);
    return jsonOk({ id }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
