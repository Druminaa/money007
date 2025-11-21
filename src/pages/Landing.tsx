import { Link } from 'react-router-dom'
import { DollarSign, ArrowRight } from 'lucide-react'

export default function Landing() {

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">Money Manager</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Manage Your Money
            <span className="text-blue-600"> Simply</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track expenses, create budgets, and achieve your financial goals with our easy-to-use money management platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-lg hover:border-gray-400 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Simple Financial Management
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Track Expenses</h3>
              <p className="text-gray-600">Monitor your spending and categorize transactions</p>
            </div>
            <div>
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Budget Planning</h3>
              <p className="text-gray-600">Create budgets and stay on track with your goals</p>
            </div>
            <div>
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Achieve Goals</h3>
              <p className="text-gray-600">Set financial goals and track your progress</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-blue-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users managing their finances better
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              <span>Create Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">Money Manager</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your trusted partner for smart financial management. Track, budget, and achieve your financial goals with ease.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 Money Manager. All rights reserved.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323C5.902 8.198 7.053 7.708 8.35 7.708s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387zm7.718 0c-1.297 0-2.448-.49-3.323-1.297-.897-.875-1.387-2.026-1.387-3.323s.49-2.448 1.297-3.323c.875-.897 2.026-1.387 3.323-1.387s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}