import crypto from "crypto";

export const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return secret;
}

/**
 * Generate a HMAC-SHA256 signed bearer token.
 * Format: tech-{id}-{timestamp}-{hmac64hex}
 */
export function generateTechToken(technicianId: number): string {
  const timestamp = Date.now();
  const payload = `tech-${technicianId}-${timestamp}`;
  const hmac = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}-${hmac}`;
}

/**
 * Verify a signed bearer token and return the technicianId, or null if invalid.
 * Rejects: missing/malformed tokens, bad HMAC signatures, expired tokens (> 30 days),
 * future-dated tokens (negative age).
 */
export function verifyTechToken(authHeader: string | undefined): number | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  // Format: tech-{id}-{timestamp}-{hmac64hex}
  const firstDash = token.indexOf("-");
  const secondDash = token.indexOf("-", firstDash + 1);
  const thirdDash = token.indexOf("-", secondDash + 1);
  if (firstDash < 0 || secondDash < 0 || thirdDash < 0) return null;

  const prefix = token.slice(0, firstDash);
  if (prefix !== "tech") return null;

  const id = parseInt(token.slice(firstDash + 1, secondDash), 10);
  const timestamp = token.slice(secondDash + 1, thirdDash);
  const providedHmac = token.slice(thirdDash + 1);

  const ts = parseInt(timestamp, 10);
  if (isNaN(id) || isNaN(ts) || !providedHmac) return null;

  // Reject tokens older than 30 days or from the future
  const age = Date.now() - ts;
  if (age < 0 || age > TOKEN_MAX_AGE_MS) return null;

  const payload = `tech-${id}-${timestamp}`;
  let expectedHmac: string;
  try {
    expectedHmac = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  } catch {
    return null;
  }

  // Guard length mismatch before timingSafeEqual (throws if buffers differ in length)
  if (providedHmac.length !== expectedHmac.length) return null;

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(providedHmac, "utf8"), Buffer.from(expectedHmac, "utf8"))) return null;

  return id;
}
