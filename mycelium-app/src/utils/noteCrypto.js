const MASTER_KEY_PREFIX = 'anima.masterkey.';

function toB64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromB64(b64) {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function deriveKey(master) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(master), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('anima-note-salt-v1'), iterations: 120000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function isEncryptedPayload(value) {
  return typeof value === 'string' && value.startsWith('enc:v1:');
}

export function getOrCreateLocalMasterKey(userId) {
  if (!userId) return null;
  const key = `${MASTER_KEY_PREFIX}${userId}`;
  let v = localStorage.getItem(key);
  if (!v) {
    const raw = crypto.getRandomValues(new Uint8Array(32));
    v = toB64(raw);
    localStorage.setItem(key, v);
  }
  return v;
}

export async function encryptNoteText(plainText, userId) {
  const master = getOrCreateLocalMasterKey(userId);
  if (!master || !plainText) return plainText;
  const key = await deriveKey(master);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return `enc:v1:${toB64(iv)}:${toB64(new Uint8Array(cipher))}`;
}

export async function decryptNoteText(payload, userId) {
  if (!isEncryptedPayload(payload)) return payload;
  const master = getOrCreateLocalMasterKey(userId);
  if (!master) throw new Error('Clé locale absente');
  const key = await deriveKey(master);
  const [, , ivB64, cipherB64] = payload.split(':');
  const iv = fromB64(ivB64);
  const cipher = fromB64(cipherB64);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return new TextDecoder().decode(plain);
}
