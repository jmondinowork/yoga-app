import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Resend } from "resend";
import { newCourseEmailHtml, newFormationEmailHtml } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Prana Motion <noreply@pranamotionyoga.fr>";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

// POST /api/admin/preview-email
// body: { to: string; type: "course" | "formation" }
export async function POST(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY n'est pas configuré dans .env.local" },
      { status: 503 }
    );
  }

  const { type } = await req.json() as { type: "course" | "formation" };

  // Envoyer uniquement à l'email de l'admin connecté
  const to = session.user.email;
  if (!to || !type) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  let html: string;
  let subject: string;

  if (type === "course") {
    html = newCourseEmailHtml({
      userName: "Marie Dupont",
      courseTitle: "Salutation au Soleil — Vinyasa Flow",
      courseSlug: "salutation-au-soleil",
      courseDuration: 45,
      courseTheme: "Vinyasa",
      courseThumbnail: null,
    });
    subject = "✉️ [Preview] Nouveau cours : Salutation au Soleil";
  } else {
    html = newFormationEmailHtml({
      userName: "Marie Dupont",
      formationTitle: "Formation Yoga Prénatal — 8 semaines",
      formationSlug: "yoga-prenatal",
      formationThumbnail: null,
      formationPrice: 197,
    });
    subject = "✉️ [Preview] Nouvelle formation : Yoga Prénatal";
  }

  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });

  if (error) {
    console.error("[PREVIEW_EMAIL_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data?.id });
}
