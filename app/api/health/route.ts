import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  try {
    const mongoose = await dbConnect();
    const readyState = mongoose.connection.readyState;
    const database = readyState === 1 ? 'connected' : 'not-ready';
    return NextResponse.json({
      ok: readyState === 1,
      service: 'lexora',
      database,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt
    }, { status: readyState === 1 ? 200 : 503 });
  } catch {
    return NextResponse.json({
      ok: false,
      service: 'lexora',
      database: 'error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
