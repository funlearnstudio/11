import { dbConnect } from '@/lib/db';
import { RateLimit } from '@/models/Security';

function clientAddress(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip') || 'unknown';
}

export async function rateLimit(req: Request, scope: string, limit: number, windowSeconds: number) {
  await dbConnect();
  const now = Date.now();
  const bucket = Math.floor(now / (windowSeconds * 1000));
  const key = `${scope}:${clientAddress(req)}:${bucket}`;
  const expiresAt = new Date((bucket + 1) * windowSeconds * 1000 + 60_000);
  let doc;
  try {
    doc = await RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
    doc = await RateLimit.findOneAndUpdate({ key }, { $inc: { count: 1 } }, { new: true });
  }
  const count = Number(doc?.count || 1);
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000))
  };
}

export function sameOrigin(req: Request) {
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (!host) return false;
  try { return new URL(origin).origin === `${proto}://${host}`; } catch { return false; }
}
