"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function InscriptionPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Validation mot de passe en temps réel
  const passwordChecks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^a-zA-Z\d]/.test(password),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!passwordValid) {
      setError("Le mot de passe ne respecte pas les critères requis");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de la création du compte");
        return;
      }

      // Rediriger vers la page de vérification email
      window.location.href = "/verification";
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="bg-card rounded-3xl border border-border p-5 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl font-bold text-heading">
            Bienvenue 🧘
          </h1>
          <p className="text-muted text-sm">
            Créez votre compte et commencez votre pratique
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-accent-light/30 rounded-xl p-4 space-y-2">
          {[
            "Accès au catalogue de cours",
            "Suivi de votre progression",
            "Recommandations personnalisées",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm text-text">
              <Check className="w-4 h-4 text-button shrink-0" />
              {benefit}
            </div>
          ))}
        </div>

        {/* Registration form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <Input
            id="name"
            label="Prénom"
            type="text"
            placeholder="Votre prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <Input
              id="password"
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 12 caractères"
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
          {password.length > 0 && (
            <div className="space-y-1 text-xs">
              {[
                { ok: passwordChecks.length, label: "12 caractères minimum" },
                { ok: passwordChecks.uppercase, label: "Une majuscule" },
                { ok: passwordChecks.lowercase, label: "Une minuscule" },
                { ok: passwordChecks.number, label: "Un chiffre" },
                { ok: passwordChecks.special, label: "Un caractère spécial (!@#$...)" },
              ].map(({ ok, label }) => (
                <div key={label} className={`flex items-center gap-1.5 ${ok ? "text-green-600" : "text-muted"}`}>
                  {ok ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block rounded-full border border-current" />}
                  {label}
                </div>
              ))}
            </div>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            Créer mon compte
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-center text-xs text-muted">
          En créant un compte, vous acceptez nos{" "}
          <Link href="/cgv" className="text-button hover:underline">CGV</Link>
          {" "}et notre{" "}
          <Link href="/confidentialite" className="text-button hover:underline">
            politique de confidentialité
          </Link>.
        </p>

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
