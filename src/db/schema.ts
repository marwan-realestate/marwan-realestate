import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type Spec = { label: string; value: string };
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
export type ContentBlock = {
  id: string;
  type: "heading" | "paragraph" | "image" | "button" | "section" | "links";
  text?: string;
  level?: 2 | 3;
  mediaId?: string;
  alt?: string;
  label?: string;
  href?: string;
  title?: string;
  body?: string;
  items?: { label: string; href: string }[];
};

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("employee"),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("users_email_uq").on(t.email),
    uniqueIndex("users_phone_uq").on(t.phone),
    index("users_role_idx").on(t.role),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_token_uq").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ],
);

export const permissions = pgTable("permissions", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  groupName: text("group_name").notNull().default("general"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    role: text("role").notNull(),
    permissionKey: text("permission_key")
      .notNull()
      .references(() => permissions.key, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.role, t.permissionKey] })],
);

export const userPermissionOverrides = pgTable(
  "user_permission_overrides",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionKey: text("permission_key")
      .notNull()
      .references(() => permissions.key, { onDelete: "cascade" }),
    allowed: boolean("allowed").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.permissionKey] })],
);

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    filename: text("filename").notNull(),
    originalName: text("original_name").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull().default(0),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt").notNull().default(""),
    folder: text("folder").notNull().default("general"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_folder_idx").on(t.folder)],
);

export const websiteSettings = pgTable("website_settings", {
  id: integer("id").primaryKey().default(1),
  siteName: text("site_name").notNull(),
  tagline: text("tagline").notNull().default(""),
  heroTitle: text("hero_title").notNull().default(""),
  heroSubtitle: text("hero_subtitle").notNull().default(""),
  heroMotto: text("hero_motto").notNull().default(""),
  trustLine: text("trust_line").notNull().default(""),
  aboutShort: text("about_short").notNull().default(""),
  aboutLong: text("about_long").notNull().default(""),
  phones: jsonb("phones").$type<PhoneEntry[]>().notNull().default(sql`'[]'::jsonb`),
  whatsappNumbers: jsonb("whatsapp_numbers").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  email: text("email").notNull().default(""),
  website: text("website").notNull().default(""),
  socials: jsonb("socials").$type<SocialLinks>().notNull().default(sql`'{}'::jsonb`),
  workingHours: text("working_hours").notNull().default(""),
  addressNote: text("address_note").notNull().default(""),
  gaId: text("ga_id").notNull().default(""),
  pixelId: text("pixel_id").notNull().default(""),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  canonicalBase: text("canonical_base").notNull().default(""),
  gscVerification: text("gsc_verification").notNull().default(""),
  robotsIndex: boolean("robots_index").notNull().default(true),
  logoMediaId: uuid("logo_media_id").references(() => media.id, { onDelete: "set null" }),
  faviconMediaId: uuid("favicon_media_id").references(() => media.id, { onDelete: "set null" }),
  coverMediaId: uuid("cover_media_id").references(() => media.id, { onDelete: "set null" }),
  personalPhotoMediaId: uuid("personal_photo_media_id").references(() => media.id, { onDelete: "set null" }),
  ogImageMediaId: uuid("og_image_media_id").references(() => media.id, { onDelete: "set null" }),
  hideSetupHint: boolean("hide_setup_hint").notNull().default(false),
  permissionsSeeded: boolean("permissions_seeded").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceAreas = pgTable(
  "service_areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    imageMediaId: uuid("image_media_id").references(() => media.id, { onDelete: "set null" }),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    canonicalUrl: text("canonical_url").notNull().default(""),
    ...timestamps,
  },
  (t) => [uniqueIndex("areas_slug_uq").on(t.slug), index("areas_active_idx").on(t.active)],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    summary: text("summary").notNull().default(""),
    body: text("body").notNull().default(""),
    icon: text("icon").notNull().default("building"),
    imageMediaId: uuid("image_media_id").references(() => media.id, { onDelete: "set null" }),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    canonicalUrl: text("canonical_url").notNull().default(""),
    ...timestamps,
  },
  (t) => [uniqueIndex("services_slug_uq").on(t.slug)],
);

