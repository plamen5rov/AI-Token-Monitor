// SERVER-ONLY: do not import this file into client components.

import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT = "atm-salt-v1"

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) {
    console.warn(
      "WARNING: ENCRYPTION_KEY is not set. Using a default key — API keys will NOT be secure."
    )
  }
  return crypto.scryptSync(raw || "atm-default-key-change-me", SALT, 32)
}

export function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(":")
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted text format")
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, "hex")
  )
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"))
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8")
}
