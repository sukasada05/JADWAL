// ============================================================
// SERVICE WORKER - DUKOPS BABINSA
// ============================================================
const CACHE_NAME = 'dukops-v1';
const urlsToCache = [
    '/dukops4/',
    '/dukops4/index.html',
    '/dukops4/app.js',
    '/dukops4/css/main.css',
    '/dukops4/site.webmanifest',
    '/dukops4/army.gif',
    '/dukops4/icons/favicon.ico',
    '/dukops4/icons/favicon-96x96.png',
    '/dukops4/icons/apple-touch-icon.png'
];

// Install Service Worker
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('📦 Cache opened');
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                console.log('✅ All resources cached');
                return self.skipWaiting();
            })
            .catch(function(error) {
                console.error('❌ Cache failed:', error);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            console.log('✅ Service Worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch with network-first strategy (fallback to cache)
self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // Clone response untuk cache
                var responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(function(cache) {
                        cache.put(event.request, responseToCache);
                    })
                    .catch(function(err) {
                        console.log('⚠️ Cache put error:', err);
                    });
                return response;
            })
            .catch(function() {
                // Jika network gagal, coba dari cache
                return caches.match(event.request)
                    .then(function(response) {
                        if (response) {
                            return response;
                        }
                        // Jika tidak ada di cache, return fallback
                        return new Response('Offline - DUKOPS', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Push notification handler
self.addEventListener('push', function(event) {
    var data = event.data ? event.data.json() : {};
    var title = data.title || 'DUKOPS BABINSA';
    var options = {
        body: data.body || 'Ada notifikasi baru',
        icon: '/dukops4/icons/favicon-96x96.png',
        badge: '/dukops4/icons/favicon-96x96.png',
        vibrate: [200, 100, 200]
    };
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(function(clientList) {
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/dukops4/');
                }
            })
    );
});