export const propertyTypes = pgTable(
  "property_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    groupName: text("group_name").notNull().default("other"),
    suggestedTemplate: text("suggested_template").notNull().default("property"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("property_types_slug_uq").on(t.slug)],
);

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    propertyTypeId: uuid("property_type_id")
      .notNull()
      .references(() => propertyTypes.id, { onDelete: "restrict" }),
    transactionType: text("transaction_type").notNull(),
    areaId: uuid("area_id").references(() => serviceAreas.id, { onDelete: "set null" }),
    location: text("location").notNull().default(""),
    mapsUrl: text("maps_url").notNull().default(""),
    price: numeric("price", { precision: 14, scale: 2, mode: "number" }),
    priceOnRequest: boolean("price_on_request").notNull().default(false),
    areaSqm: numeric("area_sqm", { precision: 12, scale: 2, mode: "number" }),
    description: text("description").notNull().default(""),
    phone: text("phone").notNull().default(""),
    whatsapp: text("whatsapp").notNull().default(""),
    status: text("status").notNull().default("available"),
    published: boolean("published").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    referenceCode: text("reference_code").notNull().default(""),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    floor: text("floor").notNull().default(""),
    finishing: text("finishing").notNull().default(""),
    elevator: boolean("elevator").notNull().default(false),
    balcony: boolean("balcony").notNull().default(false),
    parking: boolean("parking").notNull().default(false),
    buildingAge: text("building_age").notNull().default(""),
    unitsCount: integer("units_count"),
    commercialActivity: text("commercial_activity").notNull().default(""),
    frontage: text("frontage").notNull().default(""),
    streetVisibility: text("street_visibility").notNull().default(""),
    suitableActivities: text("suitable_activities").notNull().default(""),
    features: jsonb("features").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    customSpecs: jsonb("custom_specs").$type<Spec[]>().notNull().default(sql`'[]'::jsonb`),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    canonicalUrl: text("canonical_url").notNull().default(""),
    viewCount: integer("view_count").notNull().default(0),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("properties_slug_uq").on(t.slug),
    index("properties_pub_idx").on(t.published, t.status),
    index("properties_type_idx").on(t.propertyTypeId),
    index("properties_area_idx").on(t.areaId),
    index("properties_tx_idx").on(t.transactionType),
    index("properties_featured_idx").on(t.featured),
  ],
);

export const propertyImages = pgTable(
  "property_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),
  },
  (t) => [index("property_images_prop_idx").on(t.propertyId)],
);

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    systemKey: text("system_key"),
    excerpt: text("excerpt").notNull().default(""),
    blocks: jsonb("blocks").$type<ContentBlock[]>().notNull().default(sql`'[]'::jsonb`),
    featuredMediaId: uuid("featured_media_id").references(() => media.id, { onDelete: "set null" }),
    showInNav: boolean("show_in_nav").notNull().default(false),
    navLabel: text("nav_label").notNull().default(""),
    isSystem: boolean("is_system").notNull().default(false),
    published: boolean("published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    canonicalUrl: text("canonical_url").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("pages_slug_uq").on(t.slug),
    uniqueIndex("pages_system_key_uq").on(t.systemKey),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    kind: text("kind").notNull().default("article"),
    ...timestamps,
  },
  (t) => [uniqueIndex("categories_slug_uq").on(t.slug)],
);

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    body: text("body").notNull().default(""),
    blocks: jsonb("blocks").$type<ContentBlock[]>().notNull().default(sql`'[]'::jsonb`),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    featuredMediaId: uuid("featured_media_id").references(() => media.id, { onDelete: "set null" }),
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    canonicalUrl: text("canonical_url").notNull().default(""),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("articles_slug_uq").on(t.slug),
    index("articles_status_idx").on(t.status),
  ],
);

export const customerRequests = pgTable(
  "customer_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    whatsapp: text("whatsapp").notNull().default(""),
    transactionType: text("transaction_type").notNull().default(""),
    propertyTypeId: uuid("property_type_id").references(() => propertyTypes.id, { onDelete: "set null" }),
    areaId: uuid("area_id").references(() => serviceAreas.id, { onDelete: "set null" }),
    budget: text("budget").notNull().default(""),
    areaSqm: text("area_sqm").notNull().default(""),
    bedrooms: text("bedrooms").notNull().default(""),
    details: text("details").notNull().default(""),
    notes: text("notes").notNull().default(""),
    status: text("status").notNull().default("new"),
    honeypot: text("honeypot").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    index("requests_status_idx").on(t.status),
    index("requests_kind_idx").on(t.kind),
    index("requests_created_idx").on(t.createdAt),
  ],
);

export const requestNotes = pgTable(
  "request_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => customerRequests.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("request_notes_req_idx").on(t.requestId)],
);

export const adCards = pgTable(
  "ad_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    template: text("template").notNull(),
    published: boolean("published").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("ad_cards_property_idx").on(t.propertyId)],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
    adId: uuid("ad_id").references(() => adCards.id, { onDelete: "set null" }),
    path: text("path").notNull().default(""),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("analytics_type_idx").on(t.type, t.createdAt),
    index("analytics_property_idx").on(t.propertyId),
  ],
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_created_idx").on(t.createdAt)],
);
