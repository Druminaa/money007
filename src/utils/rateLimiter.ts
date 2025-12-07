// Simple client-side rate limiter
interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

class RateLimiter {
  private attempts: Map<string, number[]> = new Map()

  isRateLimited(key: string, config: RateLimitConfig): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < config.windowMs)
    
    if (recentAttempts.length >= config.maxAttempts) {
      return true
    }
    
    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)
    return false
  }

  getRemainingTime(key: string, config: RateLimitConfig): number {
    const attempts = this.attempts.get(key) || []
    if (attempts.length === 0) return 0
    
    const oldestAttempt = attempts[0]
    const timeElapsed = Date.now() - oldestAttempt
    return Math.max(0, config.windowMs - timeElapsed)
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

// Rate limit configurations
export const RATE_LIMITS = {
  LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  SIGNUP: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  PASSWORD_RESET: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
}
