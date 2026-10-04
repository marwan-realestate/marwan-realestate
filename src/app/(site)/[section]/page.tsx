import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Blocks, EmptyState, PageIntro } from "@/components/site/content";
import { ContactActions, LeadForm } from "@/components/site/interactive";
import { PropertyCard } from "@/components/site/property-card";
import { getPageBySystem, getSettings, listAreas, listArticles, listProperties, listServices, listTypes } from "@/lib/queries";
import { resolveContacts, safeHref } from "@/lib/shared";

export const dynamic = "force-dynamic";

const keys: Record<string, string> = {
  about: "about",
  services: "services",
  properties: "properties",
  areas: "areas",
  request: "request",
  "add-property": "list",
  blog: "blog",
  faq: "faq",
  contact: "contact",
  privacy: "privacy",
  terms: "terms",
};

export async function generateMetadata({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const { section } = await params;
  const sp = await searchParams;
  const page = keys[section] ? await getPageBySystem(keys[section]) : null;
  const settings = await getSettings();
  const title = page?.seoTitle || page?.title || settings.siteName;
  const description = page?.seoDescription || settings.seoDescription;
  if (section === "properties" && sp.type) return { title: `عقارات ${String(sp.type)}`, description };
  return { title, description, alternates: page?.canonicalUrl ? { canonical: page.canonicalUrl } : undefined };
}

export default async function SectionPage({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { section } = await params;
  const sp = await searchParams;
  if (!keys[section]) notFound();
  const page = await getPageBySystem(keys[section]);
  if (page && !page.published && !["about", "privacy", "terms"].includes(section)) {
    /* still allow core tools if unpublished intro; content blocks hidden */
  }
  const settings = await getSettings();
  const showBlocks = page?.published ? page.blocks : [];
  if (section === "about" || section === "privacy" || section === "terms" || section === "faq") {
    if (page && !page.published) notFound();
    return <PageIntro title={page?.title || ""} blocks={showBlocks} image={page?.featuredUrl} />;
  }
  if (section === "services") {
    const services = await listServices(true);
    return (
      <div>
        <PageIntro title={page?.title || "خدماتنا"} blocks={showBlocks} />
        <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-14 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <a key={service.id} href={`/services/${service.slug}`} className="panel rounded-3xl p-5">
              <h2 className="text-xl font-extrabold text-[#f0d78c]">{service.title}</h2>
              <p className="mt-2 leading-7 text-[#d7deee]">{service.summary}</p>
            </a>
          ))}
        </div>
      </div>
    );
  }
  if (section === "areas") {
    const areas = await listAreas(true);
    return (
      <div>
        <PageIntro title={page?.title || "مناطق الخدمة"} blocks={showBlocks} />
        <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-14 md:grid-cols-2">
          {areas.length === 0 ? <EmptyState title="لا توجد مناطق مفعّلة" text="يمكن تفعيل مناطق الخدمة من لوحة التحكم." /> : areas.map((area) => (
            <a key={area.id} href={`/areas/${area.slug}`} className="rounded-3xl border border-[#d4af37]/30 p-5">
              <h2 className="text-2xl font-extrabold text-[#f0d78c]">{area.name}</h2>
              <p className="mt-2 leading-8 text-[#d7deee]">{area.description}</p>
            </a>
          ))}
        </div>
      </div>
    );
  }
  if (section === "properties") {
    const type = typeof sp.type === "string" ? sp.type : undefined;
    const transaction = typeof sp.transaction === "string" ? sp.transaction : undefined;
    const area = typeof sp.area === "string" ? sp.area : undefined;
    const q = typeof sp.q === "string" ? sp.q : undefined;
    const [properties, types, areas] = await Promise.all([
      listProperties({ publishedOnly: true, type, transaction, area, q }),
      listTypes(true),
      listAreas(true),
    ]);
    return (
      <div>
        <PageIntro title={page?.title || "العقارات"} blocks={showBlocks} />
        <form className="mx-auto grid max-w-7xl gap-3 px-4 pb-6 md:grid-cols-5">
          <input className="field" name="q" defaultValue={q} placeholder="بحث" />
          <select className="select" name="type" defaultValue={type || ""}>
            <option value="">كل الأنواع</option>
            {types.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
          <select className="select" name="transaction" defaultValue={transaction || ""}>
            <option value="">كل العمليات</option>
            <option value="sale">للبيع</option>
            <option value="rent">للإيجار</option>
            <option value="wanted_buy">مطلوب للشراء</option>
            <option value="wanted_rent">مطلوب للإيجار</option>
          </select>
          <select className="select" name="area" defaultValue={area || ""}>
            <option value="">كل المناطق</option>
            {areas.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
          <button className="btn-gold">تصفية</button>
        </form>
        <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-14 md:grid-cols-2 xl:grid-cols-3">
          {properties.length === 0 ? <EmptyState title="لا توجد عقارات مطابقة" text="لم يتم نشر عقارات ضمن هذا التصفية بعد." /> : properties.map((property) => <PropertyCard key={property.id} property={property} settings={settings} />)}
        </div>
      </div>
    );
  }
  if (section === "blog") {
    const articles = await listArticles({ publishedOnly: true });
    return (
      <div>
        <PageIntro title={page?.title || "المدونة"} blocks={showBlocks} />
        <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-14 md:grid-cols-3">
          {articles.length === 0 ? <EmptyState title="لا توجد مقالات منشورة" text="المسودات لا تظهر للزوار." /> : articles.map((article) => (
            <a key={article.id} href={`/blog/${article.slug}`} className="overflow-hidden rounded-3xl border border-[#d4af37]/25 bg-[#0c1730]">
              {article.featuredUrl && <img src={article.featuredUrl} alt="" className="h-44 w-full object-cover" />}
              <div className="p-4">
                <h2 className="text-xl font-extrabold">{article.title}</h2>
                {article.excerpt && <p className="mt-2 text-sm leading-7 text-[#c5cde0]">{article.excerpt}</p>}
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }
  if (section === "request" || section === "add-property") {
    const [types, areas] = await Promise.all([listTypes(true), listAreas(true)]);
    return (
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <PageIntro title={page?.title || (section === "request" ? "اطلب عقارك" : "أضف عقارك")} blocks={showBlocks} />
          <ContactActions phones={resolveContacts(settings).phones} whatsapps={settings.whatsappNumbers} />
        </div>
        <LeadForm kind={section === "request" ? "request_property" : "add_property"} types={types} areas={areas} submitLabel={section === "request" ? "إرسال طلب العقار" : "إرسال بيانات العقار"} />
      </div>
    );
  }
  const areas = await listAreas(true);
  const contacts = resolveContacts(settings);
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-2">
      <div>
        <PageIntro title={page?.title || "اتصل بنا"} blocks={showBlocks} />
        <ContactActions phones={contacts.phones} whatsapps={contacts.whatsapps} />
        <div className="mt-6 grid gap-2 text-[#d7deee]">
          {settings.email && <p>البريد الإلكتروني: <a href={`mailto:${settings.email}`} className="text-[#f0d78c]" dir="ltr">{settings.email}</a></p>}
          {settings.website && <p>الموقع الإلكتروني: <a href={safeHref(settings.website)} target="_blank" rel="noopener noreferrer" className="text-[#f0d78c]" dir="ltr">{settings.website}</a></p>}
          {settings.workingHours && <p>ساعات العمل: {settings.workingHours}</p>}
          {settings.addressNote && <p>{settings.addressNote}</p>}
          <p>مناطق الخدمة: {areas.map((area) => area.name).join("، ") || "غير محددة"}</p>
        </div>
      </div>
      <LeadForm kind="contact" types={[]} areas={areas} submitLabel="إرسال الرسالة" />
    </div>
  );
}
