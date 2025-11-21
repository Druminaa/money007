import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../context/ToastContext'
import { Transaction, useTransactions } from '../hooks/useSupabase'
import { usePreferences } from '../context/PreferencesContext'
import { CustomCategory, useCustomCategories } from '../hooks/useCustomCategories'
import Sidebar from '../components/Sidebar'
import { ExportMenu } from '../components/ExportMenu'
import { generateTransactionsPDF } from './pdfGenerator'

import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Utensils,
  Car,
  Zap,
  Gamepad2,
  Heart,
  ShoppingBag,
  Briefcase,
  PiggyBank,
  Home,
  Gift,
  Award,
  MoreHorizontal,
  ChevronDown,
  Search
} from 'lucide-react'

interface TransactionForm {
  amount: string
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
}

type DatePeriod = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'

// Categories will be translated dynamically
const expenseCategoryKeys = ['food', 'transport', 'utilities', 'entertainment', 'healthcare', 'shopping', 'other']
const incomeCategoryKeys = ['salary', 'freelance', 'investment', 'business', 'rental', 'bonus', 'gift', 'other']

export default function Transactions() {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const { formatCurrency, formatDate, t } = usePreferences()
  const { customCategories, addCustomCategory } = useCustomCategories()
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [dateFilter, setDateFilter] = useState<DatePeriod>('all')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [formData, setFormData] = useState<TransactionForm>({
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [showCategoryGrid, setShowCategoryGrid] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    type: 'all' as 'all' | 'income' | 'expense',
    category: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: ''
  })

  const { toast } = useToast()

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      'food': Utensils,
      'transport': Car,
      'utilities': Zap,
      'entertainment': Gamepad2,
      'healthcare': Heart,
      'shopping': ShoppingBag,
      'salary': Briefcase,
      'freelance': PiggyBank,
      'investment': TrendingUp,
      'business': Briefcase,
      'rental': Home,
      'bonus': Award,
      'gift': Gift,
      'other': MoreHorizontal
    }
    return iconMap[category.toLowerCase()] || MoreHorizontal
  }

  const getDateRange = (date: Date, period: DatePeriod) => {
    if (period === 'all') return { start: new Date(0), end: new Date(9999, 11, 31) }

    const start = new Date(date)
    const end = new Date(date)

    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        return { start, end }
      case 'weekly':
        const dayOfWeek = date.getDay()
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        start.setDate(date.getDate() - daysToMonday)
        end.setDate(start.getDate() + 6)
        return { start, end }
      case 'monthly':
        start.setDate(1)
        end.setMonth(date.getMonth() + 1, 0)
        return { start, end }
      case 'yearly':
        start.setMonth(0, 1)
        end.setMonth(11, 31)
        return { start, end }
      default:
        return { start: new Date(0), end: new Date(9999, 11, 31) }
    }
  }

  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    // Apply date filter
    if (dateFilter !== 'all') {
      const { start, end } = getDateRange(selectedDate, dateFilter)
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date)
        const transactionDateOnly = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate())
        const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate())
        const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate())

        return transactionDateOnly >= startDateOnly && transactionDateOnly <= endDateOnly
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query) ||
        t.amount?.toString().includes(query) ||
        formatCurrency(Number(t.amount)).toLowerCase().includes(query)
      )
    }

    // Apply advanced filters
    if (searchFilters.type !== 'all') {
      filtered = filtered.filter(t => t.type === searchFilters.type)
    }
    
    if (searchFilters.category) {
      filtered = filtered.filter(t => t.category?.toLowerCase().includes(searchFilters.category.toLowerCase()))
    }
    
    if (searchFilters.minAmount) {
      filtered = filtered.filter(t => Number(t.amount) >= Number(searchFilters.minAmount))
    }
    
    if (searchFilters.maxAmount) {
      filtered = filtered.filter(t => Number(t.amount) <= Number(searchFilters.maxAmount))
    }
    
    if (searchFilters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(searchFilters.dateFrom))
    }
    
    if (searchFilters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(searchFilters.dateTo))
    }

    return filtered
  }, [transactions, dateFilter, selectedDate, searchQuery, searchFilters])

  const clearAllFilters = () => {
    setSearchQuery('')
    setSearchFilters({
      type: 'all',
      category: '',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: ''
    })
    setShowAdvancedSearch(false)
  }

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  const balance = totalIncome - totalExpenses

  const handleDownloadPDF = (transactionsToExport: Transaction[]) => {
    generateTransactionsPDF(transactionsToExport, {
      formatCurrency,
      formatDate,
      totalIncome,
      totalExpenses,
      balance
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (!formData.category) {
      toast.error('Please select a category')
      return
    }
    
    if (!formData.description.trim()) {
      toast.error('Please enter a description')
      return
    }
    
    if (!formData.date) {
      toast.error('Please select a date')
      return
    }

    let finalCategory = formData.category

    // Handle custom category
    if (formData.category === 'Other' && customCategory.trim()) {
      try {
        await addCustomCategory({
          name: customCategory.trim(),
          type: formData.type
        })
        finalCategory = customCategory.trim()
      } catch (error) {
        finalCategory = customCategory.trim()
      }
    } else if (formData.category === 'Other' && !customCategory.trim()) {
      toast.error('Please enter a custom category name')
      return
    }

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          amount,
          type: formData.type,
          category: finalCategory,
          description: formData.description.trim(),
          date: formData.date
        })
        toast.success('Transaction updated successfully!')
      } else {
        await addTransaction({
          amount,
          type: formData.type,
          category: finalCategory,
          description: formData.description.trim(),
          date: formData.date
        })
        toast.success('Transaction added successfully!')
      }

      // Reset form
      setShowModal(false)
      setEditingTransaction(null)
      setFormData({ amount: '', type: 'expense', category: '', description: '', date: new Date().toISOString().split('T')[0] })
      setShowCustomCategory(false)
      setCustomCategory('')
    } catch (error) {
      toast.error('Failed to save transaction. Please try again.')
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    if (dateFilter === 'all') return

    const newDate = new Date(selectedDate)
    const increment = direction === 'next' ? 1 : -1

    switch (dateFilter) {
      case 'daily':
        newDate.setDate(selectedDate.getDate() + increment)
        break
      case 'weekly':
        newDate.setDate(selectedDate.getDate() + (increment * 7))
        break
      case 'monthly':
        newDate.setMonth(selectedDate.getMonth() + increment)
        break
      case 'yearly':
        newDate.setFullYear(selectedDate.getFullYear() + increment)
        break
    }
    setSelectedDate(newDate)
  }

  const formatDateRange = () => {
    if (dateFilter === 'all') return 'All Transactions'

    const { start, end } = getDateRange(selectedDate, dateFilter)
    switch (dateFilter) {
      case 'daily':
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)

        if (selectedDate.toDateString() === today.toDateString()) {
          return 'Today - ' + selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })
        } else if (selectedDate.toDateString() === yesterday.toDateString()) {
          return 'Yesterday - ' + selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })
        } else if (selectedDate.toDateString() === tomorrow.toDateString()) {
          return 'Tomorrow - ' + selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })
        } else {
          return selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }
      case 'weekly':
        return `Week: ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      case 'monthly':
        return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      case 'yearly':
        return selectedDate.getFullYear().toString()
      default:
        return 'All Transactions'
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      amount: Number(transaction.amount).toString(),
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id)
      } catch (error) {
        // Error handled by hook
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Sidebar />
      <Sidebar isMobile={true} />

      <div className="lg:ml-20 transition-all duration-300">
        <div className="p-6 lg:p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 rounded-3xl"></div>
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('transactions')}</h1>
                  <p className="text-gray-600">Track and manage all your financial transactions</p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Search Section */}
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                      className={`px-4 py-2 rounded-lg border transition-all flex items-center space-x-2 ${
                        showAdvancedSearch || Object.values(searchFilters).some(v => v && v !== 'all')
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      <span>Filters</span>
                    </button>
                    
                    {(searchQuery || Object.values(searchFilters).some(v => v && v !== 'all')) && (
                      <button
                        onClick={clearAllFilters}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  
                  <ExportMenu transactions={filteredTransactions} onPDFExport={() => handleDownloadPDF(filteredTransactions)} />
                  <motion.button
                    onClick={() => setShowModal(true)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{t('addTransaction')}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Advanced Search Panel */}
            <AnimatePresence>
              {showAdvancedSearch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Advanced Search</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Transaction Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                          value={searchFilters.type}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, type: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="all">All Types</option>
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                        </select>
                      </div>
                      
                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <input
                          type="text"
                          placeholder="Filter by category"
                          value={searchFilters.category}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      
                      {/* Amount Range */}
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={searchFilters.minAmount}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            placeholder="Max"
                            value={searchFilters.maxAmount}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      {/* Date Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                          type="date"
                          value={searchFilters.dateFrom}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                          type="date"
                          value={searchFilters.dateTo}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Date Filter Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as DatePeriod[]).map((period) => (
                      <button
                        key={period}
                        onClick={() => setDateFilter(period)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${dateFilter === period
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-emerald-50'
                          }`}
                      >
                        {period === 'all' ? <Filter className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                        <span>{t(period)}</span>
                      </button>
                    ))}
                  </div>

                  {dateFilter !== 'all' && (
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => navigateDate('prev')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div className="text-center min-w-[250px]">
                        <h3 className="font-semibold text-gray-800">{formatDateRange()}</h3>
                      </div>

                      <button
                        onClick={() => navigateDate('next')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Summary Cards */}
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
                    <p className="text-sm text-gray-600 mb-1">{t('totalIncome')}</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -3 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('totalExpenses')}</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-red-400 to-pink-500 rounded-xl">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -3 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('balance')}</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Transactions List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-pink-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {formatDateRange()}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading transactions...</p>
                  </div>
                ) : filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-6 h-6 text-green-600" />
                          ) : (
                            <TrendingDown className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{transaction.description}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{transaction.category}</span>
                            <span>•</span>
                            <span>{formatDate(transaction.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <span className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredTransactions.length === 0 && (
                <div className="p-12 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {dateFilter === 'all' ? 'No transactions found' : `No transactions for ${formatDateRange().toLowerCase()}`}
                  </h3>
                  <p className="text-gray-500">
                    {dateFilter === 'all' ? 'Add your first transaction to get started' : 'Try selecting a different date period'}
                  </p>
                </div>
              )}
            </motion.div>
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {editingTransaction ? t('editTransaction') : t('addTransaction')}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setEditingTransaction(null)
                      setFormData({ amount: '', type: 'expense', category: '', description: '', date: new Date().toISOString().split('T')[0] })
                      setShowCustomCategory(false)
                      setCustomCategory('')
                    }}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-100">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('type')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, type: 'expense', category: '' }))
                        setShowCustomCategory(false)
                        setCustomCategory('')
                      }}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${formData.type === 'expense'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                    >
                      <TrendingDown className="w-4 h-4" />
                      <span className="font-medium text-sm">{t('expense')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, type: 'income', category: '' }))
                        setShowCustomCategory(false)
                        setCustomCategory('')
                      }}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${formData.type === 'income'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium text-sm">{t('income')}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount')}</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('category')}</label>
                  
                  {/* Selected Category Display */}
                  <motion.div
                    onClick={() => setShowCategoryGrid(!showCategoryGrid)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-400 transition-all bg-gradient-to-r from-gray-50 to-white"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {formData.category ? (
                      <div className="flex items-center space-x-3">
                        {(() => {
                          const selectedKey = (formData.type === 'income' ? incomeCategoryKeys : expenseCategoryKeys)
                            .find(key => t(key) === formData.category) || 'other'
                          const IconComponent = getCategoryIcon(selectedKey)
                          return (
                            <div className="p-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg">
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                          )
                        })()}
                        <span className="font-medium text-gray-800">{formData.category}</span>
                        <div className="ml-auto">
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCategoryGrid ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2 text-gray-500">
                        <Plus className="w-5 h-5" />
                        <span>Choose a category</span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${showCategoryGrid ? 'rotate-180' : ''}`} />
                      </div>
                    )}
                  </motion.div>

                  {/* Creative Category Grid */}
                  <AnimatePresence>
                    {showCategoryGrid && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-100">
                          <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                          {(formData.type === 'income' ? incomeCategoryKeys : expenseCategoryKeys).map((catKey, index) => {
                            const IconComponent = getCategoryIcon(catKey)
                            const gradients = [
                              'from-red-400 to-pink-500',
                              'from-blue-400 to-cyan-500', 
                              'from-green-400 to-emerald-500',
                              'from-yellow-400 to-orange-500',
                              'from-purple-400 to-indigo-500',
                              'from-pink-400 to-rose-500',
                              'from-indigo-400 to-blue-500'
                            ]
                            return (
                              <motion.button
                                key={catKey}
                                type="button"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, category: t(catKey) }))
                                  setShowCategoryGrid(false)
                                  setShowCustomCategory(false)
                                }}
                                className={`p-3 rounded-xl transition-all duration-200 ${formData.category === t(catKey)
                                    ? 'bg-white shadow-lg border-2 border-emerald-400'
                                    : 'bg-white/70 hover:bg-white hover:shadow-md border border-gray-200'
                                  }`}
                              >
                                <div className={`p-2 bg-gradient-to-r ${gradients[index % gradients.length]} rounded-lg mb-2 mx-auto w-fit`}>
                                  <IconComponent className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-xs font-medium text-gray-700">{t(catKey)}</div>
                              </motion.button>
                            )
                          })}
                          
                          {/* Custom Categories */}
                          {customCategories
                            .filter(cat => cat.type === formData.type)
                            .map((cat, index) => (
                              <motion.button
                                key={`custom-${cat.id}`}
                                type="button"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, category: cat.name }))
                                  setShowCategoryGrid(false)
                                  setShowCustomCategory(false)
                                }}
                                className={`p-3 rounded-xl transition-all duration-200 ${formData.category === cat.name
                                    ? 'bg-white shadow-lg border-2 border-emerald-400'
                                    : 'bg-white/70 hover:bg-white hover:shadow-md border border-gray-200'
                                  }`}
                              >
                                <div className="p-2 bg-gradient-to-r from-gray-400 to-slate-500 rounded-lg mb-2 mx-auto w-fit">
                                  <MoreHorizontal className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-xs font-medium text-gray-700">{cat.name}</div>
                              </motion.button>
                            ))}
                          
                          {/* Add Custom Category */}
                          <motion.button
                            type="button"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, category: 'Other' }))
                              setShowCustomCategory(true)
                              setShowCategoryGrid(false)
                            }}
                            className="p-3 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 hover:from-emerald-200 hover:to-teal-200 border-2 border-dashed border-emerald-300 transition-all duration-200"
                          >
                            <div className="p-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg mb-2 mx-auto w-fit">
                              <Plus className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-xs font-medium text-emerald-700">Custom</div>
                          </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {showCustomCategory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')} ({t('other')})</label>
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="Enter custom category name"
                        maxLength={50}
                        required={showCustomCategory}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="What was this transaction for?"
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingTransaction(null)
                      setFormData({ amount: '', type: 'expense', category: '', description: '', date: new Date().toISOString().split('T')[0] })
                      setShowCustomCategory(false)
                      setCustomCategory('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors text-sm font-medium"
                  >
                    {editingTransaction ? t('update') : t('add')} {t('transactions')}
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}