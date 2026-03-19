function b64ToBytes(b64) {
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function bytesToB64(bytes) {
  let raw = '';
  for (let i = 0; i < bytes.length; i += 1) raw += String.fromCharCode(bytes[i]);
  return btoa(raw);
}

export function randomSaltB64() {
  return bytesToB64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveAesKeyFromPassword(password, saltB64) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: b64ToBytes(saltB64),
      iterations: 200000,
      hash: 'SHA-256',
    },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptWithKey(plainText, cryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText || '');
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoded);
  return `enc:v2:${bytesToB64(iv)}:${bytesToB64(new Uint8Array(cipher))}`;
}

export async function decryptWithKey(payload, cryptoKey) {
  if (!payload?.startsWith?.('enc:v2:')) return payload || '';
  const [, , ivB64, dataB64] = payload.split(':');
  const iv = b64ToBytes(ivB64);
  const data = b64ToBytes(dataB64);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, data);
  return new TextDecoder().decode(plain);
}
