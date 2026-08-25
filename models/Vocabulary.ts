import { Schema, model, models } from 'mongoose';

const ExampleSchema = new Schema({ text: { type: String, required: true }, zhTW: { type: String, required: true } }, { _id: false });
const MorphPartSchema = new Schema({ form: String, type: { type: String, enum: ['prefix','root','suffix'] }, meaning: String, origin: String }, { _id: false });

const VocabularySchema = new Schema({
  word: { type: String, required: true, trim: true },
  lemma: { type: String, required: true, trim: true },
  pronunciation: String,
  ipa: String,
  partsOfSpeech: [{ type: String, required: true }],
  ceecLevel: { type: Number, min: 1, max: 6, required: true },
  zhTWDefinitions: [{ type: String, required: true }],
  englishDefinitions: [{ type: String, required: true }],
  commonMeanings: [String],
  examples: [ExampleSchema],
  collocations: [String],
  synonyms: [String],
  antonyms: [String],
  wordFamily: [{ word: String, pos: String }],
  derivatives: [String],
  morphology: [MorphPartSchema],
  morphologyExplanation: String,
  commonUsage: [String],
  commonMistakes: [String],
  confusingWords: [{ word: String, note: String }],
  difficulty: { type: Number, min: 1, max: 5, default: 3 },
  tags: [String],
  importance: { type: Number, min: 0, max: 100, default: 50 },
  source: { type: String, required: true },
  sourceEdition: { type: String, required: true },
  sourceVerifiedAt: Date,
  published: { type: Boolean, default: false }
}, { timestamps: true });

VocabularySchema.index({ word: 1, ceecLevel: 1 }, { unique: true });
VocabularySchema.index({ word: 'text', lemma: 'text', tags: 'text' });
VocabularySchema.index({ ceecLevel: 1, partsOfSpeech: 1, published: 1 });

export const Vocabulary = models.Vocabulary || model('Vocabulary', VocabularySchema);
