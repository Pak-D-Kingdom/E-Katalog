import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/admin/auth/login");
  }

  const settings = await prisma.pengaturan_katalog.findFirst({
    select: { nama_instansi: true },
    orderBy: { id: "asc" },
  });

  return (
    <AdminShell initialInstanceName={settings?.nama_instansi.trim() || "Nama Instansi"}>
      {children}
    </AdminShell>
  );
}