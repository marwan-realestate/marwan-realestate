"use client";

import { useCallback, useEffect, useState } from "react";

export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const json = await response.json();
  if (!json.ok) throw new Error(json.error || "حدث خطأ");
  return json.data as T;
}

export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(url));
  const reload = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError("");
    try {
      setData(await api<T>(url));
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-[#3c3324]">
      {label}
      {children}
    </label>
  );
}

export function Notice({ text, tone = "error" }: { text: string; tone?: "error" | "ok" }) {
  if (!text) return null;
  return <p className={`rounded-xl px-3 py-2 text-sm ${tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{text}</p>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-[#f7f3ea] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button className="btn-navy !min-h-9" onClick={onClose}>إغلاق</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ImageField({ label = "اختر صورة من الجهاز", onFile, busy = false, className = "" }: { label?: string; onFile: (file: File) => void | Promise<void>; busy?: boolean; className?: string }) {
  return (
    <label className={`btn-navy inline-flex cursor-pointer items-center gap-2 !min-h-10 ${className}`}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3M12 15V4M8 8l4-4 4 4" />
      </svg>
      <span>{busy ? "جارٍ الرفع..." : label}</span>
      <input
        className="hidden"
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onFile(file);
          event.target.value = "";
        }}
      />
    </label>
  );
}

const FOLDERS: { value: string; label: string }[] = [
  { value: "", label: "كل الصور" },
  { value: "brand", label: "هوية" },
  { value: "general", label: "عام" },
  { value: "properties", label: "عقارات" },
  { value: "articles", label: "مقالات" },
];

type MediaItem = { id: string; url: string; alt: string; originalName: string; folder: string };

export function MediaPicker({ onSelect, folder = "general" }: { onSelect: (item: { id: string; url: string; alt: string }) => void; folder?: string }) {
  const { data, reload, error, loading } = useApi<MediaItem[]>("/api/media");
  const [filter, setFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");
  const items = (data || []).filter((item) => !filter || item.folder === filter);

  async function upload(file: File) {
    setUploading(true);
    setLocalError("");
    const form = new FormData();
    form.set("file", file);
    form.set("folder", filter || folder);
    try {
      const saved = await api<{ id: string; url: string }>("/api/media", { method: "POST", body: form });
      await reload();
      onSelect({ id: saved.id, url: saved.url, alt: "" });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "تعذر الرفع");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="rounded-2xl border border-dashed border-[#d4af37]/60 bg-white p-3">
        <p className="text-sm font-bold">رفع صورة جديدة من الجهاز أو المعرض</p>
        <div className="mt-2"><ImageField label="فتح معرض الجهاز" busy={uploading} onFile={upload} /></div>
        {uploading && <p className="mt-2 text-sm text-[#8a6a1d]">جارٍ تحسين الصورة وضغطها ورفعها...</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold">المعرض — اضغط على الصورة لاختيارها</p>
        <div className="flex flex-wrap gap-1">
          {FOLDERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-full px-3 py-1 text-xs ${filter === item.value ? "bg-[#d4af37] text-[#1a1406]" : "bg-[#efe7d6] text-[#5c4c2c]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <Notice text={localError || error} />

      {loading && <p className="mt-3 text-sm">جارٍ تحميل المعرض...</p>}
      {!loading && items.length === 0 && (
        <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-[#6d6458]">
          لا توجد صور في هذا القسم بعد. استخدم «رفع صورة جديدة» بالأعلى، أو اختر قسمًا آخر من الأزرار.
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect({ id: item.id, url: item.url, alt: item.alt })}
            className="group overflow-hidden rounded-xl border border-[#d4af37]/30 bg-white text-right"
          >
            <img src={item.url} alt={item.alt || item.originalName} className="h-24 w-full object-cover" />
            <span className="block truncate px-2 py-1 text-xs text-[#5c4c2c]">{item.alt || item.originalName || "صورة"}</span>
            <span className="block bg-[#d4af37] px-2 py-1 text-center text-xs font-bold text-[#1a1406] opacity-0 transition group-hover:opacity-100">اختيار</span>
          </button>
        ))}
      </div>
    </div>
  );
}
