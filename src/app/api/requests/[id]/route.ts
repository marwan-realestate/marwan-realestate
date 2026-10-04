import { jsonError, jsonOk, readJson } from "@/lib/api";
import { guard } from "@/lib/auth";
import { deleteRequest, updateRequest } from "@/lib/mutations";
import { getRequest } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await guard(req, "requests.view");
    const { id } = await ctx.params;
    return jsonOk(await getRequest(id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await guard(req, "requests.edit");
    const { id } = await ctx.params;
    await updateRequest(id, await readJson(req), user);
    return jsonOk({ id });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await guard(req, "requests.delete");
    const { id } = await ctx.params;
    await deleteRequest(id, user);
    return jsonOk({ id });
  } catch (error) {
    return jsonError(error);
  }
}
