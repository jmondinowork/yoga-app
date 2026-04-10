import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

// Vérification admin
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

// Schéma de validation pour les entrées FAQ
const faqEntrySchema = z.object({
  question: z.string().min(1, "La question est requise"),
  answer: z.string().min(1, "La réponse est requise"),
});

const putSchema = z.object({
  homepage: z.array(faqEntrySchema).optional(),
  pricing: z.array(faqEntrySchema).optional(),
});

// GET - Récupérer les FAQs par catégorie
export async function GET() {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const [homepageFaq, pricingFaq] = await Promise.all([
      prisma.siteContent.findUnique({ where: { key: "faq_homepage" } }),
      prisma.siteContent.findUnique({ where: { key: "faq_pricing" } }),
    ]);

    return NextResponse.json({
      homepage: homepageFaq ? JSON.parse(homepageFaq.value) : [],
      pricing: pricingFaq ? JSON.parse(pricingFaq.value) : [],
    });
  } catch (error) {
    console.error("[ADMIN_FAQ_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour les FAQs par catégorie
export async function PUT(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { homepage, pricing } = putSchema.parse(body);

    const ops = [];

    if (homepage !== undefined) {
      ops.push(
        prisma.siteContent.upsert({
          where: { key: "faq_homepage" },
          create: { key: "faq_homepage", value: JSON.stringify(homepage) },
          update: { value: JSON.stringify(homepage) },
        })
      );
    }

    if (pricing !== undefined) {
      ops.push(
        prisma.siteContent.upsert({
          where: { key: "faq_pricing" },
          create: { key: "faq_pricing", value: JSON.stringify(pricing) },
          update: { value: JSON.stringify(pricing) },
        })
      );
    }

    if (ops.length > 0) {
      await prisma.$transaction(ops);
      revalidateTag("cms", "max");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[ADMIN_FAQ_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
