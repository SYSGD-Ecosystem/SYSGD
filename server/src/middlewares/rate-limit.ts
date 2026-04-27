import type { NextFunction, Request, Response } from "express";
import { getClientIp } from "../utils/ip";

type RateLimitConfig = {
	keyPrefix: string;
	windowMs: number;
	maxRequests: number;
};

type Bucket = {
	count: number;
	windowStart: number;
};

const buckets = new Map<string, Bucket>();
let lastCleanupAt = 0;

const maybeCleanupBuckets = (now: number, maxWindowMs: number) => {
	// Cleanup opportunistically to keep memory bounded without background jobs.
	if (now - lastCleanupAt < 60_000) return;

	lastCleanupAt = now;
	const staleThreshold = now - maxWindowMs * 2;

	for (const [key, bucket] of buckets.entries()) {
		if (bucket.windowStart < staleThreshold) {
			buckets.delete(key);
		}
	}
};

export function createIpRateLimit(config: RateLimitConfig) {
	return (req: Request, res: Response, next: NextFunction) => {
		const now = Date.now();
		const ip = getClientIp(req) || "unknown";
		const key = `${config.keyPrefix}:${ip}`;
		const existing = buckets.get(key);

		maybeCleanupBuckets(now, config.windowMs);

		if (!existing || now - existing.windowStart >= config.windowMs) {
			buckets.set(key, { count: 1, windowStart: now });
			next();
			return;
		}

		if (existing.count >= config.maxRequests) {
			const retryAfterSeconds = Math.ceil(
				(config.windowMs - (now - existing.windowStart)) / 1000,
			);
			res.setHeader("Retry-After", retryAfterSeconds.toString());
			res.status(429).json({
				error: "Demasiados intentos de registro desde esta IP",
				message: "Intenta nuevamente en unos minutos.",
				retryAfterSeconds,
			});
			return;
		}

		existing.count += 1;
		buckets.set(key, existing);
		next();
	};
}

const registerWindowMinutes = Number(
	process.env.REGISTER_RATE_LIMIT_WINDOW_MINUTES || "15",
);
const registerMaxRequests = Number(
	process.env.REGISTER_RATE_LIMIT_MAX_REQUESTS || "5",
);

export const registerIpRateLimit = createIpRateLimit({
	keyPrefix: "register",
	windowMs: Math.max(registerWindowMinutes, 1) * 60_000,
	maxRequests: Math.max(registerMaxRequests, 1),
});
