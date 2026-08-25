import { Schema, model, models } from 'mongoose';

const SettingsSchema = new Schema({
  theme: { type: String, enum: ['light','dark','system'], default: 'system' },
  pronunciation: { type: String, enum: ['US','UK'], default: 'US' },
  ttsSpeed: { type: Number, min: 0.5, max: 2, default: 1 },
  dailyNewWordGoal: { type: Number, min: 1, max: 100, default: 10 },
  dailyReviewGoal: { type: Number, min: 1, max: 300, default: 30 },
  soundEffects: { type: Boolean, default: true },
  reducedMotion: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new Schema({
  displayName: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user','admin'], default: 'user' },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastStudyDate: Date,
  settings: { type: SettingsSchema, default: () => ({}) },
  resetTokenHash: String,
  resetTokenExpiresAt: Date
}, { timestamps: true });

export const User = models.User || model('User', UserSchema);
