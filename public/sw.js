// Service Worker for Duka Janja - Offline Support
const CACHE_NAME = 'duka-janja-v1';
const STATIC_CACHE = 'duka-janja-static-v1';
const DYNAMIC_CACHE = 'duka-janja-dynamic-v1';
const API_CACHE = 'duka-janja-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first - for static assets
  cacheFirst: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return new Response('Offline', { status: 503 });
    }
  },

  // Network first - for API calls
  networkFirst: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  // Stale while revalidate - for API data
  staleWhileRevalidate: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });

    return cachedResponse || fetchPromise;
  },
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API calls - use stale while revalidate for GET, network first for others
    if (request.method === 'GET') {
      event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request, API_CACHE));
    } else {
      event.respondWith(CACHE_STRATEGIES.networkFirst(request, API_CACHE));
    }
  } else if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|avif|woff2|woff|ico|svg)$/)
  ) {
    // Static assets - cache first
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request, STATIC_CACHE));
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Next.js static assets - cache first
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request, STATIC_CACHE));
  } else if (url.pathname === '/' || url.pathname.startsWith('/products') || url.pathname.startsWith('/seller') || url.pathname.startsWith('/rider')) {
    // Page routes - stale while revalidate
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request, DYNAMIC_CACHE));
  } else {
    // Default - network first
    event.respondWith(CACHE_STRATEGIES.networkFirst(request, DYNAMIC_CACHE));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
  if (event.tag === 'sync-products') {
    event.waitUntil(syncProducts());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: data.actions || [],
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// Sync functions
async function syncOrders() {
  // Implementation for syncing offline orders
  const cache = await caches.open(API_CACHE);
  const requests = await cache.keys();
  for (const request of requests) {
    if (request.url.includes('/orders') && request.method !== 'GET') {
      try {
        await fetch(request);
      } catch (error) {
        console.error('Failed to sync order:', error);
      }
    }
  }
}

async function syncProducts() {
  // Implementation for syncing offline product updates
  const cache = await caches.open(API_CACHE);
  const requests = await cache.keys();
  for (const request of requests) {
    if (request.url.includes('/products') && request.method !== 'GET') {
      try {
        await fetch(request);
      } catch (error) {
        console.error('Failed to sync product:', error);
      }
    }
  }
}