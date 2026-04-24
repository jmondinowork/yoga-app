import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "Prana Motion <noreply@pranamotionyoga.fr>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Palette du site
const C = {
  bg: "#FFF9EE",
  card: "#FFFFFF",
  border: "#E8DCC8",
  heading: "#2B2A28",
  text: "#4B463A",
  muted: "#8A8279",
  button: "#0E7C78",
  buttonText: "#FFFFFF",
  accentLight: "#E6F5F4",
  accentMid: "#c8ecea",
  primary: "#F8E8C3",
};

// ─── Base layout ──────────────────────────────────────────────────

function baseLayout(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prana Motion</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:'DM Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:${C.bg};">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:${C.card};border-radius:20px;overflow:hidden;border:1px solid ${C.border};">

        <!-- HEADER -->
        <tr>
          <td style="background-color:${C.heading};padding:32px 40px;text-align:center;">
            <!-- Lotus icon (SVG inline) -->
            <div style="width:48px;height:48px;margin:0 auto 12px;background:${C.accentLight};border-radius:50%;display:table;text-align:center;vertical-align:middle;">
              <span style="display:table-cell;vertical-align:middle;font-size:24px;line-height:1;">🪷</span>
            </div>
            <h1 style="margin:0;color:${C.bg};font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:3px;font-weight:normal;">
              PRANA MOTION
            </h1>
            <p style="margin:6px 0 0;color:${C.muted};font-size:12px;letter-spacing:2px;text-transform:uppercase;">
              Yoga &amp; Bien-être
            </p>
          </td>
        </tr>

        <!-- CONTENT -->
        <tr>
          <td style="padding:40px 40px 32px;">
            ${content}
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px;background:${C.border};"></div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:24px 40px 32px;text-align:center;">
            <p style="margin:0 0 8px;color:${C.muted};font-size:12px;line-height:1.6;">
              Vous recevez cet email car vous êtes inscrit(e) sur <strong style="color:${C.text};">Prana Motion</strong><br/>
              et avez activé les notifications.
            </p>
            <p style="margin:0;font-size:12px;">
              <a href="${APP_URL}/mon-espace/parametres"
                 style="color:${C.button};text-decoration:none;font-size:12px;">
                Gérer mes préférences email
              </a>
              <span style="color:${C.border};"> &nbsp;|&nbsp; </span>
              <a href="${APP_URL}"
                 style="color:${C.muted};text-decoration:none;font-size:12px;">
                Accéder à la plateforme
              </a>
            </p>
          </td>
        </tr>

      </table>

      <!-- Sub-footer -->
      <p style="margin:20px 0 0;color:${C.muted};font-size:11px;text-align:center;">
        © ${new Date().getFullYear()} Prana Motion · Mathilde Torrez
      </p>

    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Email: nouveau cours publié ───────────────────────────────────

export function newCourseEmailHtml(opts: {
  userName: string;
  courseTitle: string;
  courseSlug: string;
  courseDuration: number;
  courseTheme: string;
  courseThumbnail?: string | null;
}): string {
  const courseUrl = `${APP_URL}/cours/${opts.courseSlug}`;
  const firstName = opts.userName ? opts.userName.split(" ")[0] : "";

  const thumbnailBlock = opts.courseThumbnail
    ? `<img src="${opts.courseThumbnail}" alt="${opts.courseTitle}"
           width="520" style="width:100%;max-width:520px;height:200px;object-fit:cover;border-radius:12px;display:block;margin-bottom:24px;" />`
    : `<div style="width:100%;height:180px;background:linear-gradient(135deg,${C.accentLight} 0%,${C.accentMid} 100%);border-radius:12px;margin-bottom:24px;display:flex;align-items:center;justify-content:center;text-align:center;">
         <span style="font-size:48px;">🧘</span>
       </div>`;

  const content = `
    <!-- Greeting -->
    <p style="margin:0 0 6px;color:${C.muted};font-size:13px;text-transform:uppercase;letter-spacing:1px;">
      Nouveau cours disponible
    </p>
    <h2 style="margin:0 0 24px;color:${C.heading};font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:normal;line-height:1.2;">
      Votre prochain rendez-vous<br/>avec le yoga vous attend 🧘
    </h2>

    <p style="margin:0 0 28px;color:${C.text};font-size:15px;line-height:1.7;">
      ${firstName ? `Bonjour <strong>${firstName}</strong>,` : "Bonjour,"}<br/><br/>
      Un nouveau cours vient d'être ajouté au catalogue Prana Motion.
      Il ne vous reste plus qu'à dérouler votre tapis !
    </p>

    <!-- Thumbnail -->
    ${thumbnailBlock}

    <!-- Course card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:${C.accentLight};border-radius:16px;border:1px solid ${C.accentMid};margin-bottom:28px;">
      <tr>
        <td style="padding:24px 28px;">
          <p style="margin:0 0 10px;">
            <span style="display:inline-block;background:${C.primary};color:${C.text};font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;">${opts.courseTheme}</span>
          </p>
          <h3 style="margin:0 0 10px;color:${C.heading};font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:normal;line-height:1.3;">
            ${opts.courseTitle}
          </h3>
          <p style="margin:0;color:${C.muted};font-size:13px;">
            ⏱&nbsp; ${opts.courseDuration} minutes
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <a href="${courseUrl}"
             style="display:inline-block;background-color:${C.button};color:${C.buttonText};text-decoration:none;padding:16px 40px;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
            Accéder au cours →
          </a>
        </td>
      </tr>
    </table>

    <!-- Signature -->
    <p style="margin:36px 0 0;color:${C.muted};font-size:13px;text-align:center;line-height:1.7;">
      Prenez soin de vous,<br/>
      <strong style="color:${C.heading};font-family:Georgia,serif;font-size:15px;">Mathilde Torrez</strong>
    </p>`;

  return baseLayout(
    content,
    `Nouveau cours disponible : ${opts.courseTitle} — ${opts.courseDuration} min`
  );
}

// ─── Email: nouvelle formation publiée ───────────────────────────

export function newFormationEmailHtml(opts: {
  userName: string;
  formationTitle: string;
  formationSlug: string;
  formationThumbnail?: string | null;
  formationPrice?: number | null;
}): string {
  const formationUrl = `${APP_URL}/formations/${opts.formationSlug}`;
  const firstName = opts.userName ? opts.userName.split(" ")[0] : "";

  const thumbnailBlock = opts.formationThumbnail
    ? `<img src="${opts.formationThumbnail}" alt="${opts.formationTitle}"
           width="520" style="width:100%;max-width:520px;height:200px;object-fit:cover;border-radius:12px;display:block;margin-bottom:24px;" />`
    : `<div style="width:100%;height:180px;background:linear-gradient(135deg,${C.primary} 0%,#f5d9a0 100%);border-radius:12px;margin-bottom:24px;text-align:center;line-height:180px;">
         <span style="font-size:48px;">✨</span>
       </div>`;

  const priceBlock = opts.formationPrice
    ? `<p style="margin:8px 0 0;color:${C.button};font-size:14px;font-weight:600;">
         ${opts.formationPrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
       </p>`
    : "";

  const content = `
    <!-- Greeting -->
    <p style="margin:0 0 6px;color:${C.muted};font-size:13px;text-transform:uppercase;letter-spacing:1px;">
      Nouvelle formation disponible
    </p>
    <h2 style="margin:0 0 24px;color:${C.heading};font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:normal;line-height:1.2;">
      Une nouvelle formation<br/>vient d'être publiée ✨
    </h2>

    <p style="margin:0 0 28px;color:${C.text};font-size:15px;line-height:1.7;">
      ${firstName ? `Bonjour <strong>${firstName}</strong>,` : "Bonjour,"}<br/><br/>
      Une nouvelle formation complète est maintenant disponible sur Prana Motion —
      vidéos exclusives, livret PDF et un an d'accompagnement personnalisé.
    </p>

    <!-- Thumbnail -->
    ${thumbnailBlock}

    <!-- Formation card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:linear-gradient(135deg,${C.primary} 0%,#fef3e2 100%);border-radius:16px;border:1px solid ${C.border};margin-bottom:28px;">
      <tr>
        <td style="padding:24px 28px;">
          <p style="margin:0 0 8px;">
            <span style="display:inline-block;background:${C.button};color:${C.buttonText};font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;letter-spacing:0.5px;">Formation complète</span>
          </p>
          <h3 style="margin:0 0 10px;color:${C.heading};font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:normal;line-height:1.3;">
            ${opts.formationTitle}
          </h3>
          <p style="margin:0;color:${C.muted};font-size:13px;line-height:1.6;">
            🎬&nbsp; Vidéos exclusives &nbsp;·&nbsp; 📄&nbsp; Livret PDF &nbsp;·&nbsp; 🗓&nbsp; 1 an d'accès
          </p>
          ${priceBlock}
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <a href="${formationUrl}"
             style="display:inline-block;background-color:${C.button};color:${C.buttonText};text-decoration:none;padding:16px 40px;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
            Découvrir la formation →
          </a>
        </td>
      </tr>
    </table>

    <!-- Signature -->
    <p style="margin:36px 0 0;color:${C.muted};font-size:13px;text-align:center;line-height:1.7;">
      Prenez soin de vous,<br/>
      <strong style="color:${C.heading};font-family:Georgia,serif;font-size:15px;">Mathilde Torrez</strong>
    </p>`;

  return baseLayout(
    content,
    `Nouvelle formation : ${opts.formationTitle}`
  );
}

// ─── Email: invitation utilisateur ─────────────────────────────────

export function invitationEmailHtml(opts: {
  name?: string | null;
  role: "USER" | "ADMIN";
  invitationUrl: string;
}): string {
  const firstName = opts.name ? opts.name.split(" ")[0] : "";
  const roleLabel = opts.role === "ADMIN" ? "administrateur" : "membre";

  const content = `
    <!-- Greeting -->
    <p style="margin:0 0 6px;color:${C.muted};font-size:13px;text-transform:uppercase;letter-spacing:1px;">
      Invitation
    </p>
    <h2 style="margin:0 0 24px;color:${C.heading};font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:normal;line-height:1.2;">
      Vous êtes invité(e) à rejoindre<br/>Prana Motion Yoga 🙏
    </h2>

    <p style="margin:0 0 28px;color:${C.text};font-size:15px;line-height:1.7;">
      ${firstName ? `Bonjour <strong>${firstName}</strong>,` : "Bonjour,"}<br/><br/>
      Vous avez été invité(e) en tant que <strong>${roleLabel}</strong> sur la plateforme Prana Motion Yoga.
      Pour finaliser la création de votre compte, cliquez sur le bouton ci-dessous et choisissez votre mot de passe.
    </p>

    <!-- Info card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:${C.accentLight};border-radius:16px;border:1px solid ${C.accentMid};margin-bottom:28px;">
      <tr>
        <td style="padding:24px 28px;">
          <p style="margin:0 0 8px;">
            <span style="display:inline-block;background:${C.primary};color:${C.text};font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;">Invitation</span>
          </p>
          <h3 style="margin:0 0 10px;color:${C.heading};font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:normal;line-height:1.3;">
            Créez votre compte ${roleLabel}
          </h3>
          <p style="margin:0;color:${C.muted};font-size:13px;">
            ⏱&nbsp; Ce lien expire dans 48 heures
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <a href="${opts.invitationUrl}"
             style="display:inline-block;background-color:${C.button};color:${C.buttonText};text-decoration:none;padding:16px 40px;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
            Créer mon compte →
          </a>
        </td>
      </tr>
    </table>

    <!-- Note -->
    <p style="margin:28px 0 0;color:${C.muted};font-size:13px;text-align:center;line-height:1.7;">
      Si vous n'êtes pas à l'origine de cette invitation,<br/>vous pouvez ignorer cet email.
    </p>

    <!-- Signature -->
    <p style="margin:24px 0 0;color:${C.muted};font-size:13px;text-align:center;line-height:1.7;">
      Prenez soin de vous,<br/>
      <strong style="color:${C.heading};font-family:Georgia,serif;font-size:15px;">Mathilde Torrez</strong>
    </p>`;

  return baseLayout(
    content,
    "Vous êtes invité(e) sur Prana Motion Yoga"
  );
}

export async function sendInvitationEmail(opts: {
  email: string;
  name?: string | null;
  role: "USER" | "ADMIN";
  invitationUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM,
    to: opts.email,
    subject: "Vous êtes invité(e) sur Prana Motion Yoga",
    html: invitationEmailHtml({
      name: opts.name,
      role: opts.role,
      invitationUrl: opts.invitationUrl,
    }),
  });
}

