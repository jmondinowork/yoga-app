"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, CreditCard, Bell, Trash2, Save, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

interface SubscriptionData {
  plan: "MONTHLY" | "ANNUAL";
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "EXPIRED";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface ParametresClientProps {
  userName: string;
  userEmail: string;
  subscription: SubscriptionData | null;
  notifNewCourses: boolean;
}

function Alert({ type, message }: { type: "error" | "success"; message: string }) {
  return (
    <div
      className={`text-sm rounded-xl px-4 py-3 flex items-center gap-2 ${
        type === "error"
          ? "bg-red-50 border border-red-200 text-red-700"
          : "bg-green-50 border border-green-200 text-green-700"
      }`}
    >
      {type === "success" && <CheckCircle className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  );
}

export default function ParametresClient({
  userName,
  userEmail,
  subscription,
  notifNewCourses: initialNotifNewCourses,
}: ParametresClientProps) {
  const router = useRouter();

  // ─── Profil ───────────────────────────────────────────────────────
  const [name, setName] = useState(userName);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json();
        setProfileMsg({ type: "error", text: data.error || "Erreur lors de la sauvegarde" });
      } else {
        setProfileMsg({ type: "success", text: "Profil mis à jour avec succès" });
        router.refresh();
      }
    } catch {
      setProfileMsg({ type: "error", text: "Une erreur est survenue" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Mot de passe ─────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Le nouveau mot de passe doit contenir au moins 6 caractères" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Les mots de passe ne correspondent pas" });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPasswordMsg({ type: "error", text: data.error || "Erreur lors du changement de mot de passe" });
      } else {
        setPasswordMsg({ type: "success", text: "Mot de passe modifié avec succès" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordMsg({ type: "error", text: "Une erreur est survenue" });
    } finally {
      setSavingPassword(false);
    }
  };

  // ─── Abonnement ───────────────────────────────────────────────────
  const [canceling, setCanceling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleCancelSubscription = async () => {
    setCanceling(true);
    setCancelMsg(null);
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setCancelMsg({ type: "error", text: data.error || "Erreur lors de la résiliation" });
      } else {
        setCancelMsg({ type: "success", text: "Votre abonnement sera résilié à la fin de la période en cours." });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setCancelMsg({ type: "error", text: "Une erreur est survenue" });
    } finally {
      setCanceling(false);
    }
  };

  // ─── Notifications ────────────────────────────────────────────────
  const [notifNewCourses, setNotifNewCourses] = useState(initialNotifNewCourses);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSaveNotifications = async () => {
    setSavingNotif(true);
    setNotifMsg(null);
    try {
      const res = await fetch("/api/auth/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifNewCourses }),
      });
      if (!res.ok) {
        const data = await res.json();
        setNotifMsg({ type: "error", text: data.error || "Erreur lors de la sauvegarde" });
      } else {
        setNotifMsg({ type: "success", text: "Préférences de notifications enregistrées" });
      }
    } catch {
      setNotifMsg({ type: "error", text: "Une erreur est survenue" });
    } finally {
      setSavingNotif(false);
    }
  };

