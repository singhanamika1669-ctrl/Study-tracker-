/* Service Worker Extension for Background Alarm & Reminder Notifications */

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SHOW_ALARM_NOTIFICATION') {
    const title = data.title || 'Study Tracker Alarm';
    const body = data.body || 'Padhai / PT ka samay ho gaya hai!';
    const tag = data.tag || 'study-tracker-alarm';
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag,
        renotify: true,
        requireInteraction: true,
        vibrate: [500, 150, 500, 150, 700],
        data: {url: '/'},
        actions: [
          {action: 'open', title: 'Open Study Tracker'},
          {action: 'dismiss', title: 'Dismiss'},
        ],
      }),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({type: 'window', includeUncontrolled: true}).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
      return undefined;
    }),
  );
});
