import { NextRequest, NextResponse } from 'next/server';

/* یہ endpoint صرف development کے لیے ہے — QR براؤزر میں دکھاتا ہے */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp QR — اسکین کریں</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { background: #0f172a; color: #fff; font-family: system-ui; margin: 0; padding: 20px; text-align: center; }
    h1 { font-size: 20px; margin-bottom: 10px; }
    p { color: #94a3b8; font-size: 14px; }
    #qr { background: #fff; padding: 20px; border-radius: 16px; display: inline-block; margin-top: 20px; }
    .steps { max-width: 400px; margin: 20px auto; text-align: left; background: #1e293b; padding: 16px; border-radius: 12px; }
    .steps ol { padding-left: 20px; margin: 0; }
    .steps li { margin: 8px 0; color: #cbd5e1; font-size: 14px; }
    .qr-refresh { color: #64748b; font-size: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>📱 WhatsApp QR Code</h1>
  <p>اپنے WhatsApp سے اسکین کریں — 20 سیکنڈ کے اندر</p>

  <div id="qr">لوڈ ہو رہا ہے...</div>
  <div class="qr-refresh" id="status"></div>

  <div class="steps">
    <ol>
      <li>WhatsApp کھولیں</li>
      <li>Settings → Linked Devices</li>
      <li>Link a Device دبائیں</li>
      <li>یہ QR اسکین کریں</li>
    </ol>
  </div>

  <script>
    let lastQR = '';
    async function poll() {
      try {
        const res = await fetch('/api/auth/whatsapp/qr-data', { cache: 'no-store' });
        const data = await res.json();
        if (data.qr && data.qr !== lastQR) {
          lastQR = data.qr;
          document.getElementById('qr').innerHTML =
            '<img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' +
            encodeURIComponent(data.qr) + '" alt="QR" />';
          document.getElementById('status').textContent = 'نیا QR — فوراً اسکین کریں';
        }
        if (data.ready) {
          document.getElementById('qr').innerHTML =
            '<div style="color:#22c55e;font-size:48px">✅</div><p style="color:#22c55e">جڑ گیا! اب ویب سائٹ پر واپس جائیں</p>';
          document.getElementById('status').textContent = '';
          return;
        }
      } catch {}
      setTimeout(poll, 1500);
    }
    poll();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}