  // ─── Suppression de compte ────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteMsg(null);
    try {
      const res = await fetch("/api/auth/account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteMsg({ type: "error", text: data.error || "Erreur lors de la suppression" });
      } else {
        // Déconnexion et redirection
        window.location.href = "/connexion?deleted=1";
      }
    } catch {
      setDeleteMsg({ type: "error", text: "Une erreur est survenue" });
    } finally {
      setDeleting(false);
    }
  };

  // ─── Labels abonnement ────────────────────────────────────────────
  const planLabel = subscription?.plan === "ANNUAL" ? "annuel" : "mensuel";
  const planPrice = subscription?.plan === "ANNUAL" ? "200 €/an (facturé annuellement)" : "22 €/mois";
  const periodEnd = subscription
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">Paramètres</h1>
        <p className="text-muted">Gérez votre profil et vos préférences</p>
      </div>

      {/* ─── Profil ──────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <User className="w-5 h-5 text-button" />
          <h2 className="font-heading text-lg font-semibold text-heading">Profil</h2>
        </div>
        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          {profileMsg && <Alert type={profileMsg.type} message={profileMsg.text} />}
          <Input
            id="name"
            label="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            value={userEmail}
            readOnly
            disabled
          />
          <p className="text-xs text-muted -mt-2">
            L&apos;email ne peut pas être modifié directement. Contactez-nous si nécessaire.
          </p>
          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
        </form>
      </div>

      {/* ─── Mot de passe ────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Lock className="w-5 h-5 text-button" />
          <h2 className="font-heading text-lg font-semibold text-heading">Mot de passe</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {passwordMsg && <Alert type={passwordMsg.type} message={passwordMsg.text} />}
          <div className="relative">
            <Input
              id="currentPassword"
              label="Mot de passe actuel"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-9 text-muted hover:text-heading cursor-pointer"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Input
              id="newPassword"
              label="Nouveau mot de passe"
              type={showNewPassword ? "text" : "password"}
              placeholder="Minimum 6 caractères"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-9 text-muted hover:text-heading cursor-pointer"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input
            id="confirmPassword"
            label="Confirmer le nouveau mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={savingPassword}>
            <Lock className="w-4 h-4" />
            Changer le mot de passe
          </Button>
        </form>
      </div>

      {/* ─── Abonnement ──────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <CreditCard className="w-5 h-5 text-button" />
          <h2 className="font-heading text-lg font-semibold text-heading">Abonnement</h2>
        </div>
        {cancelMsg && <Alert type={cancelMsg.type} message={cancelMsg.text} />}

        {!subscription || subscription.status === "CANCELED" || subscription.status === "EXPIRED" ? (
          <div className="space-y-4">
            <p className="text-text">Vous n&apos;avez pas d&apos;abonnement actif.</p>
            <p className="text-sm text-muted">
              Abonnez-vous pour accéder à l&apos;ensemble des cours vidéo en illimité.
            </p>
            <Link href="/tarifs">
              <Button>Voir les offres d&apos;abonnement</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-accent-light/20 rounded-xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-heading">Plan {planLabel}</span>
                  {subscription.cancelAtPeriodEnd ? (
                    <Badge variant="warning">Résiliation programmée</Badge>
                  ) : (
                    <Badge variant="success">Actif</Badge>
                  )}
                </div>
                <p className="text-sm text-muted">
                  {planPrice}
                  {subscription.cancelAtPeriodEnd
                    ? ` — Accès jusqu'au ${periodEnd}`
                    : ` — Prochain renouvellement le ${periodEnd}`}
                </p>
              </div>
            </div>
            {subscription.cancelAtPeriodEnd ? (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Votre abonnement prendra fin le {periodEnd}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Vous conservez l&apos;accès à tous les cours jusqu&apos;à cette date.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-50 border border-red-200"
                  onClick={handleCancelSubscription}
                  loading={canceling}
                >
                  Résilier mon abonnement
                </Button>
                <p className="text-xs text-muted mt-2">
                  Vous conserverez l&apos;accès jusqu&apos;à la fin de votre période en cours.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Notifications ───────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Bell className="w-5 h-5 text-button" />
          <h2 className="font-heading text-lg font-semibold text-heading">Notifications par email</h2>
        </div>
        {notifMsg && <Alert type={notifMsg.type} message={notifMsg.text} />}
        <label className="flex items-start justify-between gap-4 p-3 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-text">Nouveaux cours et formations disponibles</p>
            <p className="text-xs text-muted">Soyez averti(e) dès qu&apos;un nouveau cours ou une nouvelle formation est publié(e).</p>
          </div>
          <input
            type="checkbox"
            checked={notifNewCourses}
            onChange={(e) => setNotifNewCourses(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded accent-button shrink-0 cursor-pointer"
          />
        </label>
        <Button onClick={handleSaveNotifications} loading={savingNotif}>
          <Save className="w-4 h-4" />
          Enregistrer les préférences
        </Button>
      </div>

      {/* ─── Zone de danger ──────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-red-200 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-red-200">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h2 className="font-heading text-lg font-semibold text-red-600">Zone de danger</h2>
        </div>
        <p className="text-sm text-text">
          La suppression de votre compte est irréversible. Toutes vos données,
          achats, locations et progression seront définitivement perdus.
        </p>

        {!showDeleteConfirm ? (
          <Button
            variant="ghost"
            className="text-red-500 hover:bg-red-50 border border-red-200"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4" />
            Supprimer mon compte
          </Button>
        ) : (
          <div className="space-y-4 border border-red-200 rounded-xl p-4 bg-red-50">
            <p className="text-sm font-medium text-red-700">
              Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :
            </p>
            {deleteMsg && <Alert type={deleteMsg.type} message={deleteMsg.text} />}
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full max-w-xs px-4 py-2 rounded-xl border border-red-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 bg-white hover:bg-red-100 border border-red-300"
                onClick={handleDeleteAccount}
                loading={deleting}
                disabled={deleteConfirmText !== "SUPPRIMER"}
              >
                Confirmer la suppression
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setDeleteMsg(null);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
