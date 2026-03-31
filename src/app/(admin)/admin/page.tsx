import type { Metadata } from "next";
import { Users, CreditCard, Video, TrendingUp, Eye, DollarSign, BookOpen, UserPlus, ShoppingBag, BarChart3, Clock } from "lucide-react";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SIMULATE_PAYMENTS, getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Admin — Dashboard",
};

const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 60) return `Il y a ${minutes}m`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days}j`;
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    totalUsers,
    newUsersThisMonth,
    activeSubscriptions,
    newSubscriptionsThisMonth,
    monthlySubscriptions,
    annualSubscriptions,
    publishedCourses,
    publishedFormations,
    topCourses,
    topFormations,
    avgCompletion,
    activeRentals,
    formationPurchasesThisMonth,
    totalDurationAgg,
    activeUsersRaw,
    avgPurchaseAgg,
    formationRevenueThisMonthAgg,
    courseRentalsThisMonth,
    courseRentalRevenueThisMonthAgg,
    recentUsers,
    recentPurchases,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.USER } }),
    prisma.user.count({ where: { role: Role.USER, createdAt: { gte: startOfMonth } } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.subscription.count({ where: { status: "ACTIVE", plan: "MONTHLY" } }),
    prisma.subscription.count({ where: { status: "ACTIVE", plan: "ANNUAL" } }),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.formation.count({ where: { isPublished: true } }),
    prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { progress: { _count: "desc" } },
      take: 4,
      select: {
        title: true,
        theme: true,
        _count: { select: { progress: true } },
      },
    }),
    prisma.formation.findMany({
      where: { isPublished: true },
      orderBy: { purchases: { _count: "desc" } },
      take: 4,
      select: {
        title: true,
        _count: { select: { purchases: true } },
      },
    }),
    prisma.videoProgress.aggregate({ _avg: { progress: true } }),
    prisma.purchase.count({ where: { courseId: { not: null }, expiresAt: { gt: now } } }),
    prisma.purchase.count({ where: { formationId: { not: null }, createdAt: { gte: startOfMonth } } }),
    // Durée totale du contenu (en minutes)
    prisma.course.aggregate({ _sum: { duration: true }, where: { isPublished: true } }),
    // Utilisateurs actifs (7 derniers jours)
    prisma.videoProgress.findMany({
      where: { lastWatchedAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    // Panier moyen
    prisma.purchase.aggregate({ _avg: { amount: true }, _count: true }),
    // Revenue formations ce mois
    prisma.purchase.aggregate({ _sum: { amount: true }, where: { formationId: { not: null }, createdAt: { gte: startOfMonth } } }),
    // Locations cours ce mois
    prisma.purchase.count({ where: { courseId: { not: null }, createdAt: { gte: startOfMonth } } }),
    prisma.purchase.aggregate({ _sum: { amount: true }, where: { courseId: { not: null }, createdAt: { gte: startOfMonth } } }),
    prisma.user.findMany({
      where: { role: Role.USER },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    }),
    prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
        formation: { select: { title: true } },
      },
    }),
  ]);

  // Build activity feed
  type ActivityItem = {
    type: "inscription" | "achat_formation" | "location_cours";
    date: Date;
    userName: string;
    userEmail: string;
    detail?: string;
  };

  const activityFeed: ActivityItem[] = [];

  for (const user of recentUsers) {
    activityFeed.push({
      type: "inscription",
      date: user.createdAt,
      userName: user.name ?? "—",
      userEmail: user.email,
    });
  }

  for (const purchase of recentPurchases) {
    if (purchase.formationId) {
      activityFeed.push({
        type: "achat_formation",
        date: purchase.createdAt,
        userName: purchase.user.name ?? "—",
        userEmail: purchase.user.email,
        detail: purchase.formation?.title ?? "Formation",
      });
    } else if (purchase.courseId) {
      activityFeed.push({
        type: "location_cours",
        date: purchase.createdAt,
        userName: purchase.user.name ?? "—",
        userEmail: purchase.user.email,
        detail: purchase.course?.title ?? "Cours",
      });
    }
  }

  activityFeed.sort((a, b) => b.date.getTime() - a.date.getTime());
  const activityItems = activityFeed.slice(0, 8);

  const averageCompletion = avgCompletion._avg.progress != null
    ? Math.round(avgCompletion._avg.progress * 100)
    : 0;

  const totalDurationMin = totalDurationAgg._sum.duration ?? 0;
  const totalDurationH = Math.floor(totalDurationMin / 60);
  const totalDurationM = totalDurationMin % 60;
  const totalDurationLabel = totalDurationH > 0
    ? `${totalDurationH}h${totalDurationM > 0 ? `${String(totalDurationM).padStart(2, "0")}` : ""}`
    : `${totalDurationM}min`;

  const activeUsersCount = activeUsersRaw.length;
  const avgPurchaseAmount = avgPurchaseAgg._avg.amount != null
    ? avgPurchaseAgg._avg.amount.toFixed(2)
    : "0";
  const totalPurchasesCount = avgPurchaseAgg._count;
  const formationRevenueThisMonth = formationRevenueThisMonthAgg._sum.amount ?? 0;
  const courseRentalRevenueThisMonth = courseRentalRevenueThisMonthAgg._sum.amount ?? 0;

  // Build monthly revenue map for the last 12 months
  const revenueByMonth: Record<string, number> = {};
  const chartLabels: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    revenueByMonth[key] = 0;
    chartLabels.push(MONTH_NAMES[d.getMonth()]);
  }

  let revenueThisMonth = 0;

  if (!SIMULATE_PAYMENTS) {
    // Données réelles depuis Stripe
    const stripeClient = getStripe();
    const charges = await stripeClient.charges.list({
      created: { gte: Math.floor(twelveMonthsAgo.getTime() / 1000) },
      limit: 100,
    });
    for (const charge of charges.data) {
      if (charge.status !== "succeeded") continue;
      const d = new Date(charge.created * 1000);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const amount = charge.amount / 100; // centimes → euros
      if (key in revenueByMonth) revenueByMonth[key] += amount;
      if (d >= startOfMonth) revenueThisMonth += amount;
    }
  } else {
    // Mode simulation : lecture de la table Purchase locale
    const [revenueAgg, localPurchases] = await Promise.all([
      prisma.purchase.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: startOfMonth } } }),
      prisma.purchase.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { amount: true, createdAt: true },
      }),
    ]);
    revenueThisMonth = revenueAgg._sum.amount ?? 0;
    for (const p of localPurchases) {
      const key = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`;
      if (key in revenueByMonth) revenueByMonth[key] += p.amount;
    }
  }
  const monthlyValues = Object.values(revenueByMonth);
  const maxRevenue = Math.max(...monthlyValues, 1);
  const chartBars = monthlyValues.map((v) => Math.round((v / maxRevenue) * 100));

  const chartRangeLabel = `${chartLabels[0]} — ${chartLabels[11]} ${now.getFullYear()}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Dashboard
        </h1>
        <p className="text-muted">Vue d&apos;ensemble de votre plateforme</p>
      </div>

      {/* Stats Grid — 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Utilisateurs */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              +{newUsersThisMonth} ce mois
            </span>
          </div>
          <div>
            <p className="font-heading text-2xl font-bold text-heading">{totalUsers.toLocaleString("fr-FR")}</p>
            <p className="text-sm text-muted">Utilisateurs</p>
          </div>
        </div>

        {/* Abonnés actifs */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +{newSubscriptionsThisMonth} ce mois
            </span>
          </div>
          <div>
            <p className="font-heading text-2xl font-bold text-heading">{activeSubscriptions.toLocaleString("fr-FR")}</p>
            <p className="text-sm text-muted">Abonnés actifs</p>
            <p className="text-xs text-muted">{monthlySubscriptions} mensuels · {annualSubscriptions} annuels</p>
          </div>
        </div>

        {/* Revenus du mois */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-heading text-2xl font-bold text-heading">
              {revenueThisMonth.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-muted">Revenus du mois</p>
          </div>
        </div>

        {/* Cours publiés */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-heading text-2xl font-bold text-heading">{publishedCourses}</p>
            <p className="text-sm text-muted">Cours publiés</p>
          </div>
        </div>

        {/* Formations publiées */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-heading text-2xl font-bold text-heading">{publishedFormations}</p>
            <p className="text-sm text-muted">Formations publiées</p>
          </div>
        </div>
      </div>

      {/* Revenue Chart — full width */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-heading text-lg font-semibold text-heading mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-button" />
          Revenus mensuels
        </h2>
        <div className="space-y-2">
          <div className="flex items-end gap-1 h-40">
            {chartBars.map((h, i) => (
              <div
                key={i}
                title={`${chartLabels[i]} : ${monthlyValues[i].toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}`}
                className="flex-1 bg-button/20 hover:bg-button/50 rounded-t transition-colors"
                style={{ height: `${Math.max(h, 2)}%` }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            {chartLabels.map((label, i) => (
              <p key={i} className="flex-1 text-center text-[10px] text-muted">{label}</p>
            ))}
          </div>
          <p className="text-xs text-muted text-center">{chartRangeLabel}</p>
        </div>
      </div>

      {/* Middle row — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contenu populaire */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-heading text-lg font-semibold text-heading mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-button" />
            Contenu populaire
          </h2>

          {/* Sub-section: Cours */}
          <div>
            <h3 className="text-sm font-semibold text-heading mb-2">Cours</h3>
            {topCourses.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">Aucune donnée</p>
            ) : (
              <div className="space-y-2">
                {topCourses.map((course, i) => (
                  <div
                    key={course.title}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-muted">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-heading leading-tight">{course.title}</p>
                        <p className="text-xs text-muted">{course.theme}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-heading whitespace-nowrap ml-2">
                      {course._count.progress} suivis
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border my-3" />

          {/* Sub-section: Formations */}
          <div>
            <h3 className="text-sm font-semibold text-heading mb-2">Formations</h3>
            {topFormations.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">Aucune donnée</p>
            ) : (
              <div className="space-y-2">
                {topFormations.map((formation, i) => (
                  <div
                    key={formation.title}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-muted">
                        {i + 1}
                      </span>
                      <p className="text-sm font-medium text-heading leading-tight">{formation.title}</p>
                    </div>
                    <span className="text-xs font-medium text-heading whitespace-nowrap ml-2">
                      {formation._count.purchases} achats
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-heading flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-button" />
            Statistiques
          </h2>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted">Complétion moyenne</p>
              <div className="mt-1.5 w-full bg-border/50 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(averageCompletion, 100)}%` }} />
              </div>
            </div>
            <span className="font-heading text-2xl font-bold text-heading shrink-0">{averageCompletion}%</span>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted">Abonnés actifs</p>
              <p className="text-xs text-muted mt-0.5">{monthlySubscriptions} mensuels · {annualSubscriptions} annuels</p>
            </div>
            <span className="font-heading text-2xl font-bold text-heading shrink-0">{activeSubscriptions}</span>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted">Achats formations ce mois</p>
              <p className="text-xs text-muted mt-0.5">{formationRevenueThisMonth.toFixed(2)} € de revenus</p>
            </div>
            <span className="font-heading text-2xl font-bold text-heading shrink-0">{formationPurchasesThisMonth}</span>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted">Locations cours ce mois</p>
              <p className="text-xs text-muted mt-0.5">{courseRentalRevenueThisMonth.toFixed(2)} € de revenus</p>
            </div>
            <span className="font-heading text-2xl font-bold text-heading shrink-0">{courseRentalsThisMonth}</span>
          </div>
        </div>
      </div>

      {/* Bottom row — Activity feed */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-heading text-lg font-semibold text-heading flex items-center gap-2">
            <Users className="w-5 h-5 text-button" />
            Activité récente
          </h2>
        </div>
        {activityItems.length === 0 ? (
          <p className="text-sm text-muted text-center p-8">Aucune activité récente</p>
        ) : (
          <div className="divide-y divide-border">
            {activityItems.map((item, idx) => {
              const initials = (item.userName !== "—" ? item.userName : item.userEmail).charAt(0).toUpperCase();

              let icon: React.ReactNode;
              let label: string;
              let badgeClass: string;

              switch (item.type) {
                case "inscription":
                  icon = <UserPlus className="w-4 h-4" />;
                  label = "Inscription";
                  badgeClass = "bg-blue-50 text-blue-600";
                  break;
                case "achat_formation":
                  icon = <BookOpen className="w-4 h-4" />;
                  label = "Achat formation";
                  badgeClass = "bg-purple-50 text-purple-600";
                  break;
                case "location_cours":
                  icon = <Video className="w-4 h-4" />;
                  label = "Location cours";
                  badgeClass = "bg-amber-50 text-amber-600";
                  break;
              }

              return (
                <div
                  key={`${item.type}-${idx}`}
                  className="p-4 flex items-center justify-between hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-muted">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-heading">{item.userName}</p>
                      <p className="text-xs text-muted">
                        {item.detail ? item.detail : item.userEmail}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${badgeClass}`}>
                      {icon}
                      {label}
                    </span>
                    <p className="text-xs text-muted">{formatRelativeTime(item.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
