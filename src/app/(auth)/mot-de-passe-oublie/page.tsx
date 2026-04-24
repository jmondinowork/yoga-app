"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
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

      <div className="bg-card rounded-3xl border border-border p-8 shadow-sm space-y-6">
        {submitted ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
              <Mail className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-heading">
              Email envoyé !
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              Si un compte existe avec cette adresse email, vous recevrez un lien
              de réinitialisation dans quelques instants.
              <br /><br />
              Pensez à vérifier vos spams.
            </p>
            <Link
              href="/connexion"
              className="inline-flex items-center gap-2 text-button hover:underline font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h1 className="font-heading text-3xl font-bold text-heading">
                Mot de passe oublié ?
              </h1>
              <p className="text-muted text-sm">
                Saisissez votre email pour recevoir un lien de réinitialisation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="submit" className="w-full" loading={loading}>
                <Mail className="w-4 h-4" />
                Envoyer le lien
              </Button>
            </form>

            <div className="text-center text-sm text-muted">
              <Link
                href="/connexion"
                className="inline-flex items-center gap-1 text-button hover:underline font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
