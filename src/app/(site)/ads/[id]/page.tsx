import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdPublic } from "@/components/templates/ad-public";
import { getAd } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ad = await getAd(id, true);
  if (!ad) return { title: "بطاقة الإعلان", robots: { index: false } };
  return { title: ad.property.seoTitle || ad.property.title, description: ad.property.seoDescription || ad.property.description.slice(0, 160), robots: { index: false } };
}

export default async function AdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ad = await getAd(id, true);
  if (!ad) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-extrabold">بطاقة إعلان: {ad.property.title}</h1>
      <AdPublic payload={ad} />
    </div>
  );
}
