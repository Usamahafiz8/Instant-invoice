import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
