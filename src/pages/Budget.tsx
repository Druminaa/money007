import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBudgets, useTransactions } from '../hooks/useSupabase'
import Sidebar from '../components/layout/Sidebar'
import { 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  TrendingUp,
  Target,
  PiggyBank,
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Heart,
  Zap,
  MoreHorizontal,
  CheckCircle,
  Clock,
  X,
  Filter,
  Calendar
} from 'lucide-react'

export default function Budget() {
  const { budgets, loading, addBudget, updateBudget, deleteBudget } = useBudgets()
  const { transactions } = useTransactions()
  const [showModal, setShowModal] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<typeof budgets[0] | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7)
  })
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other']

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      'Food': Utensils,
      'Transport': Car,
      'Shopping': ShoppingBag,
      'Entertainment': Gamepad2,
      'Healthcare': Heart,
      'Utilities': Zap,
      'Other': MoreHorizontal
    }
    return iconMap[category] || MoreHorizontal
  }

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'Food': 'from-orange-400 to-red-500',
      'Transport': 'from-blue-400 to-cyan-500',
      'Shopping': 'from-pink-400 to-purple-500',
      'Entertainment': 'from-green-400 to-emerald-500',
      'Healthcare': 'from-red-400 to-pink-500',
      'Utilities': 'from-yellow-400 to-orange-500',
      'Other': 'from-gray-400 to-slate-500'
    }
    return colorMap[category] || 'from-gray-400 to-slate-500'
  }

  const getBudgetStatus = (percentage: number) => {
    if (percentage >= 100) return { status: 'exceeded', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle }
    if (percentage >= 80) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock }
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle }
  }

  const filteredBudgets = useMemo(() => {
    return budgets.filter(budget => {
      const monthMatch = monthFilter === 'all' || budget.month === monthFilter
      const categoryMatch = categoryFilter === 'all' || budget.category === categoryFilter
      return monthMatch && categoryMatch
    })
  }, [budgets, monthFilter, categoryFilter])

  const budgetsWithSpent = useMemo(() => 
    filteredBudgets.map(budget => {
      const spent = transactions
        .filter(t => 
          t.type === 'expense' && 
          t.category === budget.category && 
          t.date.startsWith(budget.month)
        )
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      const percentage = (spent / Number(budget.amount)) * 100
      const remaining = Number(budget.amount) - spent
      
      return {
        ...budget,
        spent,
        percentage,
        remaining: Math.max(0, remaining),
        status: getBudgetStatus(percentage)
      }
    }), [filteredBudgets, transactions]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(formData.amount)
    if (!amount || !formData.category) return

    try {
      if (selectedBudget) {
        await updateBudget(selectedBudget.id, {
          category: formData.category,
          amount,
          month: formData.month
        })
      } else {
        await addBudget({
          category: formData.category,
          amount,
          month: formData.month
        })
      }

      setShowModal(false)
      setSelectedBudget(null)
      setFormData({ category: '', amount: '', month: new Date().toISOString().slice(0, 7) })
    } catch (error) {
      // Error handled by hook
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <Sidebar />
      
      <div className="lg:ml-20 transition-all duration-300">
        <div className="p-6 lg:p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-indigo-400/10 rounded-3xl"></div>
          <div className="relative z-10">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-800">Budget Planner</h1>
                      <p className="text-gray-600">Set and track your spending limits with smart insights</p>
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowModal(true)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Budget</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Filter Controls */}
            {budgets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Month:</span>
                      <select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="all">All Months</option>
                        {Array.from(new Set(budgets.map(b => b.month))).sort().map(month => (
                          <option key={month} value={month}>
                            {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Category:</span>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {(monthFilter !== 'all' || categoryFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setMonthFilter('all')
                          setCategoryFilter('all')
                        }}
                        className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Summary Stats */}
            {budgetsWithSpent.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                <motion.div 
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Budgets</p>
                      <p className="text-2xl font-bold text-purple-600">{budgetsWithSpent.length}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-xl">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Allocated</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₹{budgetsWithSpent.reduce((sum, b) => sum + Number(b.amount), 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl">
                      <PiggyBank className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                      <p className="text-2xl font-bold text-red-600">
                        ₹{budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-red-400 to-pink-500 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Budget Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading budgets...</p>
                </div>
              ) : budgetsWithSpent.map((budget, index) => {
                const IconComponent = getCategoryIcon(budget.category)
                const colorClass = getCategoryColor(budget.category)
                const StatusIcon = budget.status.icon
                
                return (
                  <motion.div
                    key={budget.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Background Pattern */}
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClass} opacity-10 rounded-full -translate-y-16 translate-x-16`} />
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 bg-gradient-to-r ${colorClass} rounded-xl shadow-lg`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{budget.category}</h3>
                          <p className="text-sm text-gray-500">{budget.month}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBudget(budget)
                            setFormData({
                              category: budget.category,
                              amount: Number(budget.amount).toString(),
                              month: budget.month
                            })
                            setShowModal(true)
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this budget?')) {
                              deleteBudget(budget.id)
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Circular Progress */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-200"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <motion.path
                            stroke="url(#gradient-budget-${index})"
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                            initial={{ strokeDasharray: "0 100" }}
                            animate={{ strokeDasharray: `${Math.min(budget.percentage, 100)} 100` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <defs>
                            <linearGradient id={`gradient-budget-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor={budget.percentage >= 100 ? '#ef4444' : budget.percentage >= 80 ? '#f59e0b' : '#10b981'} />
                              <stop offset="100%" stopColor={budget.percentage >= 100 ? '#dc2626' : budget.percentage >= 80 ? '#d97706' : '#059669'} />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">{Math.round(budget.percentage)}%</div>
                            <div className="text-xs text-gray-500">Used</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Budget Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Budget</span>
                        <span className="font-semibold text-gray-800">₹{Number(budget.amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Spent</span>
                        <span className="font-semibold text-red-600">₹{budget.spent.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Remaining</span>
                        <span className={`font-semibold ${budget.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{budget.remaining.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg ${budget.status.bgColor}`}>
                        <StatusIcon className={`w-4 h-4 ${budget.status.color}`} />
                        <span className={`text-sm font-medium ${budget.status.color}`}>
                          {budget.status.status === 'exceeded' ? 'Budget Exceeded' :
                           budget.status.status === 'warning' ? 'Nearing Limit' : 'On Track'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {budgetsWithSpent.length === 0 && budgets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full text-center py-16"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/50 max-w-md mx-auto">
                  <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No budgets match your filters</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filter criteria to see more budgets</p>
                  <button
                    onClick={() => {
                      setMonthFilter('all')
                      setCategoryFilter('all')
                    }}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </motion.div>
            )}

            {budgets.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full text-center py-16"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/50 max-w-md mx-auto">
                  <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full w-20 h-20 mx-auto mb-6">
                    <Target className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">No budgets created yet</h3>
                  <p className="text-gray-500 mb-6">Create your first budget to start tracking expenses and achieve your financial goals</p>
                  <motion.button
                    onClick={() => setShowModal(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Budget</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedBudget ? 'Edit Budget' : 'Create Budget'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedBudget(null)
                    setFormData({ category: '', amount: '', month: new Date().toISOString().slice(0, 7) })
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter budget amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setSelectedBudget(null)
                      setFormData({ category: '', amount: '', month: new Date().toISOString().slice(0, 7) })
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {selectedBudget ? 'Update Budget' : 'Create Budget'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}