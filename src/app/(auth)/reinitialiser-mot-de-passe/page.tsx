"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense>
      <ResetContent />
    </Suspense>
  );
}

function ResetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-button flex items-center justify-center">
              <span className="text-white font-heading text-xl font-bold">Y</span>
            </div>
            <span className="font-heading text-3xl font-bold text-heading">
              Prana Motion Yoga
            </span>
          </Link>
        </div>
        <div className="bg-card rounded-3xl border border-border p-8 shadow-sm text-center space-y-4">
          <h1 className="font-heading text-2xl font-bold text-heading">
            Lien invalide
          </h1>
          <p className="text-muted text-sm">
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <Link
            href="/mot-de-passe-oublie"
            className="text-button hover:underline font-medium text-sm"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,}$/;
    if (!PASSWORD_REGEX.test(password)) {
      setError(
        "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/connexion");
      }, 2500);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-button flex items-center justify-center">
              <span className="text-white font-heading text-xl font-bold">Y</span>
            </div>
            <span className="font-heading text-3xl font-bold text-heading">
              Prana Motion Yoga
            </span>
          </Link>
        </div>
        <div className="bg-card rounded-3xl border border-border p-8 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-heading">
            Mot de passe mis à jour !
          </h1>
          <p className="text-muted text-sm">
            Vous allez être redirigé(e) vers la page de connexion...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-button flex items-center justify-center">
            <span className="text-white font-heading text-xl font-bold">Y</span>
          </div>
          <span className="font-heading text-3xl font-bold text-heading">
            Prana Motion Yoga
          </span>
        </Link>
      </div>

      <div className="bg-card rounded-3xl border border-border p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl font-bold text-heading">
            Nouveau mot de passe
          </h1>
          <p className="text-muted text-sm">
            Choisissez un mot de passe fort pour sécuriser votre compte.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="relative">
            <Input
              id="password"
              label="Nouveau mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder="Au moins 12 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted hover:text-heading cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              id="confirm-password"
              label="Confirmer le mot de passe"
              type={showConfirm ? "text" : "password"}
              placeholder="Répétez le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-9 text-muted hover:text-heading cursor-pointer"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-xs text-muted">
            Minimum 12 caractères, avec au moins une majuscule, une minuscule, un chiffre et un caractère spécial.
          </p>

          <Button type="submit" className="w-full" loading={loading}>
            <Lock className="w-4 h-4" />
            Enregistrer le mot de passe
          </Button>
        </form>
      </div>
    </div>
  );
}
