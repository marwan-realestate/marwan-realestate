"use client";

import { useState } from "react";
import { useApi } from "@/components/admin/kit";

const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

const PATH = {
  check: "m20 6-11 11-5-5",
  copy: "M9 9h10v10H9zM5 15V5h10",
  external: "M15 3h6v6M21 3l-9 9M19 14v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6",
  key: "M15 7a4 4 0 1 0-3.5 4L10 12.5 7 15.5V18h2.5l1-1v-2h2l1.2-1.2A4 4 0 0 0 15 7Z",
  login: "M10 17l5-5-5-5M15 12H3M14 3h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z",
};

type LinkItem = { label: string; note: string; path: string };

const GROUPS: { title: string; hint: string; items: LinkItem[] }[] = [
  {
    title: "روابط الموقع العامة",
    hint: "روابط يراها الزوار ويمكن مشاركتها على واتساب وفيسبوك.",
    items: [
      { label: "الرئيسية", note: "الصفحة الأولى للموقع وواجهة العلامة التجارية", path: "/" },
      { label: "العقارات", note: "قائمة كل العقارات المنشورة مع البحث والفلاتر", path: "/properties" },
      { label: "من نحن", note: "نبذة عن محمد مروان للتسويق العقاري", path: "/about" },
      { label: "خدماتنا", note: "خدمات البيع والشراء والإيجار القديم والجديد", path: "/services" },
      { label: "مناطق الخدمة", note: "العبور الجديدة والمرج وعزبة النخل والخصوص", path: "/areas" },
      { label: "المدونة", note: "المقالات المنشورة من لوحة التحكم", path: "/blog" },
      { label: "اتصل بنا", note: "أرقام التواصل ونموذج المراسلة وساعات العمل", path: "/contact" },
      { label: "الأسئلة الشائعة", note: "أسئلة العملاء وإجاباتها", path: "/faq" },
      { label: "سياسة الخصوصية", note: "كيفية التعامل مع بيانات العملاء", path: "/privacy" },
      { label: "اتفاقية الاستخدام", note: "شروط استخدام الموقع", path: "/terms" },
    ],
  },
  {
    title: "روابط نماذج العملاء",
    hint: "شارك هذه الروابط مع العميل ليصل الطلب مباشرة إلى لوحة المتابعة.",
    items: [
      { label: "رابط الدخول للعملاء (اطلب عقارك)", note: "نموذج العميل الذي يبحث عن شقة أو عقار للبيع أو الإيجار", path: "/request" },
      { label: "أضف عقارك", note: "نموذج الملاك لإرسال عقار للتسويق أو البيع أو الإيجار", path: "/add-property" },
    ],
  },
  {
    title: "روابط لوحة التحكم",
    hint: "روابط الإدارة — لا يراها الزوار ولا تُنشر عامة.",
    items: [
      { label: "رابط دخول لوحة التحكم (للمالك والموظفين)", note: "صفحة الدخول الموحدة للجميع؛ الصلاحيات تختلف حسب الدور", path: "/admin/login" },
      { label: "الرئيسية — لوحة التحكم", note: "المؤشرات والإحصائيات", path: "/admin" },
      { label: "العقارات", note: "إضافة وتعديل وحذف ونسخ ونشر العقارات", path: "/admin/properties" },
      { label: "طلبات العملاء", note: "متابعة الطلبات وتغيير حالتها وإضافة ملاحظات", path: "/admin/requests" },
      { label: "القوالب الإعلانية", note: "قالب الشقق / العقارات / المحلات مع الحفظ والتحميل", path: "/admin/templates" },
      { label: "المقالات", note: "إنشاء وتعديل ونشر المقالات", path: "/admin/articles" },
      { label: "الصفحات", note: "تحرير صفحات الموقع الثابتة", path: "/admin/pages" },
      { label: "الخدمات", note: "إدارة خدمات البيع والشراء والإيجار", path: "/admin/services" },
      { label: "مناطق الخدمة", note: "إضافة وتعديل وحذف المناطق", path: "/admin/areas" },
      { label: "الوسائط", note: "رفع الصور وحذفها واستخدامها في العقارات", path: "/admin/media" },
      { label: "المستخدمون والصلاحيات", note: "إضافة مشرف أو مسئول أو موظف وتحديد صلاحياته", path: "/admin/users" },
      { label: "الإحصائيات", note: "نقرات الاتصال وواتساب والمشاهدات والطلبات", path: "/admin/analytics" },
      { label: "إعدادات الموقع", note: "الشعار والأيقونة والغلاف والصورة الشخصية والأرقام وكلمة السر", path: "/admin/settings" },
      { label: "SEO", note: "عناوين وأوصاف محركات البحث لكل صفحة", path: "/admin/seo" },
    ],
  },
  {
    title: "روابط تقنية",
    hint: "مهمة لأرشفة محركات البحث مثل جوجل.",
    items: [
      { label: "خريطة الموقع Sitemap", note: "قائمة كل الصفحات المنشورة لمحركات البحث", path: "/sitemap.xml" },
      { label: "ملف Robots", note: "تعليمات الفهرسة لمحركات البحث", path: "/robots.txt" },
    ],
  },
];

