import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useSupabase'
import { usePreferences } from '../context/PreferencesContext'
import {
  LayoutDashboard,
  CreditCard,
  Calendar,
  BarChart3,
  PiggyBank,
  Target,
  ArrowUpRight,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  LucideIcon
} from 'lucide-react'

interface MenuItem {
  icon: LucideIcon
  label: string
  path: string
}

interface SidebarProps {
  isMobile?: boolean
}

interface SidebarContentProps {
  user: { name?: string; email: string } | null
  handleLogout: () => void
  isExpanded: boolean
  onClose?: () => void
}

// Menu items with translation keys
const menuItemKeys = [
  { icon: LayoutDashboard, labelKey: 'dashboard', path: '/dashboard' },
  { icon: CreditCard, labelKey: 'transactions', path: '/transactions' },
  { icon: BarChart3, labelKey: 'analytics', path: '/analytics' },
  { icon: PiggyBank, labelKey: 'budget', path: '/budget' },
  { icon: Target, labelKey: 'goals', path: '/goals' },
  { icon: ArrowUpRight, labelKey: 'borrowLoan', path: '/borrow-loan' }
]

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const { profile } = useProfile()
  const { t } = usePreferences()

  const handleLogout = () => {
    logout()
  }

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setIsMobileOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 lg:hidden"
              >
                <SidebarContent 
                  user={user}
                  profile={profile}
                  handleLogout={handleLogout} 
                  isExpanded={true}
                  onClose={() => setIsMobileOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <motion.div
      className="hidden lg:flex fixed left-0 top-0 h-full bg-white shadow-xl z-30"
      initial={{ width: 80 }}
      animate={{ width: isExpanded ? 280 : 80 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <SidebarContent 
        user={user}
        profile={profile}
        handleLogout={handleLogout} 
        isExpanded={isExpanded}
      />
    </motion.div>
  )
}

function SidebarContent({ user, profile, handleLogout, isExpanded, onClose }: SidebarContentProps & { profile?: any }) {
  const { t } = usePreferences()
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow-lg">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                  {profile?.full_name ? 
                    profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 
                    <User className="w-6 h-6" />
                  }
                </div>
              )}
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="font-semibold text-gray-800">
                    {profile?.full_name || user?.name || 'User'}
                  </h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItemKeys.map((item, index) => (
            <li key={index}>
              <motion.a
                href={item.path}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 transition-colors group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="w-6 h-6 text-gray-600 group-hover:text-primary-600" />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-gray-700 group-hover:text-primary-600 font-medium"
                    >
                      {t(item.labelKey)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <motion.a
          href="/settings"
          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Settings className="w-6 h-6 text-gray-600 group-hover:text-gray-800" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-gray-700 group-hover:text-gray-800 font-medium"
              >
                {t('settings')}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.a>

        <motion.button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-6 h-6 text-gray-600 group-hover:text-red-600" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-gray-700 group-hover:text-red-600 font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}