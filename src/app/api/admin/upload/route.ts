import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToR2 } from '@/lib/r2';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') return null;
  return session;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4'];
const ALLOWED_PDF_TYPES = ['application/pdf'];

const UPLOAD_TYPES = [
  'course-video',
  'course-thumbnail',
  'formation-video',
  'formation-thumbnail',
  'formation-guide',
] as const;

type UploadType = (typeof UPLOAD_TYPES)[number];

function getExtFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'application/pdf': 'pdf',
  };
  return map[contentType] || 'bin';
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

  if (!file || !type || !slug) {
    return NextResponse.json(
      { error: 'Fichier, type et slug requis' },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Slug invalide' }, { status: 400 });
  }

  if (!UPLOAD_TYPES.includes(type as UploadType)) {
    return NextResponse.json({ error: 'Type non reconnu' }, { status: 400 });
  }

  const contentType = file.type;
  let key: string;

  switch (type) {
    case 'course-video':
      if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
        return NextResponse.json(
          { error: 'Seul le format MP4 est accepté pour les vidéos' },
          { status: 400 }
        );
      }
      key = `cours/${slug}/video.mp4`;
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
          { error: 'Seul le format MP4 est accepté pour les vidéos' },
          { status: 400 }
        );
      }
      if (!videoFilename) {
        return NextResponse.json(
          { error: 'Nom de fichier vidéo requis' },
          { status: 400 }
        );
      }
      // Sanitize: only allow alphanumeric, dash, dot, underscore
      const sanitized = videoFilename
        .replace(/[^a-z0-9._-]/gi, '')
        .replace(/\.{2,}/g, '.');
      if (!sanitized.endsWith('.mp4') || sanitized.includes('/')) {
        return NextResponse.json(
          { error: 'Nom de fichier vidéo invalide' },
          { status: 400 }
        );
      }
      key = `formations/${slug}/videos/${sanitized}`;
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

    default:
      return NextResponse.json({ error: 'Type non reconnu' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, contentType);
    return NextResponse.json({ key });
  } catch (error) {
    console.error('[ADMIN_UPLOAD_ERROR]', error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier" },
      { status: 500 }
    );
  }
}
