import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token requis" }, { status: 400 });
    }

    // Même politique que l'inscription : 12 chars, maj, min, chiffre, spécial
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,}$/;
    if (!password || typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: {
          invitationToken: token,
          invitationExpires: { gt: new Date() },
        },
      });

      if (!user) return null;

      return tx.user.update({
        where: { id: user.id },
        data: {
          invitationToken: null,
          invitationExpires: null,
          password: hashedPassword,
          emailVerified: new Date(),
        },
      });
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Lien d'invitation invalide ou expiré" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INVITATION]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
