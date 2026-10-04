"use client";

import { useState } from "react";
import type { AdPayload } from "@/lib/queries";
import { AdCard, AdPreview, downloadAd, shareAd } from "@/components/templates/ad-card";

export function AdPublic({ payload }: { payload: AdPayload }) {
  const [note, setNote] = useState("");
  return (
    <div>
      <AdPreview>
        <AdCard payload={payload} />
      </AdPreview>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-gold" onClick={() => downloadAd(payload.property.slug, payload.id)}>تنزيل PNG</button>
        <button className="btn-ghost" onClick={async () => setNote((await shareAd(payload.property.title, payload.id)) === "copied" ? "تم نسخ الرابط." : "تمت المشاركة.")}>مشاركة</button>
        <a className="btn-ghost" href={`/properties/${payload.property.slug}`}>صفحة العقار</a>
      </div>
      {note && <p className="mt-2 text-sm text-[#f0d78c]">{note}</p>}
    </div>
  );
}
