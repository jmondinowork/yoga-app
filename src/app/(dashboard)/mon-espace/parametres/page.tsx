import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlans } from "@/lib/stripe";
import ParametresClient from "./ParametresClient";

export const metadata: Metadata = {
  title: "Paramètres",
};

export default async function ParametresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      notifNewCourses: true,
    },
  });

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  const plans = await getPlans();
  const subscriptionPrice = subscription
    ? plans.find((p) => p.id.toUpperCase() === subscription.plan)?.price ?? null
    : null;

  const subscriptionData = subscription
    ? {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      }
    : null;

  return (
    <ParametresClient
      userName={user?.name || ""}
      userEmail={user?.email || ""}
      subscription={subscriptionData}
      subscriptionPrice={subscriptionPrice}
      notifNewCourses={user?.notifNewCourses ?? true}
    />
  );
}
