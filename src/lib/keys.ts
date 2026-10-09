"use client";
import { encode } from "./z85";

 // Server will never use Web Crypto API

export async function generatePrivate({ password }: { password: string }) {
  try {
    const { privateKey, publicKey } = await crypto.subtle.generateKey({ name: "Ed25519" }, /* extractable */ true, ['sign', 'verify'])

    const rPublicKey = await crypto.subtle.exportKey("raw", publicKey); // Raw public key.

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits", "deriveKey"])
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      }, keyMaterial, { name: "AES-KW", length: 256}, false, ["wrapKey", "unwrapKey"])

    const privateWrap = await crypto.subtle.wrapKey("pkcs8", privateKey, key, "AES-KW");

    return {
      publicKey: encode(new Uint8Array(rPublicKey)),
      privateKey: encode(new Uint8Array(privateWrap)),
    }
  } catch (error) {
    return { error }
  }
}
