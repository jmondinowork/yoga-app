"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function InvitationPage() {
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
            Ce lien d&apos;invitation est invalide ou a expiré.
          </p>
          <Link href="/connexion" className="text-button hover:underline font-medium text-sm">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/invitation", {
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
      }, 2000);
    } catch {
      setError("Une erreur est survenue");
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
            Compte créé avec succès !
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
            Bienvenue 🙏
          </h1>
          <p className="text-muted text-sm">
            Créez votre mot de passe pour activer votre compte
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
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 caractères"
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
              id="confirmPassword"
              label="Confirmer le mot de passe"
              type={showConfirm ? "text" : "password"}
              placeholder="Retapez votre mot de passe"
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
          <Button type="submit" className="w-full" loading={loading}>
            <UserPlus className="w-4 h-4" />
            Créer mon compte
          </Button>
        </form>

        <div className="text-center text-sm text-muted">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-button hover:underline font-medium">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
