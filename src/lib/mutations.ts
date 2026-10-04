import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activityLogs,
  adCards,
  analyticsEvents,
  articles,
  categories,
  customerRequests,
  media,
  pages,
  properties,
  propertyImages,
  propertyTypes,
  requestNotes,
  serviceAreas,
  services,
  userPermissionOverrides,
  users,
  websiteSettings,
  rolePermissions,
  type ContentBlock,
} from "@/db/schema";
import { ApiError, asBool, asNumber, asString, asStringArray } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { toPublicSlug, type PermissionKey, type SessionUser } from "@/lib/shared";

export async function logActivity(userId: string | null, action: string, entityType: string, entityId?: string | null, meta?: Record<string, unknown>) {
  try {
    await db.insert(activityLogs).values({ userId, action, entityType, entityId: entityId || null, meta: meta || null });
  } catch (error) {
    console.error(error);
  }
}

async function uniqueSlug(table: "properties" | "articles" | "pages" | "services" | "areas" | "types" | "categories", base: string, excludeId?: string) {
  const source = toPublicSlug(base);
  let slug = source;
  for (let i = 2; i < 80; i += 1) {
    const existing = await findSlug(table, slug);
    if (!existing || existing === excludeId) return slug;
    slug = `${source}-${i}`;
  }
  return `${source}-${Date.now().toString().slice(-4)}`;
}

async function findSlug(table: string, slug: string) {
  const map = { properties, articles, pages, services, areas: serviceAreas, types: propertyTypes, categories } as const;
  const selected = map[table as keyof typeof map];
  const [row] = await db.select({ id: selected.id }).from(selected).where(eq(selected.slug, slug)).limit(1);
  return row?.id;
}

function cleanSpecs(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({ label: asString((item as { label?: string }).label), value: asString((item as { value?: string }).value) }))
    .filter((item) => item.label && item.value)
    .slice(0, 24);
}

function cleanBlocks(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) return [];
  const result: ContentBlock[] = [];
  for (const item of value) {
    const block = item as ContentBlock;
    if (!block || typeof block !== "object" || !block.type) continue;
    result.push({
      id: block.id || crypto.randomUUID(),
      type: block.type,
      text: asString(block.text),
      level: block.level,
      mediaId: asString(block.mediaId),
      alt: asString(block.alt),
      label: asString(block.label),
      href: asString(block.href),
      title: asString(block.title),
      body: asString(block.body),
      items: Array.isArray(block.items)
        ? block.items
            .map((link) => ({ label: asString(link.label), href: asString(link.href) }))
            .filter((link) => link.label && link.href)
        : [],
    });
  }
  return result.slice(0, 40);
}

