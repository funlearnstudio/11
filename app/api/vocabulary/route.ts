import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  await dbConnect();
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit') || 30)));
  const q = (sp.get('q') || '').trim();
  const level = sp.get('level');
  const pos = sp.get('pos');
  const hasMorphology = sp.get('hasMorphology');
  const filter: any = { published: true };
  if (q) filter.$or = [{ word: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }, { lemma: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }];
  if (level && /^[1-6]$/.test(level)) filter.ceecLevel = Number(level);
  if (pos) filter.partsOfSpeech = pos;
  if (hasMorphology === 'true') filter['morphology.0'] = { $exists: true };
  const [items, total] = await Promise.all([
    Vocabulary.find(filter).sort({ word: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Vocabulary.countDocuments(filter)
  ]);
  return NextResponse.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ error: 'Use the validated admin import/editor endpoints' }, { status: 405 });
}
