import { Logger } from './logger.js';

export interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  maxBackoffMs?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  logger?: Logger
): Promise<T> {
  const {
    maxAttempts,
    backoffMs,
    maxBackoffMs = 60000,
    shouldRetry = () => true,
    onRetry,
  } = config;

  let lastError: Error = new Error('No attempts made');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }

      const delay = Math.min(backoffMs * Math.pow(2, attempt - 1), maxBackoffMs);

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      logger?.warn(`Retry attempt ${attempt}/${maxAttempts}`, {
        error: lastError.message,
        nextRetryIn: delay,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Pre-configured retry settings for different services
export const ANTHROPIC_RETRY: RetryConfig = {
  maxAttempts: 3,
  backoffMs: 5000,
  shouldRetry: (error) => {
    const msg = error.message.toLowerCase();
    return msg.includes('rate limit') || msg.includes('timeout') || msg.includes('overloaded');
  },
};

export const RESEND_RETRY: RetryConfig = {
  maxAttempts: 3,
  backoffMs: 2000,
  shouldRetry: (error) => {
    const msg = error.message.toLowerCase();
    return msg.includes('rate limit') || msg.includes('timeout') || msg.includes('5');
  },
};

export const SUPABASE_RETRY: RetryConfig = {
  maxAttempts: 3,
  backoffMs: 1000,
  shouldRetry: (error) => {
    return !error.message.includes('constraint') && !error.message.includes('unique');
  },
};
