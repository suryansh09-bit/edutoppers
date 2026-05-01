import crypto from "crypto";

const ENCRYPTION_KEY = "maggikhalo";

export function decrypt(encryptedHex: string): string {
  const [ivHex, ciphertextHex] = encryptedHex.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(ciphertextHex, "hex");

  const key = Buffer.alloc(32);
  Buffer.from(ENCRYPTION_KEY).copy(key);

  const authTag = encrypted.subarray(encrypted.length - 16);
  const ciphertext = encrypted.subarray(0, encrypted.length - 16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function decryptJson<T = unknown>(encryptedHex: string): T {
  return JSON.parse(decrypt(encryptedHex));
}
