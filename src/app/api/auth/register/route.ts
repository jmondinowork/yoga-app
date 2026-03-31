import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Prana Motion <noreply@pranamotionyoga.fr>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Mot de passe : min 12 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,}$/;

export async function POST(request: NextRequest) {
  // Rate limit : 5 inscriptions par IP par 15 minutes
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          error:
            "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Générer un token de vérification email
    const verificationToken = crypto.randomUUID();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: verificationExpires,
      },
    });

    // Créer le compte sans emailVerified (non vérifié)
    await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        emailVerified: null,
      },
    });

    // Envoyer l'email de vérification
    const verifyUrl = `${APP_URL}/verification?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Vérifiez votre adresse email — Prana Motion Yoga",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #0E7C78; display: inline-flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px; font-weight: bold;">Y</span>
              </div>
              <h1 style="color: #2B2A28; font-size: 24px; margin-top: 16px;">Bienvenue sur Prana Motion Yoga</h1>
            </div>
            <p style="color: #555; line-height: 1.6;">
              ${name ? `Bonjour ${name},` : "Bonjour,"}<br><br>
              Merci de vous être inscrit(e) ! Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}" style="display: inline-block; background: #0E7C78; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                Vérifier mon email
              </a>
            </div>
            <p style="color: #999; font-size: 13px; text-align: center;">
              Ce lien expire dans 24 heures.<br>
              Si vous n'avez pas créé de compte, ignorez cet email.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json(
      { success: true, needsVerification: true },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
