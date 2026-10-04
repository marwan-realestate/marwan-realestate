"use client";

import { useEffect, useRef, useState } from "react";
import type { AdPayload } from "@/lib/queries";
import { telHref, whatsappHref } from "@/lib/shared";
import { track } from "@/components/site/interactive";

const W = 1200;
const H = 640;

function RoundPhoneIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="m5.2 3.8 2.8-.6 1.7 4.4-2 1.7a15 15 0 0 0 6.9 6.9l1.7-2 4.4 1.7-.6 2.8a2.3 2.3 0 0 1-2.5 1.8C9.8 19.7 4.3 14.2 3.4 6.3a2.3 2.3 0 0 1 1.8-2.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RoundWhatsappIcon() {
  return (
    <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 11.4a8.1 8.1 0 0 1-11.9 7.2L4 20l1.4-3.9A8.1 8.1 0 1 1 20 11.4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.1 7.7 1 2.5-1.1.9a6.2 6.2 0 0 0 3.9 3.9l.9-1.1 2.5 1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LineIcon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    bed: "M3 18V8m0 6h18M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M3 18h18v2H3z",
    bath: "M5 11h14v3a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5v-3zm2-3V6a2 2 0 0 1 2-2",
    area: "M4 8l8-4 8 4v8l-8 4-8-4V8zm8-4v16",
    floor: "M4 20h16M6 20V6h8v14M10 10h2M10 14h2",
    pin: "M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zm0-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    shop: "M4 10l1-5h14l1 5M5 10v9h14v-9M9 19v-5h6v5",
    front: "M3 20V8l9-5 9 5v12M9 20v-6h6v6",
    eye: "M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    type: "M4 20h16M6 20V9l6-5 6 5v11",
  };
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e6c56a" strokeWidth="1.6">
      <path d={paths[kind] || paths.type} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function specsFor(payload: AdPayload) {
  const p = payload.property;
  if (payload.template === "shop") {
    return [
      p.commercialActivity ? { icon: "shop", label: "النشاط", value: p.commercialActivity } : null,
      p.frontage ? { icon: "front", label: "الواجهة", value: p.frontage } : null,
      p.floor ? { icon: "floor", label: "الدور", value: p.floor } : null,
      p.streetVisibility ? { icon: "eye", label: "الرؤية", value: p.streetVisibility } : null,
      p.areaLabel ? { icon: "area", label: "المساحة", value: p.areaLabel } : null,
    ].filter(Boolean) as { icon: string; label: string; value: string }[];
  }
  if (payload.template === "apartment") {
    return [
      p.bedrooms ? { icon: "bed", label: "الغرف", value: String(p.bedrooms) } : null,
      p.bathrooms ? { icon: "bath", label: "الحمامات", value: String(p.bathrooms) } : null,
      p.floor ? { icon: "floor", label: "الدور", value: p.floor } : null,
      p.areaLabel ? { icon: "area", label: "المساحة", value: p.areaLabel } : null,
      p.finishing ? { icon: "type", label: "التشطيب", value: p.finishing } : null,
    ].filter(Boolean) as { icon: string; label: string; value: string }[];
  }
  return [
    p.typeName ? { icon: "type", label: "النوع", value: p.typeName } : null,
    p.areaLabel ? { icon: "area", label: "المساحة", value: p.areaLabel } : null,
    p.areaName ? { icon: "pin", label: "المنطقة", value: p.areaName } : null,
    p.floor ? { icon: "floor", label: "الدور", value: p.floor } : null,
    p.bedrooms ? { icon: "bed", label: "الغرف", value: String(p.bedrooms) } : null,
    p.frontage ? { icon: "front", label: "الواجهة", value: p.frontage } : null,
  ].filter(Boolean) as { icon: string; label: string; value: string }[];
}

