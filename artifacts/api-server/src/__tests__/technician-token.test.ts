/**
 * Unit tests for technician bearer-token logic (src/lib/techToken.ts).
 * Run with: pnpm --filter @workspace/api-server test
 *
 * Covers: token generation, valid verification, forgery, tampered HMACs,
 * short HMAC (length-guard path), expired tokens, and missing inputs.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { generateTechToken, verifyTechToken, TOKEN_MAX_AGE_MS } from "../lib/techToken";

const TEST_SECRET = "test-secret-for-unit-tests-only";

// Ensure tests use a known secret regardless of environment
process.env.SESSION_SECRET = TEST_SECRET;

// ── generateTechToken ─────────────────────────────────────────────────────────

describe("generateTechToken", () => {
  test("returns a token with correct tech-{id} prefix", () => {
    const token = generateTechToken(42);
    assert.ok(token.startsWith("tech-42-"), `Expected 'tech-42-' prefix, got: ${token}`);
  });

  test("token has exactly 4 dash-separated parts: tech, id, timestamp, hmac", () => {
    const token = generateTechToken(7);
    const firstDash = token.indexOf("-");
    const secondDash = token.indexOf("-", firstDash + 1);
    const thirdDash = token.indexOf("-", secondDash + 1);
    assert.ok(thirdDash > 0, "Token should have at least 4 dash-separated parts");
    const hmacPart = token.slice(thirdDash + 1);
    assert.equal(hmacPart.length, 64, `HMAC should be 64 hex chars, got ${hmacPart.length}`);
  });

  test("two calls at different times produce different tokens", (_, done) => {
    const t1 = generateTechToken(1);
    setTimeout(() => {
      const t2 = generateTechToken(1);
      assert.notEqual(t1, t2, "Tokens at different times must differ");
      done();
    }, 2);
  });
});

// ── verifyTechToken — valid tokens ────────────────────────────────────────────

describe("verifyTechToken — valid tokens", () => {
  test("accepts a freshly generated token and returns the correct technician ID", () => {
    const techId = 5;
    const token = generateTechToken(techId);
    const result = verifyTechToken(`Bearer ${token}`);
    assert.equal(result, techId);
  });

  test("accepts technician ID 1 (minimum valid ID)", () => {
    const token = generateTechToken(1);
    assert.equal(verifyTechToken(`Bearer ${token}`), 1);
  });

  test("accepts a large technician ID", () => {
    const token = generateTechToken(99999);
    assert.equal(verifyTechToken(`Bearer ${token}`), 99999);
  });
});

// ── verifyTechToken — invalid inputs ─────────────────────────────────────────

describe("verifyTechToken — invalid inputs", () => {
  test("returns null for undefined authorization header", () => {
    assert.equal(verifyTechToken(undefined), null);
  });

  test("returns null for empty string", () => {
    assert.equal(verifyTechToken(""), null);
  });

  test("returns null when Bearer prefix is missing", () => {
    const token = generateTechToken(1);
    assert.equal(verifyTechToken(token), null);
  });

  test("returns null for old-style forgeable token (3 parts, no HMAC)", () => {
    assert.equal(verifyTechToken("Bearer tech-1-1234567890"), null);
  });

  test("returns null for wrong prefix (user- instead of tech-)", () => {
    assert.equal(verifyTechToken("Bearer user-1-1234567890-abc123"), null);
  });

  test("returns null for tampered HMAC (flipped last hex character)", () => {
    const token = generateTechToken(3);
    const flipped = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    assert.equal(verifyTechToken(`Bearer ${flipped}`), null);
  });

  test("returns null for short HMAC (triggers length-mismatch guard, not timingSafeEqual)", () => {
    const ts = Date.now();
    const shortHmac = "deadbeef";
    const fakeToken = `tech-1-${ts}-${shortHmac}`;
    assert.equal(verifyTechToken(`Bearer ${fakeToken}`), null);
  });

  test("returns null for HMAC signed with a different secret", () => {
    const ts = Date.now();
    const payload = `tech-1-${ts}`;
    const wrongHmac = crypto.createHmac("sha256", "wrong-secret").update(payload).digest("hex");
    const token = `${payload}-${wrongHmac}`;
    assert.equal(verifyTechToken(`Bearer ${token}`), null);
  });

  test("returns null for future-dated token (negative age)", () => {
    const futureTs = Date.now() + 60_000;
    const payload = `tech-1-${futureTs}`;
    const hmac = crypto.createHmac("sha256", TEST_SECRET).update(payload).digest("hex");
    const token = `${payload}-${hmac}`;
    assert.equal(verifyTechToken(`Bearer ${token}`), null);
  });

  test("returns null for expired token (age > TOKEN_MAX_AGE_MS)", () => {
    const expiredTs = Date.now() - (TOKEN_MAX_AGE_MS + 1000);
    const payload = `tech-1-${expiredTs}`;
    const hmac = crypto.createHmac("sha256", TEST_SECRET).update(payload).digest("hex");
    const token = `${payload}-${hmac}`;
    assert.equal(verifyTechToken(`Bearer ${token}`), null);
  });

  test("TOKEN_MAX_AGE_MS is exactly 30 days in milliseconds", () => {
    assert.equal(TOKEN_MAX_AGE_MS, 30 * 24 * 60 * 60 * 1000);
  });
});
