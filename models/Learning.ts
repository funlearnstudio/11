import { Schema, model, models, Types } from 'mongoose';

const GrammarLessonSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  level: { type: String, enum: ['foundation','intermediate','advanced'], required: true },
  zhExplanation: { type: String, required: true },
  useCases: [String],
  structures: [String],
  examples: [{ en: String, zhTW: String }],
  commonErrors: [{ wrong: String, correct: String, explanation: String }],
  notes: [String],
  questionIds: [{ type: Types.ObjectId, ref: 'Question' }],
  published: { type: Boolean, default: false }
}, { timestamps: true });
GrammarLessonSchema.index({ title: 'text', zhExplanation: 'text' });

const ArticleSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: Number, min: 1, max: 5, required: true },
  body: { type: String, required: true },
  estimatedReadingMinutes: Number,
  wordCount: Number,
  vocabularyCoverage: Number,
  targetVocabularyIds: [{ type: Types.ObjectId, ref: 'Vocabulary' }],
  grammarIds: [{ type: Types.ObjectId, ref: 'GrammarLesson' }],
  questionIds: [{ type: Types.ObjectId, ref: 'Question' }],
  published: { type: Boolean, default: false }
}, { timestamps: true });
ArticleSchema.index({ title: 'text', body: 'text', category: 1 });

const QuestionSchema = new Schema({
  type: { type: String, enum: ['en-zh','zh-en','definition','spelling','fill','context','cloze','grammar','reading','listening','sentence-completion','error-correction'], required: true },
  question: { type: String, required: true },
  options: [String],
  answer: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String, required: true },
  optionExplanations: [{ option: String, explanation: String }],
  category: { type: String, required: true },
  difficulty: { type: Number, min: 1, max: 5, required: true },
  vocabularyIds: [{ type: Types.ObjectId, ref: 'Vocabulary' }],
  grammarIds: [{ type: Types.ObjectId, ref: 'GrammarLesson' }],
  articleId: { type: Types.ObjectId, ref: 'Article' },
  published: { type: Boolean, default: false }
}, { timestamps: true });
QuestionSchema.index({ type: 1, difficulty: 1, category: 1, published: 1 });

const WrongAnswerSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  questionId: { type: Types.ObjectId, ref: 'Question', required: true },
  source: { type: String, enum: ['vocabulary','grammar','reading','listening','game','exam'], required: true },
  selectedAnswer: Schema.Types.Mixed,
  attempts: { type: Number, default: 1 },
  understood: { type: Boolean, default: false },
  lastWrongAt: { type: Date, default: Date.now }
}, { timestamps: true });
WrongAnswerSchema.index({ userId: 1, questionId: 1 }, { unique: true });

const ExamAttemptSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  examType: { type: String, required: true },
  questionIds: [{ type: Types.ObjectId, ref: 'Question' }],
  answers: [{ questionId: Types.ObjectId, answer: Schema.Types.Mixed, correct: Boolean }],
  score: Number,
  accuracy: Number,
  durationSeconds: Number,
  completedAt: Date
}, { timestamps: true });
ExamAttemptSchema.index({ userId: 1, completedAt: -1 });

export const GrammarLesson = models.GrammarLesson || model('GrammarLesson', GrammarLessonSchema);
export const Article = models.Article || model('Article', ArticleSchema);
export const Question = models.Question || model('Question', QuestionSchema);
export const WrongAnswer = models.WrongAnswer || model('WrongAnswer', WrongAnswerSchema);
export const ExamAttempt = models.ExamAttempt || model('ExamAttempt', ExamAttemptSchema);
