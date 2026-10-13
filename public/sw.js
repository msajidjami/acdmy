/* ============================================================
   ILMORA786 Service Worker
   - Push notifications
   - Sound
   - Badge management
   ============================================================ */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* ============================================================
   PUSH — notification آئی
   ============================================================ */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'ILMORA786', body: 'New message' };
  }

  const title = data.title || 'ILMORA786';
  const body = data.body || 'New message';
  const url = data.url || '/';
  const tag = data.tag || `ilmora-${Date.now()}`;
  const sound = data.sound !== false;
  const badgeCount = typeof data.badge === 'number' ? data.badge : null;
  const kind = data.kind || 'message'; // 'message' | 'call'

  const options = {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag,
    renotify: true,
    requireInteraction: kind === 'call',
    vibrate: kind === 'call' ? [400, 200, 400, 200, 400] : [200, 100, 200],
    silent: !sound,
    data: { url, kind, badgeCount },
    actions:
      kind === 'call'
        ? [
            { action: 'open', title: 'Join' },
            { action: 'dismiss', title: 'Dismiss' },
          ]
        : [{ action: 'open', title: 'Open' }],
  };

  /* Badge on app icon */
  if (badgeCount !== null && 'setAppBadge' in navigator) {
    event.waitUntil(
      (async () => {
        try {
          if (badgeCount > 0) {
            await navigator.setAppBadge(badgeCount);
          } else {
            await navigator.clearAppBadge();
          }
        } catch {}
      })()
    );
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ============================================================
   NOTIFICATION CLICK
   ============================================================ */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      /* اگر کوئی tab پہلے سے کھلی ہے تو اسی میں focus کریں */
      for (const c of clients) {
        if (c.url.includes(self.location.origin)) {
          try {
            await c.focus();
            c.postMessage({ type: 'NAVIGATE', url });
            return;
          } catch {}
        }
      }

      /* نئی window کھولیں */
      if (self.clients.openWindow) {
        await self.clients.openWindow(url);
      }
    })()
  );
});

/* ============================================================
   MESSAGE FROM CLIENT — badge/notification manipulation
   ============================================================ */
self.addEventListener('message', (event) => {
  const msg = event.data || {};

  /* Background → badge set */
  if (msg.type === 'SET_BADGE') {
    const count = Number(msg.count) || 0;
    if ('setAppBadge' in navigator) {
      if (count > 0) navigator.setAppBadge(count).catch(() => {});
      else navigator.clearAppBadge().catch(() => {});
    }
  }

  /* Client → show local notification (foreground) */
  if (msg.type === 'SHOW_NOTIFICATION') {
    const data = msg.data || {};
    self.registration.showNotification(data.title || 'ILMORA786', {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: data.tag || `ilmora-${Date.now()}`,
      vibrate: data.kind === 'call' ? [400, 200, 400] : [200, 100, 200],
      requireInteraction: data.kind === 'call',
      silent: false,
      data: { url: data.url || '/', kind: data.kind || 'message' },
    });
  }
});