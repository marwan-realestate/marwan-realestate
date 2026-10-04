import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  media,
  pages,
  permissions,
  propertyTypes,
  rolePermissions,
  serviceAreas,
  services,
  users,
  websiteSettings,
  type ContentBlock,
} from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { INITIAL_OWNER } from "@/lib/setup";
import { PERMISSIONS, ROLE_DEFAULTS, type ContentBlock as SharedBlock } from "@/lib/shared";

let seedPromise: Promise<void> | null = null;

function block(partial: SharedBlock): ContentBlock {
  return partial;
}

function id() {
  return crypto.randomUUID();
}

export function ensureSeed() {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

async function runSeed() {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION app_can(p_user uuid, p_perm text)
    RETURNS boolean
    LANGUAGE plpgsql
    STABLE
    AS $$
    DECLARE
      v_role text;
      v_active boolean;
      v_override boolean;
    BEGIN
      SELECT role, active INTO v_role, v_active FROM users WHERE id = p_user;
      IF NOT FOUND OR v_active IS DISTINCT FROM true THEN
        RETURN false;
      END IF;
      IF v_role = 'owner' THEN
        RETURN true;
      END IF;
      SELECT allowed INTO v_override
      FROM user_permission_overrides
      WHERE user_id = p_user AND permission_key = p_perm;
      IF FOUND THEN
        RETURN v_override;
      END IF;
      RETURN EXISTS (
        SELECT 1 FROM role_permissions
        WHERE role = v_role AND permission_key = p_perm
      );
    END;
    $$;
  `);

  for (const permission of PERMISSIONS) {
    await db
      .insert(permissions)
      .values({ key: permission.key, label: permission.label, groupName: permission.group })
      .onConflictDoNothing();
  }

  const [settings] = await db.select({ seeded: websiteSettings.permissionsSeeded }).from(websiteSettings).limit(1);
  if (!settings?.seeded) {
    const rows = Object.entries(ROLE_DEFAULTS).flatMap(([role, keys]) =>
      keys.map((permissionKey) => ({ role, permissionKey })),
    );
    if (rows.length) await db.insert(rolePermissions).values(rows).onConflictDoNothing();
  }

  await db
    .insert(users)
    .values({
      name: INITIAL_OWNER.name,
      email: INITIAL_OWNER.email,
      phone: INITIAL_OWNER.phone,
      passwordHash: hashPassword(INITIAL_OWNER.password),
      role: "owner",
      active: true,
    })
    .onConflictDoNothing();

  await db
    .insert(websiteSettings)
    .values({
      id: 1,
      siteName: "محمد مروان للتسويق العقاري",
      tagline: "تسويق ووساطة عقارية",
      heroTitle: "محمد مروان",
      heroSubtitle: "للتسويق العقاري",
      heroMotto: "نحو استثمار عقاري آمن وناجح",
      trustLine: "مصداقية - احترافية - ثقة",
      aboutShort: "تسويق ووساطة عقارية في العبور الجديدة والمرج وعزبة النخل والخصوص. للبيع والشراء والإيجار، وطلبات البحث عن عقار أو عرضه للتسويق.",
      aboutLong:
        "محمد مروان للتسويق العقاري منصة للتسويق والوساطة العقارية. نعرض العقارات التي تتم إضافتها ونشرها من لوحة التحكم، ونستقبل طلبات العملاء للبحث عن عقار أو إضافة عقار للتسويق. بيانات التواصل ومناطق الخدمة قابلة للتعديل من لوحة التحكم، ولا تُعرض معلومات غير مسجّلة.",
      phones: [
        { number: "01110189255", label: "موبايل" },
        { number: "01009338821", label: "موبايل" },
      ],
      whatsappNumbers: ["01110189255", "01009338821"],
      email: "taswekakaraat@gmail.com",
      website: "",
      socials: {},
      workingHours: "",
      addressNote: "",
      gaId: "",
      pixelId: "",
      seoTitle: "محمد مروان للتسويق العقاري",
      seoDescription: "تسويق ووساطة عقارية في العبور الجديدة والمرج وعزبة النخل والخصوص. بيع وشراء وإيجار، وطلبات البحث عن عقار أو عرضه للتسويق.",
      canonicalBase: "",
      robotsIndex: true,
      hideSetupHint: false,
      permissionsSeeded: true,
    })
    .onConflictDoNothing();

  if (!settings?.seeded) {
    await db.update(websiteSettings).set({ permissionsSeeded: true }).where(sql`id = 1`);
  }

  await ensureBrandMedia();

  const typeRows = [
    ["شقة", "apartment", "residential", "apartment", 1],
    ["فيلا", "villa", "residential", "property", 2],
    ["عمارة", "building", "residential", "property", 3],
    ["دوبلكس", "duplex", "residential", "apartment", 4],
    ["استوديو", "studio", "residential", "apartment", 5],
    ["عقار سكني", "residential", "residential", "property", 6],
    ["محل", "shop", "commercial", "shop", 7],
    ["مكتب", "office", "commercial", "shop", 8],
    ["مخزن", "warehouse", "commercial", "shop", 9],
    ["عقار تجاري", "commercial", "commercial", "shop", 10],
    ["أرض", "land", "land", "property", 11],
    ["أخرى", "other", "other", "property", 12],
  ] as const;
  for (const [name, slug, groupName, suggestedTemplate, sortOrder] of typeRows) {
    await db.insert(propertyTypes).values({ name, slug, groupName, suggestedTemplate, sortOrder, active: true }).onConflictDoNothing();
  }

  const serviceRows = [
    ["بيع العقارات", "sell", "key", "تسويق العقارات المعروضة للبيع والتواصل مع المهتمين بالشراء.", 1],
    ["شراء العقارات", "buy", "home", "استقبال طلبات الشراء والبحث ضمن العقارات المتاحة في مناطق الخدمة.", 2],
    ["إيجار قديم", "old-rent", "building", "متابعة عروض وطلبات الإيجار القديم.", 3],
    ["إيجار جديد", "new-rent", "key", "تسويق وحدات الإيجار الجديد وطلبات الاستئجار.", 4],
    ["عقارات سكنية", "residential-units", "home", "شقق وفيلات ودوبلكس واستوديو ووحدات سكنية.", 5],
    ["عقارات تجارية", "commercial-units", "store", "محلات ومكاتب ومخازن ووحدات تجارية.", 6],
    ["استشارات عقارية", "consulting", "consult", "استقبال الاستفسارات العقارية عبر الهاتف أو واتساب.", 7],
    ["إدارة الأملاك", "management", "chart", "تنسيق متابعة الأملاك المعروضة للتسويق حسب الاتفاق مع المالك.", 8],
  ] as const;
  for (const [title, slug, icon, summary, sortOrder] of serviceRows) {
    await db
      .insert(services)
      .values({ title, slug, icon, summary, body: summary, sortOrder, active: true, seoTitle: title, seoDescription: summary })
      .onConflictDoNothing();
  }

  const areaRows = [
    ["العبور الجديدة", "new-obour", 1],
    ["المرج", "el-marg", 2],
    ["عزبة النخل", "ezbet-el-nakhl", 3],
    ["الخصوص", "el-khosous", 4],
  ] as const;
  for (const [name, slug, sortOrder] of areaRows) {
    await db
      .insert(serviceAreas)
      .values({
        name,
        slug,
        sortOrder,
        active: true,
        description: "منطقة ضمن نطاق الخدمة الحالي. يمكن تعديل الوصف أو إيقاف المنطقة من لوحة التحكم.",
        seoTitle: name,
        seoDescription: `عقارات وطلبات ضمن منطقة ${name}.`,
      })
      .onConflictDoNothing();
  }

  const categoryRows = [
    ["إرشادات", "guides"],
    ["خدمات التسويق", "marketing-services"],
    ["ملاحظات السوق", "market-notes"],
  ] as const;
  for (const [name, slug] of categoryRows) {
    await db.insert(categories).values({ name, slug, kind: "article" }).onConflictDoNothing();
  }

  const pageRows = buildPages();
  for (const page of pageRows) {
    await db.insert(pages).values(page).onConflictDoNothing();
  }
}

function buildPages() {
  const about: ContentBlock[] = [
    block({ id: id(), type: "heading", text: "من نحن", level: 2 }),
    block({
      id: id(),
      type: "paragraph",
      text: "محمد مروان للتسويق العقاري يعمل في التسويق والوساطة العقارية. تُعرض في الموقع العقارات التي تتم إضافتها ونشرها من لوحة التحكم، وتُستقبل طلبات البحث عن عقار أو عرض عقار للتسويق.",
    }),
    block({
      id: id(),
      type: "paragraph",
      text: "مناطق الخدمة الأولية: العبور الجديدة، المرج، عزبة النخل، والخصوص. يمكن لصاحب الموقع إضافة مناطق أو تعديلها أو إيقافها دون تعديل الكود.",
    }),
    block({
      id: id(),
      type: "section",
      title: "كيف نتواصل",
      body: "الاتصال وواتساب متاحان على الرقمين 01110189255 و01009338821. يمكن تغيير الأرقام والبريد وساعات العمل والروابط من إعدادات الموقع.",
    }),
    block({
      id: id(),
      type: "links",
      items: [
        { label: "العقارات", href: "/properties" },
        { label: "اطلب عقارك", href: "/request" },
        { label: "أضف عقارك", href: "/add-property" },
        { label: "اتصل بنا", href: "/contact" },
      ],
    }),
  ];

  const faq: ContentBlock[] = [
    block({
      id: id(),
      type: "section",
      title: "كيف أطلب عقاراً؟",
      body: "من صفحة اطلب عقارك يمكن إرسال النوع والمنطقة والميزانية والتفاصيل. كما يمكن الاتصال أو مراسلة واتساب على الأرقام الظاهرة في الموقع.",
    }),
    block({
      id: id(),
      type: "section",
      title: "كيف أضيف عقاراً للتسويق؟",
      body: "من صفحة أضف عقارك أرسل بيانات العقار ووسيلة التواصل. بعد المراجعة يمكن نشره من لوحة التحكم إذا كان مناسباً للعرض.",
    }),
    block({
      id: id(),
      type: "section",
      title: "ما مناطق الخدمة الحالية؟",
      body: "العبور الجديدة، المرج، عزبة النخل، والخصوص. أي تحديث للقائمة يظهر في صفحة مناطق الخدمة بعد حفظه من لوحة التحكم.",
    }),
    block({
      id: id(),
      type: "section",
      title: "هل ظهور العقار يعني إتمام الصفقة؟",
      body: "لا. الموقع للتسويق والوساطة وعرض البيانات المدخلة. توافر العقار والسعر يُؤكدان بالتواصل المباشر، ولا يُضمن إتمام البيع أو الإيجار بمجرد النشر.",
    }),
    block({
      id: id(),
      type: "section",
      title: "كيف أتابع طلبي؟",
      body: "يُسجَّل الطلب بحالة جديد ثم يمكن تحديث حالته داخلياً. للمتابعة اتصل أو راسل واتساب على الأرقام المسجّلة في الموقع.",
    }),
  ];

  const privacy: ContentBlock[] = [
    block({ id: id(), type: "heading", text: "سياسة الخصوصية", level: 2 }),
    block({
      id: id(),
      type: "paragraph",
      text: "عند إرسال نموذج تواصل أو طلب عقار نحتفظ بالاسم ورقم الهاتف وواتساب وتفاصيل الطلب لمتابعة الطلب فقط. لا نطلب بيانات دفع عبر هذا الموقع.",
    }),
    block({
      id: id(),
      type: "paragraph",
      text: "تُستخدم إحصائيات النقر على الاتصال وواتساب وزيارات صفحات العقارات لتحسين المتابعة. إذا تم إدخال معرّف Google Analytics أو Meta Pixel من لوحة التحكم فسيتم تحميله في الصفحات العامة.",
    }),
    block({
      id: id(),
      type: "paragraph",
      text: "لطلب تعديل أو حذف بيانات أرسلتموها، تواصلوا عبر أرقام الهاتف الظاهرة في صفحة اتصل بنا.",
    }),
  ];

  const terms: ContentBlock[] = [
    block({ id: id(), type: "heading", text: "اتفاقية الاستخدام", level: 2 }),
    block({
      id: id(),
      type: "paragraph",
      text: "استخدام الموقع يعني الاطلاع على العقارات والصفحات المنشورة وإرسال طلبات التواصل. المعلومات المعروضة هي ما تم إدخاله ونشره من لوحة التحكم، وقد تتغير دون إشعار مسبق داخل الموقع.",
    }),
    block({
      id: id(),
      type: "paragraph",
      text: "التسويق والوساطة لا يشكّلان عرضاً ملزماً ولا ضماناً لإتمام البيع أو الشراء أو الإيجار. يُرجى تأكيد السعر والتوافر والمساحة بالتواصل المباشر قبل أي التزام.",
    }),
    block({
      id: id(),
      type: "paragraph",
      text: "يُمنع إرسال بيانات غير صحيحة أو محتوى مخالف عبر النماذج. لصاحب الموقع رفض نشر أي عقار أو إغلاق أي طلب.",
    }),
  ];

  const home: ContentBlock[] = [
    block({ id: id(), type: "heading", text: "تسويق ووساطة عقارية", level: 2 }),
    block({
      id: id(),
      type: "paragraph",
      text: "يمكنكم تصفح العقارات المنشورة، أو إرسال طلب للبحث عن عقار، أو عرض عقار للتسويق. كل المحتوى الظاهر هنا يُدار من لوحة التحكم.",
    }),
    block({ id: id(), type: "button", label: "اطلب عقارك", href: "/request" }),
  ];

  const simple = (title: string, text: string): ContentBlock[] => [
    block({ id: id(), type: "heading", text: title, level: 2 }),
    block({ id: id(), type: "paragraph", text }),
  ];

  return [
    page("الرئيسية", "home", "home", home, false, 0),
    page("من نحن", "about", "about", about, false, 1),
    page("خدماتنا", "services", "services", simple("خدماتنا", "الخدمات أدناه مأخوذة من لوحة التحكم ويمكن تعديل عناوينها ووصفها وترتيبها."), false, 2),
    page("العقارات", "properties", "properties", simple("العقارات", "تظهر هنا العقارات المنشورة فقط. يمكن تصفية النتائج حسب النوع والعملية والمنطقة."), false, 3),
    page("مناطق الخدمة", "areas", "areas", simple("مناطق الخدمة", "هذه المناطق مفعّلة حالياً. أي منطقة يتم إيقافها تختفي من الموقع العام."), false, 4),
    page("اطلب عقارك", "request", "request", simple("اطلب عقارك", "أرسلوا مواصفات العقار المطلوب وسنتلقى الطلب في لوحة المتابعة."), false, 5),
    page("أضف عقارك", "add-property", "list", simple("أضف عقارك", "أرسلوا بيانات العقار المراد تسويقه. النشر على الموقع يتم بعد المراجعة من لوحة التحكم."), false, 6),
    page("المدونة", "blog", "blog", simple("المدونة", "المقالات المنشورة فقط تظهر للزوار. المسودات تبقى داخل لوحة التحكم."), false, 7),
    page("الأسئلة الشائعة", "faq", "faq", faq, false, 8),
    page("اتصل بنا", "contact", "contact", simple("اتصل بنا", "استخدموا الاتصال أو واتساب أو نموذج التواصل. بيانات التواصل تُدار من الإعدادات."), false, 9),
    page("سياسة الخصوصية", "privacy", "privacy", privacy, false, 10),
    page("اتفاقية الاستخدام", "terms", "terms", terms, false, 11),
    page("الصفحة غير موجودة", "not-found", "not_found", simple("الصفحة غير موجودة", "الرابط غير متاح. يمكنكم العودة للرئيسية أو تصفح العقارات."), false, 12),
  ];
}

function page(title: string, slug: string, systemKey: string, blocks: ContentBlock[], showInNav: boolean, sortOrder: number) {
  return {
    title,
    slug,
    systemKey,
    excerpt: "",
    blocks,
    showInNav,
    navLabel: title,
    isSystem: true,
    published: true,
    sortOrder,
    seoTitle: title === "الرئيسية" ? "محمد مروان للتسويق العقاري" : title,
    seoDescription: "",
    canonicalUrl: "",
  };
}

/**
 * يستورد صور الهوية الأساسية (الشعار، الأيقونة، الغلاف) إلى مكتبة الوسائط
 * عند أول تشغيل حتى تظهر قابلة للاختيار والاستبدال من لوحة التحكم.
 * لا يعمل إلا إذا كانت المكتبة فارغة، فلا يمس أي اختيار قام به المالك.
 */
async function ensureBrandMedia() {
  const [existing] = await db.select({ id: media.id }).from(media).limit(1);
  if (existing) return;
  const uploadDir = path.join(process.cwd(), "data", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const candidates: { file: string; name: string; alt: string; column: keyof typeof websiteSettings.$inferInsert }[] = [
    { file: "logo.webp", name: "الشعار الرسمي", alt: "شعار محمد مروان للتسويق العقاري", column: "logoMediaId" },
    { file: "icon-192.png", name: "أيقونة الموقع", alt: "أيقونة الموقع", column: "faviconMediaId" },
    { file: "hero-cover.jpg", name: "غلاف الموقع", alt: "غلاف الموقع", column: "coverMediaId" },
  ];
  for (const item of candidates) {
    const source = path.join(process.cwd(), "public", "brand", item.file);
    if (!existsSync(source)) continue;
    try {
      const image = sharp(source).rotate();
      const meta = await image.metadata();
      const output = await image.webp({ quality: 82, alphaQuality: 95 }).toBuffer();
      const mediaId = crypto.randomUUID();
      await writeFile(path.join(uploadDir, `${mediaId}.webp`), output);
      await db.insert(media).values({
        id: mediaId,
        filename: `${mediaId}.webp`,
        originalName: item.name,
        mime: "image/webp",
        size: output.length,
        width: meta.width || null,
        height: meta.height || null,
        alt: item.alt,
        folder: "brand",
      });
      await db.update(websiteSettings).set({ [item.column]: mediaId }).where(eq(websiteSettings.id, 1));
    } catch {
      // ملف صورة تالف: نتجاوزه دون إيقاف التهيئة
    }
  }
}
