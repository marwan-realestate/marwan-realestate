import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Blocks, EmptyState } from "@/components/site/content";
import { ContactActions, PropertyViewTracker } from "@/components/site/interactive";
import { PropertyCard } from "@/components/site/property-card";
import { getAreaBySlug, getArticleBySlug, getPropertyBySlug, getServiceBySlug, getSettings, listProperties } from "@/lib/queries";
import { formatDate, resolveContacts } from "@/lib/shared";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ section: string; slug: string }> }): Promise<Metadata> {
  const { section, slug } = await params;
  if (section === "properties") {
    const property = await getPropertyBySlug(slug);
    if (!property) return { title: "العقار غير موجود" };
    return { title: property.seoTitle || property.title, description: property.seoDescription || property.description.slice(0, 160), openGraph: { images: property.coverUrl ? [property.coverUrl] : undefined }, alternates: property.canonicalUrl ? { canonical: property.canonicalUrl } : undefined };
  }
  if (section === "blog") {
    const article = await getArticleBySlug(slug);
    if (!article) return { title: "المقال غير موجود" };
    return {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      alternates: { canonical: article.canonicalUrl || `/blog/${article.slug}` },
      openGraph: {
        type: "article",
        title: article.seoTitle || article.title,
        description: article.seoDescription || article.excerpt,
        images: article.featuredUrl ? [article.featuredUrl] : undefined,
        publishedTime: new Date(article.publishedAt || article.createdAt).toISOString(),
      },
    };
  }
  if (section === "areas") {
    const area = await getAreaBySlug(slug);
    return { title: area?.seoTitle || area?.name || "المنطقة", description: area?.seoDescription || area?.description || "" };
  }
  if (section === "services") {
    const service = await getServiceBySlug(slug);
    return { title: service?.seoTitle || service?.title || "الخدمة", description: service?.seoDescription || service?.summary || "" };
  }
  return { title: "غير موجود" };
}

