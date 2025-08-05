// utils/encryption.js - Basic encryption utilities

class SecurePersonaEncryption {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }

  // Generate a random key for encryption
  async generateKey() {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Derive key from password
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.algorithm,
        length: this.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt data
  async encrypt(data, key) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: iv
      },
      key,
      encoder.encode(JSON.stringify(data))
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  // Decrypt data
  async decrypt(encryptedData, key) {
    const decoder = new TextDecoder();
    const iv = new Uint8Array(encryptedData.iv);
    const data = new Uint8Array(encryptedData.data);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.algorithm,
        iv: iv
      },
      key,
      data
    );

    return JSON.parse(decoder.decode(decrypted));
  }

  // Simple obfuscation for less sensitive data (not cryptographically secure)
  obfuscate(data) {
    return btoa(encodeURIComponent(JSON.stringify(data)));
  }

  // Deobfuscate data
  deobfuscate(obfuscatedData) {
    try {
      return JSON.parse(decodeURIComponent(atob(obfuscatedData)));
    } catch (error) {
      console.error('Deobfuscation error:', error);
      return null;
    }
  }
}

// For now, we'll use simple obfuscation since implementing full encryption
// requires user password management which is beyond the scope of this demo
window.SecurePersonaEncryption = SecurePersonaEncryption;

// Helper function for the options page
async function encryptSensitiveData(data) {
  const encryption = new SecurePersonaEncryption();
  
  // For demo purposes, we'll obfuscate credit card data
  const sensitiveFields = ['cardNumber', 'cvv', 'expiryDate'];
  const processedData = { ...data };
  
  for (const field of sensitiveFields) {
    if (processedData[field]) {
      processedData[field] = encryption.obfuscate(processedData[field]);
    }
  }
  
  return processedData;
}

// Helper function to decrypt sensitive data
async function decryptSensitiveData(data) {
  const encryption = new SecurePersonaEncryption();
  
  const sensitiveFields = ['cardNumber', 'cvv', 'expiryDate'];
  const processedData = { ...data };
  
  for (const field of sensitiveFields) {
    if (processedData[field]) {
      const decrypted = encryption.deobfuscate(processedData[field]);
      if (decrypted) {
        processedData[field] = decrypted;
      }
    }
  }
  
  return processedData;
}