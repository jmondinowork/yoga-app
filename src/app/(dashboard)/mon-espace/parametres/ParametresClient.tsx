"use client";

import { useState } from "react";
import Link from "next/link";
import { User, CreditCard, Bell, Trash2, Save, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
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
}

export default function ParametresClient({
  userName,
  userEmail,
  subscription,
}: ParametresClientProps) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [saving, setSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Subscription state
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      alert("Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
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
        setPasswordError(data.error || "Erreur lors du changement de mot de passe");
        return;
      }

      setPasswordSuccess("Mot de passe modifié avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Une erreur est survenue");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    setCancelError("");
    setCancelSuccess("");

    try {
      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setCancelError(data.error || "Erreur lors de la résiliation");
        return;
      }

      setCancelSuccess("Votre abonnement sera résilié à la fin de la période en cours.");
      // Reload to reflect updated subscription status
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setCancelError("Une erreur est survenue");
    } finally {
      setCanceling(false);
    }
  };

  const planLabel = subscription?.plan === "ANNUAL" ? "annuel" : "mensuel";
  const planPrice = subscription?.plan === "ANNUAL" ? "14,99 €/mois (facturé annuellement)" : "19,99 €/mois";
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
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Paramètres
        </h1>
        <p className="text-muted">Gérez votre profil et vos préférences</p>
      </div>

      {/* Profile */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <User className="w-5 h-5 text-button" />
          <h2 className="font-heading text-lg font-semibold text-heading">Profil</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <Input
            id="name"
            label="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Lock className="w-5 h-5 text-button" />
          <h2 className="font-heading text-lg font-semibold text-heading">Mot de passe</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              {passwordSuccess}
            </div>
          )}
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

      {/* Subscription */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <CreditCard className="w-5 h-5 text-button" />
          <h2 className="font-heading text-lg font-semibold text-heading">Abonnement</h2>
        </div>

        {cancelError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {cancelError}
          </div>
        )}
        {cancelSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
            {cancelSuccess}
          </div>
        )}

        {!subscription || subscription.status === "CANCELED" || subscription.status === "EXPIRED" ? (
          <div className="space-y-4">
            <p className="text-text">
              Vous n&apos;avez pas d&apos;abonnement actif.
            </p>
            <p className="text-sm text-muted">
              Abonnez-vous pour accéder à l&apos;ensemble des cours vidéo en illimité.
            </p>
            <Link href="/tarifs">
              <Button>
                Voir les offres d&apos;abonnement
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-accent-light/20 rounded-xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-heading">
                    Plan {planLabel}
                  </span>
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

      {/* Notifications */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Bell className="w-5 h-5 text-button" />
          <h2 className="font-heading text-lg font-semibold text-heading">Notifications</h2>
        </div>

        <div className="space-y-3">
          {[
            { label: "Nouveaux cours disponibles", checked: true },
            { label: "Rappels de pratique quotidienne", checked: false },
            { label: "Promotions et offres spéciales", checked: true },
          ].map((notif) => (
            <label
              key={notif.label}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <span className="text-sm text-text">{notif.label}</span>
              <input
                type="checkbox"
                defaultChecked={notif.checked}
                className="w-4 h-4 rounded accent-button"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card rounded-2xl border border-red-200 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-red-200">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h2 className="font-heading text-lg font-semibold text-red-600">Zone de danger</h2>
        </div>
        <p className="text-sm text-text">
          La suppression de votre compte est irréversible. Toutes vos données,
          achats et progression seront définitivement perdus.
        </p>
        <Button
          variant="ghost"
          className="text-red-500 hover:bg-red-50 border border-red-200"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer mon compte
        </Button>
      </div>
    </div>
  );
}
