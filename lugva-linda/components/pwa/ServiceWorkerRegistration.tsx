'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker:', error);
        });
    }
  }, []);

  return null;
}
