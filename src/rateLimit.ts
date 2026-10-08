import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/** Shape of the authenticated user your auth middleware attaches to the request. */
export interface AuthContext {
  userId: string;
  isPremium?: boolean;
  isAdmin?: boolean;
}

type AuthedRequest = Request & { auth?: AuthContext };

const body = (message: string, code?: string) => ({
  success: false,
  message,
  ...(code && { code }),
});

/** Broad abuse protection: 100 requests / minute per IP. */
export const globalRateLimit = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: body('Too many requests. Please try again in a minute.'),
});

/**
 * Limiter for endpoints that call a paid LLM API.
 *
 * - Keyed by authenticated user id (falls back to IP), so rotating IPs
 *   doesn't bypass it.
 * - Higher ceiling for paying users, but never unlimited: an unbounded tier
 *   would turn one hijacked account into an unbounded API bill.
 * - Only admins skip it.
 */
export const llmRateLimit = rateLimit({
  windowMs: 60_000,
  max: (req) => ((req as AuthedRequest).auth?.isPremium === true ? 30 : 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => (req as AuthedRequest).auth?.userId ?? req.ip ?? 'anonymous',
  skip: (req) => (req as AuthedRequest).auth?.isAdmin === true,
  message: body('Per-minute limit reached. Please wait a moment.', 'LLM_RATE_LIMIT'),
});

/** Brute-force protection for login-style endpoints: 5 attempts / minute per IP. */
export const authRateLimit = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: body('Too many attempts. Please try again in a minute.'),
});
