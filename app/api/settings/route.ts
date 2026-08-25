import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';

const SettingsInput = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  pronunciation: z.enum(['US', 'UK']),
  ttsSpeed: z.number().min(0.5).max(2),
  dailyNewWordGoal: z.number().int().min(1).max(100),
  dailyReviewGoal: z.number().int().min(1).max(300),
  soundEffects: z.boolean(),
  reducedMotion: z.boolean()
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const user = await User.findById((session.user as any).id).select('settings').lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ settings: user.settings });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = SettingsInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid settings', issues: parsed.error.flatten() }, { status: 400 });
  await dbConnect();
  const user = await User.findByIdAndUpdate((session.user as any).id, { $set: { settings: parsed.data } }, { new: true, runValidators: true }).select('settings').lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ ok: true, settings: user.settings });
}
