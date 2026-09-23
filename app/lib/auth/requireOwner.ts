import { NextRequest, NextResponse } from 'next/server';
import {
  getSession,
  type SessionData,
} from '@/app/lib/session';
// اگر آپ کی فائل app/lib/session.ts پر ہے تو یہ لکھیں:
// import { getSession, type SessionData } from '@/app/lib/session';

type OkResult = { ok: true; session: SessionData };
type FailResult = { ok: false; response: NextResponse };

export async function requireOwner(
  req: NextRequest
): Promise<OkResult | FailResult> {
  const session = await getSession(req);
  if (!session || session.role !== 'owner') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden — owner only' },
        { status: 403 }
      ),
    };
  }
  return { ok: true, session };
}