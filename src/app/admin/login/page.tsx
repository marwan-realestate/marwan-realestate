import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/queries";
import { INITIAL_OWNER } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/admin");
  const settings = await getSettings();
  return <LoginForm siteName={settings.siteName} logoUrl={settings.logoUrl} hint={settings.hideSetupHint ? null : { email: INITIAL_OWNER.email, password: INITIAL_OWNER.password }} />;
}
