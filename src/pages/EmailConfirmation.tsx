import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function EmailConfirmation() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (type === 'signup' && token) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          })

          if (error) throw error

          setStatus('success')
          setMessage('Email confirmed successfully! You can now login.')
          
          // Redirect to login after 3 seconds
          setTimeout(() => navigate('/login'), 3000)
        } catch (error: any) {
          setStatus('error')
          setMessage(error.message || 'Failed to confirm email')
        }
      } else {
        setStatus('error')
        setMessage('Invalid confirmation link')
      }
    }

    handleEmailConfirmation()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center"
      >
        {status === 'loading' && (
          <>
            <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirming Email...</h1>
            <p className="text-gray-600">Please wait while we verify your email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Confirmed!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirmation Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}