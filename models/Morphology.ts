import { Schema, model, models, Types } from 'mongoose';

const MorphologySchema = new Schema({
  form: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  type: { type: String, enum: ['prefix', 'root', 'suffix'], required: true },
  meaningZhTW: { type: String, required: true },
  meaningEn: { type: String, required: true },
  origin: String,
  explanation: { type: String, required: true },
  examples: [{ word: String, breakdown: String, meaningZhTW: String }],
  relatedVocabularyIds: [{ type: Types.ObjectId, ref: 'Vocabulary' }],
  sourceNotes: [String],
  published: { type: Boolean, default: false }
}, { timestamps: true });

MorphologySchema.index({ type: 1, form: 1 });
MorphologySchema.index({ form: 'text', meaningZhTW: 'text', meaningEn: 'text', explanation: 'text' });

export const Morphology = models.Morphology || model('Morphology', MorphologySchema);
