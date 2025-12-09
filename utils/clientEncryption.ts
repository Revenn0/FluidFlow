/**
 * Client-side encryption utilities for sensitive data like API keys.
 * Uses Web Crypto API with AES-GCM for authenticated encryption.
 *
 * Security notes:
 * - This provides defense-in-depth, not complete XSS protection
 * - Keys are encrypted at rest in localStorage
 * - The encryption key is derived from a stored secret + domain binding
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const SECRET_KEY = 'fluidflow_encryption_secret';
const ENCRYPTED_PREFIX = 'encrypted:';

// Cache the derived key
let cachedKey: CryptoKey | null = null;
let cachedSecret: string | null = null;

/**
 * Gets or creates a secret for key derivation.
 * The secret is stored in localStorage and combined with the origin for domain binding.
 */
function getOrCreateSecret(): string {
  if (cachedSecret) {
    return cachedSecret;
  }

  try {
    let secret = localStorage.getItem(SECRET_KEY);
    if (!secret) {
      // Generate a random secret
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      secret = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(SECRET_KEY, secret);
    }
    cachedSecret = secret;
    return secret;
  } catch {
    // Fallback for environments without localStorage
    return 'fallback-secret-for-ephemeral-session';
  }
}

/**
 * Derives an encryption key from the secret using PBKDF2.
 */
async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  // Combine secret with origin for domain binding
  const combined = secret + window.location.origin;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(combined),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string value.
 * Returns format: "encrypted:<salt>:<iv>:<ciphertext>" (all base64 encoded)
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) {
    return plaintext;
  }

  // Don't double-encrypt
  if (plaintext.startsWith(ENCRYPTED_PREFIX)) {
    return plaintext;
  }

  try {
    const secret = getOrCreateSecret();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const key = await deriveKey(secret, salt);
    const encoder = new TextEncoder();

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoder.encode(plaintext)
    );

    // Encode as base64
    const saltB64 = btoa(String.fromCharCode(...salt));
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ciphertextB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

    return `${ENCRYPTED_PREFIX}${saltB64}:${ivB64}:${ciphertextB64}`;
  } catch (error) {
    console.error('[Encryption] Client-side encryption failed:', error);
    // Return plaintext on failure (graceful degradation)
    return plaintext;
  }
}

/**
 * Decrypts an encrypted string.
 * Handles both encrypted (prefixed) and plaintext values for backwards compatibility.
 */
export async function decrypt(encryptedValue: string): Promise<string> {
  if (!encryptedValue) {
    return encryptedValue;
  }

  // If not encrypted (legacy plaintext), return as-is
  if (!encryptedValue.startsWith(ENCRYPTED_PREFIX)) {
    return encryptedValue;
  }

  try {
    const secret = getOrCreateSecret();

    // Parse the encrypted format
    const parts = encryptedValue.slice(ENCRYPTED_PREFIX.length).split(':');
    if (parts.length !== 3) {
      console.error('[Encryption] Invalid encrypted format');
      return '';
    }

    const [saltB64, ivB64, ciphertextB64] = parts;

    // Decode from base64
    const salt = new Uint8Array(atob(saltB64).split('').map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(ivB64).split('').map(c => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(ciphertextB64).split('').map(c => c.charCodeAt(0)));

    const key = await deriveKey(secret, salt);
    const decoder = new TextDecoder();

    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    return decoder.decode(plaintext);
  } catch (error) {
    console.error('[Encryption] Client-side decryption failed:', error);
    return '';
  }
}

/**
 * Checks if a value is encrypted.
 */
export function isEncrypted(value: string): boolean {
  return value?.startsWith(ENCRYPTED_PREFIX) ?? false;
}

/**
 * Encrypts the apiKey field in a provider config.
 */
export async function encryptApiKey<T extends { apiKey?: string }>(
  config: T
): Promise<T> {
  if (!config.apiKey) {
    return config;
  }

  return {
    ...config,
    apiKey: await encrypt(config.apiKey),
  };
}

/**
 * Decrypts the apiKey field in a provider config.
 */
export async function decryptApiKey<T extends { apiKey?: string }>(
  config: T
): Promise<T> {
  if (!config.apiKey) {
    return config;
  }

  return {
    ...config,
    apiKey: await decrypt(config.apiKey),
  };
}

/**
 * Encrypts API keys in an array of provider configs.
 */
export async function encryptProviderConfigs<T extends { apiKey?: string }>(
  configs: T[]
): Promise<T[]> {
  return Promise.all(configs.map(config => encryptApiKey(config)));
}

/**
 * Decrypts API keys in an array of provider configs.
 */
export async function decryptProviderConfigs<T extends { apiKey?: string }>(
  configs: T[]
): Promise<T[]> {
  return Promise.all(configs.map(config => decryptApiKey(config)));
}
