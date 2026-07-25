// Duka Janja Enterprise Service Worker (PWA)
const CACHE_VERSION = "2026-07-25";
const STATIC_CACHE = `duka-janja-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `duka-janja-images-${CACHE_VERSION}`;
const FONT_CACHE = `duka-janja-fonts-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  "/",
  "/favicon.ico",
  "/manifest.json",
  "/offline.html" // Dedicated offline fallback page
];

// Step 8: Handle Failed Installs with Promise.allSettled
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.allSettled(
        ASSETS_TO_CACHE.map(async (asset) => {
          try {
            const response = await fetch(asset);
            if (response.ok) {
              await cache.put(asset, response);
            }
          } catch (err) {
            console.warn(`[ServiceWorker] Failed to optional-cache asset: ${asset}`, err);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

// Step 9: Better Activate Cleanup (Targeting only duka-janja prefixes)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith("duka-janja-") && ![STATIC_CACHE, IMAGE_CACHE, FONT_CACHE].includes(key))
          .map((key) => {
            console.log(`[ServiceWorker] Removing legacy cache: ${key}`);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Step 5: Skip Cross-Origin Requests (e.g., Supabase, external APIs, payment gateways)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Step 6: Ignore Non-GET Requests (POST, PUT, PATCH, DELETE)
  if (event.request.method !== "GET") {
    return;
  }

  // Step 1 & 16: Exclude dynamic routes, auth, APIs, checkout, payments, and admin portals from caching
  const excludedPaths = ["/api/", "/auth/", "/storage/", "/payments/", "/login", "/register", "/checkout", "/admin", "/seller", "/rider"];
  if (excludedPaths.some((path) => url.pathname.startsWith(path))) {
    return;
  }

  // Step 11: Navigation Requests (HTML Pages / Product Pages) -> Network First with Offline Fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(STATIC_CACHE);
          const cachedNavigate = await cache.match(event.request);
          if (cachedNavigate) return cachedNavigate;
          
          // Fallback to offline page
          const offlinePage = await cache.match("/offline.html");
          return offlinePage || new Response("Network error and offline page missing.", { status: 503, headers: { "Content-Type": "text/plain" } });
        })
    );
    return;
  }

  // Step 4 & 7: Stale While Revalidate for Images (Product Thumbnails & Avatars)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Step 10: Cache Fonts (Cache First Strategy)
  if (url.pathname.match(/\.(woff|woff2|ttf|otf)$/) || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;

        const networkResponse = await fetch(event.request);
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      })
    );
    return;
  }

  // Default Strategy for Static Assets (Cache First)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch((err) => {
        console.warn("[ServiceWorker] Fetch failed for static asset:", event.request.url, err);
      });
    })
  );
});
