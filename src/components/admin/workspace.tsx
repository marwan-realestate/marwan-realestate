"use client";

import { useEffect, useMemo, useState } from "react";
import { AD_TEMPLATES, ASSIGNABLE_ROLES, PERMISSIONS, PROPERTY_STATUSES, REQUEST_KINDS, REQUEST_STATUSES, ROLE_LABELS, TRANSACTIONS, emptyBlock, newId, type ContentBlock } from "@/lib/shared";
import { AdCard, AdPreview, downloadAd, shareAd } from "@/components/templates/ad-card";
import type { AdPayload, PropertyView } from "@/lib/queries";
import { Field, ImageField, MediaPicker, Modal, Notice, api, useApi } from "@/components/admin/kit";
import { LinksPage } from "@/components/admin/links-page";

type TypeRow = { id: string; name: string; slug: string; groupName: string; suggestedTemplate: string; active: boolean; sortOrder: number };
type AreaRow = { id: string; name: string; slug: string; description: string; active: boolean; sortOrder: number; seoTitle?: string; seoDescription?: string };
type ServiceRow = { id: string; title: string; slug: string; summary: string; body: string; icon: string; active: boolean; sortOrder: number; seoTitle?: string; seoDescription?: string };
type Meta = { types: TypeRow[]; areas: AreaRow[]; services: ServiceRow[]; categories: { id: string; name: string; slug: string }[] };

function Card({ title, value, hint }: { title: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-[#e4d7b8] bg-white p-4 shadow-sm">
      <p className="text-sm text-[#7a6a45]">{title}</p>
      <p className="mt-1 text-3xl font-extrabold text-[#8a6a1d]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[#8d8374]">{hint}</p>}
    </div>
  );
}

export function AdminScreen({ section = "dashboard", id }: { section?: string; id?: string }) {
  if (section === "dashboard") return <Dashboard />;
  if (section === "properties") return id ? <PropertyEditor id={id} /> : <PropertyList />;
  if (section === "requests") return id ? <RequestDetail id={id} /> : <RequestList />;
  if (section === "templates") return <TemplateStudio id={id} />;
  if (section === "articles") return id ? <ArticleEditor id={id} /> : <ArticleList />;
  if (section === "pages") return id ? <PageEditor id={id} /> : <PageList />;
  if (section === "services") return <ServiceManager />;
  if (section === "areas") return <AreaManager />;
  if (section === "media") return <MediaManager />;
  if (section === "users") return <UsersManager />;
  if (section === "analytics") return <AnalyticsPage />;
  if (section === "settings") return <SettingsPage />;
  if (section === "seo") return <SeoPage />;
  if (section === "links") return <LinksPage />;
  return <p>قسم غير معروف.</p>;
}

function Dashboard() {
  const { data, error, loading } = useApi<{ counts: Record<string, number>; top: { id: string; title: string; slug: string; viewCount: number }[]; recent: { id: string; action: string; entityType: string; createdAt: string }[] }>("/api/dashboard");
  if (loading) return <p>جارٍ تحميل المؤشرات...</p>;
  if (error) return <Notice text={error} />;
  const c = data?.counts || {};
  const items = [
    ["إجمالي العقارات", c.properties],
    ["المنشور", c.published],
    ["غير المنشور", c.unpublished],
    ["للبيع", c.for_sale],
    ["للإيجار", c.for_rent],
    ["طلبات شراء", c.buyer_requests],
    ["طلبات إيجار", c.rental_requests],
    ["طلبات جديدة", c.new_requests],
    ["المقالات", c.articles],
    ["مسودات", c.drafts],
    ["مقالات منشورة", c.published_articles],
    ["نقرات الاتصال", c.calls],
    ["نقرات واتساب", c.whatsapp],
    ["مشاهدات العقارات", c.views],
    ["إرسالات النماذج", c.submissions],
  ];
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold">لوحة التحكم</h1>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(([title, value]) => <Card key={String(title)} title={String(title)} value={Number(value || 0)} />)}
      </div>
      <div className="rounded-3xl bg-white p-4">
        <h2 className="font-extrabold">الأكثر مشاهدة</h2>
        {(data?.top || []).length === 0 ? <p className="mt-2 text-sm text-[#6d6458]">لا توجد مشاهدات مسجّلة بعد.</p> : (
          <ul className="mt-2 grid gap-2 text-sm">{data?.top.map((item) => <li key={item.id}>{item.title} — {item.viewCount}</li>)}</ul>
        )}
      </div>
    </div>
  );
}

