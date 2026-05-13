import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPresignedUploadUrl } from '@/lib/r2';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  let slug: string, videoFilename: string;
  try {
    ({ slug, videoFilename } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  if (!slug || !videoFilename) {
    return NextResponse.json({ error: 'slug et videoFilename requis' }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Slug invalide' }, { status: 400 });
  }

  const sanitized = videoFilename
    .replace(/[^a-z0-9._-]/gi, '')
    .replace(/\.{2,}/g, '.')
    .replace(/\.[^.]+$/, '.mp4');

  if (!sanitized || sanitized.includes('/') || sanitized === '.mp4') {
    return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
  }

  const key = `formations/${slug}/videos/${sanitized}`;
  const uploadUrl = await getPresignedUploadUrl(key, 'video/mp4', 3600);

  return NextResponse.json({ key, uploadUrl });
}
