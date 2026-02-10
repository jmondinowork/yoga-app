import type { Metadata } from "next";
import { Users, CreditCard, Video, TrendingUp, Eye, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin — Dashboard",
};

const stats = [
  { label: "Utilisateurs", value: "1 247", change: "+12%", icon: Users, color: "bg-blue-100 text-blue-600" },
  { label: "Abonnés actifs", value: "342", change: "+8%", icon: CreditCard, color: "bg-green-100 text-green-600" },
  { label: "Revenus du mois", value: "6 830 €", change: "+23%", icon: DollarSign, color: "bg-amber-100 text-amber-600" },
  { label: "Cours publiés", value: "48", change: "+3", icon: Video, color: "bg-purple-100 text-purple-600" },
];

const recentUsers = [
  { name: "Sophie Martin", email: "sophie@example.com", date: "Il y a 2h", status: "Abonné" },
  { name: "Thomas Leroy", email: "thomas@example.com", date: "Il y a 5h", status: "Gratuit" },
  { name: "Marie Dupont", email: "marie@example.com", date: "Il y a 1j", status: "Abonné" },
  { name: "Pierre Robert", email: "pierre@example.com", date: "Il y a 2j", status: "Gratuit" },
];

const topCourses = [
  { title: "Salutation au Soleil", views: 1234, theme: "Vinyasa" },
  { title: "Yin Yoga — Relaxation profonde", views: 987, theme: "Yin Yoga" },
  { title: "Méditation guidée", views: 876, theme: "Méditation" },
  { title: "Hatha Yoga — Équilibre", views: 654, theme: "Hatha" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Dashboard
        </h1>
        <p className="text-muted">Vue d&apos;ensemble de votre plateforme</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-heading">{stat.value}</p>
                <p className="text-sm text-muted">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart placeholder */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-heading text-lg font-semibold text-heading mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-button" />
            Revenus mensuels
          </h2>
          <div className="h-48 flex items-center justify-center text-muted text-sm">
            <div className="text-center space-y-2">
              <div className="flex items-end justify-center gap-1 h-32">
                {[40, 55, 35, 70, 65, 80, 75, 90, 85, 95, 88, 100].map((h, i) => (
                  <div
                    key={i}
                    className="w-6 bg-button/20 hover:bg-button/40 rounded-t transition-colors"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted">Jan — Déc 2025</p>
            </div>
          </div>
        </div>

        {/* Top Courses */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-heading text-lg font-semibold text-heading mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-button" />
            Cours les plus vus
          </h2>
          <div className="space-y-3">
            {topCourses.map((course, i) => (
              <div
                key={course.title}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-muted">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-heading">{course.title}</p>
                    <p className="text-xs text-muted">{course.theme}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-heading">{course.views}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent users */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-heading text-lg font-semibold text-heading flex items-center gap-2">
            <Users className="w-5 h-5 text-button" />
            Dernières inscriptions
          </h2>
        </div>
        <div className="divide-y divide-border">
          {recentUsers.map((user) => (
            <div
              key={user.email}
              className="p-4 flex items-center justify-between hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-muted">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-heading">{user.name}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.status === "Abonné"
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {user.status}
                </span>
                <p className="text-xs text-muted mt-1">{user.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
