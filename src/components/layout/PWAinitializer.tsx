'use client';

import { useEffect } from 'react';

/**
 * The service worker was removed. It served navigations cache-first, so after
 * each deploy the browser could be handed a stale app shell referencing
 * content-hashed chunks that no longer existed, leaving the site on a blank
 * screen indefinitely.
 *
 * This component stays only to clean up leftovers: it unregisters any worker
 * installed by an earlier version and purges its caches, once per browser.
 */
export default function PWAInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let cancelled = false;

    (async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));

        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((name) => name.startsWith('duka-janja'))
              .map((name) => caches.delete(name))
          );
        }
      } catch {
        // Cleanup is best-effort; never block render on it.
      }
    })();

    return () => {
      cancelled = true;
      void cancelled;
    };
  }, []);

  return null;
}