import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// Même politique que l'inscription : 12 chars, maj, min, chiffre, spécial
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,}$/;

export async function POST(request: NextRequest) {
  // Rate limit : 5 tentatives par IP par 15 minutes
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`reset-password:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token requis" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          error:
            "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial",
        },
        { status: 400 }
      );
    }

    // Hasher le token reçu pour comparer avec ce qui est en base
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Lien de réinitialisation invalide ou expiré" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
