// Hybrid Encryption Service using Web Crypto API
// RSA-OAEP-256 (2048-bit key) for Key Exchange
// AES-GCM-256 for Data Encryption

let clientKeyPair: CryptoKeyPair | null = null;
let serverPublicKey: CryptoKey | null = null;

// 1. Initialize Client Keys (RSA 2048)
export const initClientKeys = async (): Promise<JsonWebKey> => {
  if (clientKeyPair) return await exportPublicKey(clientKeyPair.publicKey);

  clientKeyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  return await exportPublicKey(clientKeyPair.publicKey);
};

export const setServerPublicKey = async (jwk: JsonWebKey) => {
  serverPublicKey = await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
};

// Helper: Export Key
const exportPublicKey = async (key: CryptoKey): Promise<JsonWebKey> => {
  return await window.crypto.subtle.exportKey("jwk", key);
};

// Helper: Generate AES Key
const generateAesKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

// --- UTILS ---

export const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// --- HYBRID ENCRYPTION (Data -> AES -> RSA Envelope) ---

export const encryptPayload = async (data: any): Promise<{ key: string, iv: string, data: string }> => {
  if (!serverPublicKey) throw new Error("Server Public Key not set");

  // 1. Generate ephemeral AES key
  const aesKey = await generateAesKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 2. Encrypt Data with AES
  const encodedData = new TextEncoder().encode(JSON.stringify(data));
  const encryptedDataBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    encodedData
  );

  // 3. Export AES key (raw)
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // 4. Encrypt AES Key with Server RSA Public Key
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    serverPublicKey,
    rawAesKey
  );

  return {
    key: arrayBufferToBase64(encryptedKeyBuffer),
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(encryptedDataBuffer)
  };
};

// --- HYBRID DECRYPTION (RSA Envelope -> AES -> Data) ---

export const decryptPayload = async (payload: { key: string, iv: string, data: string }): Promise<any> => {
  if (!clientKeyPair) throw new Error("Client Keys not initialized");

  try {
    // 1. Decrypt AES Key with Client RSA Private Key
    const encryptedKey = base64ToArrayBuffer(payload.key);
    const rawAesKey = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      clientKeyPair.privateKey,
      encryptedKey
    );

    // 2. Import AES Key
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      rawAesKey,
      { name: "AES-GCM" },
      true,
      ["decrypt"]
    );

    // 3. Decrypt Data
    const iv = base64ToArrayBuffer(payload.iv);
    const encryptedData = base64ToArrayBuffer(payload.data);
    const decryptedDataBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      encryptedData
    );

    const decryptedString = new TextDecoder().decode(decryptedDataBuffer);
    return JSON.parse(decryptedString);
  } catch (e) {
    console.error("Decryption failed", e);
    throw new Error("Failed to decrypt server response");
  }
};