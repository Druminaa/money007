import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthSession = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })
        
        if (error) {
          toast.error('Invalid reset link')
          navigate('/forgot-password')
        }
      } else {
        toast.error('Invalid reset link')
        navigate('/forgot-password')
      }
    }
    
    handleAuthSession()
  }, [searchParams, navigate, toast])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password updated successfully!')
        navigate('/login')
      }
    } catch (error: any) {
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter new password"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Confirm new password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}