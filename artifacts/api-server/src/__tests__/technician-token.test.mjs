/**
 * Unit tests for technician auth token logic (techToken.ts).
 * Run with: node --test src/__tests__/technician-token.test.mjs
 *
 * These tests cover: token generation, valid verification, forged tokens,
 * tampered HMACs, expired tokens, and missing/malformed inputs.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// ── Inline implementation (mirrors techToken.ts) so tests run without TS transpile ──

const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const TEST_SECRET = "test-secret-for-unit-tests-only";

function getSecret() {
  return process.env.SESSION_SECRET ?? TEST_SECRET;
}

function generateTechToken(technicianId) {
  const timestamp = Date.now();
  const payload = `tech-${technicianId}-${timestamp}`;
  const hmac = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}-${hmac}`;
}

function verifyTechToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
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
  const age = Date.now() - ts;
  if (age < 0 || age > TOKEN_MAX_AGE_MS) return null;
  const payload = `tech-${id}-${timestamp}`;
  const expectedHmac = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  if (providedHmac.length !== expectedHmac.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(providedHmac, "utf8"), Buffer.from(expectedHmac, "utf8"))) return null;
  return id;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("generateTechToken", () => {
  test("returns a token with tech prefix", () => {
    const token = generateTechToken(42);
    assert.ok(token.startsWith("tech-42-"), `Expected 'tech-42-', got: ${token}`);
  });

  test("token has exactly 4 dash-separated parts: tech, id, timestamp, hmac", () => {
    const token = generateTechToken(7);
    // tech-{id}-{ts}-{hmac} → at least 4 parts when split by first 3 dashes
    const firstDash = token.indexOf("-");
    const secondDash = token.indexOf("-", firstDash + 1);
    const thirdDash = token.indexOf("-", secondDash + 1);
    assert.ok(thirdDash > 0, "Should have at least 4 dash-separated parts");
    const hmacPart = token.slice(thirdDash + 1);
    assert.equal(hmacPart.length, 64, `HMAC should be 64 hex chars, got ${hmacPart.length}`);
  });
});

describe("verifyTechToken - valid tokens", () => {
  test("accepts a fresh, correctly signed token", () => {
    const techId = 5;
    const token = generateTechToken(techId);
    const result = verifyTechToken(`Bearer ${token}`);
    assert.equal(result, techId);
  });

  test("accepts technician ID 1 (minimum valid ID)", () => {
    const token = generateTechToken(1);
    assert.equal(verifyTechToken(`Bearer ${token}`), 1);
  });
});

describe("verifyTechToken - invalid inputs", () => {
  test("returns null for undefined header", () => {
    assert.equal(verifyTechToken(undefined), null);
  });

  test("returns null for empty string", () => {
    assert.equal(verifyTechToken(""), null);
  });

  test("returns null when Bearer prefix is missing", () => {
    const token = generateTechToken(1);
    assert.equal(verifyTechToken(token), null);
  });

  test("returns null for old-style forgeable token (no HMAC)", () => {
    assert.equal(verifyTechToken("Bearer tech-1-1234567890"), null);
  });

  test("returns null for wrong prefix", () => {
    assert.equal(verifyTechToken("Bearer user-1-1234567890-abc123"), null);
  });

  test("returns null for tampered HMAC (flipped hex character)", () => {
    const token = generateTechToken(3);
    const flipped = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    assert.equal(verifyTechToken(`Bearer ${flipped}`), null);
  });

  test("returns null for short HMAC (length mismatch guard)", () => {
    const ts = Date.now();
    const shortHmac = "deadbeef";
    const fakeToken = `tech-1-${ts}-${shortHmac}`;
    assert.equal(verifyTechToken(`Bearer ${fakeToken}`), null);
  });

  test("returns null for future-dated token (negative age)", () => {
    const futureTs = Date.now() + 60_000;
    const payload = `tech-1-${futureTs}`;
    const hmac = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
    const token = `${payload}-${hmac}`;
    assert.equal(verifyTechToken(`Bearer ${token}`), null);
  });

  test("returns null for expired token (age > 30 days)", () => {
    const expiredTs = Date.now() - (31 * 24 * 60 * 60 * 1000);
    const payload = `tech-1-${expiredTs}`;
    const hmac = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
    const token = `${payload}-${hmac}`;
    assert.equal(verifyTechToken(`Bearer ${token}`), null);
  });
});
