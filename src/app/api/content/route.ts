import { jsonError, jsonOk, readJson } from "@/lib/api";
import { guard, requirePermission } from "@/lib/auth";
import { deleteArticle, deleteContent, deletePage, saveArticle, saveContent, savePage } from "@/lib/mutations";
import { listAreas, listArticles, listServices, listTypes } from "@/lib/queries";
import { db } from "@/db";
import { articles, categories, pages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { mediaPath, type PermissionKey } from "@/lib/shared";
import { hydrateBlocks } from "@/lib/queries";

export const dynamic = "force-dynamic";

const viewPerm: Record<string, PermissionKey> = {
  articles: "articles.view",
  pages: "pages.view",
  services: "services.manage",
  areas: "areas.manage",
  types: "properties.view",
  categories: "articles.view",
  meta: "dashboard.view",
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource") || "meta";
    await guard(req, viewPerm[resource] || "dashboard.view");
    if (resource === "meta") {
      const [types, areas, services, cats] = await Promise.all([listTypes(), listAreas(), listServices(), db.select().from(categories)]);
      return jsonOk({ types, areas, services, categories: cats });
    }
    if (resource === "articles") {
      const id = url.searchParams.get("id");
      if (id) {
        const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
        if (!row) return jsonOk(null);
        return jsonOk({ ...row, blocks: await hydrateBlocks(row.blocks), featuredUrl: mediaPath(row.featuredMediaId), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), publishedAt: row.publishedAt?.toISOString() || null });
      }
      return jsonOk(await listArticles());
    }
    if (resource === "pages") {
      const id = url.searchParams.get("id");
      if (id) {
        const [row] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
        if (!row) return jsonOk(null);
        return jsonOk({ ...row, blocks: await hydrateBlocks(row.blocks), featuredUrl: mediaPath(row.featuredMediaId), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
      }
      const rows = await db.select().from(pages).orderBy(pages.sortOrder);
      return jsonOk(rows.map((row) => ({ ...row, featuredUrl: mediaPath(row.featuredMediaId), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })));
    }
    if (resource === "services") return jsonOk(await listServices());
    if (resource === "areas") return jsonOk(await listAreas());
    if (resource === "types") return jsonOk(await listTypes());
    if (resource === "categories") return jsonOk(await db.select().from(categories).orderBy(desc(categories.createdAt)));
    return jsonError(new Error("مورد غير معروف."));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJson<{ resource?: string; action?: string; id?: string; data?: Record<string, unknown> }>(req);
    const resource = body.resource || "";
    const action = body.action || "create";
    const data = body.data || {};
    if (resource === "articles") {
      const permission: PermissionKey = action === "delete" ? "articles.delete" : action === "create" ? "articles.create" : "articles.edit";
      const user = await guard(req, permission);
      if (data.status === "published") await requirePermission(user, "articles.publish");
      if (action === "delete" && body.id) {
        await deleteArticle(body.id, user);
        return jsonOk({ id: body.id });
      }
      const id = await saveArticle(data, user, action === "update" ? body.id : undefined);
      return jsonOk({ id });
    }
    if (resource === "pages") {
      const user = await guard(req, "pages.edit");
      if (action === "delete" && body.id) {
        await deletePage(body.id, user);
        return jsonOk({ id: body.id });
      }
      const id = await savePage(data, user, action === "update" ? body.id : undefined);
      return jsonOk({ id });
    }
    if (resource === "services" || resource === "areas" || resource === "types" || resource === "categories") {
      const permission: PermissionKey = resource === "services" ? "services.manage" : resource === "areas" ? "areas.manage" : resource === "categories" ? "articles.edit" : "properties.edit";
      const user = await guard(req, permission);
      if (action === "delete" && body.id) {
        await deleteContent(resource, body.id, user);
        return jsonOk({ id: body.id });
      }
      const id = await saveContent(resource, data, user, action === "update" ? body.id : undefined);
      return jsonOk({ id });
    }
    return jsonError(new Error("مورد غير معروف."));
  } catch (error) {
    return jsonError(error);
  }
}