export async function saveProperty(input: Record<string, unknown>, user: SessionUser, id?: string) {
  const title = asString(input.title);
  if (title.length < 2) throw new ApiError(400, "عنوان العقار مطلوب.");
  const propertyTypeId = asString(input.propertyTypeId);
  const [type] = propertyTypeId ? await db.select().from(propertyTypes).where(eq(propertyTypes.id, propertyTypeId)).limit(1) : [];
  if (!type) throw new ApiError(400, "اختر نوع العقار.");
  const transactionType = asString(input.transactionType);
  if (!["sale", "rent", "wanted_buy", "wanted_rent"].includes(transactionType)) throw new ApiError(400, "اختر نوع العملية.");
  const slug = await uniqueSlug("properties", asString(input.slug) || title, id);
  const areaId = asString(input.areaId) || null;
  const price = asNumber(input.price);
  if (price != null && price < 0) throw new ApiError(400, "السعر لا يمكن أن يكون سالباً.");
  const areaSqm = asNumber(input.areaSqm);
  const values = {
    title,
    slug,
    propertyTypeId,
    transactionType,
    areaId,
    location: asString(input.location),
    mapsUrl: asString(input.mapsUrl),
    price,
    priceOnRequest: asBool(input.priceOnRequest),
    areaSqm,
    description: asString(input.description),
    phone: asString(input.phone),
    whatsapp: asString(input.whatsapp),
    status: ["available", "sold", "rented", "archived"].includes(asString(input.status)) ? asString(input.status) : "available",
    published: asBool(input.published),
    featured: asBool(input.featured),
    referenceCode: asString(input.referenceCode),
    bedrooms: asNumber(input.bedrooms) == null ? null : Math.max(0, Math.round(asNumber(input.bedrooms) || 0)),
    bathrooms: asNumber(input.bathrooms) == null ? null : Math.max(0, Math.round(asNumber(input.bathrooms) || 0)),
    floor: asString(input.floor),
    finishing: asString(input.finishing),
    elevator: asBool(input.elevator),
    balcony: asBool(input.balcony),
    parking: asBool(input.parking),
    buildingAge: asString(input.buildingAge),
    unitsCount: asNumber(input.unitsCount) == null ? null : Math.max(0, Math.round(asNumber(input.unitsCount) || 0)),
    commercialActivity: asString(input.commercialActivity),
    frontage: asString(input.frontage),
    streetVisibility: asString(input.streetVisibility),
    suitableActivities: asString(input.suitableActivities),
    features: asStringArray(input.features).slice(0, 30),
    customSpecs: cleanSpecs(input.customSpecs),
    seoTitle: asString(input.seoTitle),
    seoDescription: asString(input.seoDescription),
    canonicalUrl: asString(input.canonicalUrl),
    updatedAt: new Date(),
  };
  const images = Array.isArray(input.images) ? input.images : [];
  const imageRows = images
    .map((item, index) => {
      const mediaId = asString((item as { mediaId?: string }).mediaId);
      if (!mediaId) return null;
      return { mediaId, isCover: Boolean((item as { isCover?: boolean }).isCover), sortOrder: index };
    })
    .filter((item): item is { mediaId: string; isCover: boolean; sortOrder: number } => Boolean(item));
  if (imageRows.length && !imageRows.some((item) => item.isCover)) imageRows[0].isCover = true;

  let propertyId = id;
  if (id) {
    const [existing] = await db.select({ id: properties.id }).from(properties).where(eq(properties.id, id)).limit(1);
    if (!existing) throw new ApiError(404, "العقار غير موجود.");
    await db.update(properties).set(values).where(eq(properties.id, id));
  } else {
    const [created] = await db.insert(properties).values({ ...values, createdBy: user.id }).returning({ id: properties.id });
    propertyId = created.id;
  }
  if (!propertyId) throw new ApiError(500, "تعذر حفظ العقار.");
  await db.delete(propertyImages).where(eq(propertyImages.propertyId, propertyId));
  if (imageRows.length) {
    await db.insert(propertyImages).values(imageRows.map((item) => ({ ...item, propertyId: propertyId! })));
  }
  await logActivity(user.id, id ? "property.update" : "property.create", "property", propertyId, { title });
  return propertyId;
}

export async function deleteProperty(id: string, user: SessionUser) {
  const [existing] = await db.select({ id: properties.id, title: properties.title }).from(properties).where(eq(properties.id, id)).limit(1);
  if (!existing) throw new ApiError(404, "العقار غير موجود.");
  await db.delete(properties).where(eq(properties.id, id));
  await logActivity(user.id, "property.delete", "property", id, { title: existing.title });
}

export async function duplicateProperty(id: string, user: SessionUser) {
  const [existing] = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  if (!existing) throw new ApiError(404, "العقار غير موجود.");
  const slug = await uniqueSlug("properties", `${existing.title}-نسخة`);
  const { id: _id, createdAt: _c, updatedAt: _u, viewCount: _v, slug: _s, ...rest } = existing;
  const [created] = await db
    .insert(properties)
    .values({ ...rest, title: `${existing.title} - نسخة`, slug, published: false, featured: false, viewCount: 0, createdBy: user.id, updatedAt: new Date() })
    .returning({ id: properties.id });
  const images = await db.select().from(propertyImages).where(eq(propertyImages.propertyId, id));
  if (images.length) {
    await db.insert(propertyImages).values(images.map((image) => ({ propertyId: created.id, mediaId: image.mediaId, sortOrder: image.sortOrder, isCover: image.isCover })));
  }
  await logActivity(user.id, "property.duplicate", "property", created.id, { from: id });
  return created.id;
}

