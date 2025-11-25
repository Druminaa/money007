import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import { useToast } from '../context/ToastContext'
import { useSettings, useProfile } from '../hooks/useSupabase'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'
import { useAuth } from '../context/AuthContext'
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  QrCode,
  Copy,
  Check,
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  UserX
} from 'lucide-react'
import { sanitizeInput, validatePhone, validateFileType, validateFileSize, sanitizeFileName } from '../utils/security'
import { usePreferences } from '../context/PreferencesContext'
import { notificationService } from '../services/notificationService'

export default function Settings() {
  const { toast } = useToast()
  const { settings, updateSettings } = useSettings()
  const { profile, updateProfile } = useProfile()
  const { updatePreferences } = usePreferences()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    location: '',
    date_of_birth: '',
    bio: '',
    avatar_url: ''
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [preferences, setPreferences] = useState({
    currency: 'INR',
    language: 'en',
    date_format: 'dd-mm-yyyy',
    email_notifications: true,
    push_notifications: true,
    budget_alerts: true,
    goal_reminders: true,
    weekly_reports: false
  })

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        date_of_birth: profile.date_of_birth || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      })
    }
  }, [profile])

  useEffect(() => {
    if (settings) {
      setPreferences({
        currency: settings.currency,
        language: settings.language,
        date_format: settings.date_format,
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        budget_alerts: settings.budget_alerts,
        goal_reminders: settings.goal_reminders,
        weekly_reports: settings.weekly_reports
      })
      setSecurity(prev => ({
        ...prev,
        twoFactorAuth: settings.two_factor_auth,
        loginAlerts: settings.login_alerts
      }))
    }
  }, [settings])

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorAuth: false,
    loginAlerts: true
  })
  
  const [twoFactorSetup, setTwoFactorSetup] = useState({
    showSetup: false,
    qrCode: '',
    secret: Math.random().toString(36).substring(2, 18).toUpperCase(),
    verificationCode: '',
    isVerified: false
  })
  
  const { user } = useAuth()
  
  const generateQRCode = async () => {
    try {
      const appName = 'Money Manager'
      const userEmail = user?.email || 'user@example.com'
      const otpAuthUrl = `otpauth://totp/${appName}:${userEmail}?secret=${twoFactorSetup.secret}&issuer=${appName}`
      const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl)
      setTwoFactorSetup(prev => ({ ...prev, qrCode: qrCodeDataUrl }))
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
    }
  }
  
  useEffect(() => {
    if (twoFactorSetup.showSetup && !twoFactorSetup.qrCode) {
      generateQRCode()
    }
  }, [twoFactorSetup.showSetup, twoFactorSetup.qrCode])
  
  const [copied, setCopied] = useState(false)

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validateFileType(file, allowedTypes)) {
        toast.error('Please select a valid image file (JPEG, PNG, WebP)')
        return
      }
      
      // Validate file size (5MB limit)
      if (!validateFileSize(file, 5)) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null

    setUploadingAvatar(true)
    try {
      const fileExt = avatarFile.name.split('.').pop()
      const sanitizedFileName = sanitizeFileName(`avatar-${user.id}.${fileExt}`)

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(sanitizedFileName, avatarFile, {
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(sanitizedFileName)

      return publicUrl
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      toast.error(`Upload failed: ${error.message}`)
      return null
    } finally {
      setUploadingAvatar(false)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'preferences', name: 'Preferences', icon: Palette },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'account', name: 'Account', icon: UserX }
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      if (activeTab === 'profile') {
        // Validate and sanitize profile data
        const sanitizedName = sanitizeInput(profileData.full_name)
        if (!sanitizedName) {
          toast.error('Full name is required')
          setSaving(false)
          return
        }
        
        if (!validatePhone(profileData.phone)) {
          toast.error('Please enter a valid phone number')
          setSaving(false)
          return
        }
        
        const sanitizedLocation = sanitizeInput(profileData.location)
        if (!sanitizedLocation) {
          toast.error('Location is required')
          setSaving(false)
          return
        }
        
        if (!profileData.date_of_birth) {
          toast.error('Date of birth is required')
          setSaving(false)
          return
        }
        
        const sanitizedBio = sanitizeInput(profileData.bio)
        if (!sanitizedBio) {
          toast.error('Bio is required')
          setSaving(false)
          return
        }
        
        if (sanitizedBio.length > 500) {
          toast.error('Bio must be less than 500 characters')
          setSaving(false)
          return
        }
        
        let updatedProfileData = { 
          ...profileData,
          full_name: sanitizedName,
          location: sanitizedLocation,
          bio: sanitizedBio
        }
        
        // Upload avatar if a new one is selected
        if (avatarFile) {
          const avatarUrl = await uploadAvatar()
          if (avatarUrl) {
            updatedProfileData.avatar_url = avatarUrl
            setAvatarFile(null)
            setAvatarPreview(null)
          }
        }
        
        console.log('Saving profile data:', updatedProfileData)
        console.log('User ID:', user?.id)
        
        // Call updateProfile with proper error handling
        try {
          const result = await updateProfile(updatedProfileData)
          console.log('Profile save result:', result)
          

          
          // The updateProfile function already shows success toast, so we don't need to show it again
        } catch (profileError) {
          console.error('Profile update error:', profileError)
          throw profileError
        }
        
      } else if (activeTab === 'preferences' || activeTab === 'notifications') {
        console.log('Saving preferences:', preferences)
        try {
          const result = await updateSettings(preferences)
          console.log('Settings save result:', result)
          
          // Update notification service with new settings
          await notificationService.updateSettings(preferences)
          
          // The updateSettings function already shows success toast
        } catch (settingsError) {
          console.error('Settings update error:', settingsError)
          throw settingsError
        }
        
      } else if (activeTab === 'security') {
        if (security.newPassword && security.newPassword !== security.confirmPassword) {
          toast.error('New passwords do not match')
          setSaving(false)
          return
        }
        if (security.newPassword && security.newPassword.length < 6) {
          toast.error('Password must be at least 6 characters long')
          setSaving(false)
          return
        }
        
        // Update security settings
        try {
          const result = await updateSettings({
            two_factor_auth: security.twoFactorAuth,
            login_alerts: security.loginAlerts
          })
          
          // Handle password change if provided
          if (security.newPassword && security.currentPassword) {
            const { error } = await supabase.auth.updateUser({
              password: security.newPassword
            })
            
            if (error) {
              toast.error('Failed to update password: ' + error.message)
              setSaving(false)
              return
            }
            
            toast.success('Password updated successfully!')
            setSecurity({
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
              twoFactorAuth: security.twoFactorAuth,
              loginAlerts: security.loginAlerts
            })
          }
        } catch (securityError) {
          console.error('Security update error:', securityError)
          throw securityError
        }
      }
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error('Failed to save changes: ' + (error.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.text('Money Manager - User Data Export', 20, 20)
      
      // Add export date
      doc.setFontSize(12)
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 35)
      
      // Add profile data
      doc.setFontSize(16)
      doc.text('Profile Information', 20, 55)
      doc.setFontSize(12)
      doc.text(`Name: ${profileData.full_name || 'N/A'}`, 20, 70)
      doc.text(`Email: ${user?.email || 'N/A'}`, 20, 80)
      doc.text(`Phone: ${profileData.phone || 'N/A'}`, 20, 90)
      doc.text(`Location: ${profileData.location || 'N/A'}`, 20, 100)
      doc.text(`Date of Birth: ${profileData.date_of_birth || 'N/A'}`, 20, 110)
      doc.text(`Bio: ${profileData.bio || 'N/A'}`, 20, 120)
      
      // Add preferences
      doc.setFontSize(16)
      doc.text('App Preferences', 20, 140)
      doc.setFontSize(12)
      doc.text(`Currency: ${preferences.currency}`, 20, 155)
      doc.text(`Language: ${preferences.language}`, 20, 165)
      doc.text(`Date Format: ${preferences.date_format}`, 20, 175)
      
      // Save PDF
      doc.save(`money-manager-data-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported successfully!')
    } catch (error) {
      toast.error('Failed to export PDF')
    }
  }

  const handleExportCSV = async () => {
    try {
      const csvData = [
        ['Field', 'Value'],
        ['Export Date', new Date().toLocaleDateString()],
        ['Full Name', profileData.full_name || 'N/A'],
        ['Email', user?.email || 'N/A'],
        ['Phone', profileData.phone || 'N/A'],
        ['Location', profileData.location || 'N/A'],
        ['Date of Birth', profileData.date_of_birth || 'N/A'],
        ['Bio', profileData.bio || 'N/A'],
        ['Currency', preferences.currency],
        ['Language', preferences.language],
        ['Date Format', preferences.date_format],
        ['Email Notifications', preferences.email_notifications ? 'Yes' : 'No'],
        ['Push Notifications', preferences.push_notifications ? 'Yes' : 'No'],
        ['Budget Alerts', preferences.budget_alerts ? 'Yes' : 'No'],
        ['Goal Reminders', preferences.goal_reminders ? 'Yes' : 'No'],
        ['Weekly Reports', preferences.weekly_reports ? 'Yes' : 'No']
      ]
      
      const csvContent = csvData.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `money-manager-data-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('CSV exported successfully!')
    } catch (error) {
      toast.error('Failed to export CSV')
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // In a real app, this would call a backend endpoint to handle account deletion
        // For now, we'll just show a confirmation message
        toast.error('Account deletion feature is not implemented yet. Please contact support.')
      } catch (error) {
        toast.error('Failed to delete account')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Sidebar />
      <Sidebar isMobile={true} />
      
      <div className="lg:ml-20 transition-all duration-300">
        <div className="p-6 lg:p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 to-pink-400/10 rounded-3xl"></div>
          <div className="relative z-10">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-pink-600 rounded-xl">
                  <SettingsIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
                  <p className="text-gray-600">Manage your account and app preferences</p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Sidebar Tabs */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-1"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <nav className="space-y-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            activeTab === tab.id
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{tab.name}</span>
                        </button>
                      )
                    })}
                  </nav>
                </div>
              </motion.div>

              {/* Content Area */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-3"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
                  
                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                      
                      {/* Enhanced Profile Photo Section */}
                      <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 p-6 bg-gradient-to-r from-indigo-50 to-pink-50 rounded-2xl border border-indigo-100">
                        <div className="relative group">
                          <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-white">
                            {avatarPreview || profileData.avatar_url ? (
                              <img
                                src={avatarPreview || profileData.avatar_url}
                                alt="Profile"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                                {profileData.full_name ? profileData.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                              </div>
                            )}
                            
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <Camera className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          
                          {/* Camera button */}
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-full p-3 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
                          >
                            <Camera className="w-5 h-5" />
                          </button>
                          
                          {/* Hidden file input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarSelect}
                            className="hidden"
                          />
                        </div>
                        
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">{profileData.full_name || 'User'}</h3>
                          <p className="text-gray-600 mb-4">Customize your profile information</p>
                          
                          {/* Avatar actions */}
                          {(avatarPreview || avatarFile) && (
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                              <button
                                onClick={removeAvatar}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              >
                                <X className="w-4 h-4" />
                                <span>Remove</span>
                              </button>
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                              >
                                <Upload className="w-4 h-4" />
                                <span>Change</span>
                              </button>
                            </div>
                          )}
                          
                          {!avatarPreview && !profileData.avatar_url && (
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-lg hover:from-indigo-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                <ImageIcon className="w-5 h-5" />
                                <span>Upload Photo</span>
                              </button>
                            </div>
                          )}
                          
                          {uploadingAvatar && (
                            <div className="mt-3 flex items-center justify-center md:justify-start space-x-2 text-indigo-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                              <span className="text-sm">Uploading...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={profileData.full_name}
                              onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                              type="email"
                              value={user?.email || 'user@example.com'}
                              disabled
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={profileData.location}
                              onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                              type="date"
                              value={profileData.date_of_birth}
                              onChange={(e) => setProfileData({...profileData, date_of_birth: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio *</label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Tell us about yourself..."
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Preferences Tab */}
                  {activeTab === 'preferences' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-800">App Preferences</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                          <select
                            value={preferences.currency}
                            onChange={async (e) => {
                              const newCurrency = e.target.value
                              setPreferences({...preferences, currency: newCurrency})
                              try {
                                await updatePreferences({ currency: newCurrency })
                              } catch (error) {
                                toast.error('Failed to update currency preference')
                              }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="INR">Indian Rupee (₹)</option>
                            <option value="USD">US Dollar ($)</option>
                            <option value="EUR">Euro (€)</option>
                            <option value="GBP">British Pound (£)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                          <select
                            value={preferences.language}
                            onChange={async (e) => {
                              const newLanguage = e.target.value
                              setPreferences({...preferences, language: newLanguage})
                              try {
                                await updatePreferences({ language: newLanguage })
                              } catch (error) {
                                toast.error('Failed to update language preference')
                              }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="en">English</option>
                            <option value="hi">Hindi (हिंदी)</option>
                            <option value="gu">Gujarati (ગુજરાતી)</option>
                            <option value="mr">Marathi (मराठी)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                          <select
                            value={preferences.date_format}
                            onChange={async (e) => {
                              const newDateFormat = e.target.value
                              setPreferences({...preferences, date_format: newDateFormat})
                              try {
                                await updatePreferences({ dateFormat: newDateFormat })
                              } catch (error) {
                                toast.error('Failed to update date format preference')
                              }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="dd-mm-yyyy">DD-MM-YYYY</option>
                            <option value="mm-dd-yyyy">MM-DD-YYYY</option>
                            <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                          </select>
                        </div>


                      </div>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === 'notifications' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-800">Notification Settings</h2>
                      
                      <div className="space-y-4">
                        {[
                          { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                          { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive push notifications on your device' },
                          { key: 'budget_alerts', label: 'Budget Alerts', desc: 'Get alerts when you exceed budget limits' },
                          { key: 'goal_reminders', label: 'Goal Reminders', desc: 'Reminders about your financial goals' },
                          { key: 'weekly_reports', label: 'Weekly Reports', desc: 'Weekly summary of your financial activity' }
                        ].map(({ key, label, desc }) => (
                          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h3 className="font-medium text-gray-800">{label}</h3>
                              <p className="text-sm text-gray-600">{desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={preferences[key as keyof typeof preferences] as boolean}
                                onChange={async (e) => {
                                  const newValue = e.target.checked
                                  setPreferences({
                                    ...preferences,
                                    [key]: newValue
                                  })
                                  
                                  // Update notification service settings
                                  await notificationService.updateSettings({
                                    [key]: newValue
                                  } as any)
                                  
                                  // Show test notification for push notifications
                                  if (key === 'push_notifications' && newValue) {
                                    setTimeout(() => {
                                      notificationService.sendTransactionNotification('income', 1000, 'Test')
                                    }, 1000)
                                  }
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Security Tab */}
                  {activeTab === 'security' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-800">Security Settings</h2>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                              <div className="relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={security.currentPassword}
                                  onChange={(e) => setSecurity({...security, currentPassword: e.target.value})}
                                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                              <input
                                type="password"
                                value={security.newPassword}
                                onChange={(e) => setSecurity({...security, newPassword: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                              <input
                                type="password"
                                value={security.confirmPassword}
                                onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-medium text-gray-800">Two-Factor Authentication</h3>
                                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={security.twoFactorAuth}
                                  onChange={(e) => {
                                    setSecurity({...security, twoFactorAuth: e.target.checked})
                                    if (e.target.checked && !twoFactorSetup.isVerified) {
                                      setTwoFactorSetup({...twoFactorSetup, showSetup: true})
                                    }
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>
                            
                            {security.twoFactorAuth && twoFactorSetup.showSetup && (
                              <div className="mt-4 p-4 bg-white rounded-lg border">
                                <h4 className="font-medium text-gray-800 mb-3">Setup Two-Factor Authentication</h4>
                                
                                <div className="space-y-4">
                                  <div className="text-sm text-gray-600">
                                    <p className="mb-2">1. Install an authenticator app like Google Authenticator or Authy</p>
                                    <p className="mb-2">2. Scan the QR code below or enter the secret key manually</p>
                                    <p>3. Enter the 6-digit code from your authenticator app</p>
                                  </div>
                                  
                                  <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 text-center">
                                        {twoFactorSetup.qrCode ? (
                                          <img 
                                            src={twoFactorSetup.qrCode} 
                                            alt="QR Code" 
                                            className="w-32 h-32 mx-auto mb-2"
                                          />
                                        ) : (
                                          <QrCode className="w-32 h-32 mx-auto text-gray-400 mb-2" />
                                        )}
                                        <p className="text-sm text-gray-500">QR Code</p>
                                        <p className="text-xs text-gray-400 mt-1">Scan with authenticator app</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 space-y-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                                        <div className="flex">
                                          <input
                                            type="text"
                                            value={twoFactorSetup.secret}
                                            readOnly
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm font-mono"
                                          />
                                          <button
                                            onClick={async () => {
                                              try {
                                                await navigator.clipboard.writeText(twoFactorSetup.secret)
                                                setCopied(true)
                                                setTimeout(() => setCopied(false), 2000)
                                              } catch (error) {
                                                toast.error('Failed to copy to clipboard')
                                              }
                                            }}
                                            className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-300 transition-colors"
                                          >
                                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                          </button>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                                        <input
                                          type="text"
                                          value={twoFactorSetup.verificationCode}
                                          onChange={(e) => setTwoFactorSetup({...twoFactorSetup, verificationCode: e.target.value})}
                                          placeholder="Enter 6-digit code"
                                          maxLength={6}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-mono text-lg"
                                        />
                                      </div>
                                      
                                      <button
                                        onClick={() => {
                                          try {
                                            if (twoFactorSetup.verificationCode.length === 6) {
                                              setTwoFactorSetup({...twoFactorSetup, isVerified: true, showSetup: false})
                                              toast.success('Two-factor authentication enabled successfully!')
                                            } else {
                                              toast.error('Please enter a valid 6-digit code')
                                            }
                                          } catch (error) {
                                            toast.error('Failed to enable two-factor authentication')
                                          }
                                        }}
                                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                                      >
                                        Verify & Enable
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {security.twoFactorAuth && twoFactorSetup.isVerified && (
                              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center">
                                  <Check className="w-5 h-5 text-green-600 mr-2" />
                                  <span className="text-sm text-green-800 font-medium">Two-factor authentication is enabled</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setSecurity({...security, twoFactorAuth: false})
                                    setTwoFactorSetup({...twoFactorSetup, isVerified: false, showSetup: false})
                                    toast.success('Two-factor authentication disabled')
                                  }}
                                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                                >
                                  Disable 2FA
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h3 className="font-medium text-gray-800">Login Alerts</h3>
                              <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={security.loginAlerts}
                                onChange={(e) => setSecurity({...security, loginAlerts: e.target.checked})}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Account Tab */}
                  {activeTab === 'account' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-800">Account Management</h2>
                      
                      <div className="space-y-6">
                        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                          <h3 className="text-lg font-semibold text-blue-800 mb-2">Export Your Data</h3>
                          <p className="text-blue-700 mb-4">Download your complete database including profile, settings, transactions, and financial data.</p>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={handleExportPDF}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Export as PDF</span>
                            </button>
                            <button
                              onClick={handleExportCSV}
                              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                            >
                              <Download className="w-4 h-4" />
                              <span>Export as CSV</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                          <h3 className="text-lg font-semibold text-red-800 mb-2">Delete Account</h3>
                          <p className="text-red-700 mb-4">Permanently delete your account and all associated data. We recommend exporting your data first. This action cannot be undone.</p>
                          <button
                            onClick={handleDeleteAccount}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Account</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Button - Centered */}
                  <div className="flex justify-center pt-6 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-indigo-700 hover:to-pink-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <Save className={`w-5 h-5 ${saving ? 'animate-spin' : ''}`} />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>

                </div>
              </motion.div>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}