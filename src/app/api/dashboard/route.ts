import { jsonError, jsonOk } from "@/lib/api";
import { guard } from "@/lib/auth";
import { getDashboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    await guard(req, url.searchParams.get("scope") === "analytics" ? "analytics.view" : "dashboard.view");
    return jsonOk(await getDashboard());
  } catch (error) {
    return jsonError(error);
  }
}
