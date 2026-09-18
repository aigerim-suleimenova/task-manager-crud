/**
 * Unsalted SHA-256 digest of a password, hex-encoded. Not a real password
 * hashing scheme (no bcrypt/scrypt/Argon2, no salt) — see design.md's
 * Risks/Trade-offs: this app has no backend, and hashing provides no real
 * protection here regardless of algorithm, since anyone with the localStorage
 * access needed to read this hash already has equivalent access to everything
 * it would protect. This exists purely so a casual glance at devtools doesn't
 * show a plaintext password string.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
