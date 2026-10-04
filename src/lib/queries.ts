import { cache } from "react";
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
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
  users,
  websiteSettings,
} from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import {
  formatArea,
  formatPrice,
  labelOf,
  mediaPath,
  PROPERTY_STATUSES,
  REQUEST_KINDS,
  REQUEST_STATUSES,
  resolveContacts,
  TRANSACTIONS,
  type ContentBlock,
  type PublicSettings,
  type SocialLinks,
  type PhoneEntry,
  decodeSlug,
} from "@/lib/shared";

export type PropertyImage = { id: string; url: string; alt: string; isCover: boolean };
export type PropertyView = {
  id: string;
  title: string;
  slug: string;
  propertyTypeId: string;
  typeName: string;
  typeSlug: string;
  typeGroup: string;
  suggestedTemplate: string;
  transactionType: string;
  transactionLabel: string;
  areaId: string | null;
  areaName: string;
  areaSlug: string;
  location: string;
  mapsUrl: string;
  price: number | null;
  priceOnRequest: boolean;
  priceLabel: string | null;
  areaSqm: number | null;
  areaLabel: string | null;
  description: string;
  phone: string;
  whatsapp: string;
  status: string;
  statusLabel: string;
  published: boolean;
  featured: boolean;
  referenceCode: string;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: string;
  finishing: string;
  elevator: boolean;
  balcony: boolean;
  parking: boolean;
  buildingAge: string;
  unitsCount: number | null;
  commercialActivity: string;
  frontage: string;
  streetVisibility: string;
  suitableActivities: string;
  features: string[];
  customSpecs: { label: string; value: string }[];
  images: PropertyImage[];
  coverUrl: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdPayload = {
  id?: string;
  template: string;
  published?: boolean;
  property: PropertyView;
  siteName: string;
  tagline: string;
  trustLine: string;
  logoUrl: string;
  phones: string[];
  whatsapps: string[];
};

const num = (value: unknown) => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const getSettings = cache(async (): Promise<PublicSettings> => {
  await ensureSeed();
  const [row] = await db.select().from(websiteSettings).where(eq(websiteSettings.id, 1)).limit(1);
  if (!row) throw new Error("إعدادات الموقع غير متاحة");
  const logoUrl = mediaPath(row.logoMediaId, "/brand/logo.webp");
  return {
    siteName: row.siteName,
    tagline: row.tagline,
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    heroMotto: row.heroMotto,
    trustLine: row.trustLine,
    aboutShort: row.aboutShort,
    aboutLong: row.aboutLong,
    phones: (row.phones || []) as PhoneEntry[],
    whatsappNumbers: (row.whatsappNumbers || []) as string[],
    email: row.email,
    website: row.website,
    socials: (row.socials || {}) as SocialLinks,
    workingHours: row.workingHours,
    addressNote: row.addressNote,
    gaId: row.gaId,
    pixelId: row.pixelId,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonicalBase: row.canonicalBase,
    gscVerification: row.gscVerification,
    robotsIndex: row.robotsIndex,
    logoUrl,
    faviconUrl: mediaPath(row.faviconMediaId, "/brand/icon-192.png"),
    coverUrl: mediaPath(row.coverMediaId, "/brand/hero-cover.jpg"),
    personalPhotoUrl: mediaPath(row.personalPhotoMediaId, ""),
    ogImageUrl: mediaPath(row.ogImageMediaId, logoUrl),
    hideSetupHint: row.hideSetupHint,
  };
});

async function imageMap(ids: string[]) {
  const map = new Map<string, PropertyImage[]>();
  if (!ids.length) return map;
  const rows = await db
    .select({
      propertyId: propertyImages.propertyId,
      mediaId: propertyImages.mediaId,
      isCover: propertyImages.isCover,
      alt: media.alt,
      sortOrder: propertyImages.sortOrder,
    })
    .from(propertyImages)
    .innerJoin(media, eq(media.id, propertyImages.mediaId))
    .where(inArray(propertyImages.propertyId, ids))
    .orderBy(asc(propertyImages.sortOrder));
  for (const row of rows) {
    const list = map.get(row.propertyId) || [];
    list.push({ id: row.mediaId, url: mediaPath(row.mediaId), alt: row.alt, isCover: row.isCover });
    map.set(row.propertyId, list);
  }
  return map;
}

function mapProperty(row: {
  id: string;
  title: string;
  slug: string;
  propertyTypeId: string;
  typeName: string;
  typeSlug: string;
  typeGroup: string;
  suggestedTemplate: string;
  transactionType: string;
  areaId: string | null;
  areaName: string | null;
  areaSlug: string | null;
  location: string;
  mapsUrl: string;
  price: number | null;
  priceOnRequest: boolean;
  areaSqm: number | null;
  description: string;
  phone: string;
  whatsapp: string;
  status: string;
  published: boolean;
  featured: boolean;
  referenceCode: string;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: string;
  finishing: string;
  elevator: boolean;
  balcony: boolean;
  parking: boolean;
  buildingAge: string;
  unitsCount: number | null;
  commercialActivity: string;
  frontage: string;
  streetVisibility: string;
  suitableActivities: string;
  features: string[] | null;
  customSpecs: { label: string; value: string }[] | null;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}, images: PropertyImage[]): PropertyView {
  const price = num(row.price);
  const areaSqm = num(row.areaSqm);
  const cover = images.find((image) => image.isCover) || images[0];
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    propertyTypeId: row.propertyTypeId,
    typeName: row.typeName,
    typeSlug: row.typeSlug,
    typeGroup: row.typeGroup,
    suggestedTemplate: row.suggestedTemplate || "property",
    transactionType: row.transactionType,
    transactionLabel: labelOf(TRANSACTIONS, row.transactionType),
    areaId: row.areaId,
    areaName: row.areaName || "",
    areaSlug: row.areaSlug || "",
    location: row.location || "",
    mapsUrl: row.mapsUrl || "",
    price,
    priceOnRequest: row.priceOnRequest,
    priceLabel: price != null ? formatPrice(price) : row.priceOnRequest ? "السعر عند الطلب" : null,
    areaSqm,
    areaLabel: formatArea(areaSqm),
    description: row.description || "",
    phone: row.phone || "",
    whatsapp: row.whatsapp || "",
    status: row.status,
    statusLabel: labelOf(PROPERTY_STATUSES, row.status),
    published: row.published,
    featured: row.featured,
    referenceCode: row.referenceCode || "",
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    floor: row.floor || "",
    finishing: row.finishing || "",
    elevator: row.elevator,
    balcony: row.balcony,
    parking: row.parking,
    buildingAge: row.buildingAge || "",
    unitsCount: row.unitsCount,
    commercialActivity: row.commercialActivity || "",
    frontage: row.frontage || "",
    streetVisibility: row.streetVisibility || "",
    suitableActivities: row.suitableActivities || "",
    features: row.features || [],
    customSpecs: (row.customSpecs || []).filter((item) => item.label && item.value),
    images,
    coverUrl: cover?.url || "",
    seoTitle: row.seoTitle || "",
    seoDescription: row.seoDescription || "",
    canonicalUrl: row.canonicalUrl || "",
    viewCount: row.viewCount || 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const propertySelect = {
  id: properties.id,
  title: properties.title,
  slug: properties.slug,
  propertyTypeId: properties.propertyTypeId,
  typeName: propertyTypes.name,
  typeSlug: propertyTypes.slug,
  typeGroup: propertyTypes.groupName,
  suggestedTemplate: propertyTypes.suggestedTemplate,
  transactionType: properties.transactionType,
  areaId: properties.areaId,
  areaName: serviceAreas.name,
  areaSlug: serviceAreas.slug,
  location: properties.location,
  mapsUrl: properties.mapsUrl,
  price: properties.price,
  priceOnRequest: properties.priceOnRequest,
  areaSqm: properties.areaSqm,
  description: properties.description,
  phone: properties.phone,
  whatsapp: properties.whatsapp,
  status: properties.status,
  published: properties.published,
  featured: properties.featured,
  referenceCode: properties.referenceCode,
  bedrooms: properties.bedrooms,
  bathrooms: properties.bathrooms,
  floor: properties.floor,
  finishing: properties.finishing,
  elevator: properties.elevator,
  balcony: properties.balcony,
  parking: properties.parking,
  buildingAge: properties.buildingAge,
  unitsCount: properties.unitsCount,
  commercialActivity: properties.commercialActivity,
  frontage: properties.frontage,
  streetVisibility: properties.streetVisibility,
  suitableActivities: properties.suitableActivities,
  features: properties.features,
  customSpecs: properties.customSpecs,
  seoTitle: properties.seoTitle,
  seoDescription: properties.seoDescription,
  canonicalUrl: properties.canonicalUrl,
  viewCount: properties.viewCount,
  createdAt: properties.createdAt,
  updatedAt: properties.updatedAt,
};

export async function listProperties(options: {
  q?: string;
  type?: string;
  transaction?: string;
  area?: string;
  status?: string;
  featured?: boolean;
  publishedOnly?: boolean;
  limit?: number;
} = {}) {
  await ensureSeed();
  const filters = [];
  if (options.publishedOnly) {
    filters.push(eq(properties.published, true));
    filters.push(ne(properties.status, "archived"));
  }
  if (options.type) filters.push(eq(propertyTypes.slug, options.type));
  if (options.transaction) filters.push(eq(properties.transactionType, options.transaction));
  if (options.area) filters.push(eq(serviceAreas.slug, options.area));
  if (options.status) filters.push(eq(properties.status, options.status));
  if (options.featured) filters.push(eq(properties.featured, true));
  if (options.q) {
    const term = `%${options.q}%`;
    filters.push(or(ilike(properties.title, term), ilike(properties.location, term), ilike(properties.description, term), ilike(properties.referenceCode, term), ilike(serviceAreas.name, term)));
  }
  let query = db
    .select(propertySelect)
    .from(properties)
    .innerJoin(propertyTypes, eq(propertyTypes.id, properties.propertyTypeId))
    .leftJoin(serviceAreas, eq(serviceAreas.id, properties.areaId))
    .orderBy(desc(properties.featured), desc(properties.createdAt))
    .$dynamic();
  if (filters.length) query = query.where(and(...filters));
  if (options.limit) query = query.limit(options.limit);
  const rows = await query;
  const images = await imageMap(rows.map((row) => row.id));
  return rows.map((row) => mapProperty(row, images.get(row.id) || []));
}

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function getPropertyBySlug(slug: string, publishedOnly = true) {
  slug = decodeSlug(slug);
  const [row] = await db
    .select(propertySelect)
    .from(properties)
    .innerJoin(propertyTypes, eq(propertyTypes.id, properties.propertyTypeId))
    .leftJoin(serviceAreas, eq(serviceAreas.id, properties.areaId))
    .where(isUuid(slug) ? eq(properties.id, slug) : eq(properties.slug, slug))
    .limit(1);
  if (!row) return null;
  if (publishedOnly && (!row.published || row.status === "archived")) return null;
  const images = await imageMap([row.id]);
  return mapProperty(row, images.get(row.id) || []);
}

export async function getPropertyById(id: string) {
  const [row] = await db
    .select(propertySelect)
    .from(properties)
    .innerJoin(propertyTypes, eq(propertyTypes.id, properties.propertyTypeId))
    .leftJoin(serviceAreas, eq(serviceAreas.id, properties.areaId))
    .where(eq(properties.id, id))
    .limit(1);
  if (!row) return null;
  const images = await imageMap([row.id]);
  return mapProperty(row, images.get(row.id) || []);
}

export async function listTypes(activeOnly = false) {
  await ensureSeed();
  const rows = await db.select().from(propertyTypes).orderBy(asc(propertyTypes.sortOrder), asc(propertyTypes.name));
  return activeOnly ? rows.filter((row) => row.active) : rows;
}

export async function listAreas(activeOnly = false) {
  await ensureSeed();
  const rows = await db.select().from(serviceAreas).orderBy(asc(serviceAreas.sortOrder), asc(serviceAreas.name));
  return activeOnly ? rows.filter((row) => row.active) : rows;
}

export async function listServices(activeOnly = false) {
  await ensureSeed();
  const rows = await db.select().from(services).orderBy(asc(services.sortOrder), asc(services.title));
  return (activeOnly ? rows.filter((row) => row.active) : rows).map((row) => ({
    ...row,
    imageUrl: mediaPath(row.imageMediaId, ""),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getServiceBySlug(slug: string) {
  slug = decodeSlug(slug);
  const [row] = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  if (!row || !row.active) return null;
  return { ...row, imageUrl: mediaPath(row.imageMediaId, "") };
}

export async function getAreaBySlug(slug: string) {
  slug = decodeSlug(slug);
  const [row] = await db.select().from(serviceAreas).where(eq(serviceAreas.slug, slug)).limit(1);
  if (!row || !row.active) return null;
  return { ...row, imageUrl: mediaPath(row.imageMediaId, "") };
}

export async function hydrateBlocks(blocks: ContentBlock[] | null | undefined) {
  const list = blocks || [];
  const ids = list.map((block) => block.mediaId).filter((item): item is string => Boolean(item));
  if (!ids.length) return list;
  const rows = await db.select({ id: media.id, alt: media.alt }).from(media).where(inArray(media.id, ids));
  const alts = new Map(rows.map((row) => [row.id, row.alt]));
  return list.map((block) =>
    block.mediaId && alts.has(block.mediaId)
      ? { ...block, url: mediaPath(block.mediaId), alt: block.alt || alts.get(block.mediaId) || "" }
      : block,
  );
}

export async function getPageBySystem(systemKey: string) {
  await ensureSeed();
  const [row] = await db.select().from(pages).where(eq(pages.systemKey, systemKey)).limit(1);
  if (!row) return null;
  return { ...row, blocks: await hydrateBlocks(row.blocks), featuredUrl: mediaPath(row.featuredMediaId, ""), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export async function getPageBySlug(slug: string) {
  slug = decodeSlug(slug);
  await ensureSeed();
  const [row] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  if (!row || !row.published) return null;
  return { ...row, blocks: await hydrateBlocks(row.blocks), featuredUrl: mediaPath(row.featuredMediaId, "") };
}

export async function listCustomNav() {
  await ensureSeed();
  return db
    .select({ title: pages.title, slug: pages.slug, navLabel: pages.navLabel })
    .from(pages)
    .where(and(eq(pages.published, true), eq(pages.showInNav, true), eq(pages.isSystem, false)))
    .orderBy(asc(pages.sortOrder));
}

export async function listArticles(options: { publishedOnly?: boolean; limit?: number; category?: string } = {}) {
  await ensureSeed();
  const filters = [];
  if (options.publishedOnly) filters.push(eq(articles.status, "published"));
  if (options.category) filters.push(eq(categories.slug, options.category));
  let query = db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      status: articles.status,
      tags: articles.tags,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      seoTitle: articles.seoTitle,
      seoDescription: articles.seoDescription,
      featuredMediaId: articles.featuredMediaId,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(articles)
    .leftJoin(categories, eq(categories.id, articles.categoryId))
    .orderBy(desc(articles.publishedAt), desc(articles.createdAt))
    .$dynamic();
  if (filters.length) query = query.where(and(...filters));
  if (options.limit) query = query.limit(options.limit);
  const rows = await query;
  return rows.map((row) => ({
    ...row,
    featuredUrl: mediaPath(row.featuredMediaId, ""),
    publishedAt: row.publishedAt?.toISOString() || null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getArticleBySlug(slug: string, publishedOnly = true) {
  slug = decodeSlug(slug);
  const [row] = await db
    .select({
      article: articles,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(articles)
    .leftJoin(categories, eq(categories.id, articles.categoryId))
    .where(isUuid(slug) ? eq(articles.id, slug) : eq(articles.slug, slug))
    .limit(1);
  if (!row) return null;
  if (publishedOnly && row.article.status !== "published") return null;
  return {
    ...row.article,
    categoryName: row.categoryName || "",
    categorySlug: row.categorySlug || "",
    blocks: await hydrateBlocks(row.article.blocks),
    featuredUrl: mediaPath(row.article.featuredMediaId, ""),
    publishedAt: row.article.publishedAt?.toISOString() || null,
    createdAt: row.article.createdAt.toISOString(),
    updatedAt: row.article.updatedAt.toISOString(),
  };
}

export async function buildAdPayload(property: PropertyView, template: string, ad?: { id: string; published: boolean }): Promise<AdPayload> {
  const settings = await getSettings();
  const contacts = resolveContacts(settings, property);
  return {
    id: ad?.id,
    template,
    published: ad?.published,
    property,
    siteName: settings.siteName,
    tagline: settings.tagline,
    trustLine: settings.trustLine,
    logoUrl: settings.logoUrl,
    phones: contacts.phones,
    whatsapps: contacts.whatsapps,
  };
}

export async function getAd(id: string, publishedOnly = false) {
  const [row] = await db.select().from(adCards).where(eq(adCards.id, id)).limit(1);
  if (!row) return null;
  if (publishedOnly && !row.published) return null;
  const property = await getPropertyById(row.propertyId);
  if (!property) return null;
  return buildAdPayload(property, row.template, { id: row.id, published: row.published });
}

export async function listAds() {
  const rows = await db
    .select({
      id: adCards.id,
      template: adCards.template,
      published: adCards.published,
      createdAt: adCards.createdAt,
      updatedAt: adCards.updatedAt,
      propertyId: properties.id,
      title: properties.title,
      slug: properties.slug,
    })
    .from(adCards)
    .innerJoin(properties, eq(properties.id, adCards.propertyId))
    .orderBy(desc(adCards.updatedAt));
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }));
}

export async function listRequests(status?: string, kind?: string) {
  const filters = [];
  if (status) filters.push(eq(customerRequests.status, status));
  if (kind) filters.push(eq(customerRequests.kind, kind));
  let query = db
    .select({
      request: customerRequests,
      typeName: propertyTypes.name,
      areaName: serviceAreas.name,
    })
    .from(customerRequests)
    .leftJoin(propertyTypes, eq(propertyTypes.id, customerRequests.propertyTypeId))
    .leftJoin(serviceAreas, eq(serviceAreas.id, customerRequests.areaId))
    .orderBy(desc(customerRequests.createdAt))
    .$dynamic();
  if (filters.length) query = query.where(and(...filters));
  const rows = await query;
  return rows.map((row) => ({
    ...row.request,
    typeName: row.typeName || "",
    areaName: row.areaName || "",
    kindLabel: labelOf(REQUEST_KINDS, row.request.kind),
    statusLabel: labelOf(REQUEST_STATUSES, row.request.status),
    transactionLabel: labelOf(TRANSACTIONS, row.request.transactionType),
    createdAt: row.request.createdAt.toISOString(),
    updatedAt: row.request.updatedAt.toISOString(),
  }));
}

export async function getRequest(id: string) {
  const [row] = await listRequests().then((rows) => rows.filter((item) => item.id === id));
  if (!row) return null;
  const notes = await db
    .select({
      id: requestNotes.id,
      body: requestNotes.body,
      createdAt: requestNotes.createdAt,
      userName: users.name,
    })
    .from(requestNotes)
    .leftJoin(users, eq(users.id, requestNotes.userId))
    .where(eq(requestNotes.requestId, id))
    .orderBy(desc(requestNotes.createdAt));
  return { ...row, internalNotes: notes.map((note) => ({ ...note, createdAt: note.createdAt.toISOString() })) };
}

export async function getDashboard() {
  await ensureSeed();
  const countResult = await db.execute<{
      properties: number;
      published: number;
      unpublished: number;
      for_sale: number;
      for_rent: number;
      featured: number;
      buyer_requests: number;
      rental_requests: number;
      new_requests: number;
      articles: number;
      drafts: number;
      published_articles: number;
      calls: number;
      whatsapp: number;
      views: number;
      submissions: number;
    }>(sql`
      select
        (select count(*)::int from properties) as properties,
        (select count(*)::int from properties where published = true) as published,
        (select count(*)::int from properties where published = false) as unpublished,
        (select count(*)::int from properties where transaction_type = 'sale') as for_sale,
        (select count(*)::int from properties where transaction_type = 'rent') as for_rent,
        (select count(*)::int from properties where featured = true) as featured,
        (select count(*)::int from customer_requests where kind = 'request_property' and transaction_type in ('sale', 'wanted_buy')) as buyer_requests,
        (select count(*)::int from customer_requests where kind = 'request_property' and transaction_type in ('rent', 'wanted_rent')) as rental_requests,
        (select count(*)::int from customer_requests where status = 'new') as new_requests,
        (select count(*)::int from articles) as articles,
        (select count(*)::int from articles where status = 'draft') as drafts,
        (select count(*)::int from articles where status = 'published') as published_articles,
        (select count(*)::int from analytics_events where type = 'call_click') as calls,
        (select count(*)::int from analytics_events where type = 'whatsapp_click') as whatsapp,
        (select count(*)::int from analytics_events where type = 'property_view') as views,
        (select count(*)::int from analytics_events where type in ('contact_submit', 'request_submit')) as submissions
    `);
  const countRows = Array.isArray(countResult) ? countResult : countResult.rows || [];
  const counts = countRows[0];
  const top = await db
    .select({ id: properties.id, title: properties.title, slug: properties.slug, viewCount: properties.viewCount })
    .from(properties)
    .orderBy(desc(properties.viewCount), desc(properties.createdAt))
    .limit(6);
  const recent = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(8);
  const events = await db
    .select({ type: analyticsEvents.type, count: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .groupBy(analyticsEvents.type);
  return {
    counts: counts || {
      properties: 0,
      published: 0,
      unpublished: 0,
      for_sale: 0,
      for_rent: 0,
      featured: 0,
      buyer_requests: 0,
      rental_requests: 0,
      new_requests: 0,
      articles: 0,
      drafts: 0,
      published_articles: 0,
      calls: 0,
      whatsapp: 0,
      views: 0,
      submissions: 0,
    },
    top: top.filter((item) => item.viewCount > 0),
    events,
    recent: recent.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  };
}

export async function listMedia(folder?: string) {
  const rows = folder
    ? await db.select().from(media).where(eq(media.folder, folder)).orderBy(desc(media.createdAt))
    : await db.select().from(media).orderBy(desc(media.createdAt));
  return rows.map((row) => ({ ...row, url: mediaPath(row.id), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }));
}

export async function absoluteUrl(path: string, canonicalBase?: string) {
  if (!canonicalBase) return path;
  return `${canonicalBase.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
