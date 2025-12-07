import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../context/ToastContext'
import { Transaction, useTransactions } from '../hooks/useSupabase'
import { usePreferences } from '../context/PreferencesContext'
import { CustomCategory, useCustomCategories } from '../hooks/useCustomCategories'
import Sidebar from '../components/layout/Sidebar'
import { ExportMenu } from '../components/ui/ExportMenu'
import { generateTransactionsPDF } from '../utils/pdfGenerator'
import { notificationService } from '../services/notificationService'
import { validateAmount, validateDescription, validateCategory, validateDate, sanitizeInput } from '../utils/validation'

import {
  Plus,
  Edit,
  Trash2,
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
  Banknote,
  Wallet
} from 'lucide-react'

interface TransactionForm {
  amount: string
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
  paymentMethod: 'cash' | 'card' | 'bank'
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
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash'
  })
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [showCategoryGrid, setShowCategoryGrid] = useState(false)


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



    return filtered
  }, [transactions, dateFilter, selectedDate])



  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  const balance = totalIncome - totalExpenses
  
  const cashBalance = useMemo(() => {
    let cash = 0
    filteredTransactions.forEach(t => {
      const paymentMethod = (t as any).paymentMethod
      if (paymentMethod === 'cash') {
        cash += t.type === 'income' ? Number(t.amount) : -Number(t.amount)
      }
    })
    return cash
  }, [filteredTransactions])

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
    
    // Validate amount
    const amountValidation = validateAmount(formData.amount)
    if (!amountValidation.valid) {
      toast.error(amountValidation.error || 'Invalid amount')
      return
    }
    
    // Validate category
    if (!formData.category || !validateCategory(formData.category)) {
      toast.error('Please select a valid category')
      return
    }
    
    // Validate description
    const descValidation = validateDescription(formData.description)
    if (!descValidation.valid) {
      toast.error(descValidation.error || 'Invalid description')
      return
    }
    
    // Validate date
    if (!formData.date || !validateDate(formData.date)) {
      toast.error('Please select a valid date')
      return
    }
    
    const amount = amountValidation.value

    let finalCategory = formData.category

    // Handle custom category
    if (formData.category === 'Other' && customCategory.trim()) {
      const sanitizedCategory = sanitizeInput(customCategory.trim())
      if (!validateCategory(sanitizedCategory)) {
        toast.error('Invalid category name')
        return
      }
      try {
        await addCustomCategory({
          name: sanitizedCategory,
          type: formData.type
        })
        finalCategory = sanitizedCategory
      } catch (error) {
        finalCategory = sanitizedCategory
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
        })de 
        toast.success('Transaction updated successfully!')
      } else {
        await addTransaction({
          amount,
          type: formData.type,
          category: sanitizeInput(finalCategory),
          description: sanitizeInput(formData.description.trim()),
          date: formData.date
        })
        toast.success('Transaction added successfully!')
        
        // Send notification for new transaction
        await notificationService.sendTransactionNotification(
          formData.type,
          amount,
          finalCategory
        )
      }

      // Reset form
      setShowModal(false)
      setEditingTransaction(null)
      setFormData({ amount: '', type: 'expense', category: '', description: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'cash' })
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
      date: transaction.date,
      paymentMethod: (transaction as any).paymentMethod || 'cash'
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"
    >
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
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">{t('transactions')}</h1>
                  <p className="text-gray-600 text-sm lg:text-base">Track and manage all your financial transactions</p>
                </div>
                <div className="flex items-center space-x-2 lg:space-x-4">
                  <ExportMenu transactions={filteredTransactions} onPDFExport={() => handleDownloadPDF(filteredTransactions)} />
                  <motion.button
                    onClick={() => setShowModal(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="text-sm lg:text-base">{t('addTransaction')}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>





            {/* Date Filter Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 lg:p-6 shadow-lg border border-white/50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as DatePeriod[]).map((period) => (
                      <button
                        key={period}
                        onClick={() => setDateFilter(period)}
                        className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-sm lg:text-base ${
                          dateFilter === period
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-emerald-50 border border-gray-300'
                        }`}
                      >
                        {period === 'all' ? <Filter className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                        <span className="hidden sm:inline">{t(period)}</span>
                      </button>
                    ))}
                  </div>

                  {dateFilter !== 'all' && (
                    <div className="flex items-center justify-center lg:justify-end space-x-2 lg:space-x-4">
                      <button
                        onClick={() => navigateDate('prev')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Previous"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div className="text-center min-w-[200px] lg:min-w-[250px]">
                        <h3 className="font-semibold text-gray-800 text-sm lg:text-base">{formatDateRange()}</h3>
                      </div>

                      <button
                        onClick={() => navigateDate('next')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Next"
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
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6"
            >
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 shadow-md text-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-xs opacity-90">{t('income')}</span>
                </div>
                <p className="text-xl lg:text-2xl font-bold">{formatCurrency(totalIncome)}</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-4 shadow-md text-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-5 h-5" />
                  <span className="text-xs opacity-90">{t('expense')}</span>
                </div>
                <p className="text-xl lg:text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-cyan-600' : 'from-gray-500 to-gray-600'} rounded-xl p-4 shadow-md text-white`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Wallet className="w-5 h-5" />
                  <span className="text-xs opacity-90">{t('balance')}</span>
                </div>
                <p className="text-xl lg:text-2xl font-bold">{formatCurrency(balance)}</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl p-4 shadow-md text-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs opacity-90">Cash</span>
                </div>
                <p className="text-xl lg:text-2xl font-bold">{formatCurrency(cashBalance)}</p>
              </motion.div>
            </motion.div>

            {/* Transactions List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
            >
              <div className="p-4 lg:p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-base lg:text-lg font-semibold text-gray-800">
                    {formatDateRange()}
                  </h2>
                  <span className="text-xs text-gray-500">
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
                ) : (
                  filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                    className="p-3 lg:p-4 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-emerald-500"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {(() => {
                            const IconComponent = getCategoryIcon(transaction.category)
                            return <IconComponent className={`w-4 h-4 lg:w-5 lg:h-5 ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`} />
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 text-sm truncate">
                            {transaction.description}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="truncate">{transaction.category}</span>
                            <span>•</span>
                            <span>{formatDate(transaction.date)}</span>
                            {(transaction as any).paymentMethod && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                                  {(transaction as any).paymentMethod === 'cash' && <Banknote className="w-3 h-3" />}
                                  {(transaction as any).paymentMethod === 'card' && <CreditCard className="w-3 h-3" />}
                                  {(transaction as any).paymentMethod === 'bank' && <Wallet className="w-3 h-3" />}
                                  <span className="capitalize">{(transaction as any).paymentMethod}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-base lg:text-lg font-bold whitespace-nowrap ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  ))
                )}
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-4"
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
                      setFormData({ amount: '', type: 'expense', category: '', description: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'cash' })
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
                <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4 lg:space-y-6">
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
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">₹</span>
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
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategoryGrid(!showCategoryGrid)}
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all flex items-center justify-between"
                    >
                      {formData.category ? (
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const selectedKey = (formData.type === 'income' ? incomeCategoryKeys : expenseCategoryKeys)
                              .find(key => t(key) === formData.category) || 'other'
                            const IconComponent = getCategoryIcon(selectedKey)
                            return (
                              <div className="p-1.5 bg-emerald-500 rounded-md">
                                <IconComponent className="w-4 h-4 text-white" />
                              </div>
                            )
                          })()}
                          <span className="font-medium text-gray-800">{formData.category}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Select category</span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCategoryGrid ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showCategoryGrid && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                          <div className="p-2">
                            {(formData.type === 'income' ? incomeCategoryKeys : expenseCategoryKeys).map((catKey) => {
                              const IconComponent = getCategoryIcon(catKey)
                              return (
                                <button
                                  key={catKey}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, category: t(catKey) }))
                                    setShowCategoryGrid(false)
                                    setShowCustomCategory(false)
                                  }}
                                  className="w-full p-3 text-left hover:bg-emerald-50 rounded-lg transition-colors flex items-center space-x-3"
                                >
                                  <div className="p-1.5 bg-emerald-500 rounded-md">
                                    <IconComponent className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{t(catKey)}</span>
                                </button>
                              )
                            })}
                          
                            
                            {customCategories
                              .filter(cat => cat.type === formData.type)
                              .map((cat) => (
                                <button
                                  key={`custom-${cat.id}`}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, category: cat.name }))
                                    setShowCategoryGrid(false)
                                    setShowCustomCategory(false)
                                  }}
                                  className="w-full p-3 text-left hover:bg-emerald-50 rounded-lg transition-colors flex items-center space-x-3"
                                >
                                  <div className="p-1.5 bg-gray-500 rounded-md">
                                    <MoreHorizontal className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                                </button>
                              ))}
                            
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, category: 'Other' }))
                                setShowCustomCategory(true)
                                setShowCategoryGrid(false)
                              }}
                              className="w-full p-3 text-left hover:bg-emerald-50 rounded-lg transition-colors flex items-center space-x-3 border-t border-gray-100 mt-2 pt-3"
                            >
                              <div className="p-1.5 bg-emerald-500 rounded-md">
                                <Plus className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-medium text-emerald-700">Add Custom Category</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center space-y-1 ${formData.paymentMethod === 'cash'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                    >
                      <Banknote className="w-5 h-5" />
                      <span className="font-medium text-xs">Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'card' }))}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center space-y-1 ${formData.paymentMethod === 'card'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="font-medium text-xs">Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'bank' }))}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center space-y-1 ${formData.paymentMethod === 'bank'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                    >
                      <Wallet className="w-5 h-5" />
                      <span className="font-medium text-xs">Bank</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.date ? new Date(formData.date).toLocaleDateString('en-GB') : ''}
                      onChange={(e) => {
                        const parts = e.target.value.split('/')
                        if (parts.length === 3) {
                          const [day, month, year] = parts
                          if (day && month && year && year.length === 4) {
                            setFormData(prev => ({ ...prev, date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` }))
                          }
                        }
                      }}
                      onFocus={(e) => e.target.type = 'date'}
                      onBlur={(e) => e.target.type = 'text'}
                      className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="DD/MM/YYYY"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingTransaction(null)
                      setFormData({ amount: '', type: 'expense', category: '', description: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'cash' })
                      setShowCustomCategory(false)
                      setCustomCategory('')
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors text-sm font-medium"
                  >
                    {editingTransaction ? t('update') : t('add')}
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}