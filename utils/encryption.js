// utils/encryption.js

/**
 * Encrypts a JavaScript object using the Web Crypto API.
 * @param {Object} data - The data to encrypt.
 * @param {CryptoKey} key - The symmetric key for encryption.
 * @returns {Promise<string>} - Base64-encoded ciphertext.
 */
export async function encryptData(data, key) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const encoded = encoder.encode(JSON.stringify(data));
  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encoded
  );
  // Combine IV and ciphertext
  const combined = new Uint8Array(iv.byteLength + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.byteLength);
  // Return Base64 string
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a Base64-encoded ciphertext using the Web Crypto API.
 * @param {string} b64Data - The Base64-encoded IV+ciphertext.
 * @param {CryptoKey} key - The symmetric key for decryption.
 * @returns {Promise<Object>} - The decrypted JavaScript object.
 */
export async function decryptData(b64Data, key) {
  const combined = Uint8Array.from(atob(b64Data), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const cipherBuffer = combined.slice(12).buffer;
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    cipherBuffer
  );
  const decoder = new TextDecoder();
  const json = decoder.decode(decryptedBuffer);
  return JSON.parse(json);
}

/**
 * Generates a symmetric AES-GCM key for encryption/decryption.
 * @returns {Promise<CryptoKey>}
 */
export async function generateKey() {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Exports a CryptoKey to a Base64-encoded string.
 * @param {CryptoKey} key
 * @returns {Promise<string>}
 */
export async function exportKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(raw)));
  return b64;
}

/**
 * Imports a Base64-encoded AES-GCM key.
 * @param {string} b64Key
 * @returns {Promise<CryptoKey>}
 */
export async function importKey(b64Key) {
  const raw = Uint8Array.from(atob(b64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    raw.buffer,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}
