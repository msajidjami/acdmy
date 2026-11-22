
import { getMessaging } from "firebase-admin/messaging";
import type { MulticastMessage } from "firebase-admin/messaging";

import "@/app/lib/firebaseAdmin";

import User from "@/models/User";
import connectDB from "@/app/lib/dbConnect";

type PushType = "message" | "call" | "incoming_call" | "system";

type SendOpts = {
  toUserId: string | string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  type?: PushType;
  ring?: boolean;
  setBadge?: number;
};

const FCM_BATCH_SIZE = 500;

function uniqueStrings(values: unknown[]): string[] {
  return [
    ...new Set(
      values
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0
        )
        .map((value) => value.trim())
    ),
  ];
}

function isInvalidTokenError(code?: string): boolean {
  if (!code) return false;

  return (
    code === "messaging/invalid-registration-token" ||
    code === "messaging/registration-token-not-registered"
  );
}

function getBatches<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }

  return batches;
}

function normalizeData(
  data?: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};

  if (!data) return result;

  for (const [key, value] of Object.entries(data)) {
    if (
      typeof key === "string" &&
      typeof value === "string"
    ) {
      result[key] = value;
    }
  }

  return result;
}

export async function sendPush(opts: SendOpts): Promise<void> {
  try {
    // 1. Validate input

    if (!opts?.toUserId || !opts.title || !opts.body) {
      console.warn("[sendPush] Missing required notification data");
      return;
    }

    const userIds = Array.isArray(opts.toUserId)
      ? opts.toUserId
      : [opts.toUserId];

    const validUserIds = uniqueStrings(userIds);

    if (validUserIds.length === 0) return;

    // 2. Database connection

    await connectDB();

    // 3. Get FCM tokens

    const users = await User.find({
      _id: { $in: validUserIds },
    })
      .select("fcmTokens")
      .lean();

    const allTokens: string[] = [];

    for (const user of users) {
      const tokens = Array.isArray(user.fcmTokens)
        ? user.fcmTokens
        : [];

      allTokens.push(...tokens);
    }

    const tokens = uniqueStrings(allTokens);

    if (tokens.length === 0) {
      console.info("[sendPush] No registered FCM devices");
      return;
    }

    // 4. Notification type

    const isCall =
      opts.type === "call" ||
      opts.type === "incoming_call" ||
      opts.ring === true;

    const notificationType: PushType =
      opts.type === "incoming_call"
        ? "incoming_call"
        : isCall
          ? "call"
          : opts.type || "system";

    // 5. Prepare data payload

    const data = {
      ...normalizeData(opts.data),
      type: notificationType,
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    };

    // 6. Prepare FCM message

    const message: Omit<MulticastMessage, "tokens"> = {
      notification: {
        title: opts.title,
        body: opts.body,
      },

      data,

      android: {
        priority: isCall ? "high" : "normal",

        notification: {
          channelId: isCall
            ? "calls_channel"
            : "messages_channel",

          sound: isCall ? "ringtone" : "default",

          ...(typeof opts.setBadge === "number" && {
            notificationCount: Math.max(
              0,
              Math.floor(opts.setBadge)
            ),
          }),

          ...(isCall && {
            defaultVibrateTimings: false,
            vibrateTimingsMillis: [
              0,
              1000,
              500,
              1000,
              500,
              1000,
            ],
          }),
        },
      },

      apns: {
        headers: {
          "apns-priority": isCall ? "10" : "5",
          "apns-push-type": "alert",
        },

        payload: {
          aps: {
            alert: {
              title: opts.title,
              body: opts.body,
            },

            sound: isCall
              ? "ringtone.caf"
              : "default",

            ...(typeof opts.setBadge === "number" && {
              badge: Math.max(
                0,
                Math.floor(opts.setBadge)
              ),
            }),

            ...(isCall && {
              contentAvailable: true,
              interruptionLevel: "time-sensitive" as const,
            }),
          },
        },
      },
    };

    // 7. Send in batches (FCM maximum = 500)

    const batches = getBatches(tokens, FCM_BATCH_SIZE);

    const invalidTokens: string[] = [];

    let totalSuccess = 0;
    let totalFailure = 0;

    const messaging = getMessaging();

    for (const batch of batches) {
      const response = await messaging.sendEachForMulticast({
        ...message,
        tokens: batch,
      });

      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      // 8. Find invalid tokens

      response.responses.forEach((result, index) => {
        if (!result.success) {
          const code = result.error?.code;

          if (isInvalidTokenError(code)) {
            invalidTokens.push(batch[index]);
          } else {
            console.error(
              "[sendPush] FCM delivery error:",
              code,
              result.error?.message
            );
          }
        }
      });
    }

    // 9. Remove only invalid tokens

    const tokensToRemove = uniqueStrings(invalidTokens);

    if (tokensToRemove.length > 0) {
      await User.updateMany(
        {
          fcmTokens: { $in: tokensToRemove },
        },
        {
          $pull: {
            fcmTokens: {
              $in: tokensToRemove,
            },
          },
        }
      );
    }

    // 10. Result logging

    console.info("[sendPush] Completed", {
      type: notificationType,
      totalTokens: tokens.length,
      sent: totalSuccess,
      failed: totalFailure,
      removedInvalidTokens: tokensToRemove.length,
    });
  } catch (error) {
    // Push failure must never break chat/call APIs.
    console.error("[sendPush] Notification error:", error);
  }
}

// Compatibility alias for existing imports.
export const sendNotification = sendPush;

export default sendPush;
