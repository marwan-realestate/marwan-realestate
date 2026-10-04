import { AdminScreen } from "@/components/admin/workspace";

export const dynamic = "force-dynamic";

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <AdminScreen section={section} />;
}
