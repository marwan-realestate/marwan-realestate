import { AdminScreen } from "@/components/admin/workspace";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ section: string; id: string }> }) {
  const { section, id } = await params;
  return <AdminScreen section={section} id={id} />;
}
