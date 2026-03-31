"use client";

import { useState, useEffect } from "react";
import { User, Lock, Save, Eye, EyeOff } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function AdminParametresPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchAccount() {
      try {
        const res = await fetch("/api/admin/account");
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setEmail(data.email || "");
        }
      } catch {
        console.error("Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    }
    fetchAccount();
  }, []);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameMessage(null);

    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (res.ok) {
        setNameMessage({ type: "success", text: data.message || "Nom mis à jour" });
      } else {
        setNameMessage({ type: "error", text: data.error || "Erreur" });
      }
    } catch {
      setNameMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Les mots de passe ne correspondent pas" });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères" });
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setPasswordMessage({ type: "success", text: data.message || "Mot de passe mis à jour" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ type: "error", text: data.error || "Erreur" });
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Paramètres du compte
        </h1>
        <p className="text-muted">Gérez votre profil et votre mot de passe</p>
      </div>

      {/* Profile section */}
      <form onSubmit={handleSaveName} className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <User className="w-5 h-5 text-muted" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-heading">Profil</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="name"
            label="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
          />
          <Input
            id="email"
            label="Email"
            value={email}
            disabled
            className="opacity-60 cursor-not-allowed"
          />
        </div>

        {nameMessage && (
          <p className={`text-sm ${nameMessage.type === "success" ? "text-green-500" : "text-red-500"}`}>
            {nameMessage.text}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={savingName}>
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
        </div>
      </form>

      {/* Password section */}
      <form onSubmit={handleSavePassword} className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-heading">Mot de passe</h2>
        </div>

        <div className="grid gap-4">
          <div className="relative">
            <Input
              id="currentPassword"
              label="Mot de passe actuel"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Entrez votre mot de passe actuel"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-[38px] text-muted hover:text-heading transition-colors cursor-pointer"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <Input
                id="newPassword"
                label="Nouveau mot de passe"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-[38px] text-muted hover:text-heading transition-colors cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                id="confirmPassword"
                label="Confirmer le mot de passe"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez le mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[38px] text-muted hover:text-heading transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {passwordMessage && (
          <p className={`text-sm ${passwordMessage.type === "success" ? "text-green-500" : "text-red-500"}`}>
            {passwordMessage.text}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={savingPassword}>
            <Save className="w-4 h-4" />
            Modifier le mot de passe
          </Button>
        </div>
      </form>
    </div>
  );
}