function PropertyList() {
  const { data, error, reload } = useApi<{ properties: PropertyView[] }>("/api/properties");
  const [q, setQ] = useState("");
  const rows = (data?.properties || []).filter((item) => !q || `${item.title} ${item.location} ${item.referenceCode}`.includes(q));
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">العقارات</h1>
        <a className="btn-gold" href="/admin/properties/new">إضافة عقار</a>
      </div>
      <input className="field max-w-sm" placeholder="بحث" value={q} onChange={(event) => setQ(event.target.value)} />
      <Notice text={error} />
      {rows.length === 0 ? <p className="rounded-2xl bg-white p-6 text-sm">لا توجد عقارات بعد. أضف أول عقار من الزر أعلاه.</p> : (
        <div className="grid gap-3">
          {rows.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-2xl bg-white p-3 md:grid-cols-[96px_1fr_auto] md:items-center">
              {item.coverUrl ? <img src={item.coverUrl} alt="" className="h-20 w-full rounded-xl object-cover md:w-24" /> : <div className="grid h-20 place-items-center rounded-xl bg-[#f3ecdf] text-xs">بدون صورة</div>}
              <div>
                <p className="font-extrabold">{item.title}</p>
                <p className="text-sm text-[#6d6458]">{item.typeName} · {item.transactionLabel} · {item.statusLabel} · {item.published ? "منشور" : "غير منشور"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a className="btn-navy !min-h-9" href={`/admin/properties/${item.id}`}>تعديل</a>
                <a className="btn-navy !min-h-9" href={`/admin/templates/new?propertyId=${item.id}`}>إنشاء بطاقة الإعلان</a>
                <button className="btn-ghost !min-h-9 !text-[#1a1406]" onClick={async () => { await api(`/api/properties/${item.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "duplicate" }) }); reload(); }}>نسخ</button>
                <button className="btn-ghost !min-h-9 !text-[#1a1406]" onClick={async () => { if (confirm("حذف العقار؟")) { await api(`/api/properties/${item.id}`, { method: "DELETE" }); reload(); } }}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <TypeManager />
    </div>
  );
}

function TypeManager() {
  const { data, reload } = useApi<Meta>("/api/content?resource=meta");
  const [name, setName] = useState("");
  const [groupName, setGroupName] = useState("residential");
  const [template, setTemplate] = useState("property");
  return (
    <div className="rounded-3xl bg-white p-4">
      <h2 className="font-extrabold">أنواع العقارات</h2>
      <div className="mt-3 grid gap-2 md:grid-cols-4">
        <input className="field" placeholder="اسم النوع" value={name} onChange={(event) => setName(event.target.value)} />
        <select className="select" value={groupName} onChange={(event) => setGroupName(event.target.value)}>
          <option value="residential">سكني</option>
          <option value="commercial">تجاري</option>
          <option value="land">أرض</option>
          <option value="other">أخرى</option>
        </select>
        <select className="select" value={template} onChange={(event) => setTemplate(event.target.value)}>
          {AD_TEMPLATES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <button className="btn-gold" onClick={async () => { await api("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "types", data: { name, groupName, suggestedTemplate: template, active: true } }) }); setName(""); reload(); }}>إضافة</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(data?.types || []).map((type) => (
          <button key={type.id} className="badge" onClick={async () => { await api("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "types", action: "update", id: type.id, data: { ...type, active: !type.active } }) }); reload(); }}>
            {type.name} {type.active ? "" : "(موقوف)"}
          </button>
        ))}
      </div>
    </div>
  );
}

function PropertyEditor({ id }: { id: string }) {
  const isNew = id === "new";
  const meta = useApi<Meta>("/api/content?resource=meta");
  const existing = useApi<PropertyView>(isNew ? null : `/api/properties/${id}`);
  const [form, setForm] = useState<Record<string, unknown>>({ transactionType: "sale", status: "available", published: false, featured: false, priceOnRequest: false, images: [], specs: [] });
  const [picker, setPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!existing.data) return;
    const property = existing.data;
    setForm({
      ...property,
      price: property.price ?? "",
      areaSqm: property.areaSqm ?? "",
      bedrooms: property.bedrooms ?? "",
      bathrooms: property.bathrooms ?? "",
      unitsCount: property.unitsCount ?? "",
      featuresText: property.features.join("\n"),
      specs: property.customSpecs,
      images: property.images.map((image) => ({ mediaId: image.id, url: image.url, isCover: image.isCover })),
    });
  }, [existing.data]);
  const types = meta.data?.types || [];
  const group = types.find((type) => type.id === form.propertyTypeId)?.groupName || "other";
  function set(key: string, value: unknown) { setForm((current) => ({ ...current, [key]: value })); }
  const images = (form.images as { mediaId: string; url: string; isCover: boolean }[]) || [];
  async function save() {
    setError("");
    const payload = {
      ...form,
      features: String(form.featuresText || "").split("\n").map((item) => item.trim()).filter(Boolean),
      customSpecs: form.specs,
      images,
    };
    try {
      const saved = await api<{ id: string }>(isNew ? "/api/properties" : `/api/properties/${id}`, { method: isNew ? "POST" : "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      setMessage("تم حفظ العقار.");
      if (isNew) window.location.href = `/admin/properties/${saved.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الحفظ");
    }
  }
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">{isNew ? "إضافة عقار" : "تعديل عقار"}</h1>
        <div className="flex flex-wrap gap-2">
          {!isNew && <a className="btn-navy" href={`/admin/templates/new?propertyId=${id}`}>إنشاء بطاقة الإعلان</a>}
          <button className="btn-gold" onClick={save}>حفظ</button>
        </div>
      </div>
      <Notice text={error} />
      <Notice text={message} tone="ok" />
      <div className="grid gap-3 rounded-3xl bg-white p-4 md:grid-cols-2">
        <Field label="عنوان العقار"><input className="field" value={String(form.title || "")} onChange={(event) => set("title", event.target.value)} /></Field>
        <Field label="الرابط اللطيف"><input className="field" value={String(form.slug || "")} onChange={(event) => set("slug", event.target.value)} placeholder="يُنشأ تلقائياً بحروف لاتينية إذا تُرك فارغاً" /></Field>
        <Field label="نوع العقار"><select className="select" value={String(form.propertyTypeId || "")} onChange={(event) => set("propertyTypeId", event.target.value)}><option value="">اختر</option>{types.filter((type) => type.active || type.id === form.propertyTypeId).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></Field>
        <Field label="نوع العملية"><select className="select" value={String(form.transactionType || "sale")} onChange={(event) => set("transactionType", event.target.value)}>{TRANSACTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
        <Field label="المنطقة"><select className="select" value={String(form.areaId || "")} onChange={(event) => set("areaId", event.target.value)}><option value="">بدون</option>{(meta.data?.areas || []).map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></Field>
        <Field label="العنوان / الموقع"><input className="field" value={String(form.location || "")} onChange={(event) => set("location", event.target.value)} /></Field>
        <Field label="السعر"><input className="field" value={String(form.price ?? "")} onChange={(event) => set("price", event.target.value)} /></Field>
        <Field label="المساحة"><input className="field" value={String(form.areaSqm ?? "")} onChange={(event) => set("areaSqm", event.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.priceOnRequest)} onChange={(event) => set("priceOnRequest", event.target.checked)} /> السعر عند الطلب</label>
        <Field label="رابط الخريطة"><input className="field" value={String(form.mapsUrl || "")} onChange={(event) => set("mapsUrl", event.target.value)} /></Field>
        <Field label="هاتف العقار"><input className="field" value={String(form.phone || "")} onChange={(event) => set("phone", event.target.value)} placeholder="إذا تُرك فارغاً تُستخدم أرقام الموقع" /></Field>
        <Field label="واتساب العقار"><input className="field" value={String(form.whatsapp || "")} onChange={(event) => set("whatsapp", event.target.value)} /></Field>
        <Field label="الحالة"><select className="select" value={String(form.status || "available")} onChange={(event) => set("status", event.target.value)}>{PROPERTY_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
        <Field label="رقم مرجعي"><input className="field" value={String(form.referenceCode || "")} onChange={(event) => set("referenceCode", event.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.published)} onChange={(event) => set("published", event.target.checked)} /> نشر</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.featured)} onChange={(event) => set("featured", event.target.checked)} /> مميز</label>
        {group === "residential" && (
          <>
            <Field label="غرف"><input className="field" value={String(form.bedrooms ?? "")} onChange={(event) => set("bedrooms", event.target.value)} /></Field>
            <Field label="حمامات"><input className="field" value={String(form.bathrooms ?? "")} onChange={(event) => set("bathrooms", event.target.value)} /></Field>
            <Field label="الدور"><input className="field" value={String(form.floor || "")} onChange={(event) => set("floor", event.target.value)} /></Field>
            <Field label="التشطيب"><input className="field" value={String(form.finishing || "")} onChange={(event) => set("finishing", event.target.value)} /></Field>
            <Field label="عمر المبنى"><input className="field" value={String(form.buildingAge || "")} onChange={(event) => set("buildingAge", event.target.value)} /></Field>
            <Field label="عدد الوحدات"><input className="field" value={String(form.unitsCount ?? "")} onChange={(event) => set("unitsCount", event.target.value)} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.elevator)} onChange={(event) => set("elevator", event.target.checked)} /> مصعد</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.balcony)} onChange={(event) => set("balcony", event.target.checked)} /> بلكونة</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.parking)} onChange={(event) => set("parking", event.target.checked)} /> جراج</label>
          </>
        )}
        {group === "commercial" && (
          <>
            <Field label="النشاط التجاري"><input className="field" value={String(form.commercialActivity || "")} onChange={(event) => set("commercialActivity", event.target.value)} /></Field>
            <Field label="الواجهة"><input className="field" value={String(form.frontage || "")} onChange={(event) => set("frontage", event.target.value)} /></Field>
            <Field label="الدور"><input className="field" value={String(form.floor || "")} onChange={(event) => set("floor", event.target.value)} /></Field>
            <Field label="الرؤية على الشارع"><input className="field" value={String(form.streetVisibility || "")} onChange={(event) => set("streetVisibility", event.target.value)} /></Field>
            <Field label="أنشطة مناسبة"><input className="field" value={String(form.suitableActivities || "")} onChange={(event) => set("suitableActivities", event.target.value)} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.parking)} onChange={(event) => set("parking", event.target.checked)} /> جراج</label>
          </>
        )}
        <Field label="الوصف"><textarea className="area md:col-span-2" value={String(form.description || "")} onChange={(event) => set("description", event.target.value)} /></Field>
        <Field label="المميزات، سطر لكل ميزة"><textarea className="area" value={String(form.featuresText || "")} onChange={(event) => set("featuresText", event.target.value)} /></Field>
        <div className="grid gap-2">
          <p className="text-sm font-semibold">مواصفات إضافية</p>
          {((form.specs as { label: string; value: string }[]) || []).map((spec, index) => (
            <div key={index} className="grid grid-cols-2 gap-2">
              <input className="field" placeholder="البند" value={spec.label} onChange={(event) => set("specs", ((form.specs as { label: string; value: string }[]) || []).map((item, i) => i === index ? { ...item, label: event.target.value } : item))} />
              <input className="field" placeholder="القيمة" value={spec.value} onChange={(event) => set("specs", ((form.specs as { label: string; value: string }[]) || []).map((item, i) => i === index ? { ...item, value: event.target.value } : item))} />
            </div>
          ))}
          <button type="button" className="btn-navy" onClick={() => set("specs", [...((form.specs as { label: string; value: string }[]) || []), { label: "", value: "" }])}>إضافة بند</button>
        </div>
        <Field label="عنوان SEO"><input className="field" value={String(form.seoTitle || "")} onChange={(event) => set("seoTitle", event.target.value)} /></Field>
        <Field label="وصف SEO"><textarea className="area" value={String(form.seoDescription || "")} onChange={(event) => set("seoDescription", event.target.value)} /></Field>
      </div>
      <div className="rounded-3xl bg-white p-4">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-extrabold">الصور</h2><button className="btn-navy" onClick={() => setPicker(true)}>إضافة صورة</button></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {images.map((image) => (
            <div key={image.mediaId} className="rounded-2xl border p-2">
              <img src={image.url} alt="" className="h-28 w-full rounded-xl object-cover" />
              <div className="mt-2 flex gap-2 text-xs">
                <button onClick={() => set("images", images.map((item) => ({ ...item, isCover: item.mediaId === image.mediaId })))}>{image.isCover ? "الغلاف" : "تعيين غلاف"}</button>
                <button onClick={() => set("images", images.filter((item) => item.mediaId !== image.mediaId))}>حذف</button>
              </div>
            </div>
          ))}
        </div>
        {images.length === 0 && <p className="text-sm text-[#6d6458]">لا توجد صور. لن تُعرض صورة افتراضية مزيفة.</p>}
      </div>
      {picker && <Modal title="مكتبة الصور" onClose={() => setPicker(false)}><MediaPicker folder="properties" onSelect={(item) => { set("images", [...images, { mediaId: item.id, url: item.url, isCover: images.length === 0 }]); setPicker(false); }} /></Modal>}
    </div>
  );
}

