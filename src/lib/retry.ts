/**
 * Execute a function with exponential backoff retries.
 * Particularly useful for 503 (Service Unavailable) or 429 (Rate Limit) errors.
 */
export async function withRetry<T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Retry on 503 (Service Unavailable) or 429 (Rate Limit)
    const isRetryable = 
      error.message?.includes('503') || 
      error.message?.includes('429') ||
      error.status === 503 ||
      error.status === 429;

    if (retries > 0 && isRetryable) {
      console.warn(`Retryable error encountered, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}
