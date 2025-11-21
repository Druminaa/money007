// Input sanitization and validation utilities

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000) // Limit length
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 255)
}

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type)
}

export const validateFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  
  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs)
    
    if (validAttempts.length >= maxAttempts) {
      return false
    }
    
    validAttempts.push(now)
    this.attempts.set(key, validAttempts)
    return true
  }
}