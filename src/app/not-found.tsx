import { getPageBySystem, getSettings } from "@/lib/queries";
import { Blocks } from "@/components/site/content";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  let title = "الصفحة غير موجودة";
  let blocks: Awaited<ReturnType<typeof getPageBySystem>> extends infer T ? T extends { blocks: infer B } ? B : never : never = [];
  try {
    const [page, settings] = await Promise.all([getPageBySystem("not_found"), getSettings()]);
    title = page?.title || title;
    blocks = page?.blocks || [];
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <img src={settings.logoUrl} alt="" className="mx-auto h-24 w-24 object-contain" />
        <h1 className="mt-4 text-3xl font-extrabold">{title}</h1>
        <div className="mt-4 text-right"><Blocks blocks={blocks} /></div>
        <a href="/" className="btn-gold mt-6">العودة للرئيسية</a>
      </div>
    );
  } catch {
    return (
      <div className="px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <a href="/" className="btn-gold mt-6">العودة للرئيسية</a>
      </div>
    );
  }
}
