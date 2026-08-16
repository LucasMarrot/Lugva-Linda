const CACHE_NAME = 'lugva-linda-v1';

// Assets à mettre en cache lors de l'installation
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Installation : mise en cache des assets essentiels
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch : Network First avec fallback cache
self.addEventListener('fetch', (event) => {
  // On ignore les requêtes non-GET et les requêtes vers des API externes
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorer les routes d'API Next.js et de supabase
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache les réponses réussies pour les assets statiques
        if (
          response.ok &&
          (url.pathname.startsWith('/_next/static/') ||
            url.pathname.startsWith('/icons/') ||
            url.pathname === '/manifest.json')
        ) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => {
        // Fallback vers le cache si réseau indisponible
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Pour les pages HTML, renvoyer la page d'accueil en offline
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
      }),
  );
});


/**
 * Gestionnaire d'événement `push`.
 *
 * Parse le payload JSON et affiche une notification système adaptée
 * au type de message (SESSION_REMINDER, WORD_COMPLETED, WORD_ASSIGNED).
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    console.error('[SW Push] Payload JSON invalide.');
    return;
  }

  const icon = '/icons/icon-192x192.png';
  const badge = '/icons/icon-maskable-192x192.png';

  let title = 'Lugva Linda';
  let body = '';
  let data = {};

  switch (payload.type) {
    case 'SESSION_REMINDER':
      title = 'Rappel de séance 📚';
      body = `Vous avez ${payload.exerciseCount} exercice${payload.exerciseCount > 1 ? 's' : ''} à faire aujourd'hui en ${payload.languageName}.`;
      data = { type: 'SESSION_REMINDER', languageId: payload.languageId };
      break;

    case 'WORD_COMPLETED':
      title = 'Mot complété ✅';
      body = `${payload.contributorName} a complété : ${payload.wordTerm}`;
      data = { type: 'WORD_COMPLETED', wordId: payload.wordId };
      break;

    case 'WORD_ASSIGNED':
      title = 'Nouveau mot à compléter 🖊️';
      body = `${payload.learnerName} vous demande de compléter : ${payload.wordTranslation}`;
      data = { type: 'WORD_ASSIGNED', wordId: payload.wordId };
      break;

    default:
      console.warn('[SW Push] Type de payload inconnu :', payload.type);
      return;
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data,
      // Évite d'empiler plusieurs notifications du même type
      tag: payload.type === 'SESSION_REMINDER'
        ? `session-${payload.languageId}`
        : `word-${payload.wordId ?? payload.type}`,
      renotify: true,
    }),
  );
});

/**
 * Gestionnaire d'événement `notificationclick`.
 *
 * Ferme la notification et route l'utilisateur vers la vue appropriée.
 * Si un onglet est déjà ouvert sur l'app, le focus (évite les doublons).
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { type, languageId, wordId } = event.notification.data ?? {};

  let targetPath = '/';

  switch (type) {
    case 'SESSION_REMINDER':
      targetPath = languageId ? `/review?lang=${languageId}` : '/review';
      break;
    case 'WORD_COMPLETED':
      targetPath = wordId ? `/words/${wordId}` : '/words';
      break;
    case 'WORD_ASSIGNED':
      targetPath = '/contribute';
      break;
  }

  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
