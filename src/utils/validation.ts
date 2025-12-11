import DOMPurify from 'dompurify'

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [] })
}

// Password validation
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) errors.push('Password must be at least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number')
  if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain at least one special character (!@#$%^&*)')
  
  return { valid: errors.length === 0, errors }
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Amount validation with enhanced security
export const validateAmount = (amount: string | number): { valid: boolean; value: number; error?: string } => {
  // Convert to string and sanitize
  const amountStr = typeof amount === 'number' ? amount.toString() : sanitizeInput(amount.toString())
  
  // Remove any non-numeric characters except decimal point
  const cleanAmount = amountStr.replace(/[^0-9.-]/g, '')
  
  const numAmount = parseFloat(cleanAmount)
  
  if (isNaN(numAmount)) return { valid: false, value: 0, error: 'Invalid amount' }
  if (numAmount <= 0) return { valid: false, value: 0, error: 'Amount must be greater than 0' }
  if (numAmount > 999999999) return { valid: false, value: 0, error: 'Amount too large' }
  
  // Validate decimal format (max 2 decimal places)
  if (!/^\d+(\.\d{1,2})?$/.test(cleanAmount)) {
    return { valid: false, value: 0, error: 'Invalid decimal format (max 2 decimal places)' }
  }
  
  // Round to 2 decimal places to prevent floating point issues
  const roundedAmount = Math.round(numAmount * 100) / 100
  
  return { valid: true, value: roundedAmount }
}

// Date validation
export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date)
  return dateObj instanceof Date && !isNaN(dateObj.getTime())
}

// Description validation
export const validateDescription = (description: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(description)
  
  if (sanitized.length === 0) return { valid: false, error: 'Description is required' }
  if (sanitized.length > 200) return { valid: false, error: 'Description too long (max 200 characters)' }
  
  return { valid: true }
}

// Category validation
export const validateCategory = (category: string): boolean => {
  const sanitized = sanitizeInput(category)
  return sanitized.length > 0 && sanitized.length <= 50
}
