import { safeHref, type ContentBlock, type PublicSettings } from "@/lib/shared";
import { ContactActions } from "@/components/site/interactive";

export function Blocks({ blocks, accordion = false }: { blocks: ContentBlock[]; accordion?: boolean }) {
  if (!blocks?.length) return null;
  return (
    <div className="grid gap-4">
      {blocks.map((block) => {
        if (block.type === "heading" && block.text) {
          const Tag = block.level === 3 ? "h3" : "h2";
          return (
            <Tag key={block.id} className="text-2xl font-extrabold text-white md:text-3xl">
              {block.text}
            </Tag>
          );
        }
        if (block.type === "paragraph" && block.text) {
          return (
            <p key={block.id} className="whitespace-pre-line leading-8 text-[#d7deee]">
              {block.text}
            </p>
          );
        }
        if (block.type === "image" && block.url) {
          return <img key={block.id} src={block.url} alt={block.alt || ""} className="max-h-[520px] w-full rounded-3xl object-cover" />;
        }
        if (block.type === "button" && block.label) {
          return (
            <a key={block.id} href={safeHref(block.href)} className="btn-gold w-fit">
              {block.label}
            </a>
          );
        }
        if (block.type === "section" && (block.title || block.body)) {
          if (accordion) {
            return (
              <details key={block.id} className="rounded-2xl border border-[#d4af37]/25 bg-[#0c1730] px-4 py-3" open>
                <summary className="cursor-pointer text-lg font-bold text-[#f0d78c]">{block.title}</summary>
                <p className="mt-2 whitespace-pre-line leading-8 text-[#d7deee]">{block.body}</p>
              </details>
            );
          }
          return (
            <section key={block.id} className="rounded-3xl border border-[#d4af37]/20 bg-[#0c1730]/70 p-5">
              {block.title && <h3 className="text-xl font-bold text-[#f0d78c]">{block.title}</h3>}
              {block.body && <p className="mt-2 whitespace-pre-line leading-8 text-[#d7deee]">{block.body}</p>}
            </section>
          );
        }
        if (block.type === "links" && block.items?.length) {
          return (
            <div key={block.id} className="flex flex-wrap gap-2">
              {block.items.map((item) => (
                <a key={`${item.href}-${item.label}`} href={safeHref(item.href)} className="btn-ghost">
                  {item.label}
                </a>
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export function Footer({ settings, areas }: { settings: PublicSettings; areas: string[] }) {
  const phones = settings.phones.map((item) => item.number).filter(Boolean);
  const socials = Object.entries(settings.socials).filter(([, value]) => value);
  return (
    <footer className="mt-16 border-t border-[#d4af37]/25 bg-[#050912]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <img src={settings.logoUrl} alt="" className="h-20 w-20 object-contain" />
          <p className="mt-3 font-extrabold text-[#f0d78c]">{settings.siteName}</p>
          <p className="mt-1 text-sm text-[#c5cde0]">{settings.tagline}</p>
        </div>
        <div>
          <p className="mb-3 font-bold text-[#f0d78c]">روابط</p>
          <div className="grid gap-2 text-sm text-[#d7deee]">
            <a href="/about">من نحن</a>
            <a href="/properties">العقارات</a>
            <a href="/request">اطلب عقارك</a>
            <a href="/add-property">أضف عقارك</a>
            <a href="/blog">المدونة</a>
            <a href="/faq">الأسئلة الشائعة</a>
          </div>
        </div>
        <div>
          <p className="mb-3 font-bold text-[#f0d78c]">مناطق الخدمة</p>
          <div className="grid gap-2 text-sm text-[#d7deee]">
            {areas.length ? areas.map((area) => <span key={area}>{area}</span>) : <span>لم تتم إضافة مناطق بعد.</span>}
          </div>
        </div>
        <div>
          <p className="mb-3 font-bold text-[#f0d78c]">تواصل</p>
          <ContactActions phones={phones} whatsapps={settings.whatsappNumbers} compact />
          {settings.email && <a className="mt-3 block text-sm text-[#d7deee]" href={`mailto:${settings.email}`} dir="ltr">{settings.email}</a>}
          {settings.website && <a className="mt-1 block text-sm text-[#f0d78c]" href={safeHref(settings.website)} target="_blank" rel="noopener noreferrer" dir="ltr">{settings.website}</a>}
          {settings.workingHours && <p className="mt-2 text-sm text-[#c5cde0]">ساعات العمل: {settings.workingHours}</p>}
          {socials.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {socials.map(([key, value]) => (
                <a key={key} className="text-[#f0d78c]" href={safeHref(value)} target="_blank" rel="noopener noreferrer">
                  {key}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-white/5 px-4 py-4 text-center text-xs text-[#9aa6c0]">
        <a href="/privacy" className="mx-2">سياسة الخصوصية</a>
        <a href="/terms" className="mx-2">اتفاقية الاستخدام</a>
      </div>
    </footer>
  );
}

export function EmptyState({ title, text, href, label }: { title: string; text: string; href?: string; label?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#d4af37]/35 bg-[#0c1730]/50 px-5 py-10 text-center">
      <p className="text-xl font-bold text-[#f0d78c]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl leading-8 text-[#c5cde0]">{text}</p>
      {href && label && (
        <a href={href} className="btn-gold mt-5">
          {label}
        </a>
      )}
    </div>
  );
}

export function PageIntro({ title, excerpt, blocks, image }: { title: string; excerpt?: string; blocks?: ContentBlock[]; image?: string }) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <p className="kicker">محمد مروان للتسويق العقاري</p>
      <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">{title}</h1>
      {excerpt && <p className="mt-3 leading-8 text-[#d7deee]">{excerpt}</p>}
      {image && <img src={image} alt="" className="mt-6 max-h-80 w-full rounded-3xl object-cover" />}
      {blocks && blocks.length > 0 && (
        <div className="mt-6">
          <Blocks blocks={blocks} accordion={title.includes("أسئلة")} />
        </div>
      )}
    </section>
  );
}
