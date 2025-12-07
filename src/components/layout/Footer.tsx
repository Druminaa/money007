import { motion } from 'framer-motion'
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  Heart
} from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Money Manager</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Take control of your finances with our comprehensive money management platform. 
              Track expenses, set budgets, and achieve your financial goals.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">Dashboard</a></li>
              <li><a href="/transactions" className="text-gray-400 hover:text-white transition-colors text-sm">Transactions</a></li>
              <li><a href="/budget" className="text-gray-400 hover:text-white transition-colors text-sm">Budget</a></li>
              <li><a href="/goals" className="text-gray-400 hover:text-white transition-colors text-sm">Goals</a></li>
              <li><a href="/analytics" className="text-gray-400 hover:text-white transition-colors text-sm">Analytics</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Support</h4>
            <ul className="space-y-2">
              <li><a href="/help" className="text-gray-400 hover:text-white transition-colors text-sm">Help Center</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">Contact Us</a></li>
              <li><a href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a></li>
              <li><a href="/faq" className="text-gray-400 hover:text-white transition-colors text-sm">FAQ</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm">support@moneymanager.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-gray-400 text-sm">
                  123 Finance Street<br />
                  New York, NY 10001
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-gray-400 text-sm text-center sm:text-left">
              © {currentYear} Money Manager. All rights reserved.
            </div>
            <div className="flex items-center space-x-1 text-gray-400 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>for better financial management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden bg-gray-800 border-t border-gray-700">
        <div className="grid grid-cols-4 gap-1 p-2">
          <a href="/dashboard" className="flex flex-col items-center py-2 px-1 text-gray-400 hover:text-white">
            <div className="w-6 h-6 mb-1">📊</div>
            <span className="text-xs">Dashboard</span>
          </a>
          <a href="/transactions" className="flex flex-col items-center py-2 px-1 text-gray-400 hover:text-white">
            <div className="w-6 h-6 mb-1">💳</div>
            <span className="text-xs">Transactions</span>
          </a>
          <a href="/budget" className="flex flex-col items-center py-2 px-1 text-gray-400 hover:text-white">
            <div className="w-6 h-6 mb-1">🏦</div>
            <span className="text-xs">Budget</span>
          </a>
          <a href="/goals" className="flex flex-col items-center py-2 px-1 text-gray-400 hover:text-white">
            <div className="w-6 h-6 mb-1">🎯</div>
            <span className="text-xs">Goals</span>
          </a>
        </div>
      </div>
    </footer>
  )
}