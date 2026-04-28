import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Backend'in bize gönderdiği on-demand revalidation hook.
 *
 * Sözleşme (backend `RevalidationService` ile eşleşir):
 *   POST /api/revalidate
 *   { secret: string, tags?: string[], paths?: string[] }
 *
 * Hem `tags` hem `paths` opsiyonel; en az birinin dolu olması beklenir. Secret
 * header yerine body'de beklenir çünkü log'lanan query string'de sızmasın.
 *
 * Hata durumlarında body asla secret'ı echo'lamaz.
 */

interface RevalidateBody {
  secret?: string;
  tags?: string[];
  paths?: string[];
}

const SECRET = process.env.REVALIDATION_SECRET;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!SECRET) {
    return NextResponse.json(
      { ok: false, error: 'server misconfigured' },
      { status: 500 },
    );
  }

  let body: RevalidateBody;
  try {
    body = (await req.json()) as RevalidateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid json' },
      { status: 400 },
    );
  }

  if (!body.secret || body.secret !== SECRET) {
    // 401 yerine 404 döneriz — endpoint'in varlığını bot'a reveal etmemek için.
    return NextResponse.json(
      { ok: false, error: 'not found' },
      { status: 404 },
    );
  }

  const tags = Array.isArray(body.tags) ? body.tags.filter(isNonEmptyString) : [];
  const paths = Array.isArray(body.paths) ? body.paths.filter(isNonEmptyString) : [];

  if (tags.length === 0 && paths.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'tags or paths required' },
      { status: 400 },
    );
  }

  for (const tag of tags) revalidateTag(tag);
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({
    ok: true,
    revalidated: { tags, paths },
    now: Date.now(),
  });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}
