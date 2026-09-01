// Service Worker for PWA Web Push Notifications
self.addEventListener('push', function(event) {
    if (event.data) {
        try {
            const payload = event.data.json();
            const options = {
                body: payload.body || 'New update from AS Academy',
                icon: '/logo.jpg', // Use logo
                badge: '/favicon.ico',
                data: payload.data || {},
                vibrate: [100, 50, 100],
                actions: [
                    { action: 'open', title: 'Open App' }
                ]
            };
            event.waitUntil(
                self.registration.showNotification(payload.title || 'AS Academy Alert', options)
            );
        } catch (e) {
            console.error('Push data parse error:', e);
            // Fallback plain text notification
            event.waitUntil(
                self.registration.showNotification('AS Academy Alert', {
                    body: event.data.text(),
                    icon: '/logo.jpg'
                })
            );
        }
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    const courseId = event.notification.data?.courseId;
    const type = event.notification.data?.type;

    let targetUrl = '/';
    if (courseId) {
        targetUrl = `/courses/${courseId}`;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // If already open, focus it
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new tab/window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
