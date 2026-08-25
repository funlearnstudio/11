export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export function scheduleReview(input: {
  rating: ReviewRating;
  ease?: number;
  intervalDays?: number;
  reviewCount?: number;
}) {
  const ease0 = Math.max(1.3, Math.min(3, input.ease ?? 2.5));
  const interval0 = Math.max(0, input.intervalDays ?? 0);
  const count = Math.max(0, input.reviewCount ?? 0);
  let ease = ease0;
  let intervalDays = interval0;

  if (input.rating === 'again') {
    ease = Math.max(1.3, ease - 0.2);
    intervalDays = 0;
  } else if (input.rating === 'hard') {
    ease = Math.max(1.3, ease - 0.15);
    intervalDays = Math.max(1, Math.round(Math.max(1, interval0) * 1.2));
  } else if (input.rating === 'good') {
    intervalDays = count === 0 ? 1 : count === 1 ? 3 : Math.max(4, Math.round(Math.max(1, interval0) * ease));
  } else {
    ease = Math.min(3, ease + 0.15);
    intervalDays = count === 0 ? 3 : count === 1 ? 7 : Math.max(7, Math.round(Math.max(1, interval0) * ease * 1.3));
  }

  const now = new Date();
  const nextReviewAt = new Date(now);
  if (input.rating === 'again') nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 10);
  else nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  return { ease, intervalDays, nextReviewAt };
}
