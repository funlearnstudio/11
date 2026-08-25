import { Schema, model, models, Types } from 'mongoose';

const VocabularyProgressSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  vocabularyId: { type: Types.ObjectId, ref: 'Vocabulary', required: true },
  firstSeenAt: Date,
  lastReviewedAt: Date,
  nextReviewAt: Date,
  reviewCount: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  mastery: { type: Number, min: 0, max: 100, default: 0 },
  ease: { type: Number, min: 1.3, max: 3, default: 2.5 },
  intervalDays: { type: Number, default: 0 },
  recentPerformance: [{ correct: Boolean, rating: String, at: Date }],
  status: { type: String, enum: ['unseen','learning','reviewing','mastered'], default: 'unseen' }
}, { timestamps: true });
VocabularyProgressSchema.index({ userId: 1, vocabularyId: 1 }, { unique: true });
VocabularyProgressSchema.index({ userId: 1, nextReviewAt: 1 });

export const VocabularyProgress = models.VocabularyProgress || model('VocabularyProgress', VocabularyProgressSchema);
