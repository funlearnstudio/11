import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';

const schema = z.object({
  displayName: z.string().trim().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  confirmPassword: z.string()
}).refine(v => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    await dbConnect();
    const email = data.email.toLowerCase();
    if (await User.exists({ email })) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    const passwordHash = await bcrypt.hash(data.password, 12);
    const role = process.env.ADMIN_EMAIL?.toLowerCase() === email ? 'admin' : 'user';
    const user = await User.create({ displayName: data.displayName, email, passwordHash, role });
    return NextResponse.json({ id: user.id, displayName: user.displayName, email: user.email }, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') return NextResponse.json({ error: 'Invalid registration data', details: error.issues }, { status: 400 });
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
