import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { GrammarLesson, Article } from '@/models/Learning';
import { Morphology } from '@/models/Morphology';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() || '';
  if (q.length < 2) return NextResponse.json({ query: q, vocabulary: [], grammar: [], reading: [], morphology: [] });

  await dbConnect();
  const safe = new RegExp(escapeRegExp(q), 'i');

  const [vocabulary, grammar, reading, morphology] = await Promise.all([
    Vocabulary.find({ $or: [{ word: safe }, { lemma: safe }, { definitionsZhTW: safe }] })
      .select('word lemma ipa partOfSpeech ceecLevel definitionsZhTW')
      .limit(12).lean(),
    GrammarLesson.find({ published: true, $or: [{ title: safe }, { zhExplanation: safe }] })
      .select('slug title level').limit(8).lean(),
    Article.find({ published: true, $or: [{ title: safe }, { category: safe }] })
      .select('slug title category difficulty estimatedReadingMinutes').limit(8).lean(),
    Morphology.find({ published: true, $or: [{ form: safe }, { meaningZhTW: safe }, { meaningEn: safe }] })
      .select('slug form type meaningZhTW meaningEn').limit(8).lean()
  ]);

  return NextResponse.json({ query: q, vocabulary, grammar, reading, morphology });
}
