/**
 * Storefront Ops Auth Rate Limiter & Lockout Mechanism
 * Spec Step 4: Rate limit auth endpoints and add lockout after repeated failures
 */

interface AttemptRecord {
  count: number;
  lockedUntil: number | null; // Timestamp ms
  firstAttemptAt: number;
}

const ATTEMPT_STORE = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export class RateLimiter {
  /**
   * Check if a given key (IP or email) is locked out
   */
  static isLocked(key: string): { locked: boolean; remainingMinutes: number } {
    const record = ATTEMPT_STORE.get(key);
    if (!record || !record.lockedUntil) {
      return { locked: false, remainingMinutes: 0 };
    }

    const now = Date.now();
    if (now < record.lockedUntil) {
      const remainingMs = record.lockedUntil - now;
      return { locked: true, remainingMinutes: Math.ceil(remainingMs / (60 * 1000)) };
    }

    // Lockout expired, reset record
    ATTEMPT_STORE.delete(key);
    return { locked: false, remainingMinutes: 0 };
  }

  /**
   * Record a failed attempt
   */
  static recordFailure(key: string): { locked: boolean; remainingAttempts: number; remainingMinutes: number } {
    const now = Date.now();
    let record = ATTEMPT_STORE.get(key);

    if (!record || now - record.firstAttemptAt > WINDOW_DURATION_MS) {
      record = { count: 1, lockedUntil: null, firstAttemptAt: now };
      ATTEMPT_STORE.set(key, record);
      return { locked: false, remainingAttempts: MAX_ATTEMPTS - 1, remainingMinutes: 0 };
    }

    record.count += 1;

    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_DURATION_MS;
      return { locked: true, remainingAttempts: 0, remainingMinutes: 15 };
    }

    return {
      locked: false,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.count),
      remainingMinutes: 0,
    };
  }

  /**
   * Reset attempts upon successful login
   */
  static reset(key: string): void {
    ATTEMPT_STORE.delete(key);
  }
}
