import { prisma } from "@/lib/prisma";
import { isActiveStatus } from "@/lib/lemonsqueezy";
import type { Subscription } from "@prisma/client";

// New accounts get a 7-day free trial of the whole app, starting at sign-up.
export const TRIAL_DAYS = 7;

export type Access = {
  hasAccess: boolean;
  // Why access is (or isn't) granted:
  isSubscribed: boolean; // active paid/trial subscription in Lemon Squeezy
  isTrial: boolean; // still within the free trial window
  trialEndsAt: Date | null;
  daysLeftInTrial: number;
  subscription: Subscription | null;
};

function trialEnd(createdAt: Date): Date {
  return new Date(createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

// A cancelled subscription still grants access until its period ends.
function subscriptionGrantsAccess(sub: Subscription | null): boolean {
  if (!sub) return false;
  if (isActiveStatus(sub.status)) return true;
  if (sub.status === "cancelled" && sub.endsAt && sub.endsAt.getTime() > Date.now())
    return true;
  return false;
}

/** Resolve whether a user may use the app, and why. */
export async function getAccess(userId: string): Promise<Access> {
  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);

  const isSubscribed = subscriptionGrantsAccess(subscription);

  const trialEndsAt = user ? trialEnd(user.createdAt) : null;
  const now = Date.now();
  const isTrial = !isSubscribed && !!trialEndsAt && trialEndsAt.getTime() > now;
  const daysLeftInTrial =
    trialEndsAt && trialEndsAt.getTime() > now
      ? Math.ceil((trialEndsAt.getTime() - now) / (24 * 60 * 60 * 1000))
      : 0;

  return {
    hasAccess: isSubscribed || isTrial,
    isSubscribed,
    isTrial,
    trialEndsAt,
    daysLeftInTrial,
    subscription: subscription ?? null,
  };
}
