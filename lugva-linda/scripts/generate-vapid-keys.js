/**
 * Script de génération des clés VAPID pour Web Push.
 *
 * Usage :
 *   node scripts/generate-vapid-keys.js
 *
 * Copier les valeurs générées dans votre .env :
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<PUBLIC KEY>
 *   VAPID_PRIVATE_KEY=<PRIVATE KEY>
 *
 * ⚠️  NE JAMAIS committer les clés privées dans le dépôt.
 */

const { webcrypto } = require('crypto');
const { subtle } = webcrypto;

async function generateVapidKeys() {
  const keyPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey'],
  );

  const publicKeyRaw = await subtle.exportKey('raw', keyPair.publicKey);
  const privateKeyJwk = await subtle.exportKey('jwk', keyPair.privateKey);

  const publicKeyBase64 = Buffer.from(publicKeyRaw).toString('base64url');
  const privateKeyBase64 = Buffer.from(privateKeyJwk.d, 'base64url').toString('base64url');

  console.log('\n✅  Clés VAPID générées avec succès !\n');
  console.log('Ajoutez ces lignes dans votre .env :\n');
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKeyBase64}`);
  console.log(`VAPID_PRIVATE_KEY=${privateKeyBase64}`);
  console.log('\n⚠️  Ne commitez JAMAIS VAPID_PRIVATE_KEY dans votre dépôt Git.\n');
}

generateVapidKeys().catch((err) => {
  console.error('Erreur lors de la génération :', err);
  process.exit(1);
});
