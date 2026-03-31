import { Resend } from "resend";
import { newCourseEmailHtml, newFormationEmailHtml } from "./src/lib/email.ts";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
// En mode test Resend, uniquement l'email du compte propriétaire
const TO = "jmondino.work@gmail.com";

const r1 = await resend.emails.send({
  from,
  to: TO,
  subject: "\u2709\uFE0F [Preview] Nouveau cours : Salutation au Soleil",
  html: newCourseEmailHtml({
    userName: "Marie Dupont",
    courseTitle: "Salutation au Soleil \u2014 Vinyasa Flow",
    courseSlug: "salutation-au-soleil",
    courseDuration: 45,
    courseLevel: "INTERMEDIATE",
    courseTheme: "Vinyasa",
    courseThumbnail: null,
  }),
});
console.log("Cours    :", r1.error ? "ERREUR -> " + r1.error.message : "OK id=" + r1.data?.id);

const r2 = await resend.emails.send({
  from,
  to: TO,
  subject: "\u2709\uFE0F [Preview] Nouvelle formation : Yoga Pr\u00E9natal",
  html: newFormationEmailHtml({
    userName: "Marie Dupont",
    formationTitle: "Formation Yoga Pr\u00E9natal \u2014 8 semaines",
    formationSlug: "yoga-prenatal",
    formationThumbnail: null,
    formationPrice: 197,
  }),
});
console.log("Formation:", r2.error ? "ERREUR -> " + r2.error.message : "OK id=" + r2.data?.id);


config({ path: ".env.local" });
