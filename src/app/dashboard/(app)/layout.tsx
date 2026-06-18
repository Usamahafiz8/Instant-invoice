import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth-helpers";
import { getAccess } from "@/lib/subscription";

// Paid gate for the whole app. Auth is already enforced by dashboard/layout.tsx;
// here we additionally require an active subscription OR an in-window free trial.
// The /dashboard/billing page lives outside this group, so it stays reachable
// for users who need to subscribe.
export default async function PaidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/signin");

  const { hasAccess } = await getAccess(userId);
  if (!hasAccess) redirect("/dashboard/billing");

  return <>{children}</>;
}
