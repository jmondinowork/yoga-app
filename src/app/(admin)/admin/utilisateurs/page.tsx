"use client";

import { useState } from "react";
import { Search, Eye, Shield, ShieldOff } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const demoUsers = [
  { id: "1", name: "Sophie Martin", email: "sophie@example.com", role: "USER", subscription: "MONTHLY", status: "ACTIVE", createdAt: "2025-06-15" },
  { id: "2", name: "Thomas Leroy", email: "thomas@example.com", role: "USER", subscription: null, status: null, createdAt: "2025-09-20" },
  { id: "3", name: "Marie Dupont", email: "marie@example.com", role: "USER", subscription: "ANNUAL", status: "ACTIVE", createdAt: "2025-03-10" },
  { id: "4", name: "Pierre Robert", email: "pierre@example.com", role: "ADMIN", subscription: null, status: null, createdAt: "2025-01-01" },
  { id: "5", name: "Claire Petit", email: "claire@example.com", role: "USER", subscription: "MONTHLY", status: "CANCELED", createdAt: "2025-11-05" },
  { id: "6", name: "Jean Moreau", email: "jean@example.com", role: "USER", subscription: null, status: null, createdAt: "2026-01-20" },
];

export default function AdminUtilisateursPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("");

  const filtered = demoUsers.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "subscribed" && u.status !== "ACTIVE") return false;
    if (filter === "free" && u.subscription !== null) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Gestion des utilisateurs
        </h1>
        <p className="text-muted">{demoUsers.length} utilisateurs au total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-card border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: "", label: "Tous" },
            { value: "subscribed", label: "Abonnés" },
            { value: "free", label: "Gratuits" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                filter === f.value
                  ? "bg-button text-white"
                  : "bg-card border border-border text-text hover:border-button"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-primary/20">
                <th className="text-left p-4 text-sm font-medium text-heading">Utilisateur</th>
                <th className="text-left p-4 text-sm font-medium text-heading">Rôle</th>
                <th className="text-left p-4 text-sm font-medium text-heading">Abonnement</th>
                <th className="text-left p-4 text-sm font-medium text-heading">Inscription</th>
                <th className="text-right p-4 text-sm font-medium text-heading">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-primary/10 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-muted">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-heading">{user.name}</p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.role === "ADMIN" ? (
                      <Badge variant="premium">Admin</Badge>
                    ) : (
                      <Badge>Utilisateur</Badge>
                    )}
                  </td>
                  <td className="p-4">
                    {user.subscription ? (
                      <div>
                        <Badge variant={user.status === "ACTIVE" ? "success" : "warning"}>
                          {user.subscription === "MONTHLY" ? "Mensuel" : "Annuel"}
                        </Badge>
                        {user.status === "CANCELED" && (
                          <p className="text-xs text-red-500 mt-1">Annulé</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-text">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer" title="Voir le profil">
                        <Eye className="w-4 h-4 text-muted" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer" title={user.role === "ADMIN" ? "Retirer admin" : "Donner admin"}>
                        {user.role === "ADMIN" ? (
                          <ShieldOff className="w-4 h-4 text-muted" />
                        ) : (
                          <Shield className="w-4 h-4 text-muted" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
