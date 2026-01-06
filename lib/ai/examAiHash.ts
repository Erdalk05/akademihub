import crypto from 'crypto';

/**
 * Analytics hash (SHA-256)
 * Amaç: aynı input için tekrar AI çağrısı yapılmasın.
 */
export function computeAnalyticsHash(input: unknown): string {
  const json = JSON.stringify(input ?? null);
  return crypto.createHash('sha256').update(json).digest('hex');
}


