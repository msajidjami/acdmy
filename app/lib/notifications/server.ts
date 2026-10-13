import webpush from 'web-push';
import connectDB from '@/app/lib/dbConnect';
import PushSubscription from '@/models/PushSubscription';
import User from '@/models/User';

let configured = false;

function configure() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT || 'mailto:admin@ilmora786.com';

  if (!pub || !priv) {
    console.warn('[notify] VAPID keys missing — notifications disabled');
    return;
  }

  webpush.setVapidDetails(subj, pub, priv);
  configured = true;
}

export type NotifyPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  kind?: 'message' | 'call';
  badgeCount?: number;
};

/**
 * Send push notification to a specific user
 */
export async function notifyUser(
  userId: string,
  payload: NotifyPayload
): Promise<{ sent: number; failed: number }> {
  configure();
  if (!configured) return { sent: 0, failed: 0 };

  await connectDB();

  const subs: any[] = await PushSubscription.find({ userId }).lean();
  if (!subs.length) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  /* Badge count — total unread for the user */
  let badgeCount = payload.badgeCount;
  if (typeof badgeCount !== 'number') {
    try {
      const Contact = (await import('@/models/Contact')).default;
      const contacts: any[] = await Contact.find({ ownerId: userId })
        .select('unreadCount')
        .lean();
      badgeCount = contacts.reduce(
        (sum, c) => sum + (Number(c.unreadCount) || 0),
        0
      );
    } catch {
      badgeCount = 0;
    }
  }

  const jsonPayload = JSON.stringify({
    ...payload,
    badge: badgeCount,
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        },
        jsonPayload,
        { TTL: 60 * 60 * 24 } // 24h
      );
      sent++;
    } catch (err: any) {
      failed++;
      /* اگر subscription ختم ہو گئی تو ہٹا دیں */
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await PushSubscription.deleteOne({ _id: sub._id }).catch(() => {});
      }
    }
  }

  return { sent, failed };
}