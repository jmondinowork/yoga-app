"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Mail, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("resend", { email, callbackUrl: "/mon-espace" });
      setSent(true);
    } catch {
      // Handle error
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
            Yoga Flow
          </span>
        </Link>
      </div>

      <div className="bg-card rounded-3xl border border-border p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl font-bold text-heading">
            Bon retour 🙏
          </h1>
          <p className="text-muted text-sm">
            Connectez-vous pour accéder à vos cours
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4 py-6">
            <Mail className="w-12 h-12 text-button mx-auto" />
            <h2 className="font-heading text-xl font-semibold text-heading">
              Vérifiez vos emails
            </h2>
            <p className="text-text text-sm">
              Un lien de connexion a été envoyé à{" "}
              <strong className="text-heading">{email}</strong>.
              Cliquez sur le lien pour vous connecter.
            </p>
          </div>
        ) : (
          <>
            {/* Google */}
            <button
              onClick={() => signIn("google", { callbackUrl: "/mon-espace" })}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border border-border bg-card hover:bg-primary/20 transition-colors font-medium text-heading cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuer avec Google
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                <Mail className="w-4 h-4" />
                Recevoir un lien de connexion
              </Button>
            </form>
          </>
        )}

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
