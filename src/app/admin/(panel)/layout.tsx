import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { getSessionUser, getUserPermissions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "لوحة التحكم", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const permissions = await getUserPermissions(user);
  return <AdminShell user={user} permissions={permissions}>{children}</AdminShell>;
}