export async function createRequest(input: Record<string, unknown>) {
  if (asString(input.website)) return { ignored: true, id: "" };
  const name = asString(input.name);
  const phone = asString(input.phone);
  const kind = asString(input.kind);
  if (name.length < 2) throw new ApiError(400, "الاسم مطلوب.");
  if (phone.replace(/\D/g, "").length < 8) throw new ApiError(400, "رقم الهاتف غير مكتمل.");
  if (!["request_property", "add_property", "contact"].includes(kind)) throw new ApiError(400, "نوع الطلب غير صالح.");
  const [created] = await db
    .insert(customerRequests)
    .values({
      kind,
      name,
      phone,
      whatsapp: asString(input.whatsapp),
      transactionType: asString(input.transactionType),
      propertyTypeId: asString(input.propertyTypeId) || null,
      areaId: asString(input.areaId) || null,
      budget: asString(input.budget),
      areaSqm: asString(input.areaSqm),
      bedrooms: asString(input.bedrooms),
      details: asString(input.details),
      notes: asString(input.notes),
      status: "new",
    })
    .returning({ id: customerRequests.id });
  await db.insert(analyticsEvents).values({ type: kind === "contact" ? "contact_submit" : "request_submit", path: kind });
  return { ignored: false, id: created.id };
}

export async function updateRequest(id: string, input: Record<string, unknown>, user: SessionUser) {
  const [existing] = await db.select({ id: customerRequests.id }).from(customerRequests).where(eq(customerRequests.id, id)).limit(1);
  if (!existing) throw new ApiError(404, "الطلب غير موجود.");
  const status = asString(input.status);
  if (status && !["new", "following", "contacted", "interested", "closed", "not_interested"].includes(status)) {
    throw new ApiError(400, "حالة الطلب غير صالحة.");
  }
  await db
    .update(customerRequests)
    .set({
      ...(status ? { status } : {}),
      notes: input.notes == null ? undefined : asString(input.notes),
      updatedAt: new Date(),
    })
    .where(eq(customerRequests.id, id));
  const note = asString(input.internalNote);
  if (note) await db.insert(requestNotes).values({ requestId: id, userId: user.id, body: note });
  await logActivity(user.id, "request.update", "request", id, { status });
}

export async function deleteRequest(id: string, user: SessionUser) {
  await db.delete(customerRequests).where(eq(customerRequests.id, id));
  await logActivity(user.id, "request.delete", "request", id);
}

export async function saveArticle(input: Record<string, unknown>, user: SessionUser, id?: string) {
  const title = asString(input.title);
  if (title.length < 2) throw new ApiError(400, "عنوان المقال مطلوب.");
  const status = asString(input.status) === "published" ? "published" : "draft";
  const slug = await uniqueSlug("articles", asString(input.slug) || title, id);
  const values = {
    title,
    slug,
    excerpt: asString(input.excerpt),
    body: asString(input.body),
    blocks: cleanBlocks(input.blocks),
    categoryId: asString(input.categoryId) || null,
    tags: asStringArray(input.tags).slice(0, 12),
    featuredMediaId: asString(input.featuredMediaId) || null,
    status,
    publishedAt: status === "published" ? new Date() : null,
    seoTitle: asString(input.seoTitle),
    seoDescription: asString(input.seoDescription),
    canonicalUrl: asString(input.canonicalUrl),
    updatedAt: new Date(),
  };
  if (id) {
    const [existing] = await db.select({ publishedAt: articles.publishedAt, status: articles.status }).from(articles).where(eq(articles.id, id)).limit(1);
    if (!existing) throw new ApiError(404, "المقال غير موجود.");
    await db
      .update(articles)
      .set({ ...values, publishedAt: status === "published" ? existing.publishedAt || new Date() : null })
      .where(eq(articles.id, id));
    await logActivity(user.id, "article.update", "article", id, { title, status });
    return id;
  }
  const [created] = await db.insert(articles).values({ ...values, authorId: user.id }).returning({ id: articles.id });
  await logActivity(user.id, "article.create", "article", created.id, { title, status });
  return created.id;
}

export async function deleteArticle(id: string, user: SessionUser) {
  await db.delete(articles).where(eq(articles.id, id));
  await logActivity(user.id, "article.delete", "article", id);
}