function CopyRow({ item }: { item: LinkItem }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e7dfcf] bg-white p-3">
      <div className="min-w-0 flex-1">
        <p className="font-bold">{item.label}</p>
        <p className="text-xs text-[#6d6458]">{item.note}</p>
        <p className="mt-1 break-all text-sm text-[#8a6a1d]" dir="ltr">{item.path}</p>
      </div>
      <div className="flex gap-2">
        <a className="btn-navy !min-h-9" href={item.path}><Icon d={PATH.external} size={15} /> فتح</a>
        <button
          className="btn-gold !min-h-9"
          onClick={async () => {
            const base = typeof window === "undefined" ? "" : window.location.origin;
            try {
              await navigator.clipboard.writeText(`${base}${item.path}`);
            } catch {
              /* المتصفح منع الحافظة */
            }
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          }}
        >
          {copied ? <Icon d={PATH.check} size={15} /> : <Icon d={PATH.copy} size={15} />} {copied ? "تم النسخ" : "نسخ الرابط"}
        </button>
      </div>
    </div>
  );
}

export function LinksPage({ adminEmail = "" }: { adminEmail?: string }) {
  const { data } = useApi<{ user: { email: string } | null }>("/api/auth");
  const email = data?.user?.email || adminEmail || "—";
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-extrabold">روابط الموقع المهمة</h1>
      <p className="text-sm text-[#6d6458]">كل رابط مكتوب أمامه وصفه. اضغط «نسخ الرابط» لنسخه كاملاً مع رابط الموقع والمشاركة في أي مكان.</p>

      <div className="rounded-3xl border border-[#d4af37]/40 bg-[#10203a] p-4 text-white">
        <p className="flex items-center gap-2 font-extrabold text-[#f0d78c]"><Icon d={PATH.login} size={18} /> بيانات الدخول وكلمة السر</p>
        <div className="mt-3 grid gap-2 text-sm leading-7">
          <p><b className="text-[#f0d78c]">رابط دخول لوحة التحكم:</b> <span dir="ltr">/admin/login</span> — هو نفسه رابط الدخول للمالك وللموظفين.</p>
          <p><b className="text-[#f0d78c]">البريد الإلكتروني للدخول:</b> <span dir="ltr">{email}</span> — اكتبه في خانة «البريد أو رقم الهاتف» ثم كلمة السر.</p>
          <p><b className="text-[#f0d78c]">الدخول برقم الهاتف:</b> يمكنك كتابة رقم الهاتف المسجّل بدل البريد في نفس الصفحة.</p>
          <p className="flex items-start gap-2"><span className="mt-0.5 shrink-0"><Icon d={PATH.key} size={16} /></span><span><b className="text-[#f0d78c]">كلمة سر لوحة التحكم:</b> لا تُعرض داخل النظام لأسباب أمنية. لتغييرها: <b>إعدادات الموقع ← تغيير كلمة المرور</b> (اكتب الحالية ثم الجديدة 8 أحرف على الأقل). ويمكن تعيين كلمة سر لأي موظف من <b>المستخدمون والصلاحيات ← كلمة مرور</b>.</span></p>
          <p className="flex items-start gap-2"><span className="mt-0.5 shrink-0"><Icon d={PATH.shield} size={16} /></span><span>المالك وحده يستطيع إضافة المستخدمين وتغيير الإعدادات والصلاحيات. إذا نسيت كلمة السر نهائياً: غيّر <span dir="ltr">ADMIN_PASSWORD</span> في ملف البيئة ثم أعد التشغيل.</span></p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="btn-gold !min-h-9" href="/admin/settings">تغيير كلمة المرور</a>
          <a className="btn-ghost !min-h-9" href="/admin/users">إدارة المستخدمين</a>
        </div>
      </div>

      {GROUPS.map((group) => (
        <section key={group.title} className="rounded-3xl bg-white p-4">
          <h2 className="font-extrabold">{group.title}</h2>
          <p className="mt-1 text-xs text-[#6d6458]">{group.hint}</p>
          <div className="mt-3 grid gap-2">{group.items.map((item) => <CopyRow key={item.path} item={item} />)}</div>
        </section>
      ))}
    </div>
  );
}
