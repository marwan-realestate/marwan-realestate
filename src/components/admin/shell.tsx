"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/shared";

const links = [
  { href: "/admin", label: "الرئيسية", perm: "dashboard.view" },
  { href: "/admin/properties", label: "العقارات", perm: "properties.view" },
  { href: "/admin/requests", label: "طلبات العملاء", perm: "requests.view" },
  { href: "/admin/templates", label: "القوالب الإعلانية", perm: "templates.manage" },
  { href: "/admin/articles", label: "المقالات", perm: "articles.view" },
  { href: "/admin/pages", label: "الصفحات", perm: "pages.view" },
  { href: "/admin/services", label: "الخدمات", perm: "services.manage" },
  { href: "/admin/areas", label: "مناطق الخدمة", perm: "areas.manage" },
  { href: "/admin/media", label: "الوسائط", perm: "media.manage" },
  { href: "/admin/users", label: "المستخدمون والصلاحيات", perm: "users.manage" },
  { href: "/admin/analytics", label: "الإحصائيات", perm: "analytics.view" },
  { href: "/admin/settings", label: "إعدادات الموقع", perm: "settings.manage" },
  { href: "/admin/seo", label: "SEO", perm: "seo.manage" },
  { href: "/admin/links", label: "روابط الموقع", perm: "dashboard.view" },
];

export function AdminShell({ user, permissions, children }: { user: SessionUser; permissions: string[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visible = links.filter((link) => user.role === "owner" || permissions.includes(link.perm));
  return (
    <div className="min-h-screen bg-[#f6f1e7] text-[#172033]">
      <div className="flex min-h-screen">
        <aside className={`${open ? "translate-x-0" : "translate-x-full"} fixed inset-y-0 right-0 z-40 w-72 overflow-auto bg-[#07101f] text-white transition lg:static lg:translate-x-0`}>
          <div className="border-b border-[#d4af37]/20 p-4">
            <a href="/" className="text-xs text-[#f0d78c]">عرض الموقع</a>
            <p className="mt-2 text-lg font-extrabold text-[#f0d78c]">لوحة التحكم</p>
            <p className="text-sm text-[#c5cde0]">{user.name} · {user.roleLabel}</p>
          </div>
          <nav className="grid gap-1 p-3">
            {visible.map((link) => {
              const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
              return (
                <a key={link.href} href={link.href} onClick={() => setOpen(false)} className={`rounded-xl px-3 py-2 text-sm ${active ? "bg-[#d4af37] text-[#1a1406]" : "hover:bg-white/5"}`}>
                  {link.label}
                </a>
              );
            })}
          </nav>
          <form action="/api/auth" method="post" className="p-3" onSubmit={async (event) => { event.preventDefault(); await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); window.location.href = "/admin/login"; }}>
            <button className="btn-ghost w-full">تسجيل الخروج</button>
          </form>
        </aside>
        {open && <button className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-label="إغلاق" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-[#d4af37]/20 bg-white/70 px-4 py-3 lg:hidden">
            <button className="btn-navy !min-h-10" onClick={() => setOpen(true)}>القائمة</button>
            <span className="font-bold">{user.roleLabel}</span>
          </div>
          <div className="p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