export async function savePage(input: Record<string, unknown>, user: SessionUser, id?: string) {
  const title = asString(input.title);
  if (title.length < 2) throw new ApiError(400, "عنوان الصفحة مطلوب.");
  if (id) {
    const [existing] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
    if (!existing) throw new ApiError(404, "الصفحة غير موجودة.");
    const slug = existing.isSystem ? existing.slug : await uniqueSlug("pages", asString(input.slug) || title, id);
    await db
      .update(pages)
      .set({
        title,
        slug,
        excerpt: asString(input.excerpt),
        blocks: cleanBlocks(input.blocks),
        featuredMediaId: asString(input.featuredMediaId) || null,
        showInNav: existing.isSystem ? false : asBool(input.showInNav),
        navLabel: asString(input.navLabel) || title,
        published: asBool(input.published, true),
        sortOrder: Math.round(asNumber(input.sortOrder) || existing.sortOrder),
        seoTitle: asString(input.seoTitle),
        seoDescription: asString(input.seoDescription),
        canonicalUrl: asString(input.canonicalUrl),
        updatedAt: new Date(),
      })
      .where(eq(pages.id, id));
    await logActivity(user.id, "page.update", "page", id, { title });
    return id;
  }
  const slug = await uniqueSlug("pages", asString(input.slug) || title);
  const [created] = await db
    .insert(pages)
    .values({
      title,
      slug,
      excerpt: asString(input.excerpt),
      blocks: cleanBlocks(input.blocks),
      featuredMediaId: asString(input.featuredMediaId) || null,
      showInNav: asBool(input.showInNav),
      navLabel: asString(input.navLabel) || title,
      isSystem: false,
      published: asBool(input.published, true),
      sortOrder: Math.round(asNumber(input.sortOrder) || 20),
      seoTitle: asString(input.seoTitle),
      seoDescription: asString(input.seoDescription),
      canonicalUrl: asString(input.canonicalUrl),
    })
    .returning({ id: pages.id });
  await logActivity(user.id, "page.create", "page", created.id, { title });
  return created.id;
}

export async function deletePage(id: string, user: SessionUser) {
  const [existing] = await db.select({ isSystem: pages.isSystem }).from(pages).where(eq(pages.id, id)).limit(1);
  if (!existing) throw new ApiError(404, "الصفحة غير موجودة.");
  if (existing.isSystem) throw new ApiError(400, "لا يمكن حذف الصفحات الأساسية. يمكن تعديل محتواها أو إيقاف نشرها.");
  await db.delete(pages).where(eq(pages.id, id));
  await logActivity(user.id, "page.delete", "page", id);
}

async function saveSimple(
  kind: "services" | "areas" | "types" | "categories",
  input: Record<string, unknown>,
  id?: string,
) {
  const name = asString(input.title || input.name);
  if (name.length < 2) throw new ApiError(400, "الاسم مطلوب.");
  if (kind === "services") {
    const slug = await uniqueSlug("services", asString(input.slug) || name, id);
    const values = {
      title: name,
      slug,
      summary: asString(input.summary),
      body: asString(input.body),
      icon: asString(input.icon) || "building",
      imageMediaId: asString(input.imageMediaId) || null,
      active: asBool(input.active, true),
      sortOrder: Math.round(asNumber(input.sortOrder) || 0),
      seoTitle: asString(input.seoTitle),
      seoDescription: asString(input.seoDescription),
      canonicalUrl: asString(input.canonicalUrl),
      updatedAt: new Date(),
    };
    if (id) {
      await db.update(services).set(values).where(eq(services.id, id));
      return id;
    }
    const [created] = await db.insert(services).values(values).returning({ id: services.id });
    return created.id;
  }
  if (kind === "areas") {
    const slug = await uniqueSlug("areas", asString(input.slug) || name, id);
    const values = {
      name,
      slug,
      description: asString(input.description),
      imageMediaId: asString(input.imageMediaId) || null,
      active: asBool(input.active, true),
      sortOrder: Math.round(asNumber(input.sortOrder) || 0),
      seoTitle: asString(input.seoTitle),
      seoDescription: asString(input.seoDescription),
      canonicalUrl: asString(input.canonicalUrl),
      updatedAt: new Date(),
    };
    if (id) {
      await db.update(serviceAreas).set(values).where(eq(serviceAreas.id, id));
      return id;
    }
    const [created] = await db.insert(serviceAreas).values(values).returning({ id: serviceAreas.id });
    return created.id;
  }
  if (kind === "types") {
    const slug = await uniqueSlug("types", asString(input.slug) || name, id);
    const groupName = ["residential", "commercial", "land", "other"].includes(asString(input.groupName)) ? asString(input.groupName) : "other";
    const suggestedTemplate = ["apartment", "property", "shop"].includes(asString(input.suggestedTemplate)) ? asString(input.suggestedTemplate) : "property";
    const values = {
      name,
      slug,
      groupName,
      suggestedTemplate,
      active: asBool(input.active, true),
      sortOrder: Math.round(asNumber(input.sortOrder) || 0),
      updatedAt: new Date(),
    };
    if (id) {
      await db.update(propertyTypes).set(values).where(eq(propertyTypes.id, id));
      return id;
    }
    const [created] = await db.insert(propertyTypes).values(values).returning({ id: propertyTypes.id });
    return created.id;
  }
  const slug = await uniqueSlug("categories", asString(input.slug) || name, id);
  const values = { name, slug, kind: "article", updatedAt: new Date() };
  if (id) {
    await db.update(categories).set(values).where(eq(categories.id, id));
    return id;
  }
  const [created] = await db.insert(categories).values(values).returning({ id: categories.id });
  return created.id;
}

