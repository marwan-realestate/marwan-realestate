export const ROLE_LABELS = {
  owner: "مالك",
  supervisor: "مشرف",
  manager: "مسئول",
  employee: "موظف",
} as const;

export const ASSIGNABLE_ROLES = [
  { value: "supervisor", label: "مشرف" },
  { value: "manager", label: "مسئول" },
  { value: "employee", label: "موظف" },
] as const;

export type Role = keyof typeof ROLE_LABELS;

export const PERMISSIONS = [
  { key: "dashboard.view", label: "عرض لوحة التحكم", group: "عام" },
  { key: "properties.view", label: "عرض العقارات", group: "العقارات" },
  { key: "properties.create", label: "إضافة عقار", group: "العقارات" },
  { key: "properties.edit", label: "تعديل عقار", group: "العقارات" },
  { key: "properties.delete", label: "حذف عقار", group: "العقارات" },
  { key: "properties.publish", label: "نشر العقارات وتمييزها", group: "العقارات" },
  { key: "requests.view", label: "عرض طلبات العملاء", group: "الطلبات" },
  { key: "requests.edit", label: "متابعة الطلبات", group: "الطلبات" },
  { key: "requests.delete", label: "حذف الطلبات", group: "الطلبات" },
  { key: "articles.view", label: "عرض المقالات", group: "المحتوى" },
  { key: "articles.create", label: "إنشاء مقال", group: "المحتوى" },
  { key: "articles.edit", label: "تعديل مقال", group: "المحتوى" },
  { key: "articles.delete", label: "حذف مقال", group: "المحتوى" },
  { key: "articles.publish", label: "نشر المقالات", group: "المحتوى" },
  { key: "pages.view", label: "عرض الصفحات", group: "المحتوى" },
  { key: "pages.edit", label: "تعديل الصفحات", group: "المحتوى" },
  { key: "services.manage", label: "إدارة الخدمات", group: "المحتوى" },
  { key: "areas.manage", label: "إدارة مناطق الخدمة", group: "المحتوى" },
  { key: "media.manage", label: "إدارة الوسائط", group: "الوسائط" },
  { key: "templates.manage", label: "إنشاء البطاقات الإعلانية", group: "الإعلانات" },
  { key: "templates.publish", label: "نشر البطاقات الإعلانية", group: "الإعلانات" },
  { key: "users.manage", label: "إدارة المستخدمين والصلاحيات", group: "النظام" },
  { key: "settings.manage", label: "إعدادات الموقع", group: "النظام" },
  { key: "seo.manage", label: "إعدادات SEO", group: "النظام" },
  { key: "analytics.view", label: "عرض الإحصائيات", group: "النظام" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const ROLE_DEFAULTS: Record<Exclude<Role, "owner">, PermissionKey[]> = {
  supervisor: PERMISSIONS.map((p) => p.key).filter(
    (key) => key !== "users.manage" && key !== "settings.manage",
  ),
  manager: [
    "dashboard.view",
    "properties.view",
    "properties.create",
    "properties.edit",
    "properties.delete",
    "properties.publish",
    "requests.view",
    "requests.edit",
    "requests.delete",
    "templates.manage",
    "templates.publish",
    "media.manage",
    "articles.view",
    "articles.create",
    "articles.edit",
    "analytics.view",
  ],
  employee: [
    "dashboard.view",
    "properties.view",
    "properties.create",
    "properties.edit",
    "requests.view",
    "requests.edit",
    "templates.manage",
    "media.manage",
  ],
};

export const TRANSACTIONS = [
  { value: "sale", label: "للبيع" },
  { value: "rent", label: "للإيجار" },
  { value: "wanted_buy", label: "مطلوب للشراء" },
  { value: "wanted_rent", label: "مطلوب للإيجار" },
] as const;

export const PROPERTY_STATUSES = [
  { value: "available", label: "متاح" },
  { value: "sold", label: "تم البيع" },
  { value: "rented", label: "تم التأجير" },
  { value: "archived", label: "مؤرشف" },
] as const;

export const REQUEST_STATUSES = [
  { value: "new", label: "جديد" },
  { value: "following", label: "قيد المتابعة" },
  { value: "contacted", label: "تم التواصل" },
  { value: "interested", label: "مهتم" },
  { value: "closed", label: "مغلق" },
  { value: "not_interested", label: "غير مهتم" },
] as const;

export const REQUEST_KINDS = [
  { value: "request_property", label: "اطلب عقارك" },
  { value: "add_property", label: "أضف عقارك" },
  { value: "contact", label: "رسالة تواصل" },
] as const;

export const AD_TEMPLATES = [
  {
    value: "apartment",
    label: "قالب الشقق",
    description: "للشقق والدوبلكس والاستوديو، مع إبراز الغرف والحمامات والدور والمساحة.",
  },
  {
    value: "property",
    label: "قالب العقارات",
    description: "قالب عام للفيلات والأراضي والعمارات والعقارات المتنوعة.",
  },
  {
    value: "shop",
    label: "قالب المحلات",
    description: "للمحلات والمكاتب والمخازن، مع إبراز النشاط والواجهة والرؤية.",
  },
] as const;

export type AdTemplate = (typeof AD_TEMPLATES)[number]["value"];

export const FIELD_GROUPS = {
  residential: ["bedrooms", "bathrooms", "floor", "finishing", "elevator", "balcony", "parking", "buildingAge", "unitsCount"],
  commercial: ["commercialActivity", "frontage", "floor", "streetVisibility", "suitableActivities", "parking", "unitsCount"],
  land: [] as string[],
  other: ["floor", "areaNote"],
} as const;

export type ContentBlock = {
  id: string;
  type: "heading" | "paragraph" | "image" | "button" | "section" | "links";
  text?: string;
  level?: 2 | 3;
  mediaId?: string;
  alt?: string;
  url?: string;
  label?: string;
  href?: string;
  title?: string;
  body?: string;
  items?: { label: string; href: string }[];
};

export type PhoneEntry = { number: string; label?: string };
export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  x?: string;
  linkedin?: string;
  snapchat?: string;
};

export type PublicSettings = {
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroMotto: string;
  trustLine: string;
  aboutShort: string;
  aboutLong: string;
  phones: PhoneEntry[];
  whatsappNumbers: string[];
  email: string;
  website: string;
  socials: SocialLinks;
  workingHours: string;
  addressNote: string;
  gaId: string;
  pixelId: string;
  seoTitle: string;
  seoDescription: string;
  canonicalBase: string;
  gscVerification: string;
  robotsIndex: boolean;
  logoUrl: string;
  faviconUrl: string;
  coverUrl: string;
  personalPhotoUrl: string;
  ogImageUrl: string;
  hideSetupHint: boolean;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  roleLabel: string;
};

export const SYSTEM_ROUTES: Record<string, string> = {
  home: "/",
  about: "/about",
  services: "/services",
  properties: "/properties",
  areas: "/areas",
  request: "/request",
  list: "/add-property",
  blog: "/blog",
  faq: "/faq",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  not_found: "/404",
};

export function labelOf(list: readonly { value: string; label: string }[], value: string | null | undefined) {
  return list.find((item) => item.value === value)?.label || "";
}

export function slugify(input: string) {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return slug || "item";
}

const ARABIC_LATIN: Record<string, string> = {
  "أ": "a", "إ": "a", "آ": "a", "ا": "a", "ء": "a", "ٱ": "a", "ئ": "y", "ؤ": "w",
  "ب": "b", "ت": "t", "ث": "th", "ج": "j", "ح": "h", "خ": "kh", "د": "d", "ذ": "dh",
  "ر": "r", "ز": "z", "س": "s", "ش": "sh", "ص": "s", "ض": "d", "ط": "t", "ظ": "z",
  "ع": "a", "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n",
  "ه": "h", "ة": "a", "و": "w", "ي": "y", "ى": "a", "ـ": "",
};

export function toPublicSlug(input: string) {
  const readable = input.trim().replace(/[\u0621-\u064A\u0640]/g, (char) => ARABIC_LATIN[char] ?? "");
  const ascii = readable
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  if (ascii.length >= 2) return ascii;
  let hash = 2166136261;
  for (const char of input.trim()) {
    hash ^= char.codePointAt(0) || 0;
    hash = Math.imul(hash, 16777619);
  }
  return `item-${(hash >>> 0).toString(36)}`;
}

export function formatPrice(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const formatted = new Intl.NumberFormat("ar-EG-u-nu-latn", { maximumFractionDigits: 0 }).format(Number(value));
  return `${formatted} ج.م`;
}

export function formatArea(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const formatted = new Intl.NumberFormat("ar-EG-u-nu-latn", { maximumFractionDigits: 1 }).format(Number(value));
  return `${formatted} م²`;
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(date);
}

export function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

export function whatsappHref(phone: string, text?: string) {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `20${digits.slice(1)}`;
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function safeHref(href: string | undefined | null) {
  const value = (href || "").trim();
  if (!value) return "#";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(tel:|mailto:)/i.test(value)) return value;
  return "#";
}

export function mediaPath(id: string | null | undefined, fallback = "") {
  if (!id) return fallback;
  return `/api/files/${id}`;
}

export function resolveContacts(
  settings: Pick<PublicSettings, "phones" | "whatsappNumbers">,
  specific?: { phone?: string | null; whatsapp?: string | null },
) {
  const phones = specific?.phone?.trim()
    ? [specific.phone.trim()]
    : settings.phones.map((item) => item.number).filter(Boolean);
  const whatsapps = specific?.whatsapp?.trim()
    ? [specific.whatsapp.trim()]
    : settings.whatsappNumbers.filter(Boolean);
  return { phones, whatsapps };
}

export function newId() {
  return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function emptyBlock(type: ContentBlock["type"]): ContentBlock {
  const id = newId();
  if (type === "heading") return { id, type, text: "", level: 2 };
  if (type === "paragraph") return { id, type, text: "" };
  if (type === "image") return { id, type, mediaId: "", alt: "", url: "" };
  if (type === "button") return { id, type, label: "", href: "/" };
  if (type === "section") return { id, type, title: "", body: "" };
  return { id, type, items: [{ label: "", href: "/" }] };
}

export const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string }[] = [
  { key: "facebook", label: "فيسبوك" },
  { key: "instagram", label: "إنستغرام" },
  { key: "tiktok", label: "تيك توك" },
  { key: "youtube", label: "يوتيوب" },
  { key: "x", label: "X" },
  { key: "linkedin", label: "لينكدإن" },
  { key: "snapchat", label: "سناب شات" },
];

export const TRACK_TYPES = [
  "call_click",
  "whatsapp_click",
  "property_view",
  "contact_submit",
  "request_submit",
  "ad_download",
  "ad_share",
] as const;

export type TrackType = (typeof TRACK_TYPES)[number];

export function decodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
