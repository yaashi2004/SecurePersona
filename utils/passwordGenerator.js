// utils/passwordGenerator.js

/**
 * Generates a strong password based on options.
 * @param {number} length - Desired password length.
 * @param {boolean} includeNumbers - Whether to include numeric characters.
 * @param {boolean} includeSymbols - Whether to include symbol characters.
 * @returns {string} - The generated password.
 */
export function generatePassword(length = 12, includeNumbers = true, includeSymbols = true) {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let charset = letters;
  if (includeNumbers) charset += numbers;
  if (includeSymbols) charset += symbols;

  let password = '';
  const array = new Uint32Array(length);
  if (window.crypto && crypto.getRandomValues) {
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      const index = array[i] % charset.length;
      password += charset.charAt(index);
    }
  } else {
    // Fallback to Math.random if crypto not available
    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * charset.length);
      password += charset.charAt(index);
    }
  }

  return password;
}