// ─── Envoi helpers ─────────────────────────────────────────────────

export async function sendNewCourseNotification(opts: {
  courseTitle: string;
  courseSlug: string;
  courseDuration: number;
  courseTheme: string;
  courseThumbnail?: string | null;
  recipients: { email: string; name: string | null }[];
}) {
  if (!process.env.RESEND_API_KEY) return;

  const results = await Promise.allSettled(
    opts.recipients.map((user) =>
      resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `Nouveau cours : ${opts.courseTitle}`,
        html: newCourseEmailHtml({
          userName: user.name ?? "",
          courseTitle: opts.courseTitle,
          courseSlug: opts.courseSlug,
          courseDuration: opts.courseDuration,
          courseTheme: opts.courseTheme,
          courseThumbnail: opts.courseThumbnail,
        }),
      })
    )
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) {
    console.error(`[EMAIL] ${failed}/${opts.recipients.length} emails failed for new course`);
  }
}

export async function sendNewFormationNotification(opts: {
  formationTitle: string;
  formationSlug: string;
  formationThumbnail?: string | null;
  formationPrice?: number | null;
  recipients: { email: string; name: string | null }[];
}) {
  if (!process.env.RESEND_API_KEY) return;

  const results = await Promise.allSettled(
    opts.recipients.map((user) =>
      resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `Nouvelle formation : ${opts.formationTitle}`,
        html: newFormationEmailHtml({
          userName: user.name ?? "",
          formationTitle: opts.formationTitle,
          formationSlug: opts.formationSlug,
          formationThumbnail: opts.formationThumbnail,
          formationPrice: opts.formationPrice,
        }),
      })
    )
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) {
    console.error(`[EMAIL] ${failed}/${opts.recipients.length} emails failed for new formation`);
  }
}

