/**
 * Clé publique VAPID exposée côté client (préfixe NEXT_PUBLIC_).
 *
 * La clé VAPID publique est nécessaire dans le navigateur pour appeler
 * PushManager.subscribe(). Elle est sans danger à exposer publiquement.
 *
 * La clé privée VAPID ne doit JAMAIS se retrouver côté client.
 * Elle est lue uniquement dans lib/push/push-service.ts via env.VAPID_PRIVATE_KEY.
 */
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