export async function saveContent(kind: "services" | "areas" | "types" | "categories", input: Record<string, unknown>, user: SessionUser, id?: string) {
  const saved = await saveSimple(kind, input, id);
  await logActivity(user.id, `${kind}.save`, kind, saved);
  return saved;
}

export async function deleteContent(kind: "services" | "areas" | "types" | "categories", id: string, user: SessionUser) {
  if (kind === "types") {
    const [used] = await db.select({ id: properties.id }).from(properties).where(eq(properties.propertyTypeId, id)).limit(1);
    if (used) throw new ApiError(400, "لا يمكن حذف نوع مستخدم في عقار. يمكن إيقافه بدلاً من ذلك.");
    await db.delete(propertyTypes).where(eq(propertyTypes.id, id));
  } else if (kind === "services") await db.delete(services).where(eq(services.id, id));
  else if (kind === "areas") await db.delete(serviceAreas).where(eq(serviceAreas.id, id));
  else await db.delete(categories).where(eq(categories.id, id));
  await logActivity(user.id, `${kind}.delete`, kind, id);
}

export async function saveAd(input: Record<string, unknown>, user: SessionUser, id?: string) {
  const propertyId = asString(input.propertyId);
  const template = asString(input.template);
  if (!propertyId) throw new ApiError(400, "اختر العقار.");
  if (!["apartment", "property", "shop"].includes(template)) throw new ApiError(400, "اختر قالباً.");
  const [property] = await db.select({ id: properties.id }).from(properties).where(eq(properties.id, propertyId)).limit(1);
  if (!property) throw new ApiError(404, "العقار غير موجود.");
  const published = asBool(input.published);
  if (id) {
    await db.update(adCards).set({ propertyId, template, published, updatedAt: new Date() }).where(eq(adCards.id, id));
    await logActivity(user.id, "ad.update", "ad", id);
    return id;
  }
  const [created] = await db.insert(adCards).values({ propertyId, template, published, createdBy: user.id }).returning({ id: adCards.id });
  await logActivity(user.id, "ad.create", "ad", created.id);
  return created.id;
}

export async function deleteAd(id: string, user: SessionUser) {
  await db.delete(adCards).where(eq(adCards.id, id));
  await logActivity(user.id, "ad.delete", "ad", id);
}

