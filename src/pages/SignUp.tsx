import { useState, FormEvent, ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, XCircle } from 'lucide-react'
import { validatePassword, sanitizeInput, validateEmail } from '../utils/validation'
import { rateLimiter, RATE_LIMITS } from '../utils/rateLimiter'

interface FormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

interface Errors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

export default function SignUp() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{ valid: boolean; errors: string[] }>({ valid: false, errors: [] })
  
  const { signup } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const validateForm = (): Errors => {
    const newErrors: Errors = {}

    // Validate and sanitize full name
    const sanitizedName = sanitizeInput(formData.fullName)
    if (!sanitizedName) {
      newErrors.fullName = 'Full name is required'
    } else if (sanitizedName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    } else if (sanitizedName.length > 100) {
      newErrors.fullName = 'Full name must be less than 100 characters'
    }

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Validate password with strong requirements
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.errors[0]
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    return newErrors
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const newErrors = validateForm()
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Rate limiting
    const rateLimitKey = `signup:${formData.email}`
    if (rateLimiter.isRateLimited(rateLimitKey, RATE_LIMITS.SIGNUP)) {
      toast.error('Too many signup attempts. Please try again later.')
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const result = await signup(formData.email, formData.password)
      console.log('Signup result:', result)
      
      if (result?.user) {
        if (result.user.email_confirmed_at) {
          toast.success('Account created successfully!')
          navigate('/dashboard')
        } else {
          toast.success('Account created! Please check your email for confirmation.')
          navigate('/confirm')
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      let errorMessage = error.message || 'Failed to create account'
      
      // Handle specific error for existing unconfirmed user
      if (error.message?.includes('User already registered')) {
        errorMessage = 'Email already exists. Check your email for confirmation or resend it.'
        toast.error(errorMessage)
        navigate('/resend-confirmation')
        return
      }
      
      toast.error(errorMessage)
      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Sanitize input for name and email fields
    const sanitizedValue = (name === 'fullName' || name === 'email') ? sanitizeInput(value) : value
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }))
    
    // Update password strength indicator
    if (name === 'password') {
      setPasswordStrength(validatePassword(sanitizedValue))
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof Errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Join us to manage your finances</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
                required
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
                required
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  {passwordStrength.valid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={passwordStrength.valid ? 'text-green-600' : 'text-red-600'}>
                    {passwordStrength.valid ? 'Strong password' : 'Weak password'}
                  </span>
                </div>
                {!passwordStrength.valid && passwordStrength.errors.length > 0 && (
                  <ul className="text-xs text-gray-600 ml-6 space-y-0.5">
                    {passwordStrength.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          {errors.general && (
            <div className="text-red-600 text-sm text-center">{errors.general}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
          <p className="text-sm text-gray-500">
            Didn't receive confirmation email?{' '}
            <Link
              to="/resend-confirmation"
              className="text-primary-600 hover:text-primary-700 transition-colors"
            >
              Resend
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}