export function AdCard({ payload, captureId = "ad-export" }: { payload: AdPayload; captureId?: string }) {
  const p = payload.property;
  const specs = specsFor(payload).slice(0, 4);
  const image = p.images[0]?.url || "";
  const location = [p.areaName, p.location].filter(Boolean).join(" - ");
  const subtitle = [p.transactionLabel, p.typeName].filter(Boolean).join("  ·  ");
  const chips = [
    p.elevator ? "مصعد" : "",
    p.balcony ? "بلكونة" : "",
    p.parking ? "جراج" : "",
    p.buildingAge ? p.buildingAge : "",
    p.suitableActivities || "",
    ...p.features,
  ].filter(Boolean).slice(0, 3);
  return (
    <div id={captureId} dir="ltr" style={{ width: W, height: H, position: "relative", overflow: "hidden", background: "#07111f", color: "#f7f4ec", fontFamily: "Cairo, Tahoma, sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, #08142c 0%, #07101f 46%, #050910 100%)" }} />
      <div style={{ position: "absolute", inset: 12, border: "1px solid rgba(212,175,55,0.55)", pointerEvents: "none", zIndex: 5 }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: "48%", height: "100%", clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0 82%)", overflow: "hidden" }}>
        {image ? (
          <img src={image} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg,#102044,#07101f)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <svg viewBox="0 0 420 90" width="78%" height="120">
              <path d="M0 90 V58 H28 V34 H58 V58 H92 V18 H128 V58 H164 V40 H204 V58 H246 V14 H286 V58 H324 V36 H368 V58 H420 V90 Z" fill="#d4af37" />
            </svg>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #07111f 0%, rgba(7,17,31,0.15) 22%, transparent 40%)" }} />
        {!image && <div style={{ position: "absolute", left: 0, right: 0, bottom: 86, textAlign: "center", color: "#f0d78c", fontSize: 18 }}>لا توجد صورة مرفوعة</div>}
      </div>
      <div style={{ position: "absolute", top: -40, bottom: 40, left: "51%", width: 2, background: "linear-gradient(#f8e7a8, #8d6b22)", transform: "rotate(12deg)", opacity: 0.9 }} />
      <div dir="rtl" style={{ position: "absolute", top: 34, right: 500, left: 36, bottom: 108, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={payload.logoUrl} alt="" crossOrigin="anonymous" style={{ width: 92, height: 92, objectFit: "contain" }} />
          <div>
            <div style={{ color: "#f3e2a3", fontWeight: 800, fontSize: 18 }}>{payload.siteName}</div>
            {payload.tagline && <div style={{ color: "#d5dced", marginTop: 4, fontSize: 14 }}>{payload.tagline}</div>}
          </div>
        </div>
        <div style={{ marginTop: 16, fontSize: 40, lineHeight: 1.25, fontWeight: 800, color: "#f6e7b2" }}>{p.title}</div>
        {subtitle && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, color: "#fff", fontSize: 22, fontWeight: 700 }}>
            <span style={{ height: 1, width: 42, background: "#d4af37" }} />
            <span>{subtitle}</span>
            <span style={{ height: 1, width: 42, background: "#d4af37" }} />
          </div>
        )}
        {location && <div style={{ marginTop: 8, color: "#f0d78c", fontSize: 16 }}>{location}</div>}
        {specs.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${specs.length}, minmax(0, 1fr))`, gap: 10, marginTop: 18, maxWidth: 560 }}>
            {specs.map((spec) => (
              <div key={spec.label} style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center" }}><LineIcon kind={spec.icon} /></div>
                <div style={{ marginTop: 6, fontWeight: 800, fontSize: 15 }}>{spec.value}</div>
                <div style={{ color: "#d7deee", fontSize: 12, marginTop: 2 }}>{spec.label}</div>
              </div>
            ))}
          </div>
        )}
        {chips.length > 0 && <div style={{ marginTop: 12, color: "#f0d78c", fontSize: 14 }}>{chips.join("  ·  ")}</div>}
      </div>
      <div dir="rtl" style={{ position: "absolute", left: 24, right: 250, bottom: 18, height: 64, borderTop: "1px solid rgba(212,175,55,0.45)", display: "flex", alignItems: "center", gap: 16, fontSize: 14 }}>
        {location && <span>{location}</span>}
        {payload.trustLine && <span style={{ color: "#f0d78c" }}>{payload.trustLine}</span>}
        <span style={{ marginRight: "auto", display: "flex", gap: 8 }}>
          {payload.phones.slice(0, 1).map((phone) => (
            <a key={phone} href={telHref(phone)} aria-label="اتصال" style={{ width: 38, height: 38, background: "linear-gradient(#f8e7a8,#d4af37)", color: "#1a1406", borderRadius: "50%", display: "grid", placeItems: "center" }}><RoundPhoneIcon /></a>
          ))}
          {payload.whatsapps.slice(0, 1).map((phone) => (
            <a key={phone} href={whatsappHref(phone, `استفسار عن ${p.title}`)} aria-label="واتساب" style={{ width: 38, height: 38, background: "#0f8f6e", color: "#fff", borderRadius: "50%", display: "grid", placeItems: "center" }}><RoundWhatsappIcon /></a>
          ))}
        </span>
      </div>
      {(p.priceLabel || p.transactionLabel) && (
        <div dir="rtl" style={{ position: "absolute", right: 0, bottom: 0, width: 280, height: 118, background: "#0c1b38", clipPath: "polygon(16% 0, 100% 0, 100% 100%, 0 100%)", borderTop: "1px solid rgba(212,175,55,0.7)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", paddingRight: 18 }}>
          <svg viewBox="0 0 220 36" width="150" height="28">
            <path d="M0 36 V22 H18 V12 H36 V22 H58 V6 H78 V22 H100 V14 H124 V22 H150 V4 H172 V22 H196 V16 H220 V36 Z" fill="#e6c56a" />
          </svg>
          {p.priceLabel && <div style={{ color: "#f6e7b2", fontWeight: 800, fontSize: 26, marginTop: 4 }}>{p.priceLabel}</div>}
          <div style={{ color: "#fff", fontSize: 14 }}>{p.transactionLabel}</div>
        </div>
      )}
    </div>
  );
}

export function AdPreview({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / W));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative w-full overflow-hidden rounded-2xl" style={{ height: H * scale }}>
      <div style={{ position: "absolute", left: "50%", width: W, height: H, transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center" }}>{children}</div>
    </div>
  );
}

export async function downloadAd(filename: string, adId?: string) {
  const node = document.getElementById("ad-export");
  if (!node) return;
  await document.fonts?.ready;
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2, backgroundColor: "#07111f", width: W, height: H });
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${filename || "ad"}.png`;
  link.click();
  track("ad_download", { adId });
  return dataUrl;
}

export async function shareAd(title: string, adId?: string) {
  const url = adId ? `${window.location.origin}/ads/${adId}` : window.location.href;
  const node = document.getElementById("ad-export");
  try {
    if (node && navigator.share) {
      await document.fonts?.ready;
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(node, { cacheBust: true, pixelRatio: 2, backgroundColor: "#07111f", width: W, height: H });
      const file = blob ? new File([blob], "ad.png", { type: "image/png" }) : null;
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text: title, url, files: [file] });
        track("ad_share", { adId });
        return "shared";
      }
    }
    if (navigator.share) {
      await navigator.share({ title, url });
      track("ad_share", { adId });
      return "shared";
    }
  } catch {
    /* cancelled */
  }
  await navigator.clipboard.writeText(url);
  track("ad_share", { adId });
  return "copied";
}
