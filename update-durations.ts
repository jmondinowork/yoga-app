/**
 * Met à jour la durée réelle (en minutes) de toutes les vidéos existantes
 * en utilisant ffprobe sur les URLs presignées R2.
 *
 * Usage: node --env-file=.env.local --experimental-strip-types update-durations.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { spawnSync } from "child_process";

const prisma = new PrismaClient();

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET!;

async function signedUrl(key: string) {
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: 3600,
  });
}

/**
 * Utilise ffprobe pour obtenir la durée d'une vidéo à partir de son URL.
 * Retourne la durée en secondes, ou null si erreur.
 */
function getVideoDuration(videoUrl: string): number | null {
  const res = spawnSync(
    "ffprobe",
    [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      "-reconnect", "1",
      "-reconnect_at_eof", "1",
      "-reconnect_streamed", "1",
      "-reconnect_delay_max", "5",
      videoUrl,
    ],
    { timeout: 60_000, encoding: "utf-8" }
  );

  if (res.status !== 0) {
    console.error(`  ffprobe error: ${res.stderr?.slice(0, 200)}`);
    return null;
  }

  const seconds = parseFloat(res.stdout.trim());
  return isNaN(seconds) ? null : seconds;
}

async function updateCourseDurations() {
  const courses = await prisma.course.findMany({
    where: { videoUrl: { not: null } },
    select: { id: true, title: true, slug: true, videoUrl: true, duration: true },
    orderBy: { sortOrder: "asc" },
  });

  console.log(`\n=== COURS : ${courses.length} vidéos ===\n`);

  let updated = 0;
  for (const course of courses) {
    const key = course.videoUrl ?? `cours/${course.slug}/video.mp4`;
    console.log(`[${course.title}]`);
    console.log(`  R2 key: ${key}`);
    console.log(`  Durée actuelle: ${course.duration} min`);

    try {
      const url = await signedUrl(key);
      const seconds = getVideoDuration(url);

      if (seconds === null) {
        console.log(`  ❌ Impossible de lire la durée\n`);
        continue;
      }

      const durationMin = Math.round(seconds / 60);
      console.log(`  Durée réelle: ${seconds.toFixed(1)}s → ${durationMin} min`);

      if (durationMin !== course.duration) {
        await prisma.course.update({
          where: { id: course.id },
          data: { duration: durationMin },
        });
        console.log(`  ✅ Mis à jour: ${course.duration} → ${durationMin} min\n`);
        updated++;
      } else {
        console.log(`  ⏭️  Déjà correct\n`);
      }
    } catch (err) {
      console.error(`  ❌ Erreur: ${err}\n`);
    }
  }

  console.log(`Cours: ${updated}/${courses.length} mis à jour`);
}

async function updateFormationVideoDurations() {
  const formations = await prisma.formation.findMany({
    include: {
      videos: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, title: true, videoUrl: true, duration: true },
      },
    },
  });

  let totalVideos = 0;
  let updated = 0;

  for (const formation of formations) {
    console.log(`\n=== FORMATION : ${formation.title} (${formation.videos.length} vidéos) ===\n`);

    for (const video of formation.videos) {
      totalVideos++;

      if (!video.videoUrl) {
        console.log(`  [${video.title}] Pas de vidéo, skip`);
        continue;
      }

      // Reconstruire la clé R2 si c'est un nom de fichier simple
      const key = video.videoUrl.includes("/")
        ? video.videoUrl
        : `formations/${formation.slug}/videos/${video.videoUrl}`;

      console.log(`  [${video.title}]`);
      console.log(`    R2 key: ${key}`);
      console.log(`    Durée actuelle: ${video.duration} min`);

      try {
        const url = await signedUrl(key);
        const seconds = getVideoDuration(url);

        if (seconds === null) {
          console.log(`    ❌ Impossible de lire la durée`);
          continue;
        }

        const durationMin = Math.round(seconds / 60);
        console.log(`    Durée réelle: ${seconds.toFixed(1)}s → ${durationMin} min`);

        if (durationMin !== video.duration) {
          await prisma.formationVideo.update({
            where: { id: video.id },
            data: { duration: durationMin },
          });
          console.log(`    ✅ Mis à jour: ${video.duration} → ${durationMin} min`);
          updated++;
        } else {
          console.log(`    ⏭️  Déjà correct`);
        }
      } catch (err) {
        console.error(`    ❌ Erreur: ${err}`);
      }
    }
  }

  console.log(`\nFormations: ${updated}/${totalVideos} vidéos mises à jour`);
}

async function main() {
  console.log("🕐 Mise à jour des durées vidéo...\n");
  await updateCourseDurations();
  await updateFormationVideoDurations();
  console.log("\n✅ Terminé !");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
