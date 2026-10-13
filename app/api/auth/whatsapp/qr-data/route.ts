import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    /* whatsapp.ts سے موجودہ QR حاصل کریں */
    const { getLatestQr, isClientReady } = await import('@/app/lib/whatsapp');
    return NextResponse.json({
      qr: getLatestQr(),
      ready: isClientReady(),
    });
  } catch {
    return NextResponse.json({ qr: null, ready: false });
  }
}