// ─── Email: réinitialisation du mot de passe ───────────────────────

export function resetPasswordEmailHtml(opts: {
  resetUrl: string;
}): string {
  const content = `
    <!-- Greeting -->
    <p style="margin:0 0 6px;color:${C.muted};font-size:13px;text-transform:uppercase;letter-spacing:1px;">
      Sécurité du compte
    </p>
    <h2 style="margin:0 0 24px;color:${C.heading};font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:normal;line-height:1.2;">
      Réinitialisation de<br/>votre mot de passe 🔐
    </h2>

    <p style="margin:0 0 28px;color:${C.text};font-size:15px;line-height:1.7;">
      Bonjour,<br/><br/>
      Nous avons reçu une demande de réinitialisation du mot de passe associé à votre compte Prana Motion.
      Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
    </p>

    <!-- Info card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:${C.accentLight};border-radius:16px;border:1px solid ${C.accentMid};margin-bottom:28px;">
      <tr>
        <td style="padding:24px 28px;">
          <p style="margin:0 0 8px;">
            <span style="display:inline-block;background:${C.primary};color:${C.text};font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;">Lien sécurisé</span>
          </p>
          <p style="margin:0;color:${C.muted};font-size:13px;line-height:1.6;">
            ⏱&nbsp; Ce lien expire dans <strong>1 heure</strong><br/>
            🔒&nbsp; À usage unique — il sera invalidé après utilisation
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <a href="${opts.resetUrl}"
             style="display:inline-block;background-color:${C.button};color:${C.buttonText};text-decoration:none;padding:16px 40px;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
            Réinitialiser mon mot de passe →
          </a>
        </td>
      </tr>
    </table>

    <!-- Security note -->
    <p style="margin:28px 0 0;color:${C.muted};font-size:13px;text-align:center;line-height:1.7;">
      Si vous n'êtes pas à l'origine de cette demande,<br/>
      ignorez cet email — votre mot de passe restera inchangé.
    </p>

    <!-- Signature -->
    <p style="margin:24px 0 0;color:${C.muted};font-size:13px;text-align:center;line-height:1.7;">
      Prenez soin de vous,<br/>
      <strong style="color:${C.heading};font-family:Georgia,serif;font-size:15px;">Mathilde Torrez</strong>
    </p>`;

  return baseLayout(
    content,
    "Réinitialisez votre mot de passe Prana Motion"
  );
}

export async function sendResetPasswordEmail(opts: {
  email: string;
  resetUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM,
    to: opts.email,
    subject: "Réinitialisation de votre mot de passe",
    html: resetPasswordEmailHtml({ resetUrl: opts.resetUrl }),
  });
}
