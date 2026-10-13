import { getMessaging } from 'firebase-admin/messaging';
import '@/app/lib/firebaseAdmin'; // ensures admin initialized
import User from '@/models/User';
import connectDB from '@/app/lib/dbConnect';

type SendOpts = {
  toUserId: string | string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  /* Notification type for icon/badge */
  type?: 'message' | 'call' | 'system';
  /* Optional: incoming call ring */
  ring?: boolean;
  /* Badge count — auto-increment */
  setBadge?: number;
};

export async function sendPush(opts: SendOpts): Promise<void> {
  try {
    await connectDB();

    const userIds = Array.isArray(opts.toUserId)
      ? opts.toUserId
      : [opts.toUserId];

    /* FCM tokens جمع کریں */
    const users = await User.find({ _id: { $in: userIds } })
      .select('fcmTokens')
      .lean();

    const tokens: string[] = [];
    for (const u of users) {
      for (const t of (u as any).fcmTokens || []) {
        if (t && typeof t === 'string') tokens.push(t);
      }
    }

    if (tokens.length === 0) return;

    const isCall = opts.type === 'call' || opts.ring === true;

    /* FCM message */
    const message = {
      tokens,
      notification: {
        title: opts.title,
        body: opts.body,
      },
      data: {
        type: opts.type || 'system',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        ...(opts.data || {}),
      },
      android: {
        priority: (isCall ? 'high' : 'normal') as 'high' | 'normal',
        notification: {
          channelId: isCall ? 'calls_channel' : 'messages_channel',
          sound: isCall ? 'ringtone' : 'default',
          /* Badge count */
          notificationCount: opts.setBadge ?? 1,
          /* Long ring for calls */
          ...(isCall && {
            /* Continuous vibration + ring */
            defaultSound: false,
            defaultVibrateTimings: false,
            vibrateTimingsMillis: [0, 1000, 500, 1000, 500, 1000],
          }),
        },
      },
      apns: {
        headers: {
          'apns-priority': isCall ? '10' : '5',
        },
        payload: {
          aps: {
            alert: {
              title: opts.title,
              body: opts.body,
            },
            sound: isCall ? 'ringtone.caf' : 'default',
            badge: opts.setBadge ?? 1,
            /* Call needs background */
            ...(isCall && {
              'content-available': 1,
              'interruption-level': 'time-sensitive',
            }),
          },
        },
      },
    };

    /* Send */
    const res = await getMessaging().sendEachForMulticast(message as any);

    /* ✅ Prune invalid tokens */
    const invalidTokens: string[] = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code || '';
        if (
          code.includes('registration-token-not-registered') ||
          code.includes('invalid-registration-token') ||
          code.includes('invalid-argument')
        ) {
          invalidTokens.push(tokens[i]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await User.updateMany(
        { fcmTokens: { $in: invalidTokens } },
        { $pull: { fcmTokens: { $in: invalidTokens } } }
      );
    }
  } catch (err) {
    console.error('[sendPush]', err);
  }
}