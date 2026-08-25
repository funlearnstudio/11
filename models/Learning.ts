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

const GrammarProgressSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  grammarId: { type: Types.ObjectId, ref: 'GrammarLesson', required: true },
  status: { type: String, enum: ['not-started','learning','completed','mastered'], default: 'not-started' },
  attempts: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  mastery: { type: Number, min: 0, max: 1, default: 0 },
  lastStudiedAt: Date,
  completedAt: Date
}, { timestamps: true });
GrammarProgressSchema.index({ userId: 1, grammarId: 1 }, { unique: true });
GrammarProgressSchema.index({ userId: 1, status: 1 });

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
ArticleSchema.index({ published: 1, category: 1, difficulty: 1 });

const ReadingProgressSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  articleId: { type: Types.ObjectId, ref: 'Article', required: true },
  startedAt: Date,
  completedAt: Date,
  timeSpentSeconds: { type: Number, default: 0 },
  questionAttempts: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  accuracy: { type: Number, min: 0, max: 1, default: 0 },
  vocabularyReviewedAt: Date
}, { timestamps: true });
ReadingProgressSchema.index({ userId: 1, articleId: 1 }, { unique: true });
ReadingProgressSchema.index({ userId: 1, completedAt: -1 });

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
QuestionSchema.index({ question: 'text', explanation: 'text' });

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
WrongAnswerSchema.index({ userId: 1, understood: 1, lastWrongAt: -1 });

const ExamAttemptSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  examType: { type: String, enum: ['vocabulary','grammar','reading','mixed','mock'], required: true },
  questionIds: [{ type: Types.ObjectId, ref: 'Question' }],
  answers: [{ questionId: Types.ObjectId, answer: Schema.Types.Mixed, correct: Boolean }],
  score: Number,
  accuracy: Number,
  durationSeconds: Number,
  flaggedQuestionIds: [{ type: Types.ObjectId, ref: 'Question' }],
  completedAt: Date
}, { timestamps: true });
ExamAttemptSchema.index({ userId: 1, completedAt: -1 });

const FavoriteSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  itemType: { type: String, enum: ['vocabulary','grammar','article','morphology','question'], required: true },
  itemId: { type: Types.ObjectId, required: true }
}, { timestamps: true });
FavoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

const AchievementSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now }
}, { timestamps: true });
AchievementSchema.index({ userId: 1, key: 1 }, { unique: true });

const StudySessionSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  activity: { type: String, enum: ['vocabulary','review','grammar','reading','practice','game','exam','listening'], required: true },
  startedAt: { type: Date, required: true },
  endedAt: Date,
  durationSeconds: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  metadata: Schema.Types.Mixed
}, { timestamps: true });
StudySessionSchema.index({ userId: 1, startedAt: -1 });

const GameResultSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  game: { type: String, enum: ['word-match','definition-match','speed-quiz','spelling-challenge','falling-words','sentence-builder','cloze-challenge','root-builder','vocabulary-battle','memory-cards'], required: true },
  score: { type: Number, required: true },
  accuracy: { type: Number, min: 0, max: 1, required: true },
  correctCount: { type: Number, required: true },
  wrongCount: { type: Number, required: true },
  xpEarned: { type: Number, default: 0 },
  vocabularyIds: [{ type: Types.ObjectId, ref: 'Vocabulary' }],
  durationSeconds: Number,
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });
GameResultSchema.index({ userId: 1, game: 1, completedAt: -1 });

const DailyTaskSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  dateKey: { type: String, required: true },
  tasks: [{
    key: { type: String, required: true },
    target: { type: Number, required: true },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }
  }]
}, { timestamps: true });
DailyTaskSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export const GrammarLesson = models.GrammarLesson || model('GrammarLesson', GrammarLessonSchema);
export const GrammarProgress = models.GrammarProgress || model('GrammarProgress', GrammarProgressSchema);
export const Article = models.Article || model('Article', ArticleSchema);
export const ReadingProgress = models.ReadingProgress || model('ReadingProgress', ReadingProgressSchema);
export const Question = models.Question || model('Question', QuestionSchema);
export const WrongAnswer = models.WrongAnswer || model('WrongAnswer', WrongAnswerSchema);
export const ExamAttempt = models.ExamAttempt || model('ExamAttempt', ExamAttemptSchema);
export const Favorite = models.Favorite || model('Favorite', FavoriteSchema);
export const Achievement = models.Achievement || model('Achievement', AchievementSchema);
export const StudySession = models.StudySession || model('StudySession', StudySessionSchema);
export const GameResult = models.GameResult || model('GameResult', GameResultSchema);
export const DailyTask = models.DailyTask || model('DailyTask', DailyTaskSchema);
