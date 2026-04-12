"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Search, Trash2, UserPlus, AlertTriangle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  subscription: {
    plan: "MONTHLY" | "ANNUAL";
    status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "EXPIRED";
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
  } | null;
  _count: { purchases: number };
}

export default function AdminUtilisateursPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Invitation modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"USER" | "ADMIN">("USER");
  const [inviteConfirmAdmin, setInviteConfirmAdmin] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const fetcher = (url: string) => fetch(url).then(r => r.json());

  const usersParams = new URLSearchParams();
  if (search) usersParams.set("search", search);
  if (filter) usersParams.set("filter", filter);
  const { data: usersData, isLoading: loading, mutate: mutateUsers } = useSWR(
    `/api/admin/users?${usersParams}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
  const users: UserData[] = usersData?.users || [];
  const total = usersData?.total || 0;

  const { data: accountData } = useSWR<{ id: string }>(
    "/api/admin/account",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 120_000 }
  );
  const currentUserId = accountData?.id || null;

  const fetchUsers = useCallback(() => mutateUsers(), [mutateUsers]);

  async function deleteUser() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteTarget.id }),
      });
      if (res.ok) {
        setDeleteTarget(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setDeleting(false);
    }
  }

  function resetInviteModal() {
    setInviteEmail("");
    setInviteName("");
    setInviteRole("USER");
    setInviteConfirmAdmin(false);
    setInviteError("");
    setInviteSuccess("");
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");

    if (inviteRole === "ADMIN" && !inviteConfirmAdmin) {
      setInviteError("Veuillez confirmer l'attribution des droits administrateur");
      return;
    }

    setInviteLoading(true);
    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName || undefined,
          role: inviteRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error || "Erreur lors de l'envoi");
        return;
      }

      setInviteSuccess("Invitation envoyée avec succès !");
      setTimeout(() => {
        setShowInviteModal(false);
        resetInviteModal();
        fetchUsers();
      }, 1500);
    } catch {
      setInviteError("Erreur réseau");
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-heading mb-2">
            Gestion des utilisateurs
          </h1>
          <p className="text-muted">{total} utilisateur{total > 1 ? "s" : ""} au total</p>
        </div>
        <button
          onClick={() => { resetInviteModal(); setShowInviteModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-button text-white text-sm font-medium hover:bg-button/90 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Inviter un utilisateur
        </button>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => { setShowInviteModal(false); resetInviteModal(); }}
        title="Inviter un utilisateur"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          {inviteError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {inviteError}
            </div>
          )}
          {inviteSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              {inviteSuccess}
            </div>
          )}

          <Input
            id="invite-email"
            label="Email"
            type="email"
            placeholder="utilisateur@email.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <Input
            id="invite-name"
            label="Nom (optionnel)"
            type="text"
            placeholder="Prénom Nom"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
          />

          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium text-heading mb-1.5">
              Rôle
            </label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => {
                setInviteRole(e.target.value as "USER" | "ADMIN");
                setInviteConfirmAdmin(false);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text focus:outline-none focus:ring-2 focus:ring-button/30"
            >
              <option value="USER">Utilisateur</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {inviteRole === "ADMIN" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 text-sm">
                  Cette personne aura accès à l&apos;ensemble du panneau d&apos;administration. Êtes-vous sûr ?
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inviteConfirmAdmin}
                  onChange={(e) => setInviteConfirmAdmin(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-button focus:ring-button/30"
                />
                <span className="text-sm text-text">
                  Je confirme vouloir donner les droits administrateur
                </span>
              </label>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={inviteLoading}
            disabled={inviteRole === "ADMIN" && !inviteConfirmAdmin}
          >
            <UserPlus className="w-4 h-4" />
            Envoyer l&apos;invitation
          </Button>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Supprimer l'utilisateur"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Êtes-vous sûr de vouloir supprimer cet utilisateur ?
              </p>
              <p className="text-sm text-red-600 mt-1">
                <strong>{deleteTarget?.name || deleteTarget?.email}</strong> perdra toutes ses données : abonnement, achats, progression et historique. Cette action est irréversible.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-sm font-medium text-heading">{deleteTarget?.name || "—"}</p>
            <p className="text-xs text-muted">{deleteTarget?.email}</p>
            <p className="text-xs text-muted mt-1">
              Rôle : {deleteTarget?.role === "ADMIN" ? "Admin" : "Utilisateur"}
              {deleteTarget?.subscription ? ` · Abonné ${deleteTarget.subscription.plan === "MONTHLY" ? "mensuel" : "annuel"}` : ""}
              {(deleteTarget?._count?.purchases ?? 0) > 0 ? ` · ${deleteTarget?._count.purchases} achat(s)` : ""}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <button
              onClick={deleteUser}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {deleting ? "Suppression..." : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      </Modal>

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
            { value: "free", label: "Inscrits" },
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
                <th className="text-left p-4 text-sm font-medium text-heading">Achats</th>
                <th className="text-left p-4 text-sm font-medium text-heading">Inscription</th>
                <th className="text-right p-4 text-sm font-medium text-heading">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    Chargement...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    {search || filter ? "Aucun utilisateur trouvé" : "Aucun utilisateur inscrit"}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-primary/10 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-muted">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-heading">{user.name || "—"}</p>
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
                          <Badge variant={user.subscription.status === "ACTIVE" ? "success" : "warning"}>
                            {user.subscription.plan === "MONTHLY" ? "Mensuel" : "Annuel"}
                          </Badge>
                          {user.subscription.status === "CANCELED" && (
                            <p className="text-xs text-red-500 mt-1">Annulé</p>
                          )}
                          {user.subscription.cancelAtPeriodEnd && user.subscription.status === "ACTIVE" && (
                            <p className="text-xs text-amber-500 mt-1">
                              Fin le {new Date(user.subscription.currentPeriodEnd).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-text">
                      {user._count.purchases > 0 ? (
                        <span>{user._count.purchases} achat{user._count.purchases > 1 ? "s" : ""}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-text">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.id !== currentUserId && (
                          <button
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Supprimer l'utilisateur"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
