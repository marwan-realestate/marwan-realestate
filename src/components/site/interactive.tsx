"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { telHref, whatsappHref, type PhoneEntry, type PublicSettings } from "@/lib/shared";

export function track(type: string, extra?: { propertyId?: string; adId?: string; path?: string }) {
  fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type, path: extra?.path || window.location.pathname, ...extra }),
    keepalive: true,
  }).catch(() => undefined);
  const w = window as Window & { gtag?: (...args: unknown[]) => void; fbq?: (...args: unknown[]) => void };
  w.gtag?.("event", type, extra || {});
  w.fbq?.("trackCustom", type, extra || {});
}

export function TrackedLink({
  href,
  event,
  propertyId,
  className,
  children,
  external,
}: {
  href: string;
  event?: string;
  propertyId?: string;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      className={className}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={() => event && track(event, { propertyId, path: href })}
    >
      {children}
    </a>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5.2 3.8 8 3.2l1.7 4.4-2 1.7a15 15 0 0 0 6.9 6.9l1.7-2 4.4 1.7-.6 2.8a2.3 2.3 0 0 1-2.5 1.8C9.8 19.7 4.3 14.2 3.4 6.3a2.3 2.3 0 0 1 1.8-2.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M20 11.4a8.1 8.1 0 0 1-11.9 7.2L4 20l1.4-3.9A8.1 8.1 0 1 1 20 11.4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.1 7.7 1 2.5-1.1.9a6.2 6.2 0 0 0 3.9 3.9l.9-1.1 2.5 1c-.2 1.1-.9 1.6-1.8 1.5-3.5-.5-6.1-3.1-6.6-6.6-.1-.9.4-1.6 1.5-1.8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ContactActions({
  phones,
  whatsapps,
  propertyId,
  compact,
  message,
}: {
  phones: string[];
  whatsapps: string[];
  propertyId?: string;
  compact?: boolean;
  message?: string;
}) {
  const phone = phones[0];
  const whatsapp = whatsapps[0];
  if (!phone && !whatsapp) return null;
  const size = compact ? "!h-10 !w-10 !min-h-0 !p-0" : "!h-12 !w-12 !min-h-0 !p-0";
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-4"}`}>
      {phone && (
        <TrackedLink href={telHref(phone)} event="call_click" propertyId={propertyId} className={`btn-gold ${size}`}>
          <span className="sr-only">اتصال</span><PhoneIcon />
        </TrackedLink>
      )}
      {whatsapp && (
        <TrackedLink href={whatsappHref(whatsapp, message)} event="whatsapp_click" propertyId={propertyId} external className={`btn-wa ${size}`}>
          <span className="sr-only">واتساب</span><WhatsappIcon />
        </TrackedLink>
      )}
    </div>
  );
}

export function Header({
  settings,
  links,
}: {
  settings: PublicSettings;
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  const phones = settings.phones.map((item) => item.number).filter(Boolean);
  return (
    <header className="sticky top-0 z-40 border-b border-[#d4af37]/20 bg-[#07101f]/90 backdrop-blur-md">
      <div className="hidden border-b border-white/5 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-sm text-[#d7deee]">
          <span>{settings.trustLine}</span>
          <div className="flex flex-wrap gap-3">
            {phones.map((phone) => (
              <TrackedLink key={phone} href={telHref(phone)} event="call_click" className="text-[#f0d78c]">
                {phone}
              </TrackedLink>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <a href="/" className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-[#d4af37]/60 bg-[#07101f] p-1 shadow-[0_0_18px_rgba(212,175,55,0.16)]">
            <img src={settings.logoUrl} alt={settings.siteName} className="h-full w-full object-contain" />
          </span>
          <span>
            <span className="block text-sm font-extrabold text-[#f0d78c] md:text-base">{settings.siteName}</span>
            <span className="block text-xs text-[#c5cde0]">{settings.tagline}</span>
          </span>
        </a>
        <nav className="hidden items-center gap-4 text-sm xl:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={pathname === link.href ? "text-[#f0d78c]" : "text-[#e7ebf5] hover:text-[#f0d78c]"}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <ContactActions phones={phones.slice(0, 1)} whatsapps={settings.whatsappNumbers.slice(0, 1)} compact />
        </div>
        <button className="btn-ghost !min-h-10 !px-3 xl:hidden" onClick={() => setOpen((value) => !value)} aria-label="القائمة">
          القائمة
        </button>
      </div>
      {open && (
        <div className="border-t border-[#d4af37]/20 bg-[#07101f] px-4 py-4 xl:hidden">
          <div className="grid gap-3">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="rounded-xl border border-white/10 px-3 py-3">
                {link.label}
              </a>
            ))}
            <ContactActions phones={phones} whatsapps={settings.whatsappNumbers} />
          </div>
        </div>
      )}
    </header>
  );
}

export function FloatContact({ phones, whatsapps }: { phones: PhoneEntry[]; whatsapps: string[] }) {
  const phone = phones[0]?.number;
  const wa = whatsapps[0];
  if (!phone && !wa) return null;
  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col gap-2">
      {phone && (
        <TrackedLink href={telHref(phone)} event="call_click" className="btn-gold !h-12 !w-12 !min-h-0 !p-0 shadow-xl">
          <span className="sr-only">اتصال</span><PhoneIcon />
        </TrackedLink>
      )}
      {wa && (
        <TrackedLink href={whatsappHref(wa)} event="whatsapp_click" external className="btn-wa !h-12 !w-12 !min-h-0 !p-0 shadow-xl">
          <span className="sr-only">واتساب</span><WhatsappIcon />
        </TrackedLink>
      )}
    </div>
  );
}

export function AnalyticsScripts({ gaId, pixelId }: { gaId: string; pixelId: string }) {
  useEffect(() => {
    if (gaId) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(script);
      const inline = document.createElement("script");
      inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`;
      document.head.appendChild(inline);
    }
    if (pixelId) {
      const inline = document.createElement("script");
      inline.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(pixelId)});fbq('track','PageView');`;
      document.head.appendChild(inline);
    }
  }, [gaId, pixelId]);
  return null;
}

type Option = { id: string; name: string };

export function LeadForm({
  kind,
  types,
  areas,
  submitLabel,
}: {
  kind: "request_property" | "add_property" | "contact";
  types: Option[];
  areas: Option[];
  submitLabel: string;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    transactionType: kind === "add_property" ? "sale" : "wanted_buy",
    propertyTypeId: "",
    areaId: "",
    budget: "",
    areaSqm: "",
    bedrooms: "",
    details: "",
    notes: "",
    website: "",
  });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const transactions = useMemo(
    () =>
      kind === "add_property"
        ? [
            ["sale", "للبيع"],
            ["rent", "للإيجار"],
          ]
        : [
            ["wanted_buy", "مطلوب للشراء"],
            ["wanted_rent", "مطلوب للإيجار"],
            ["sale", "للبيع"],
            ["rent", "للإيجار"],
          ],
    [kind],
  );
  function set(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, kind }),
    });
    const json = await response.json();
    setPending(false);
    if (!json.ok) {
      setError(json.error || "تعذر إرسال الطلب.");
      return;
    }
    setDone(true);
  }
  if (done) {
    return <div className="panel rounded-3xl p-6 text-[#f7f4ec]">تم استلام الطلب. يمكنكم المتابعة عبر الاتصال أو واتساب على الأرقام الظاهرة في الصفحة.</div>;
  }
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-[#d4af37]/25 bg-[#0c1730] p-4 md:p-6">
      <div className="absolute -left-[9999px]" aria-hidden>
        <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => set("website", event.target.value)} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="field" placeholder="الاسم" value={form.name} onChange={(event) => set("name", event.target.value)} required />
        <input className="field" placeholder="الهاتف" value={form.phone} onChange={(event) => set("phone", event.target.value)} required />
        <input className="field" placeholder="واتساب (اختياري)" value={form.whatsapp} onChange={(event) => set("whatsapp", event.target.value)} />
        {kind !== "contact" && (
          <>
            <select className="select" value={form.transactionType} onChange={(event) => set("transactionType", event.target.value)}>
              {transactions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select className="select" value={form.propertyTypeId} onChange={(event) => set("propertyTypeId", event.target.value)}>
              <option value="">نوع العقار</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <select className="select" value={form.areaId} onChange={(event) => set("areaId", event.target.value)}>
              <option value="">المنطقة</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
            <input className="field" placeholder={kind === "add_property" ? "السعر المتوقع" : "الميزانية"} value={form.budget} onChange={(event) => set("budget", event.target.value)} />
            <input className="field" placeholder="المساحة" value={form.areaSqm} onChange={(event) => set("areaSqm", event.target.value)} />
            <input className="field" placeholder="عدد الغرف" value={form.bedrooms} onChange={(event) => set("bedrooms", event.target.value)} />
          </>
        )}
      </div>
      <textarea className="area" placeholder="التفاصيل" value={form.details} onChange={(event) => set("details", event.target.value)} />
      <textarea className="area !min-h-20" placeholder="ملاحظات" value={form.notes} onChange={(event) => set("notes", event.target.value)} />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button className="btn-gold" disabled={pending}>
        {pending ? "جارٍ الإرسال..." : submitLabel}
      </button>
    </form>
  );
}

export function PropertyViewTracker({ id }: { id: string }) {
  useEffect(() => {
    track("property_view", { propertyId: id });
  }, [id]);
  return null;
}
