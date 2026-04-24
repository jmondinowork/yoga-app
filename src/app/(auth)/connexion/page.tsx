"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { LogIn, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Email ou mot de passe incorrect");
      } else {
        window.location.href = "/mon-espace";
      }
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
            Bon retour 🙏
          </h1>
          <p className="text-muted text-sm">
            Connectez-vous pour accéder à vos cours
          </p>
        </div>

        {/* Email + Password */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
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
              placeholder="Votre mot de passe"
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
          <Button type="submit" className="w-full" loading={loading}>
            <LogIn className="w-4 h-4" />
            Se connecter
          </Button>
          <div className="text-center">
            <Link
              href="/mot-de-passe-oublie"
              className="text-sm text-muted hover:text-button hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </form>

        <div className="text-center text-sm text-muted">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-button hover:underline font-medium">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
