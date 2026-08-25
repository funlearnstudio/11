import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { VocabularyProgress } from '@/models/VocabularyProgress';
import ReviewQueue from '@/components/ReviewQueue';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  await dbConnect();
  const userId = (session.user as any).id;
  const now = new Date();
  const due: any[] = await VocabularyProgress.find({ userId, nextReviewAt: { $lte: now }, status: { $ne: 'mastered' } })
    .sort({ nextReviewAt: 1 })
    .limit(100)
    .populate('vocabularyId', 'word ipa definitionsZhTW definitionsEn examples')
    .lean();

  const queue = due.filter(item => item.vocabularyId).map(item => ({
    vocabularyId: String(item.vocabularyId._id),
    word: item.vocabularyId.word,
    ipa: item.vocabularyId.ipa,
    definitionsZhTW: item.vocabularyId.definitionsZhTW,
    definitionsEn: item.vocabularyId.definitionsEn,
    examples: item.vocabularyId.examples
  }));

  return <main className="content">
    <h1>Review</h1>
    <p className="muted">Spaced repetition queue · {queue.length} due now</p>
    <ReviewQueue items={queue}/>
  </main>;
}
