import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { email, name, role } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Format d'email invalide" }, { status: 400 });
    }

    const sanitizedName = name ? String(name).trim().slice(0, 100) : null;

    if (!role || !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    // Check if user already exists with a password (already activated)
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser?.password) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 409 }
      );
    }

    const invitationToken = crypto.randomUUID();
    const invitationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    if (existingUser) {
      // User exists but hasn't set a password yet — re-send invitation
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: sanitizedName || existingUser.name,
          role,
          invitationToken,
          invitationExpires,
        },
      });
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: sanitizedName,
          role,
          invitationToken,
          invitationExpires,
        },
      });
    }

    const invitationUrl = `${APP_URL}/invitation?token=${invitationToken}`;

    await sendInvitationEmail({
      email: email.toLowerCase().trim(),
      name: sanitizedName,
      role,
      invitationUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INVITE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