function RequestList() {
  const { data, error } = useApi<{ id: string; name: string; phone: string; kindLabel: string; statusLabel: string; createdAt: string; typeName: string; areaName: string }[]>("/api/requests");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">طلبات العملاء</h1>
      <Notice text={error} />
      {(data || []).length === 0 ? <p className="rounded-2xl bg-white p-6">لا توجد طلبات بعد.</p> : (
        <div className="table-wrap rounded-2xl bg-white">
          <table className="data">
            <thead><tr><th>الاسم</th><th>النوع</th><th>الحالة</th><th>الهاتف</th><th></th></tr></thead>
            <tbody>
              {(data || []).map((item) => (
                <tr key={item.id}><td>{item.name}</td><td>{item.kindLabel} {item.typeName} {item.areaName}</td><td>{item.statusLabel}</td><td>{item.phone}</td><td><a href={`/admin/requests/${item.id}`}>متابعة</a></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type RequestDetailData = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  kindLabel: string;
  status: string;
  details: string;
  notes: string;
  budget: string;
  areaSqm: string;
  bedrooms: string;
  transactionLabel: string;
  typeName: string;
  areaName: string;
  internalNotes?: { id: string; body: string; userName: string | null; createdAt: string }[];
};

function RequestDetail({ id }: { id: string }) {
  const { data, error, reload } = useApi<RequestDetailData>(`/api/requests/${id}`);
  const [status, setStatus] = useState("new");
  const [internalNote, setInternalNote] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { if (data?.status) setStatus(data.status); }, [data?.status]);
  if (error) return <Notice text={error} />;
  if (!data) return <p>جارٍ التحميل...</p>;
  const noteItems = data.internalNotes || [];
  return (
    <div className="grid gap-4 rounded-3xl bg-white p-4">
      <h1 className="text-2xl font-extrabold">{data.name}</h1>
      <p>{data.kindLabel} · {data.transactionLabel} · {data.typeName} · {data.areaName}</p>
      <p>الهاتف: {data.phone} {data.whatsapp && `· واتساب: ${data.whatsapp}`}</p>
      {data.budget && <p>الميزانية: {data.budget}</p>}
      {data.areaSqm && <p>المساحة: {data.areaSqm}</p>}
      {data.bedrooms && <p>الغرف: {data.bedrooms}</p>}
      {data.details && <p className="whitespace-pre-line">{data.details}</p>}
      {typeof data.notes === "string" && data.notes && <p className="whitespace-pre-line">ملاحظات العميل: {data.notes}</p>}
      <Field label="الحالة"><select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>{REQUEST_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
      <Field label="ملاحظة داخلية"><textarea className="area" value={internalNote} onChange={(event) => setInternalNote(event.target.value)} /></Field>
      <button className="btn-gold w-fit" onClick={async () => { await api(`/api/requests/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, internalNote }) }); setInternalNote(""); setMessage("تم تحديث الطلب."); reload(); }}>حفظ المتابعة</button>
      <Notice text={message} tone="ok" />
      <div>{noteItems.map((note) => <p key={note.id} className="border-b py-2 text-sm">{note.body} — {note.userName || "الفريق"}</p>)}</div>
      <button className="btn-ghost w-fit !text-[#1a1406]" onClick={async () => { if (confirm("حذف الطلب؟")) { await api(`/api/requests/${id}`, { method: "DELETE" }); window.location.href = "/admin/requests"; } }}>حذف</button>
    </div>
  );
}

function TemplateStudio({ id }: { id?: string }) {
  const editing = Boolean(id && id !== "new");
  const saved = useApi<AdPayload>(editing ? `/api/ads/${id}` : null);
  const list = useApi<{ id: string; template: string; published: boolean; title: string; propertyId: string }[]>(editing || id === "new" ? null : "/api/ads");
  const meta = useApi<{ properties: PropertyView[] }>("/api/properties");
  const [propertyId, setPropertyId] = useState("");
  const [template, setTemplate] = useState("apartment");
  const [published, setPublished] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get("propertyId");
    if (preset) setPropertyId(preset);
  }, []);
  useEffect(() => {
    if (!saved.data) return;
    setPropertyId(saved.data.property.id);
    setTemplate(saved.data.template);
    setPublished(Boolean(saved.data.published));
  }, [saved.data]);
  const previewUrl = propertyId ? `/api/ads?propertyId=${propertyId}&template=${template}` : null;
  const preview = useApi<AdPayload>(editing ? null : previewUrl);
  const payload = editing ? saved.data : preview.data;
  async function save() {
    setError("");
    try {
      const result = await api<{ id: string }>(editing ? `/api/ads/${id}` : "/api/ads", { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ propertyId, template, published }) });
      setNote("تم حفظ البطاقة. البيانات تُقرأ مباشرة من العقار.");
      if (!editing) window.location.href = `/admin/templates/${result.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الحفظ");
    }
  }
  if (!id) {
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between"><h1 className="text-2xl font-extrabold">القوالب الإعلانية</h1><a className="btn-gold" href="/admin/templates/new">إنشاء بطاقة الإعلان</a></div>
        <div className="grid gap-3 md:grid-cols-3">
          {AD_TEMPLATES.map((item) => <div key={item.value} className="rounded-3xl bg-white p-4"><p className="font-extrabold">{item.label}</p><p className="mt-2 text-sm leading-7 text-[#6d6458]">{item.description}</p></div>)}
        </div>
        <Notice text={list.error} />
        {(list.data || []).length === 0 ? <p className="rounded-2xl bg-white p-5">لا توجد بطاقات محفوظة. اختر عقاراً وقالباً لإنشاء بطاقة ببيانات حقيقية.</p> : (list.data || []).map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-3">
            <span>{item.title} · {AD_TEMPLATES.find((templateItem) => templateItem.value === item.template)?.label} · {item.published ? "منشورة" : "مسودة"}</span>
            <a className="btn-navy !min-h-9" href={`/admin/templates/${item.id}`}>فتح</a>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold">إنشاء بطاقة الإعلان</h1>
      <div className="grid gap-3 rounded-3xl bg-white p-4 md:grid-cols-3">
        <Field label="العقار"><select className="select" value={propertyId} onChange={(event) => setPropertyId(event.target.value)}><option value="">اختر عقاراً</option>{(meta.data?.properties || []).map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></Field>
        <Field label="القالب"><select className="select" value={template} onChange={(event) => setTemplate(event.target.value)}>{AD_TEMPLATES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
        <label className="mt-6 flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} /> نشر البطاقة</label>
      </div>
      <Notice text={error || preview.error || saved.error} />
      {!propertyId ? <p className="rounded-2xl bg-white p-5">اختر عقاراً لعرض بياناته الحقيقية داخل القالب. لن يتم استخدام أسعار أو أرقام وهمية.</p> : payload ? (
        <>
          <AdPreview><AdCard payload={{ ...payload, template, published }} /></AdPreview>
          <div className="flex flex-wrap gap-2">
            <button className="btn-gold" onClick={save}>{editing ? "تحديث" : "حفظ"}</button>
            <button className="btn-navy" onClick={() => downloadAd(payload.property.slug, payload.id)}>تنزيل PNG</button>
            <button className="btn-navy" onClick={async () => setNote((await shareAd(payload.property.title, editing ? id : undefined)) === "copied" ? "تم نسخ الرابط." : "تمت المشاركة.")}>مشاركة</button>
            {editing && published && <a className="btn-ghost !text-[#1a1406]" href={`/ads/${id}`}>الرابط العام</a>}
          </div>
        </>
      ) : <p>جارٍ تحميل بيانات العقار...</p>}
      <Notice text={note} tone="ok" />
    </div>
  );
}

function ArticleList() {
  const { data, error } = useApi<{ id: string; title: string; status: string; slug: string }[]>("/api/content?resource=articles");
  return (
    <div>
      <div className="mb-4 flex justify-between"><h1 className="text-2xl font-extrabold">المقالات</h1><a className="btn-gold" href="/admin/articles/new">مقال جديد</a></div>
      <Notice text={error} />
      {(data || []).length === 0 ? <p className="rounded-2xl bg-white p-5">لا توجد مقالات. اكتب أول مقال من لوحة التحكم.</p> : (data || []).map((item) => (
        <a key={item.id} href={`/admin/articles/${item.id}`} className="mb-2 block rounded-2xl bg-white p-3">{item.title} · {item.status === "published" ? "منشور" : "مسودة"}</a>
      ))}
    </div>
  );
}

function ArticleEditor({ id }: { id: string }) {
  const isNew = id === "new";
  const meta = useApi<Meta>("/api/content?resource=meta");
  const existing = useApi<Record<string, unknown>>(isNew ? null : `/api/content?resource=articles&id=${id}`);
  const [form, setForm] = useState<Record<string, unknown>>({ status: "draft", tagsText: "", blocks: [] });
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (existing.data) setForm({ ...existing.data, tagsText: Array.isArray(existing.data.tags) ? (existing.data.tags as string[]).join(", ") : "" });
  }, [existing.data]);
  async function save(status: string) {
    try {
      const saved = await api<{ id: string }>("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "articles", action: isNew ? "create" : "update", id: isNew ? undefined : id, data: { ...form, status, tags: String(form.tagsText || "").split(",").map((item) => item.trim()).filter(Boolean) } }) });
      if (isNew) window.location.href = `/admin/articles/${saved.id}`;
      else setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر الحفظ"); }
  }
  return (
    <div className="grid gap-3 rounded-3xl bg-white p-4">
      <h1 className="text-2xl font-extrabold">كتابة مقال</h1>
      <Notice text={error} />
      <Field label="العنوان"><input className="field" value={String(form.title || "")} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
      <Field label="الرابط"><input className="field" value={String(form.slug || "")} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></Field>
      <Field label="المقتطف"><textarea className="area" value={String(form.excerpt || "")} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></Field>
      <Field label="نص المقال"><textarea className="area min-h-56" value={String(form.body || "")} onChange={(event) => setForm({ ...form, body: event.target.value })} /></Field>
      <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
        <Field label="التصنيف"><select className="select" value={String(form.categoryId || "")} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">بدون</option>{(meta.data?.categories || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <button className="btn-navy" type="button" onClick={async () => { const name = prompt("اسم التصنيف الجديد"); if (!name) return; try { await api("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "categories", data: { name } }) }); meta.reload(); } catch (err) { setError(err instanceof Error ? err.message : "تعذر إضافة التصنيف"); } }}>إضافة تصنيف</button>
      </div>
      <Field label="الوسوم"><input className="field" value={String(form.tagsText || "")} onChange={(event) => setForm({ ...form, tagsText: event.target.value })} /></Field>
      <Field label="عنوان SEO"><input className="field" value={String(form.seoTitle || "")} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} /></Field>
      <Field label="وصف SEO"><textarea className="area" value={String(form.seoDescription || "")} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} /></Field>
      <button className="btn-navy w-fit" onClick={() => setPicker(true)}>صورة بارزة</button>
      {form.featuredMediaId ? <img src={`/api/files/${form.featuredMediaId}`} alt="" className="h-36 rounded-2xl object-cover" /> : null}
      <BlockEditor blocks={(form.blocks as ContentBlock[]) || []} onChange={(blocks) => setForm({ ...form, blocks })} />
      <div className="flex gap-2">
        <button className="btn-navy" onClick={() => save("draft")}>حفظ مسودة</button>
        <button className="btn-gold" onClick={() => save("published")}>نشر</button>
        {!isNew && <button className="btn-ghost !text-[#1a1406]" onClick={async () => { if (confirm("حذف المقال؟")) { await api("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "articles", action: "delete", id }) }); window.location.href = "/admin/articles"; } }}>حذف</button>}
      </div>
      {picker && <Modal title="الصورة البارزة" onClose={() => setPicker(false)}><MediaPicker folder="articles" onSelect={(item) => { setForm({ ...form, featuredMediaId: item.id }); setPicker(false); }} /></Modal>}
    </div>
  );
}

function PageList() {
  const { data, error } = useApi<{ id: string; title: string; slug: string; isSystem: boolean; published: boolean }[]>("/api/content?resource=pages");
  return (
    <div>
      <div className="mb-4 flex justify-between"><h1 className="text-2xl font-extrabold">الصفحات</h1><a className="btn-gold" href="/admin/pages/new">صفحة جديدة</a></div>
      <Notice text={error} />
      {(data || []).map((page) => <a key={page.id} className="mb-2 block rounded-2xl bg-white p-3" href={`/admin/pages/${page.id}`}>{page.title} {page.isSystem ? "· أساسية" : ""} {page.published ? "" : "· مخفية"}</a>)}
    </div>
  );
}

function PageEditor({ id }: { id: string }) {
  const isNew = id === "new";
  const existing = useApi<Record<string, unknown>>(isNew ? null : `/api/content?resource=pages&id=${id}`);
  const [form, setForm] = useState<Record<string, unknown>>({ published: true, blocks: [], showInNav: false });
  const [error, setError] = useState("");
  useEffect(() => { if (existing.data) setForm(existing.data); }, [existing.data]);
  async function save() {
    try {
      const saved = await api<{ id: string }>("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "pages", action: isNew ? "create" : "update", id: isNew ? undefined : id, data: form }) });
      if (isNew) window.location.href = `/admin/pages/${saved.id}`;
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر الحفظ"); }
  }
  return (
    <div className="grid gap-3 rounded-3xl bg-white p-4">
      <h1 className="text-2xl font-extrabold">{isNew ? "صفحة جديدة" : String(form.title || "تعديل صفحة")}</h1>
      <Notice text={error} />
      <Field label="العنوان"><input className="field" value={String(form.title || "")} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
      {!form.isSystem && <Field label="الرابط"><input className="field" value={String(form.slug || "")} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></Field>}
      {!form.isSystem && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.showInNav)} onChange={(event) => setForm({ ...form, showInNav: event.target.checked })} /> إظهار في القائمة</label>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.published)} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> منشورة</label>
      <Field label="عنوان SEO"><input className="field" value={String(form.seoTitle || "")} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} /></Field>
      <Field label="وصف SEO"><textarea className="area" value={String(form.seoDescription || "")} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} /></Field>
      <BlockEditor blocks={(form.blocks as ContentBlock[]) || []} onChange={(blocks) => setForm({ ...form, blocks })} />
      <div className="flex gap-2">
        <button className="btn-gold" onClick={save}>حفظ</button>
        {!isNew && !form.isSystem && <button className="btn-ghost !text-[#1a1406]" onClick={async () => { if (confirm("حذف الصفحة؟")) { await api("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "pages", action: "delete", id }) }); window.location.href = "/admin/pages"; } }}>حذف</button>}
      </div>
    </div>
  );
}

function BlockEditor({ blocks, onChange }: { blocks: ContentBlock[]; onChange: (blocks: ContentBlock[]) => void }) {
  const [picker, setPicker] = useState<string | null>(null);
  function update(index: number, patch: Partial<ContentBlock>) {
    onChange(blocks.map((block, i) => i === index ? { ...block, ...patch } : block));
  }
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {(["heading", "paragraph", "image", "button", "section", "links"] as const).map((type) => (
          <button key={type} className="btn-navy !min-h-9" type="button" onClick={() => onChange([...blocks, emptyBlock(type)])}>{type === "heading" ? "عنوان" : type === "paragraph" ? "فقرة" : type === "image" ? "صورة" : type === "button" ? "زر" : type === "section" ? "قسم" : "روابط"}</button>
        ))}
      </div>
      {blocks.map((block, index) => (
        <div key={block.id || index} className="rounded-2xl border border-[#eadfc8] p-3">
          <div className="mb-2 flex justify-between text-xs">
            <span>{block.type}</span>
            <span className="flex gap-2">
              <button type="button" onClick={() => index > 0 && onChange(blocks.map((item, i) => i === index - 1 ? blocks[index] : i === index ? blocks[index - 1] : item))}>أعلى</button>
              <button type="button" onClick={() => onChange(blocks.filter((_, i) => i !== index))}>حذف</button>
            </span>
          </div>
          {block.type === "heading" && <input className="field" value={block.text || ""} onChange={(event) => update(index, { text: event.target.value })} />}
          {block.type === "paragraph" && <textarea className="area" value={block.text || ""} onChange={(event) => update(index, { text: event.target.value })} />}
          {block.type === "section" && <div className="grid gap-2"><input className="field" placeholder="عنوان القسم" value={block.title || ""} onChange={(event) => update(index, { title: event.target.value })} /><textarea className="area" value={block.body || ""} onChange={(event) => update(index, { body: event.target.value })} /></div>}
          {block.type === "button" && <div className="grid gap-2 md:grid-cols-2"><input className="field" placeholder="نص الزر" value={block.label || ""} onChange={(event) => update(index, { label: event.target.value })} /><input className="field" placeholder="الرابط" value={block.href || ""} onChange={(event) => update(index, { href: event.target.value })} /></div>}
          {block.type === "image" && <div>{block.url || block.mediaId ? <img src={block.url || `/api/files/${block.mediaId}`} alt="" className="mb-2 h-28 rounded-xl object-cover" /> : null}<button className="btn-navy !min-h-9" type="button" onClick={() => setPicker(block.id)}>اختيار صورة</button></div>}
          {block.type === "links" && (
            <div className="grid gap-2">
              {(block.items || []).map((item, linkIndex) => (
                <div key={linkIndex} className="grid grid-cols-2 gap-2">
                  <input className="field" value={item.label} onChange={(event) => update(index, { items: (block.items || []).map((link, i) => i === linkIndex ? { ...link, label: event.target.value } : link) })} />
                  <input className="field" value={item.href} onChange={(event) => update(index, { items: (block.items || []).map((link, i) => i === linkIndex ? { ...link, href: event.target.value } : link) })} />
                </div>
              ))}
              <button type="button" className="btn-navy !min-h-9" onClick={() => update(index, { items: [...(block.items || []), { label: "", href: "/" }] })}>رابط</button>
            </div>
          )}
        </div>
      ))}
      {picker && <Modal title="صورة" onClose={() => setPicker(null)}><MediaPicker onSelect={(item) => { onChange(blocks.map((block) => block.id === picker ? { ...block, mediaId: item.id, url: item.url, alt: item.alt } : block)); setPicker(null); }} /></Modal>}
    </div>
  );
}

function ServiceManager() {
  const { data, error, reload } = useApi<ServiceRow[]>("/api/content?resource=services");
  const [form, setForm] = useState({ title: "", summary: "", body: "", icon: "building" });
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-extrabold">الخدمات</h1>
      <Notice text={error} />
      <div className="grid gap-2 rounded-3xl bg-white p-4 md:grid-cols-2">
        <input className="field" placeholder="عنوان الخدمة" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <input className="field" placeholder="وصف مختصر" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
        <textarea className="area md:col-span-2" placeholder="التفاصيل" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
        <button className="btn-gold" onClick={async () => { await api("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "services", data: { ...form, active: true } }) }); setForm({ title: "", summary: "", body: "", icon: "building" }); reload(); }}>إضافة خدمة</button>
      </div>
      {(data || []).map((service) => (
        <div key={service.id} className="rounded-2xl bg-white p-3">
          <p className="font-bold">{service.title}</p>
          <div className="mt-2 flex gap-2">
            <button className="btn-navy !min-h-9" onClick={async () => { await api("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "services", action: "update", id: service.id, data: { ...service, active: !service.active } }) }); reload(); }}>{service.active ? "إيقاف" : "تفعيل"}</button>
            <button className="btn-ghost !min-h-9 !text-[#1a1406]" onClick={async () => { if (confirm("حذف الخدمة؟")) { await api("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "services", action: "delete", id: service.id }) }); reload(); } }}>حذف</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AreaManager() {
  const { data, error, reload } = useApi<AreaRow[]>("/api/content?resource=areas");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-extrabold">مناطق الخدمة</h1>
      <Notice text={error} />
      <div className="grid gap-2 rounded-3xl bg-white p-4">
        <input className="field" placeholder="اسم المنطقة" value={name} onChange={(event) => setName(event.target.value)} />
        <textarea className="area" placeholder="الوصف" value={description} onChange={(event) => setDescription(event.target.value)} />
        <button className="btn-gold w-fit" onClick={async () => { await api("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "areas", data: { name, description, active: true } }) }); setName(""); setDescription(""); reload(); }}>إضافة منطقة</button>
      </div>
      {(data || []).map((area) => (
        <div key={area.id} className="rounded-2xl bg-white p-3">
          <p className="font-bold">{area.name} {area.active ? "" : "· موقوفة"}</p>
          <p className="text-sm text-[#6d6458]">{area.description}</p>
          <div className="mt-2 flex gap-2">
            <button className="btn-navy !min-h-9" onClick={async () => { await api("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "areas", action: "update", id: area.id, data: { ...area, active: !area.active } }) }); reload(); }}>{area.active ? "إيقاف" : "تفعيل"}</button>
            <button className="btn-ghost !min-h-9 !text-[#1a1406]" onClick={async () => { const next = prompt("تعديل الاسم", area.name); if (next) { await api("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "areas", action: "update", id: area.id, data: { ...area, name: next } }) }); reload(); } }}>تعديل</button>
            <button className="btn-ghost !min-h-9 !text-[#1a1406]" onClick={async () => { if (confirm("حذف المنطقة؟")) { await api("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "areas", action: "delete", id: area.id }) }); reload(); } }}>حذف</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MediaManager() {
  const { data, error, reload } = useApi<{ id: string; url: string; alt: string; originalName: string; folder: string }[]>("/api/media");
  const [folder, setFolder] = useState("general");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">الوسائط</h1>
      <Notice text={error} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select className="select max-w-xs" value={folder} onChange={(event) => setFolder(event.target.value)}>
          <option value="general">عام</option><option value="properties">عقارات</option><option value="articles">مقالات</option><option value="brand">هوية</option>
        </select>
        <ImageField label="رفع صورة من الجهاز" onFile={async (file) => { const form = new FormData(); form.set("file", file); form.set("folder", folder); await api("/api/media", { method: "POST", body: form }); reload(); }} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(data || []).map((item) => (
          <div key={item.id} className="rounded-2xl bg-white p-2">
            <img src={item.url} alt={item.alt} className="h-32 w-full rounded-xl object-cover" />
            <p className="mt-1 truncate text-xs">{item.originalName}</p>
            <div className="mt-2 flex gap-2 text-xs">
              <button onClick={async () => { const alt = prompt("النص البديل", item.alt) ?? item.alt; await api(`/api/media/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ alt, folder: item.folder }) }); reload(); }}>تعديل</button>
              <ImageField label="استبدال" className="!min-h-8 !px-2 !text-xs" onFile={async (file) => { const form = new FormData(); form.set("file", file); await api(`/api/media/${item.id}`, { method: "POST", body: form }); reload(); }} />
              <button onClick={async () => { if (confirm("حذف الصورة؟")) { await api(`/api/media/${item.id}`, { method: "DELETE" }); reload(); } }}>حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersManager() {
  const { data, error, reload } = useApi<{ users: { id: string; name: string; email: string; phone: string | null; role: string; active: boolean }[]; rolePermissions: { role: string; permissionKey: string }[]; overrides: { userId: string; permissionKey: string; allowed: boolean }[] }>("/api/users");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "employee" });
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const matrix = useMemo(() => {
    const map: Record<string, string[]> = { supervisor: [], manager: [], employee: [] };
    for (const row of data?.rolePermissions || []) {
      if (map[row.role]) map[row.role].push(row.permissionKey);
    }
    return map;
  }, [data]);
  async function saveRole(role: string, key: string) {
    const current = new Set(matrix[role] || []);
    if (current.has(key)) current.delete(key); else current.add(key);
    await api("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "permissions", role, keys: [...current] }) });
    reload();
  }
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold">المستخدمون والصلاحيات</h1>
      <p className="text-sm text-[#6d6458]">المالك هو الحساب الوحيد بصلاحية ملكية كاملة. الصلاحيات تُفحص من قاعدة البيانات عند كل عملية.</p>
      <Notice text={error || localError} />
      <Notice text={message} tone="ok" />
      <div className="grid gap-2 rounded-3xl bg-white p-4 md:grid-cols-2">
        <input className="field" placeholder="الاسم" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="field" placeholder="البريد" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="field" placeholder="الهاتف" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <input className="field" placeholder="كلمة المرور" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <select className="select" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
          {ASSIGNABLE_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
        </select>
        <button className="btn-gold" onClick={async () => { try { await api("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }); setMessage("تمت إضافة المستخدم."); setForm({ name: "", email: "", phone: "", password: "", role: "employee" }); reload(); } catch (err) { setLocalError(err instanceof Error ? err.message : "خطأ"); } }}>إضافة مستخدم</button>
      </div>
      {(data?.users || []).map((user) => {
        const roleKeys = new Set(matrix[user.role] || []);
        const userOverrides = (data?.overrides || []).filter((item) => item.userId === user.id);
        const overrideMap = new Map(userOverrides.map((item) => [item.permissionKey, item.allowed]));
        return (
          <div key={user.id} className="rounded-2xl bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold">{user.name}</p>
                <p className="text-sm text-[#6d6458]" dir="ltr">{user.email}{user.phone ? ` · ${user.phone}` : ""} · {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role} · {user.active ? "نشط" : "موقوف"}</p>
              </div>
              {user.role !== "owner" ? (
                <div className="flex flex-wrap gap-2">
                  <select className="select !min-h-9 !w-auto" value={user.role} onChange={async (event) => { await api("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "update", id: user.id, role: event.target.value }) }); reload(); }}>
                    {ASSIGNABLE_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                  <button className="btn-navy !min-h-9" onClick={async () => { const next = prompt("كلمة المرور الجديدة (8 أحرف على الأقل)"); if (!next) return; try { await api("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "update", id: user.id, password: next }) }); setMessage(`تم تغيير كلمة مرور ${user.name}.`); } catch (err) { setLocalError(err instanceof Error ? err.message : "تعذر التغيير"); } }}>كلمة مرور</button>
                  <button className="btn-navy !min-h-9" onClick={async () => { await api("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "update", id: user.id, active: !user.active }) }); reload(); }}>{user.active ? "إيقاف" : "تفعيل"}</button>
                  <button className="btn-ghost !min-h-9 !text-[#1a1406]" onClick={async () => { if (confirm("حذف المستخدم؟")) { await api("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", id: user.id }) }); reload(); } }}>حذف</button>
                </div>
              ) : (
                <p className="text-sm text-[#6d5420]">حساب المالك: صلاحيات كاملة ولا يمكن إيقافه أو حذفه.</p>
              )}
            </div>
            {user.role !== "owner" && (
              <details className="mt-2 border-t border-[#e7dfcf] pt-2">
                <summary className="cursor-pointer text-sm font-bold text-[#6d5420]">صلاحيات فردية لهذا المستخدم (تجاوز دور {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role})</summary>
                <div className="mt-2 grid gap-1 md:grid-cols-2">
                  {PERMISSIONS.map((permission) => {
                    const override = overrideMap.get(permission.key);
                    const checked = override === undefined ? roleKeys.has(permission.key) : override;
                    return (
                      <label key={permission.key} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-[#faf6ee]">
                        <input type="checkbox" checked={checked} onChange={async () => {
                          const nextMap = new Map(overrideMap);
                          nextMap.set(permission.key, !(override === undefined ? roleKeys.has(permission.key) : override));
                          const overrides = [...nextMap.entries()].map(([key, allowed]) => ({ key, allowed }));
                          await api("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "update", id: user.id, overrides }) });
                          reload();
                        }} />
                        {permission.label}
                      </label>
                    );
                  })}
                </div>
              </details>
            )}
          </div>
        );
      })}
      <div className="table-wrap rounded-3xl bg-white p-3">
        <h2 className="mb-3 font-extrabold">مصفوفة الصلاحيات</h2>
        <table className="data">
          <thead><tr><th>الصلاحية</th><th>مشرف</th><th>مسئول</th><th>موظف</th></tr></thead>
          <tbody>
            {PERMISSIONS.map((permission) => (
              <tr key={permission.key}>
                <td>{permission.label}</td>
                {(["supervisor", "manager", "employee"] as const).map((role) => (
                  <td key={role}><input type="checkbox" checked={(matrix[role] || []).includes(permission.key)} onChange={() => saveRole(role, permission.key)} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsPage() {
  const { data, error, reload } = useApi<Record<string, unknown>>("/api/settings");
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [picker, setPicker] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [password, setPassword] = useState({ currentPassword: "", nextPassword: "" });
  useEffect(() => { if (data) setForm(data); }, [data]);
  if (error) return <Notice text={error} />;
  if (!form) return <p>جارٍ التحميل...</p>;
  const phones = (form.phones as { number: string; label?: string }[]) || [];
  const whatsappNumbers = (form.whatsappNumbers as string[]) || [];
  const socials = (form.socials as Record<string, string>) || {};
  async function save() {
    try {
      await api("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      setMessage("تم حفظ الإعدادات وتطبيقها على الموقع.");
      reload();
    } catch (err) { setLocalError(err instanceof Error ? err.message : "تعذر الحفظ"); }
  }
  return (
    <div className="grid gap-3 rounded-3xl bg-white p-4">
      <h1 className="text-2xl font-extrabold">إعدادات الموقع</h1>
      <p className="rounded-2xl border border-[#d4af37]/30 bg-[#fffaf0] p-3 text-sm leading-7 text-[#6d5420]">يمكنك رفع الشعار الرسمي، غلاف الموقع، والصورة الشخصية من قسم الصور أدناه: اضغط «رفع أو استبدال»، ثم ارفع الملف أو اختره من مكتبة الوسائط، وبعد الضغط على «حفظ الإعدادات» سيظهر فوراً في الموقع.</p>
      <Notice text={localError} />
      <Notice text={message} tone="ok" />
      {[["siteName", "اسم الموقع"], ["tagline", "الشعار النصي"], ["heroTitle", "عنوان الواجهة"], ["heroSubtitle", "العنوان الفرعي"], ["heroMotto", "العبارة"], ["trustLine", "سطر الثقة"], ["email", "البريد الإلكتروني"], ["website", "الموقع الإلكتروني"], ["workingHours", "ساعات العمل"], ["addressNote", "العنوان"], ["gaId", "Google Analytics ID"], ["pixelId", "Meta Pixel ID"], ["seoTitle", "عنوان SEO الافتراضي"], ["canonicalBase", "الرابط الأساسي"]].map(([key, label]) => (
        <Field key={key} label={label}><input className="field" value={String(form[key] || "")} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></Field>
      ))}
      <Field label="نبذة قصيرة"><textarea className="area" value={String(form.aboutShort || "")} onChange={(event) => setForm({ ...form, aboutShort: event.target.value })} /></Field>
      <Field label="نبذة تفصيلية"><textarea className="area" value={String(form.aboutLong || "")} onChange={(event) => setForm({ ...form, aboutLong: event.target.value })} /></Field>
      <Field label="وصف SEO"><textarea className="area" value={String(form.seoDescription || "")} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.robotsIndex)} onChange={(event) => setForm({ ...form, robotsIndex: event.target.checked })} /> السماح بالفهرسة</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.hideSetupHint)} onChange={(event) => setForm({ ...form, hideSetupHint: event.target.checked })} /> إخفاء بيانات الدخول الأولية</label>
      <div>
        <p className="mb-2 font-bold">أرقام الهاتف</p>
        {phones.map((phone, index) => <input key={index} className="field mb-2" value={phone.number} onChange={(event) => setForm({ ...form, phones: phones.map((item, i) => i === index ? { ...item, number: event.target.value } : item) })} />)}
        <button className="btn-navy !min-h-9" type="button" onClick={() => setForm({ ...form, phones: [...phones, { number: "", label: "موبايل" }] })}>إضافة رقم</button>
      </div>
      <div>
        <p className="mb-2 font-bold">أرقام واتساب</p>
        {whatsappNumbers.map((phone, index) => <input key={index} className="field mb-2" value={phone} onChange={(event) => setForm({ ...form, whatsappNumbers: whatsappNumbers.map((item, i) => i === index ? event.target.value : item) })} />)}
        <button className="btn-navy !min-h-9" type="button" onClick={() => setForm({ ...form, whatsappNumbers: [...whatsappNumbers, ""] })}>إضافة واتساب</button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {["facebook", "instagram", "tiktok", "youtube", "x", "linkedin"].map((key) => (
          <Field key={key} label={key}><input className="field" value={socials[key] || ""} onChange={(event) => setForm({ ...form, socials: { ...socials, [key]: event.target.value } })} /></Field>
        ))}
      </div>
      <div>
        <p className="mb-1 font-bold">صور الهوية</p>
        <p className="mb-3 rounded-2xl border border-[#d4af37]/25 bg-[#fffaf0] p-3 text-xs leading-6 text-[#6d5420]">تُضغط كل صورة تلقائياً وتُحوَّل إلى WEBP بعد الرفع. المقاسات الموصى بها: الشعار 560×560 بخلفية شفافة PNG · الأيقونة 192×192 شفافة · الغلاف 1920×1080 · الصورة الشخصية 800×1000.</p>
        <div className="grid gap-3 md:grid-cols-2">
        {[["logoMediaId", "الشعار", "logoUrl"], ["faviconMediaId", "أيقونة الموقع", "faviconUrl"], ["coverMediaId", "غلاف الموقع", "coverUrl"], ["personalPhotoMediaId", "الصورة الشخصية", "personalPhotoUrl"], ["ogImageMediaId", "صورة المشاركة", "ogImageUrl"]].map(([key, label, urlKey]) => (
          <div key={key} className="rounded-2xl border p-3">
            <p className="mb-2 font-bold">{label}</p>
            {form[urlKey] ? <img src={String(form[urlKey])} alt="" className="mb-2 h-24 object-contain" /> : <p className="mb-2 text-xs text-[#6d6458]">لا توجد صورة مرفوعة.</p>}
            <button className="btn-navy !min-h-9" type="button" onClick={() => setPicker(key)}>رفع أو استبدال</button>
            <button className="btn-ghost !min-h-9 !text-[#1a1406]" type="button" onClick={() => setForm({ ...form, [key]: null, [urlKey]: "" })}>إزالة</button>
          </div>
        ))}
        </div>
      </div>
      <button className="btn-gold w-fit" onClick={save}>حفظ الإعدادات</button>
      <div className="grid gap-2 border-t pt-3 md:grid-cols-2">
        <input className="field" type="password" placeholder="كلمة المرور الحالية" value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} />
        <input className="field" type="password" placeholder="كلمة المرور الجديدة" value={password.nextPassword} onChange={(event) => setPassword({ ...password, nextPassword: event.target.value })} />
        <button className="btn-navy" onClick={async () => { try { await api("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "password", ...password }) }); setMessage("تم تغيير كلمة المرور."); } catch (err) { setLocalError(err instanceof Error ? err.message : "تعذر التغيير"); } }}>تغيير كلمة المرور</button>
      </div>
      {picker && <Modal title="اختيار صورة" onClose={() => setPicker(null)}><MediaPicker folder="brand" onSelect={(item) => { setForm({ ...form, [picker]: item.id, [`${picker.replace("MediaId", "")}Url`]: item.url }); setPicker(null); }} /></Modal>}
    </div>
  );
}

function SeoGscCard() {
  const { data, reload } = useApi<Record<string, unknown>>("/api/settings");
  const [verification, setVerification] = useState<string | null>(null);
  const [base, setBase] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (!data) return null;
  const v = verification === null ? String(data.gscVerification || "") : verification;
  const b = base === null ? String(data.canonicalBase || "") : base;
  return (
    <div className="rounded-3xl border border-[#d4af37]/40 bg-[#10203a] p-4 text-white">
      <h2 className="font-extrabold text-[#f0d78c]">Google Search Console — أرشفة جوجل</h2>
      <ol className="mt-2 grid list-inside list-decimal gap-1 text-sm leading-7">
        <li>من <span dir="ltr">search.google.com/search-console</span> اضغط «إضافة ملكية» ثم «بادئة URL» واكتب رابط الموقع الحالي.</li>
        <li>اختر طريقة التحقق «وسم HTML» وانسخ الكود والصقه هنا، ثم احفظ.</li>
        <li>ارجع لصفحة التحقق واضغط «تحقق»، ثم أرسل خريطة الموقع من رابط sitemap أدناه.</li>
      </ol>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <Field label="رمز تحقق Google Search Console"><input className="field" dir="ltr" value={v} onChange={(event) => setVerification(event.target.value)} placeholder="google-site-verification=..." /></Field>
        <Field label="الرابط الأساسي للموقع (Canonical)"><input className="field" dir="ltr" value={b} onChange={(event) => setBase(event.target.value)} placeholder="https://your-link.com" /></Field>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button className="btn-gold !min-h-9" onClick={async () => { setError(""); try { await api("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...(data as object), gscVerification: v, canonicalBase: b }) }); setMessage("تم الحفظ. الرمز يظهر الآن في ترويسة الموقع وسيستخدم الرابط الجديد في Canonical وSitemap."); reload(); } catch (err) { setError(err instanceof Error ? err.message : "تعذر الحفظ"); } }}>حفظ</button>
        <span className="text-sm">
          خريطة الموقع: <a className="text-[#f0d78c] underline" href="/sitemap.xml" target="_blank" rel="noreferrer">/sitemap.xml</a>
        </span>
      </div>
      <Notice text={error} />
      <Notice text={message} tone="ok" />
    </div>
  );
}

function SeoPage() {
  const gsc = <SeoGscCard />;
  const home = useApi<Record<string, unknown>>("/api/settings?scope=seo");
  const properties = useApi<{ properties: PropertyView[] }>("/api/properties");
  const pages = useApi<{ id: string; title: string; slug: string; seoTitle: string; seoDescription: string; isSystem: boolean }[]>("/api/content?resource=pages");
  const articles = useApi<{ id: string; title: string; slug: string; seoTitle: string; seoDescription: string }[]>("/api/content?resource=articles");
  const services = useApi<{ id: string; title: string; slug: string; seoTitle: string; seoDescription: string }[]>("/api/content?resource=services");
  const areas = useApi<{ id: string; name: string; slug: string; seoTitle: string; seoDescription: string }[]>("/api/content?resource=areas");
  const [message, setMessage] = useState("");
  async function save(entity: string, id: string, seoTitle: string, seoDescription: string, slug?: string) {
    await api("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "seo", entity, id, seoTitle, seoDescription, slug }) });
    setMessage("تم تحديث SEO.");
  }
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold">SEO</h1>
      {gsc}
      <p className="text-sm"><a className="text-[#8a6a1d]" href="/sitemap.xml">sitemap.xml</a> · <a className="text-[#8a6a1d]" href="/robots.txt">robots.txt</a></p>
      <Notice text={message} tone="ok" />
      <SeoRow title="الرئيسية" initialTitle={String(home.data?.seoTitle || "")} initialDescription={String(home.data?.seoDescription || "")} onSave={(seoTitle, seoDescription) => save("home", "", seoTitle, seoDescription)} />
      {(properties.data?.properties || []).map((item) => <SeoRow key={item.id} title={`عقار: ${item.title}`} slug={item.slug} initialTitle={item.seoTitle} initialDescription={item.seoDescription} onSave={(seoTitle, seoDescription, slug) => save("property", item.id, seoTitle, seoDescription, slug)} />)}
      {(articles.data || []).map((item) => <SeoRow key={item.id} title={`مقال: ${item.title}`} slug={item.slug} initialTitle={item.seoTitle} initialDescription={item.seoDescription} onSave={(seoTitle, seoDescription, slug) => save("article", item.id, seoTitle, seoDescription, slug)} />)}
      {(pages.data || []).map((item) => <SeoRow key={item.id} title={`صفحة: ${item.title}`} slug={item.isSystem ? undefined : item.slug} initialTitle={item.seoTitle} initialDescription={item.seoDescription} onSave={(seoTitle, seoDescription, slug) => save("page", item.id, seoTitle, seoDescription, slug)} />)}
      {(services.data || []).map((item) => <SeoRow key={item.id} title={`خدمة: ${item.title}`} slug={item.slug} initialTitle={item.seoTitle || ""} initialDescription={item.seoDescription || ""} onSave={(seoTitle, seoDescription) => save("service", item.id, seoTitle, seoDescription)} />)}
      {(areas.data || []).map((item) => <SeoRow key={item.id} title={`منطقة: ${item.name}`} slug={item.slug} initialTitle={item.seoTitle || ""} initialDescription={item.seoDescription || ""} onSave={(seoTitle, seoDescription) => save("area", item.id, seoTitle, seoDescription)} />)}
    </div>
  );
}

function SeoRow({ title, slug, initialTitle, initialDescription, onSave }: { title: string; slug?: string; initialTitle: string; initialDescription: string; onSave: (title: string, description: string, slug?: string) => Promise<void> }) {
  const [seoTitle, setSeoTitle] = useState(initialTitle);
  const [seoDescription, setSeoDescription] = useState(initialDescription);
  const [nextSlug, setNextSlug] = useState(slug || "");
  useEffect(() => { setSeoTitle(initialTitle); setSeoDescription(initialDescription); setNextSlug(slug || ""); }, [initialTitle, initialDescription, slug]);
  return (
    <div className="grid gap-2 rounded-2xl bg-white p-3">
      <p className="font-bold">{title}</p>
      <input className="field" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder="عنوان SEO" />
      <textarea className="area" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} placeholder="الوصف" />
      {slug != null && <input className="field" value={nextSlug} onChange={(event) => setNextSlug(event.target.value)} placeholder="الرابط" />}
      <button className="btn-navy w-fit" onClick={() => onSave(seoTitle, seoDescription, slug != null ? nextSlug : undefined)}>حفظ</button>
    </div>
  );
}

function AnalyticsPage() {
  const { data, error } = useApi<{ counts: Record<string, number>; top: { title: string; viewCount: number }[]; events: { type: string; count: number }[] }>("/api/dashboard?scope=analytics");
  if (error) return <Notice text={error} />;
  if (!data) return <p>جارٍ التحميل...</p>;
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold">الإحصائيات</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="نقرات الاتصال" value={data.counts.calls || 0} />
        <Card title="نقرات واتساب" value={data.counts.whatsapp || 0} />
        <Card title="مشاهدات العقارات" value={data.counts.views || 0} />
        <Card title="طلبات العملاء" value={data.counts.submissions || 0} />
      </div>
      <div className="rounded-3xl bg-white p-4">
        <h2 className="font-extrabold">أكثر العقارات مشاهدة</h2>
        {data.top.length === 0 ? <p className="mt-2 text-sm">لا توجد مشاهدات بعد.</p> : data.top.map((item) => <p key={item.title} className="mt-2 text-sm">{item.title}: {item.viewCount}</p>)}
      </div>
      <p className="text-sm text-[#6d6458]">معرّفات Google Analytics وMeta Pixel تُدار من إعدادات الموقع وتُحمَّل في الصفحات العامة فقط عند إدخالها.</p>
    </div>
  );
}

void REQUEST_KINDS;
void newId;
