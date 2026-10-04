import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/site/content";
import { AnalyticsScripts, FloatContact, Header } from "@/components/site/interactive";
import { getSettings, listAreas, listCustomNav } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(settings.canonicalBase || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: { default: settings.seoTitle || settings.siteName, template: `%s | ${settings.siteName}` },
    description: settings.seoDescription || settings.tagline,
    icons: { icon: settings.faviconUrl },
    other: settings.gscVerification ? { "google-site-verification": settings.gscVerification } : undefined,
    openGraph: {
      title: settings.seoTitle || settings.siteName,
      description: settings.seoDescription || settings.tagline,
      images: settings.ogImageUrl ? [settings.ogImageUrl] : undefined,
      locale: "ar_EG",
    },
  };
}

const primary = [
  { href: "/", label: "الرئيسية" },
  { href: "/about", label: "من نحن" },
  { href: "/services", label: "خدماتنا" },
  { href: "/properties", label: "العقارات" },
  { href: "/areas", label: "مناطق الخدمة" },
  { href: "/request", label: "اطلب عقارك" },
  { href: "/add-property", label: "أضف عقارك" },
  { href: "/blog", label: "المدونة" },
  { href: "/contact", label: "اتصل بنا" },
];

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, areas, custom] = await Promise.all([getSettings(), listAreas(true), listCustomNav()]);
  const links = [...primary, ...custom.map((page) => ({ href: `/p/${page.slug}`, label: page.navLabel || page.title }))];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: settings.siteName,
    description: settings.seoDescription || settings.aboutShort,
    telephone: settings.phones.map((item) => item.number).filter(Boolean),
    areaServed: areas.map((area) => area.name),
    image: settings.logoUrl,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Header settings={settings} links={links} />
      <main>{children}</main>
      <Footer settings={settings} areas={areas.map((area) => area.name)} />
      <FloatContact phones={settings.phones} whatsapps={settings.whatsappNumbers} />
      <AnalyticsScripts gaId={settings.gaId} pixelId={settings.pixelId} />
    </>
  );
}
