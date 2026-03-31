import Link from "next/link";
import type { Metadata } from "next";
import { Mail, CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Vérifiez votre email",
};

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function VerifyRequestPage({ searchParams }: Props) {
  const { token, email } = await searchParams;

  let verified = false;
  let error = false;

  // Si un token est présent, tenter la vérification
  if (token && email) {
    const record = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: email,
        expires: { gt: new Date() },
      },
    });

    if (record) {
      // Vérifier l'email de l'utilisateur
      await prisma.user.updateMany({
        where: { email },
        data: { emailVerified: new Date() },
      });

      // Supprimer le token utilisé
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      });

      verified = true;
    } else {
      error = true;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {verified ? (
          <>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-heading">
              Email vérifié !
            </h1>
            <p className="text-text text-lg">
              Votre adresse email a été confirmée. Vous pouvez maintenant vous connecter.
            </p>
            <Link
              href="/connexion"
              className="inline-block bg-button text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Se connecter
            </Link>
          </>
        ) : error ? (
          <>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-heading">
              Lien invalide ou expiré
            </h1>
            <p className="text-text text-lg">
              Ce lien de vérification n&apos;est plus valide. Veuillez vous réinscrire.
            </p>
            <Link
              href="/inscription"
              className="inline-block text-button hover:underline text-sm font-medium"
            >
              ← Retour à l&apos;inscription
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 bg-accent-light rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-button" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-heading">
              Vérifiez votre email
            </h1>
            <p className="text-text text-lg">
              Un lien de vérification a été envoyé à votre adresse email.
              Cliquez sur le lien dans l&apos;email pour activer votre compte.
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
          </>
        )}
      </div>
    </div>
  );
}
