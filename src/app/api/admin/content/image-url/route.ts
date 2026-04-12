import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPresignedUrl } from '@/lib/r2';

async function resolveUrls(keys: string[]): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  const TIMEOUT_MS = 5_000;

  await Promise.all(
    keys.map(async (key) => {
      if (key && !key.startsWith('http')) {
        try {
          const result = await Promise.race([
            getPresignedUrl(key, 3600),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
            ),
          ]);
          urls[key] = result;
        } catch {
          // Key doesn't exist in R2 or timed out, skip
        }
      } else if (key?.startsWith('http')) {
        urls[key] = key;
      }
    })
  );

  return urls;
}

// GET - Resolve a single key via query param
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const key = req.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Paramètre key requis' }, { status: 400 });
  }

  const urls = await resolveUrls([key]);
  return NextResponse.json(
    { urls },
    {
      headers: {
        'Cache-Control': 'private, max-age=1800',
      },
    }
  );
}

// POST - Resolve multiple keys
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { keys } = await req.json() as { keys: string[] };
  if (!Array.isArray(keys) || keys.length === 0) {
    return NextResponse.json({ error: 'Clés requises' }, { status: 400 });
  }

  const urls = await resolveUrls(keys);
  return NextResponse.json({ urls });
}
