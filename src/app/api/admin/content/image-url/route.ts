import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPresignedUrl } from '@/lib/r2';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { keys } = await req.json() as { keys: string[] };
  if (!Array.isArray(keys) || keys.length === 0) {
    return NextResponse.json({ error: 'Clés requises' }, { status: 400 });
  }

  // Only allow R2 keys (not arbitrary URLs)
  const urls: Record<string, string> = {};
  await Promise.all(
    keys.map(async (key) => {
      if (key && !key.startsWith('http')) {
        try {
          urls[key] = await getPresignedUrl(key, 3600);
        } catch {
          // Key doesn't exist in R2, skip
        }
      } else if (key?.startsWith('http')) {
        urls[key] = key;
      }
    })
  );

  return NextResponse.json({ urls });
}
