import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

export default function ResendConfirmation() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm`
        }
      })

      if (error) throw error

      setSent(true)
      toast.success('Confirmation email sent! Check your inbox.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Mail className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Resend Confirmation
          </h1>
          <p className="text-gray-600">
            Enter your email to receive a new confirmation link
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleResend} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Confirmation Email'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                Confirmation email sent to <strong>{email}</strong>
              </p>
              <p className="text-green-600 text-sm mt-1">
                Check your inbox and spam folder
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}