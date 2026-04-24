import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendResetPasswordEmail } from "@/lib/email";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Durée de validité du token : 1 heure
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  // Rate limit : 3 demandes par IP par 15 minutes
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`forgot-password:${ip}`, 3, 15 * 60 * 1000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Réponse générique dans tous les cas pour ne pas révéler l'existence du compte
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    if (user?.password) {
      // Générer un token sécurisé (32 octets = 64 chars hex)
      const rawToken = crypto.randomBytes(32).toString("hex");
      // Stocker uniquement le hash SHA-256 en base
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expires = new Date(Date.now() + TOKEN_EXPIRY_MS);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: expires,
        },
      });

      const resetUrl = `${APP_URL}/reinitialiser-mot-de-passe?token=${rawToken}`;
      await sendResetPasswordEmail({ email, resetUrl });
    }

    // Toujours retourner 200 (anti-énumération d'emails)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
