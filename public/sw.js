// Service Worker for AS Academy PWA and Push Notifications

// Lifecycle: Install & Activate immediately
self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

// Fetch handler required by Chromium for PWA installability criteria
self.addEventListener('fetch', function(event) {
    // Only handle GET requests for http/https schemes
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request);
        })
    );
});

// Push Notification Handler
self.addEventListener('push', function(event) {
    if (event.data) {
        try {
            const payload = event.data.json();
            const options = {
                body: payload.body || 'New update from AS Academy',
                icon: '/icons/icon-192x192.png',
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
            event.waitUntil(
                self.registration.showNotification('AS Academy Alert', {
                    body: event.data.text(),
                    icon: '/icons/icon-192x192.png'
                })
            );
        }
    }
});

// Notification Click Handler
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    const courseId = event.notification.data?.courseId;
    let targetUrl = '/';
    if (courseId) {
        targetUrl = `/courses/${courseId}`;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
