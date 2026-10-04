import { Blocks } from "@/components/site/content";
import { ContactActions } from "@/components/site/interactive";
import { PropertyCard } from "@/components/site/property-card";
import { EmptyState } from "@/components/site/content";
import { getPageBySystem, getSettings, listAreas, listArticles, listProperties, listServices, listTypes } from "@/lib/queries";
import { resolveContacts } from "@/lib/shared";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, services, properties, areas, types, articles, home] = await Promise.all([
    getSettings(),
    listServices(true),
    listProperties({ publishedOnly: true, featured: true, limit: 6 }),
    listAreas(true),
    listTypes(true),
    listArticles({ publishedOnly: true, limit: 3 }),
    getPageBySystem("home"),
  ]);
  const featured = properties.length ? properties : await listProperties({ publishedOnly: true, limit: 6 });
  const contacts = resolveContacts(settings);
  const highlights = services.slice(0, 4);
  return (
    <div>
      <section className="relative overflow-hidden bg-[#07111f]">
        <div className="mx-auto grid max-w-[1400px] lg:min-h-[680px] lg:grid-cols-[1.15fr_0.85fr]" dir="ltr">
          <div dir="rtl" className="relative z-10 flex flex-col justify-center px-5 py-12 md:px-12">
            <div className="flex items-center gap-4">
              <img src={settings.logoUrl} alt="" className="h-24 w-24 object-contain drop-shadow-[0_12px_24px_rgba(212,175,55,0.35)] md:h-28 md:w-28" />
              <div>
                <p className="text-sm font-bold text-[#f0d78c] md:text-base">{settings.siteName}</p>
                <p className="text-sm text-[#c5cde0]">{settings.tagline}</p>
              </div>
            </div>
            <h1 className="gold-text mt-6 text-5xl font-extrabold leading-tight md:text-7xl">{settings.heroTitle}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-2xl font-bold md:text-4xl">
              <span className="h-px w-10 bg-[#d4af37]" />
              <span>{settings.heroSubtitle}</span>
              <span className="h-px w-10 bg-[#d4af37]" />
            </div>
            {settings.heroMotto && <p className="mt-3 text-lg text-[#f0d78c]">{settings.heroMotto}</p>}
            {highlights.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {highlights.map((service) => (
                  <a key={service.id} href={`/services/${service.slug}`} className="text-center">
                    <span className="mx-auto mb-2 block h-px w-8 bg-[#d4af37]" />
                    <span className="text-sm font-bold text-white">{service.title}</span>
                  </a>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="/properties" className="btn-ghost">العقارات</a>
              <a href="/request" className="btn-ghost">اطلب عقارك</a>
              <a href="/add-property" className="btn-ghost">أضف عقارك</a>
            </div>
            <ContactActions phones={contacts.phones} whatsapps={contacts.whatsapps} />
          </div>
          <div className="relative h-64 min-h-[280px] lg:h-auto">
            <img src={settings.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover lg:[clip-path:polygon(12%_0,100%_0,100%_100%,0_84%)]" />
            <div className="absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-transparent via-[#f0d78c] to-transparent lg:block" />
            {settings.heroMotto && (
              <div className="absolute bottom-0 left-0 right-0 hidden bg-[#0c1b38]/95 px-6 py-4 text-center lg:block" style={{ clipPath: "polygon(10% 0, 100% 0, 100% 100%, 0 100%)" }}>
                <p className="text-lg font-extrabold text-[#f6e7b2]">{settings.heroMotto}</p>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-[#d4af37]/40 bg-[#071018]">
          <div className="mx-auto grid max-w-[1400px] gap-3 px-5 py-4 text-sm text-[#d7deee] md:grid-cols-3">
            <p>مناطق الخدمة: {areas.map((area) => area.name).join("، ") || "تُحدد من لوحة التحكم"}</p>
            <p>{settings.trustLine}</p>
            <p>{settings.tagline}</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14">
        <p className="kicker">الخدمات</p>
        <h2 className="mt-2 text-3xl font-extrabold">خدمات التسويق العقاري</h2>
        {services.length === 0 ? (
          <div className="mt-6"><EmptyState title="لا توجد خدمات منشورة" text="يمكن إضافة الخدمات وتفعيلها من لوحة التحكم." /></div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <a key={service.id} href={`/services/${service.slug}`} className="panel rounded-3xl p-5 transition hover:-translate-y-0.5">
                <p className="text-lg font-extrabold text-[#f0d78c]">{service.title}</p>
                <p className="mt-2 text-sm leading-7 text-[#d7deee]">{service.summary}</p>
              </a>
            ))}
          </div>
        )}
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="kicker">العقارات</p>
            <h2 className="mt-2 text-3xl font-extrabold">العقارات المنشورة</h2>
          </div>
          <a href="/properties" className="btn-ghost">عرض الكل</a>
        </div>
        {featured.length === 0 ? (
          <EmptyState title="لا توجد عقارات منشورة حالياً" text="عند إضافة عقار ونشره من لوحة التحكم سيظهر هنا ببياناته وصوره الحقيقية." href="/request" label="اطلب عقارك" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} settings={settings} />
            ))}
          </div>
        )}
      </section>
      <section className="bg-[#0a1428] py-14">
        <div className="mx-auto max-w-7xl px-4">
          <p className="kicker">التصنيفات</p>
          <h2 className="mt-2 text-3xl font-extrabold">أنواع العقارات</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {types.map((type) => (
              <a key={type.id} href={`/properties?type=${type.slug}`} className="rounded-full border border-[#d4af37]/35 px-4 py-2 text-sm hover:bg-[#d4af37]/10">
                {type.name}
              </a>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14">
        <p className="kicker">النطاق</p>
        <h2 className="mt-2 text-3xl font-extrabold">مناطق الخدمة</h2>
        {areas.length === 0 ? (
          <div className="mt-6"><EmptyState title="لا توجد مناطق مفعّلة" text="يمكن إضافة المناطق أو إعادة تفعيلها من لوحة التحكم." /></div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {areas.map((area) => (
              <a key={area.id} href={`/areas/${area.slug}`} className="rounded-3xl border border-[#d4af37]/30 bg-gradient-to-b from-[#122044] to-[#07101f] p-5">
                <p className="text-xl font-extrabold text-[#f0d78c]">{area.name}</p>
                <p className="mt-2 text-sm leading-7 text-[#d7deee]">{area.description}</p>
              </a>
            ))}
          </div>
        )}
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-14 md:grid-cols-2">
        <a href="/request" className="panel rounded-3xl p-6">
          <p className="kicker">للباحثين</p>
          <h2 className="mt-2 text-3xl font-extrabold">اطلب عقارك</h2>
          <p className="mt-3 leading-8 text-[#d7deee]">أرسلوا نوع العقار والمنطقة والميزانية ليصل الطلب إلى لوحة المتابعة.</p>
        </a>
        <a href="/add-property" className="panel rounded-3xl p-6">
          <p className="kicker">للملاك</p>
          <h2 className="mt-2 text-3xl font-extrabold">أضف عقارك</h2>
          <p className="mt-3 leading-8 text-[#d7deee]">أرسلوا بيانات العقار المراد تسويقه. النشر يتم بعد المراجعة من لوحة التحكم.</p>
        </a>
      </section>
      <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-14 lg:grid-cols-[220px_1fr]">
        {settings.personalPhotoUrl ? (
          <div className="relative mx-auto w-full max-w-[260px]">
            <div className="overflow-hidden rounded-[28px] border border-[#d4af37]/45 bg-[#0c1b38] shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <img src={settings.personalPhotoUrl} alt={settings.siteName} className="aspect-[4/5] w-full object-cover object-[50%_18%]" />
            </div>
            <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-gradient-to-l from-transparent via-[#d4af37] to-transparent" />
          </div>
        ) : (
          <img src={settings.logoUrl} alt="" className="mx-auto h-48 w-48 object-contain" />
        )}
        <div>
          <p className="kicker">من نحن</p>
          <h2 className="mt-2 text-3xl font-extrabold">{settings.siteName}</h2>
          <p className="mt-3 leading-8 text-[#d7deee]">{settings.aboutLong || settings.aboutShort}</p>
          <a href="/about" className="btn-ghost mt-4">المزيد</a>
        </div>
      </section>
      {home?.published && home.blocks.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-14">
          <Blocks blocks={home.blocks} />
        </section>
      )}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-3xl font-extrabold">المدونة</h2>
          <a href="/blog" className="text-[#f0d78c]">كل المقالات</a>
        </div>
        {articles.length === 0 ? (
          <EmptyState title="لا توجد مقالات منشورة" text="يمكن كتابة المقالات ونشرها من لوحة التحكم دون تعديل الكود." />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {articles.map((article) => (
              <a key={article.id} href={`/blog/${article.slug}`} className="overflow-hidden rounded-3xl border border-[#d4af37]/25 bg-[#0c1730]">
                {article.featuredUrl && <img src={article.featuredUrl} alt="" className="h-40 w-full object-cover" />}
                <div className="p-4">
                  <p className="font-extrabold">{article.title}</p>
                  {article.excerpt && <p className="mt-2 text-sm leading-7 text-[#c5cde0]">{article.excerpt}</p>}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
