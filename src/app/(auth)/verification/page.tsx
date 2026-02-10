import Link from "next/link";
import type { Metadata } from "next";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Vérifiez votre email",
};

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-accent-light rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-button" />
        </div>

        <h1 className="font-heading text-3xl font-bold text-heading">
          Vérifiez votre email
        </h1>

        <p className="text-text text-lg">
          Un lien de connexion a été envoyé à votre adresse email.
          Cliquez sur le lien dans l&apos;email pour vous connecter.
        </p>

        <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted">
          <p>
            Si vous ne voyez pas l&apos;email, vérifiez votre dossier spam ou courrier indésirable.
          </p>
        </div>

        <Link
          href="/connexion"
          className="inline-block text-button hover:underline text-sm font-medium"
        >
          ← Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
