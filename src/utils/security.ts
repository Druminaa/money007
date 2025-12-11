// Enhanced security utilities
import DOMPurify from 'dompurify'

// Rate limiting for API calls
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  isAllowed(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(key, validRequests)
    return true
  }
}

// Input sanitization with strict rules
export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })
}

// SQL injection prevention for search queries
export const sanitizeSearchQuery = (query: string): string => {
  return query
    .replace(/['"`;\\]/g, '') // Remove dangerous SQL characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 100) // Limit length
}

// Validate file uploads (for avatar)
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }
  
  return { valid: true }
}

// Prevent XSS in dynamic content
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Validate and sanitize URLs
export const sanitizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return ''
    }
    return urlObj.toString()
  } catch {
    return ''
  }
}

// Generate secure random tokens
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Validate phone numbers
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Content Security Policy headers (for reference)
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://oespmnkmdzhigvbyxyyk.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'"
  ].join('; ')
}