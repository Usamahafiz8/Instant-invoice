import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardShell from "@/components/DashboardShell";
import { getAccess } from "@/lib/subscription";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const access = await getAccess(session.user.id);

  return (
    <DashboardShell
      user={session.user}
      trialDaysLeft={access.isTrial ? access.daysLeftInTrial : 0}
    >
      {children}
    </DashboardShell>
  );
}