export async function updateSettings(input: Record<string, unknown>, user: SessionUser) {
  const phones = Array.isArray(input.phones)
    ? input.phones
        .map((item) => ({ number: asString((item as { number?: string }).number), label: asString((item as { label?: string }).label) }))
        .filter((item) => item.number)
    : [];
  const whatsappNumbers = asStringArray(input.whatsappNumbers);
  const socials = (input.socials && typeof input.socials === "object" ? input.socials : {}) as Record<string, string>;
  await db
    .update(websiteSettings)
    .set({
      siteName: asString(input.siteName) || "محمد مروان للتسويق العقاري",
      tagline: asString(input.tagline),
      heroTitle: asString(input.heroTitle),
      heroSubtitle: asString(input.heroSubtitle),
      heroMotto: asString(input.heroMotto),
      trustLine: asString(input.trustLine),
      aboutShort: asString(input.aboutShort),
      aboutLong: asString(input.aboutLong),
      phones,
      whatsappNumbers,
      email: asString(input.email),
      website: asString(input.website),
      socials: {
        facebook: asString(socials.facebook),
        instagram: asString(socials.instagram),
        tiktok: asString(socials.tiktok),
        youtube: asString(socials.youtube),
        x: asString(socials.x),
        linkedin: asString(socials.linkedin),
        snapchat: asString(socials.snapchat),
      },
      workingHours: asString(input.workingHours),
      addressNote: asString(input.addressNote),
      gaId: asString(input.gaId),
      pixelId: asString(input.pixelId),
      seoTitle: asString(input.seoTitle),
      seoDescription: asString(input.seoDescription),
      canonicalBase: asString(input.canonicalBase),
      gscVerification: asString(input.gscVerification),
      robotsIndex: asBool(input.robotsIndex, true),
      logoMediaId: asString(input.logoMediaId) || null,
      faviconMediaId: asString(input.faviconMediaId) || null,
      coverMediaId: asString(input.coverMediaId) || null,
      personalPhotoMediaId: asString(input.personalPhotoMediaId) || null,
      ogImageMediaId: asString(input.ogImageMediaId) || null,
      hideSetupHint: asBool(input.hideSetupHint),
      updatedAt: new Date(),
    })
    .where(eq(websiteSettings.id, 1));
  await logActivity(user.id, "settings.update", "settings", "1");
}

export async function updateSeo(input: Record<string, unknown>, user: SessionUser) {
  const entity = asString(input.entity);
  const id = asString(input.id);
  const seoTitle = asString(input.seoTitle);
  const seoDescription = asString(input.seoDescription);
  const canonicalUrl = asString(input.canonicalUrl);
  if (entity === "home") {
    await db.update(websiteSettings).set({ seoTitle, seoDescription, canonicalBase: asString(input.canonicalBase) || undefined, updatedAt: new Date() }).where(eq(websiteSettings.id, 1));
  } else if (entity === "property" && id) {
    const slug = asString(input.slug);
    await db.update(properties).set({ seoTitle, seoDescription, canonicalUrl, ...(slug ? { slug: await uniqueSlug("properties", slug, id) } : {}), updatedAt: new Date() }).where(eq(properties.id, id));
  } else if (entity === "article" && id) {
    const slug = asString(input.slug);
    await db.update(articles).set({ seoTitle, seoDescription, canonicalUrl, ...(slug ? { slug: await uniqueSlug("articles", slug, id) } : {}), updatedAt: new Date() }).where(eq(articles.id, id));
  } else if (entity === "page" && id) {
    const [existing] = await db.select({ isSystem: pages.isSystem }).from(pages).where(eq(pages.id, id)).limit(1);
    const slug = asString(input.slug);
    await db
      .update(pages)
      .set({ seoTitle, seoDescription, canonicalUrl, ...(slug && existing && !existing.isSystem ? { slug: await uniqueSlug("pages", slug, id) } : {}), updatedAt: new Date() })
      .where(eq(pages.id, id));
  } else if (entity === "service" && id) {
    await db.update(services).set({ seoTitle, seoDescription, canonicalUrl, updatedAt: new Date() }).where(eq(services.id, id));
  } else if (entity === "area" && id) {
    await db.update(serviceAreas).set({ seoTitle, seoDescription, canonicalUrl, updatedAt: new Date() }).where(eq(serviceAreas.id, id));
  } else {
    throw new ApiError(400, "عنصر SEO غير معروف.");
  }
  await logActivity(user.id, "seo.update", entity, id || "home");
}

