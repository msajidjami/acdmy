import { NextResponse } from 'next/server';
import { getWhatsAppManager } from '@/app/lib/whatsapp/manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* GET — status */
export async function GET() {
  try {
    const manager = getWhatsAppManager();
    return NextResponse.json(manager.getStatus(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ready: false, qr: null, error: err?.message },
      { status: 500 }
    );
  }
}

/* POST — start WhatsApp */
export async function POST() {
  try {
    const manager = getWhatsAppManager();
    const s = manager.getStatus();

    if (s.ready) {
      return NextResponse.json({ success: true, already: 'connected' });
    }
    if (s.status === 'connecting' || s.status === 'qr') {
      return NextResponse.json({ success: true, already: 'starting' });
    }

    void manager.start();
    return NextResponse.json({ success: true, started: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message },
      { status: 500 }
    );
  }
}

/* DELETE — logout */
export async function DELETE() {
  try {
    await getWhatsAppManager().logout();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message },
      { status: 500 }
    );
  }
}