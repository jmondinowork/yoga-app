/**
 * Génère les miniatures des vidéos sur R2 via ffmpeg.
 * Force la regénération pour TOUS les cours/formations avec vidéo (ignore la valeur thumbnail en DB).
 * Usage: node --env-file=.env.local --experimental-strip-types generate-thumbnails.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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

async function extractFrame(videoUrl: string): Promise<Buffer | null> {
  const tmp = path.join(os.tmpdir(), `thumb_${Date.now()}.jpg`);
  try {
    // Les options reconnect permettent à ffmpeg d'utiliser les range requests HTTP
    // pour les MP4 sans faststart (moov atom à la fin du fichier)
    const res = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-nostdin",
        "-hide_banner",
        "-loglevel", "error",
        "-reconnect", "1",
        "-reconnect_at_eof", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
        "-i", videoUrl,
        "-frames:v", "1",
        "-q:v", "2",
        tmp,
      ],
      { timeout: 60_000 }
    );
    if (res.status === 0 && fs.existsSync(tmp)) {
      return fs.readFileSync(tmp);
    }
    return null;
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

async function uploadThumbnail(key: string, buf: Buffer) {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buf,
      ContentType: "image/jpeg",
    })
  );
}

async function main() {
  // ── Cours ────────────────────────────────────────────────
  const courses = await prisma.course.findMany({
    where: { videoUrl: { not: null } },
    select: { id: true, slug: true },
  });

  console.log(`\n📹 ${courses.length} cours à traiter\n`);

  for (const course of courses) {
    const videoKey = `cours/${course.slug}/video.mp4`;
    const thumbKey = `cours/${course.slug}/thumbnail.jpg`;
    process.stdout.write(`  [cours] ${course.slug} … `);
    try {
      const url = await signedUrl(videoKey);
      const buf = await extractFrame(url);
      if (!buf) { console.log("❌ ffmpeg échoué"); continue; }
      await uploadThumbnail(thumbKey, buf);
      await prisma.course.update({
        where: { id: course.id },
        data: { thumbnail: thumbKey },
      });
      console.log(`✓ (${(buf.length / 1024).toFixed(0)} Ko)`);
    } catch (err) {
      console.log(`❌ ${err}`);
    }
  }

  // ── Formations ───────────────────────────────────────────
  const formations = await prisma.formation.findMany({
    include: {
      videos: {
        where: { videoUrl: { not: null } },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { videoUrl: true },
      },
    },
  });

  const withVideos = formations.filter((f) => f.videos.length > 0);
  console.log(`\n📚 ${withVideos.length} formations à traiter\n`);

  for (const formation of withVideos) {
    const rawKey = formation.videos[0].videoUrl!;
    // Clé complète si le champ en DB ne contient que le nom de fichier (ancienne donnée)
    const videoKey = rawKey.includes("/")
      ? rawKey
      : `formations/${formation.slug}/videos/${rawKey}`;
    const thumbKey = `formations/${formation.slug}/thumbnail.jpg`;
    process.stdout.write(`  [formation] ${formation.slug} … `);
    try {
      const url = await signedUrl(videoKey);
      const buf = await extractFrame(url);
      if (!buf) { console.log("❌ ffmpeg échoué"); continue; }
      await uploadThumbnail(thumbKey, buf);
      await prisma.formation.update({
        where: { id: formation.id },
        data: { thumbnail: thumbKey },
      });
      console.log(`✓ (${(buf.length / 1024).toFixed(0)} Ko)`);
    } catch (err) {
      console.log(`❌ ${err}`);
    }
  }

  console.log("\n✅ Terminé\n");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
