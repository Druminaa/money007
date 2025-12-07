import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { uploadAvatar } from '../utils/uploadAvatar'
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  Camera,
  X
} from 'lucide-react'

export default function Settings() {
  const { toast } = useToast()
  const { user } = useAuth()
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
    avatar: ''
  })
  
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

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorAuth: false,
    loginAlerts: true
  })

  useEffect(() => {
    if (user) {
      const storedProfile = localStorage.getItem(`profile_${user.id}`)
      if (storedProfile) {
        setProfileData(JSON.parse(storedProfile))
      }
      
      const storedPrefs = localStorage.getItem(`preferences_${user.id}`)
      if (storedPrefs) {
        setPreferences(JSON.parse(storedPrefs))
      }
      
      const storedSecurity = localStorage.getItem(`security_${user.id}`)
      if (storedSecurity) {
        setSecurity(JSON.parse(storedSecurity))
      }
    }
  }, [user])

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'preferences', name: 'Preferences', icon: Palette },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield }
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      if (activeTab === 'profile') {
        if (!profileData.full_name.trim()) {
          toast.error('Full name is required')
          setSaving(false)
          return
        }
        
        if (!profileData.phone.trim()) {
          toast.error('Phone is required')
          setSaving(false)
          return
        }
        
        if (!profileData.location.trim()) {
          toast.error('Location is required')
          setSaving(false)
          return
        }
        
        if (!profileData.date_of_birth) {
          toast.error('Date of birth is required')
          setSaving(false)
          return
        }
        
        if (!profileData.bio.trim()) {
          toast.error('Bio is required')
          setSaving(false)
          return
        }
        
        localStorage.setItem(`profile_${user?.id}`, JSON.stringify(profileData))
        toast.success('Profile updated successfully!')
        
      } else if (activeTab === 'preferences' || activeTab === 'notifications') {
        localStorage.setItem(`preferences_${user?.id}`, JSON.stringify(preferences))
        await updatePreferences(preferences)
        toast.success('Preferences updated successfully!')
        
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
        
        localStorage.setItem(`security_${user?.id}`, JSON.stringify(security))
        toast.success('Security settings updated successfully!')
        
        if (security.newPassword) {
          setSecurity({
            ...security,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          })
        }
      }
    } catch (error: any) {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleExportCSV = () => {
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
        ['Date Format', preferences.date_format]
      ]
      
      const csvContent = csvData.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `settings-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('CSV exported successfully!')
    } catch (error) {
      toast.error('Failed to export CSV')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Sidebar />
      
      <div className="lg:ml-20 transition-all duration-300">
        <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-7xl mx-auto">
            
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
                <SettingsIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Settings</h1>
                <p className="text-gray-600 text-sm">Manage your account preferences</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.name}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                        <User className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                    </div>
                    
                    <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg ring-4 ring-white">
                          {profileData.avatar ? (
                            <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                              {profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-2 shadow-lg hover:bg-indigo-700 transition-all"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file || !user) return
                            
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error('File size must be less than 2MB')
                              return
                            }
                            
                            setUploadingAvatar(true)
                            try {
                              const avatarUrl = await uploadAvatar(file, user.id)
                              setProfileData({...profileData, avatar: avatarUrl})
                              toast.success('Photo uploaded successfully!')
                            } catch (error) {
                              console.error('Upload failed:', error)
                              toast.error('Failed to upload photo')
                            } finally {
                              setUploadingAvatar(false)
                            }
                          }}
                          className="hidden"
                          disabled={uploadingAvatar}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{profileData.full_name || 'User'}</h3>
                        <p className="text-gray-600 text-sm mb-3">{user?.email}</p>
                        {uploadingAvatar && (
                          <p className="text-indigo-600 text-sm">Uploading...</p>
                        )}
                        {profileData.avatar && !uploadingAvatar && (
                          <button
                            onClick={() => setProfileData({...profileData, avatar: ''})}
                            className="text-red-600 text-sm hover:text-red-700 flex items-center space-x-1"
                          >
                            <X className="w-4 h-4" />
                            <span>Remove Photo</span>
                          </button>
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

                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                        <Palette className="w-6 h-6 text-purple-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">App Preferences</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <select
                          value={preferences.currency}
                          onChange={(e) => setPreferences({...preferences, currency: e.target.value})}
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
                          onChange={(e) => setPreferences({...preferences, language: e.target.value})}
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
                          onChange={(e) => setPreferences({...preferences, date_format: e.target.value})}
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

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg">
                        <Bell className="w-6 h-6 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Notification Settings</h2>
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                        { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive push notifications' },
                        { key: 'budget_alerts', label: 'Budget Alerts', desc: 'Get alerts when you exceed budget' },
                        { key: 'goal_reminders', label: 'Goal Reminders', desc: 'Reminders about your goals' },
                        { key: 'weekly_reports', label: 'Weekly Reports', desc: 'Weekly summary of activity' }
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
                              onChange={(e) => setPreferences({...preferences, [key]: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg">
                        <Shield className="w-6 h-6 text-red-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Security Settings</h2>
                    </div>
                    
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
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-800">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-600">Add extra security to your account</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={security.twoFactorAuth}
                              onChange={(e) => setSecurity({...security, twoFactorAuth: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-800">Login Alerts</h3>
                            <p className="text-sm text-gray-600">Get notified of account logins</p>
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

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Export Your Data</h3>
                        <p className="text-blue-700 mb-4 text-sm">Download your settings and profile data</p>
                        <button
                          onClick={handleExportCSV}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export as CSV</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <Save className={`w-5 h-5 ${saving ? 'animate-spin' : ''}`} />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