export default async function DetailPage({ params }: { params: Promise<{ section: string; slug: string }> }) {
  const { section, slug } = await params;
  const settings = await getSettings();
  if (section === "properties") {
    const property = await getPropertyBySlug(slug);
    if (!property) notFound();
    const contacts = resolveContacts(settings, property);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: property.title,
      description: property.description || undefined,
      image: property.images.map((image) => image.url),
      address: property.location || property.areaName || undefined,
      ...(property.price != null ? { offers: { "@type": "Offer", price: property.price, priceCurrency: "EGP" } } : {}),
    };
    return (
      <article className="mx-auto max-w-6xl px-4 py-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <PropertyViewTracker id={property.id} />
        <p className="kicker">{property.transactionLabel} · {property.typeName}</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">{property.title}</h1>
        <p className="mt-2 text-[#c5cde0]">{[property.areaName, property.location].filter(Boolean).join(" - ")}</p>
        {property.priceLabel && <p className="mt-4 text-3xl font-extrabold text-[#f0d78c]">{property.priceLabel}</p>}
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {property.images.length === 0 ? <div className="rounded-3xl border border-dashed border-[#d4af37]/30 p-8 text-center text-[#c5cde0] md:col-span-4">لا توجد صور مرفوعة لهذا العقار.</div> : property.images.map((image) => (
            <img key={image.id} src={image.url} alt={image.alt || property.title} className={`h-56 w-full rounded-3xl object-cover ${image.isCover ? "md:col-span-2 md:h-80" : ""}`} />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {property.areaLabel && <span className="badge">{property.areaLabel}</span>}
          {property.bedrooms ? <span className="badge">{property.bedrooms} غرف</span> : null}
          {property.bathrooms ? <span className="badge">{property.bathrooms} حمام</span> : null}
          {property.floor && <span className="badge">الدور {property.floor}</span>}
          {property.finishing && <span className="badge">{property.finishing}</span>}
          {property.elevator && <span className="badge">مصعد</span>}
          {property.balcony && <span className="badge">بلكونة</span>}
          {property.parking && <span className="badge">جراج</span>}
          {property.buildingAge && <span className="badge">عمر المبنى: {property.buildingAge}</span>}
          {property.commercialActivity && <span className="badge">{property.commercialActivity}</span>}
          {property.frontage && <span className="badge">واجهة {property.frontage}</span>}
          {property.streetVisibility && <span className="badge">{property.streetVisibility}</span>}
          {property.referenceCode && <span className="badge">مرجع {property.referenceCode}</span>}
          {property.status !== "available" && <span className="badge">{property.statusLabel}</span>}
        </div>
        {property.description && <p className="mt-6 whitespace-pre-line leading-8 text-[#d7deee]">{property.description}</p>}
        {property.suitableActivities && <p className="mt-4 text-[#d7deee]">أنشطة مناسبة: {property.suitableActivities}</p>}
        {property.features.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {property.features.map((feature) => <span key={feature} className="rounded-full border border-[#d4af37]/30 px-3 py-1 text-sm">{feature}</span>)}
          </div>
        )}
        {property.customSpecs.length > 0 && (
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {property.customSpecs.map((spec) => (
              <div key={`${spec.label}-${spec.value}`} className="rounded-2xl border border-white/10 p-3">
                <dt className="text-sm text-[#f0d78c]">{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {property.mapsUrl && <a className="btn-ghost mt-5" href={property.mapsUrl} target="_blank" rel="noopener noreferrer">الموقع على الخريطة</a>}
        <div className="mt-6"><ContactActions phones={contacts.phones} whatsapps={contacts.whatsapps} propertyId={property.id} message={`استفسار عن ${property.title}`} /></div>
      </article>
    );
  }
  if (section === "blog") {
    const article = await getArticleBySlug(slug);
    if (!article) notFound();
    return (
      <article className="mx-auto max-w-3xl px-4 py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: article.seoTitle || article.title,
              description: article.seoDescription || article.excerpt,
              image: article.featuredUrl ? [article.featuredUrl] : undefined,
              datePublished: new Date(article.publishedAt || article.createdAt).toISOString(),
              dateModified: new Date(article.updatedAt).toISOString(),
              inLanguage: "ar",
              mainEntityOfPage: { "@type": "WebPage", "@id": article.canonicalUrl || `/blog/${article.slug}` },
              author: { "@type": "Organization", name: settings.siteName },
              publisher: { "@type": "Organization", name: settings.siteName, logo: { "@type": "ImageObject", url: settings.logoUrl } },
            }).replace(/</g, "\\u003c"),
          }}
        />
        <p className="kicker">{article.categoryName}</p>
        <h1 className="mt-2 text-4xl font-extrabold">{article.title}</h1>
        <p className="mt-2 text-sm text-[#c5cde0]">{formatDate(article.publishedAt || article.createdAt)}</p>
        {article.featuredUrl && <img src={article.featuredUrl} alt="" className="mt-6 max-h-[460px] w-full rounded-3xl object-cover" />}
        {article.body && <div className="mt-6 whitespace-pre-line leading-8 text-[#d7deee]">{article.body}</div>}
        <div className="mt-6"><Blocks blocks={article.blocks} /></div>
        {article.tags.length > 0 && <p className="mt-6 text-sm text-[#f0d78c]">{article.tags.join(" · ")}</p>}
      </article>
    );
  }
  if (section === "areas") {
    const area = await getAreaBySlug(slug);
    if (!area) notFound();
    const properties = await listProperties({ publishedOnly: true, area: slug });
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-4xl font-extrabold">{area.name}</h1>
        <p className="mt-3 max-w-3xl leading-8 text-[#d7deee]">{area.description}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {properties.length === 0 ? <EmptyState title="لا توجد عقارات منشورة في هذه المنطقة" text="عند نشر عقار وربطه بالمنطقة سيظهر هنا." /> : properties.map((property) => <PropertyCard key={property.id} property={property} settings={settings} />)}
        </div>
      </div>
    );
  }
  if (section === "services") {
    const service = await getServiceBySlug(slug);
    if (!service) notFound();
    return (
      <article className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-4xl font-extrabold">{service.title}</h1>
        <p className="mt-4 leading-8 text-[#d7deee]">{service.body || service.summary}</p>
        {service.imageUrl && <img src={service.imageUrl} alt="" className="mt-6 rounded-3xl" />}
        <a href="/contact" className="btn-gold mt-6">تواصل بخصوص الخدمة</a>
      </article>
    );
  }
  notFound();
}