export async function createUser(input: Record<string, unknown>, actor: SessionUser) {
  const name = asString(input.name);
  const email = asString(input.email).toLowerCase();
  const phone = asString(input.phone);
  const password = asString(input.password);
  const role = asString(input.role);
  if (name.length < 2) throw new ApiError(400, "اسم المستخدم مطلوب.");
  if (!email.includes("@")) throw new ApiError(400, "البريد الإلكتروني غير صالح.");
  if (password.length < 8) throw new ApiError(400, "كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
  if (!["supervisor", "manager", "employee"].includes(role)) throw new ApiError(400, "اختر دوراً من القائمة.");
  const [emailTaken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (emailTaken) throw new ApiError(400, "البريد مستخدم بالفعل.");
  if (phone) {
    const [phoneTaken] = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
    if (phoneTaken) throw new ApiError(400, "رقم الهاتف مستخدم بالفعل.");
  }
  const [created] = await db
    .insert(users)
    .values({ name, email, phone: phone || null, passwordHash: hashPassword(password), role, active: true })
    .returning({ id: users.id });
  await logActivity(actor.id, "user.create", "user", created.id, { role });
  return created.id;
}

export async function updateUser(id: string, input: Record<string, unknown>, actor: SessionUser) {
  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) throw new ApiError(404, "المستخدم غير موجود.");
  if (existing.role === "owner" && id !== actor.id) {
    // owner account can only be edited by itself for name/password, never demoted by others
  }
  const role = asString(input.role);
  if (existing.role === "owner" && role && role !== "owner") throw new ApiError(400, "لا يمكن تغيير دور المالك.");
  if (role === "owner") throw new ApiError(400, "لا يمكن منح صلاحية المالك.");
  const nextRole = existing.role === "owner" ? "owner" : role || existing.role;
  if (!["owner", "supervisor", "manager", "employee"].includes(nextRole)) throw new ApiError(400, "دور غير صالح.");
  const active = existing.role === "owner" ? true : asBool(input.active, existing.active);
  await db
    .update(users)
    .set({
      name: asString(input.name) || existing.name,
      phone: input.phone == null ? existing.phone : asString(input.phone) || null,
      role: nextRole,
      active,
      updatedAt: new Date(),
      ...(asString(input.password).length >= 8 ? { passwordHash: hashPassword(asString(input.password)) } : {}),
    })
    .where(eq(users.id, id));
  if (Array.isArray(input.overrides) && existing.role !== "owner") {
    await db.delete(userPermissionOverrides).where(eq(userPermissionOverrides.userId, id));
    const overrides = input.overrides
      .map((item) => ({
        userId: id,
        permissionKey: asString((item as { key?: string }).key),
        allowed: asBool((item as { allowed?: boolean }).allowed),
      }))
      .filter((item) => item.permissionKey);
    if (overrides.length) await db.insert(userPermissionOverrides).values(overrides);
  }
  await logActivity(actor.id, "user.update", "user", id);
}

export async function deleteUser(id: string, actor: SessionUser) {
  if (id === actor.id) throw new ApiError(400, "لا يمكنك حذف حسابك الحالي.");
  const [existing] = await db.select({ role: users.role }).from(users).where(eq(users.id, id)).limit(1);
  if (!existing) throw new ApiError(404, "المستخدم غير موجود.");
  if (existing.role === "owner") throw new ApiError(400, "لا يمكن حذف حساب المالك.");
  await db.delete(users).where(and(eq(users.id, id), ne(users.role, "owner")));
  await logActivity(actor.id, "user.delete", "user", id);
}

export async function saveRolePermissions(role: string, keys: string[], actor: SessionUser) {
  if (role === "owner") throw new ApiError(400, "صلاحيات المالك كاملة ولا تُقيَّد.");
  if (!["supervisor", "manager", "employee"].includes(role)) throw new ApiError(400, "دور غير صالح.");
  const allowed = new Set<string>(["dashboard.view", "properties.view", "properties.create", "properties.edit", "properties.delete", "properties.publish", "requests.view", "requests.edit", "requests.delete", "articles.view", "articles.create", "articles.edit", "articles.delete", "articles.publish", "pages.view", "pages.edit", "services.manage", "areas.manage", "media.manage", "templates.manage", "templates.publish", "users.manage", "settings.manage", "seo.manage", "analytics.view"]);
  const clean = keys.filter((key): key is PermissionKey => allowed.has(key));
  await db.delete(rolePermissions).where(eq(rolePermissions.role, role));
  if (clean.length) await db.insert(rolePermissions).values(clean.map((permissionKey) => ({ role, permissionKey })));
  await logActivity(actor.id, "permissions.update", "role", role, { count: clean.length });
}

export async function trackEvent(type: string, propertyId?: string | null, adId?: string | null, path?: string) {
  const allowed = ["call_click", "whatsapp_click", "property_view", "contact_submit", "request_submit", "ad_download", "ad_share"];
  if (!allowed.includes(type)) return;
  await db.insert(analyticsEvents).values({ type, propertyId: propertyId || null, adId: adId || null, path: path || "" });
  if (type === "property_view" && propertyId) {
    await db
      .update(properties)
      .set({ viewCount: sql`${properties.viewCount} + 1` })
      .where(eq(properties.id, propertyId));
  }
}
