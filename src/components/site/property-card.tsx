import type { PropertyView } from "@/lib/queries";
import { resolveContacts, type PublicSettings } from "@/lib/shared";
import { ContactActions } from "@/components/site/interactive";

export function PropertyCard({ property, settings }: { property: PropertyView; settings: PublicSettings }) {
  const contacts = resolveContacts(settings, property);
  return (
    <article className="overflow-hidden rounded-3xl border border-[#d4af37]/25 bg-[#0c1730]">
      <a href={`/properties/${property.slug}`} className="relative block h-52 bg-[#07101f]">
        {property.coverUrl ? (
          <img src={property.coverUrl} alt={property.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#c5cde0]">لا توجد صورة</div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-[#07101f]/85 px-3 py-1 text-xs font-bold text-[#f0d78c]">{property.transactionLabel}</span>
        {property.status !== "available" && <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs">{property.statusLabel}</span>}
      </a>
      <div className="p-4">
        <a href={`/properties/${property.slug}`} className="text-lg font-extrabold text-white">
          {property.title}
        </a>
        <p className="mt-1 text-sm text-[#c5cde0]">
          {[property.typeName, property.areaName, property.location].filter(Boolean).join(" · ")}
        </p>
        {property.priceLabel && <p className="mt-3 text-xl font-extrabold text-[#f0d78c]">{property.priceLabel}</p>}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#d7deee]">
          {property.areaLabel && <span className="rounded-full border border-white/10 px-2 py-1">{property.areaLabel}</span>}
          {property.bedrooms != null && property.bedrooms > 0 && <span className="rounded-full border border-white/10 px-2 py-1">{property.bedrooms} غرف</span>}
          {property.bathrooms != null && property.bathrooms > 0 && <span className="rounded-full border border-white/10 px-2 py-1">{property.bathrooms} حمام</span>}
          {property.floor && <span className="rounded-full border border-white/10 px-2 py-1">الدور {property.floor}</span>}
        </div>
        <ContactActions phones={contacts.phones.slice(0, 1)} whatsapps={contacts.whatsapps.slice(0, 1)} propertyId={property.id} compact message={`استفسار عن ${property.title}`} />
      </div>
    </article>
  );
}
