import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/site/content";
import { getPageBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page || page.isSystem) return { title: "صفحة" };
  return { title: page.seoTitle || page.title, description: page.seoDescription || page.excerpt, openGraph: { images: page.featuredUrl ? [page.featuredUrl] : undefined } };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page || page.isSystem) notFound();
  return <PageIntro title={page.title} excerpt={page.excerpt} blocks={page.blocks} image={page.featuredUrl} />;
}
