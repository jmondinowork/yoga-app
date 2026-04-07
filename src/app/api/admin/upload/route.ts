import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToR2, getPresignedUrl } from '@/lib/r2';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') return null;
  return session;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'];
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',      // .mov
  'video/webm',           // .webm
  'video/x-msvideo',      // .avi
  'video/avi',
  'video/x-matroska',     // .mkv
  'video/x-m4v',          // .m4v
  'video/mp2t',           // .ts
];
const ALLOWED_PDF_TYPES = ['application/pdf'];

const UPLOAD_TYPES = [
  'course-video',
  'course-thumbnail',
  'formation-video',
  'formation-thumbnail',
  'formation-guide',
  'site-image',
] as const;

type UploadType = (typeof UPLOAD_TYPES)[number];

function getExtFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'application/pdf': 'pdf',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
    'image/svg+xml': 'svg',
  };
  return map[contentType] || 'bin';
}

/**
 * Convertit une vidéo en MP4 H.264 + AAC avec faststart.
 * Retourne le buffer MP4 converti.
 */
async function convertToMp4(inputBuffer: Buffer, inputExt: string): Promise<Buffer> {
  const tmpIn = path.join(os.tmpdir(), `upload_in_${Date.now()}.${inputExt}`);
  const tmpOut = path.join(os.tmpdir(), `upload_out_${Date.now()}.mp4`);
  try {
    fs.writeFileSync(tmpIn, inputBuffer);
    const result = spawnSync('ffmpeg', [
      '-y',
      '-nostdin',
      '-hide_banner',
      '-loglevel', 'error',
      '-i', tmpIn,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-preset', 'fast',
      '-crf', '23',
      '-movflags', '+faststart',
      tmpOut,
    ], { timeout: 600_000, maxBuffer: 1024 * 1024 * 10 });

    if (result.status !== 0) {
      const errMsg = result.stderr?.toString() || 'Erreur ffmpeg inconnue';
      throw new Error(`Conversion échouée : ${errMsg.slice(0, 200)}`);
    }
    return fs.readFileSync(tmpOut);
  } finally {
    if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  }
}

function extFromMimeType(mime: string): string {
  const map: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'video/x-msvideo': 'avi',
    'video/avi': 'avi',
    'video/x-matroska': 'mkv',
    'video/x-m4v': 'm4v',
    'video/mp2t': 'ts',
  };
  return map[mime] || 'mp4';
}

export async function POST(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const type = formData.get('type') as string;
  const slug = formData.get('slug') as string;
  const videoFilename = formData.get('videoFilename') as string | null;

  if (!file || !type) {
    return NextResponse.json(
      { error: 'Fichier et type requis' },
      { status: 400 }
    );
  }

  // slug is required for all types except site-image
  if (type !== 'site-image' && !slug) {
    return NextResponse.json(
      { error: 'Slug requis' },
      { status: 400 }
    );
  }

  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Slug invalide' }, { status: 400 });
  }

  if (!UPLOAD_TYPES.includes(type as UploadType)) {
    return NextResponse.json({ error: 'Type non reconnu' }, { status: 400 });
  }

  const contentType = file.type;
  let key: string;
  let needsConversion = false;

  switch (type) {
    case 'course-video':
      if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
        return NextResponse.json(
          { error: 'Format vidéo non supporté. Formats acceptés : MP4, MOV, WebM, AVI, MKV' },
          { status: 400 }
        );
      }
      key = `cours/${slug}/video.mp4`;
      needsConversion = contentType !== 'video/mp4';
      break;

    case 'course-thumbnail': {
      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        return NextResponse.json(
          { error: 'Format accepté : JPEG, PNG ou WebP' },
          { status: 400 }
        );
      }
      const ext = getExtFromContentType(contentType);
      key = `cours/${slug}/thumbnail.${ext}`;
      break;
    }

    case 'formation-video': {
      if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
        return NextResponse.json(
          { error: 'Format vidéo non supporté. Formats acceptés : MP4, MOV, WebM, AVI, MKV' },
          { status: 400 }
        );
      }
      if (!videoFilename) {
        return NextResponse.json(
          { error: 'Nom de fichier vidéo requis' },
          { status: 400 }
        );
      }
      // Forcer l'extension .mp4 (la conversion est faite côté serveur)
      const sanitized = videoFilename
        .replace(/[^a-z0-9._-]/gi, '')
        .replace(/\.{2,}/g, '.')
        .replace(/\.[^.]+$/, '.mp4'); // remplace toute extension par .mp4
      if (!sanitized || sanitized.includes('/')) {
        return NextResponse.json(
          { error: 'Nom de fichier vidéo invalide' },
          { status: 400 }
        );
      }
      key = `formations/${slug}/videos/${sanitized}`;
      needsConversion = contentType !== 'video/mp4';
      break;
    }

    case 'formation-thumbnail': {
      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        return NextResponse.json(
          { error: 'Format accepté : JPEG, PNG ou WebP' },
          { status: 400 }
        );
      }
      const ext = getExtFromContentType(contentType);
      key = `formations/${slug}/thumbnail.${ext}`;
      break;
    }

    case 'formation-guide':
      if (!ALLOWED_PDF_TYPES.includes(contentType)) {
        return NextResponse.json(
          { error: 'Seul le format PDF est accepté' },
          { status: 400 }
        );
      }
      key = `formations/${slug}/guide.pdf`;
      break;

    case 'site-image': {
      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        return NextResponse.json(
          { error: 'Format accepté : JPEG, PNG ou WebP' },
          { status: 400 }
        );
      }
      const imageSlug = formData.get('imageKey') as string || `img-${Date.now()}`;
      const sanitizedSlug = imageSlug.replace(/[^a-z0-9_-]/gi, '');
      const ext = getExtFromContentType(contentType);
      key = `site/images/${sanitizedSlug}.${ext}`;
      break;
    }

    default:
      return NextResponse.json({ error: 'Type non reconnu' }, { status: 400 });
  }

  try {
    let buffer: Buffer<ArrayBufferLike> = Buffer.from(await file.arrayBuffer());
    let uploadContentType = contentType;

    if (needsConversion) {
      const inputExt = extFromMimeType(contentType);
      buffer = await convertToMp4(buffer, inputExt);
      uploadContentType = 'video/mp4';
    }

    await uploadToR2(key, buffer, uploadContentType);

    // For images, return a presigned URL for immediate preview
    if (ALLOWED_IMAGE_TYPES.includes(contentType)) {
      const url = await getPresignedUrl(key, 3600);
      return NextResponse.json({ key, url });
    }

    return NextResponse.json({ key });
  } catch (error) {
    console.error('[ADMIN_UPLOAD_ERROR]', error);
    const message = error instanceof Error ? error.message : "Erreur lors de l'upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
