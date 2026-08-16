/**
 * Utilitaires client pour la gestion des souscriptions Web Push.
 *
 * Ce module est destiné à être exécuté UNIQUEMENT dans le navigateur.
 * Ne pas l'importer dans des Server Components ou Server Actions.
 */

import { VAPID_PUBLIC_KEY } from '@/lib/push/vapid';
import type { SerializedPushSubscription } from '@/types/notifications';

/**
 * Convertit une clé VAPID base64url en Uint8Array,
 * format attendu par PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/**
 * Récupère la registration Service Worker active.
 * Retourne null si le SW n'est pas enregistré ou non supporté.
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Retourne la souscription push active pour l'appareil courant,
 * ou null si l'utilisateur n'est pas souscrit.
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return null;
  try {
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Souscrit l'appareil courant aux notifications push via VAPID.
 *
 * Pré-conditions :
 * - Le Service Worker doit être enregistré.
 * - `Notification.permission` doit être 'granted'.
 * - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` doit être définie.
 *
 * @throws Error si la souscription échoue (permission refusée, SW absent, etc.)
 */
export async function subscribeToPush(): Promise<PushSubscription> {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY manquante.');
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    throw new Error('[Push] Aucun Service Worker enregistré.');
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
  });
}

/**
 * Désabonne l'appareil courant des notifications push.
 * Retourne true si le désabonnement a réussi, false sinon.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  const sub = await getCurrentPushSubscription();
  if (!sub) return true;
  return sub.unsubscribe();
}

/**
 * Sérialise un objet PushSubscription en POJO envoyable au serveur.
 * Extrait endpoint, p256dh et auth en strings base64url.
 */
export function serializePushSubscription(
  sub: PushSubscription,
): SerializedPushSubscription {
  const key = sub.getKey('p256dh');
  const auth = sub.getKey('auth');

  if (!key || !auth) {
    throw new Error('[Push] Clés de souscription manquantes (p256dh / auth).');
  }

  return {
    endpoint: sub.endpoint,
    p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
    auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
    userAgent: navigator.userAgent.slice(0, 512),
  };
}

/**
 * Vérifie si l'appareil supporte les Web Push Notifications.
 * Tient compte de la contrainte iOS (PWA installée uniquement).
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}
