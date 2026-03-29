import { AppError } from './error-handler';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  record.count++;
  rateLimitMap.set(key, record);

  if (record.count > limit) {
    throw new AppError('Too many requests, please retry later', 429);
  }
};
