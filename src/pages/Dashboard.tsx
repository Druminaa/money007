import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTransactions, useBudgets, useGoals, useProfile } from '../hooks/useSupabase'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import Sidebar from '../components/Sidebar'
import { 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  BarChart3,
  Plus,
  ShoppingBag,
  Car,
  Utensils,
  Gamepad2,
  Heart,
  Zap,
  Briefcase,
  TrendingUp as TrendingUpIcon,
  DollarSign as DollarIcon,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Activity,
  Bell,
  Lightbulb
} from 'lucide-react'

interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  category: string
  type: 'income' | 'expense'
}

export default function Dashboard() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { formatCurrency, formatDate, t } = usePreferences()
  const { transactions, loading } = useTransactions()
  const { budgets } = useBudgets()
  const { goals } = useGoals()

  const stats = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthStr = lastMonth.toISOString().slice(0, 7)
    
    let totalIncome = 0
    let totalExpenses = 0
    let monthlyIncome = 0
    let monthlyExpenses = 0
    let lastMonthIncome = 0
    let lastMonthExpenses = 0
    let currentMonthCount = 0
    
    transactions.forEach(t => {
      const amount = Number(t.amount)
      const isCurrentMonth = t.date.startsWith(currentMonth)
      const isLastMonth = t.date.startsWith(lastMonthStr)
      
      if (t.type === 'income') {
        totalIncome += amount
        if (isCurrentMonth) monthlyIncome += amount
        if (isLastMonth) lastMonthIncome += amount
      } else {
        totalExpenses += amount
        if (isCurrentMonth) monthlyExpenses += amount
        if (isLastMonth) lastMonthExpenses += amount
      }
      
      if (isCurrentMonth) currentMonthCount++
    })
    
    const incomeChange = lastMonthIncome > 0 ? ((monthlyIncome - lastMonthIncome) / lastMonthIncome * 100) : 0
    const expenseChange = lastMonthExpenses > 0 ? ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses * 100) : 0
    
    return {
      totalBalance: totalIncome - totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      incomeChange,
      expenseChange,
      totalTransactions: transactions.length,
      monthlyTransactions: currentMonthCount
    }
  }, [transactions])

  const categoryBreakdown = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthlyExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
    
    const breakdown = monthlyExpenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(breakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }, [transactions])

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      'Food': Utensils,
      'Transport': Car,
      'Shopping': ShoppingBag,
      'Entertainment': Gamepad2,
      'Healthcare': Heart,
      'Utilities': Zap,
      'Salary': Briefcase,
      'Freelance': TrendingUpIcon,
      'Investment': DollarIcon,
      'Other': MoreHorizontal
    }
    return iconMap[category] || MoreHorizontal
  }

  const getCategoryColor = (index: number) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500', 
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500'
    ]
    return colors[index] || colors[0]
  }

  const recentTransactions = useMemo(() => 
    transactions.slice(0, 5), [transactions]
  )

  const financialHealth = useMemo(() => {
    const savingsRate = stats.monthlyIncome > 0 ? ((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome) * 100 : 0
    const budgetAdherence = budgets.length > 0 ? 
      budgets.filter(b => {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.category === b.category && t.date.startsWith(b.month))
          .reduce((sum, t) => sum + Number(t.amount), 0)
        return spent <= Number(b.amount)
      }).length / budgets.length * 100 : 100
    
    const goalProgress = goals.length > 0 ? 
      goals.reduce((sum, g) => sum + (Number(g.current_amount) / Number(g.target_amount)) * 100, 0) / goals.length : 0
    
    const score = Math.round((savingsRate * 0.4 + budgetAdherence * 0.3 + goalProgress * 0.3))
    
    return {
      score: Math.min(100, Math.max(0, score)),
      savingsRate,
      budgetAdherence,
      goalProgress
    }
  }, [stats, budgets, goals, transactions])

  const upcomingBills = useMemo(() => {
    // Get recurring transactions from the last 3 months to predict upcoming bills
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    const recurringExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= threeMonthsAgo)
      .reduce((acc, t) => {
        const key = `${t.description}-${t.category}`
        if (!acc[key]) {
          acc[key] = { transactions: [], description: t.description, category: t.category }
        }
        acc[key].transactions.push(t)
        return acc
      }, {} as Record<string, { transactions: Transaction[], description: string, category: string }>)
    
    // Find bills that appear monthly (2+ times in 3 months)
    const bills = Object.values(recurringExpenses)
      .filter(item => item.transactions.length >= 2)
      .map(item => {
        const avgAmount = item.transactions.reduce((sum, t) => sum + Number(t.amount), 0) / item.transactions.length
        const lastTransaction = item.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        
        // Estimate next due date (30 days from last transaction)
        const nextDueDate = new Date(lastTransaction.date)
        nextDueDate.setDate(nextDueDate.getDate() + 30)
        
        return {
          name: item.description,
          amount: Math.round(avgAmount),
          dueDate: nextDueDate.toISOString().split('T')[0],
          category: item.category
        }
      })
      .filter(bill => new Date(bill.dueDate) > new Date()) // Only future bills
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
    
    return bills
  }, [transactions])

  const insights = useMemo(() => {
    const insights = []
    
    // High spending alert
    if (stats.expenseChange > 20) {
      insights.push({
        type: 'warning',
        title: 'High Spending Alert',
        message: `Your expenses increased by ${stats.expenseChange.toFixed(1)}% this month`,
        icon: AlertTriangle
      })
    }
    
    // Great savings rate
    if (financialHealth.savingsRate > 20) {
      insights.push({
        type: 'success',
        title: 'Great Savings Rate',
        message: `You're saving ${financialHealth.savingsRate.toFixed(1)}% of your income`,
        icon: CheckCircle
      })
    }
    
    // Budget overspending alert
    const overspentBudgets = budgets.filter(budget => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category && t.date.startsWith(budget.month))
        .reduce((sum, t) => sum + Number(t.amount), 0)
      return spent > Number(budget.amount)
    })
    
    if (overspentBudgets.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Budget Alert',
        message: `You've exceeded ${overspentBudgets.length} budget${overspentBudgets.length > 1 ? 's' : ''} this month`,
        icon: AlertTriangle
      })
    }
    
    // Goal achievement alert
    const nearGoals = goals.filter(g => {
      const progress = Number(g.target_amount) > 0 ? (Number(g.current_amount) / Number(g.target_amount)) * 100 : 0
      return progress >= 90 && !g.completed
    })
    
    if (nearGoals.length > 0) {
      insights.push({
        type: 'success',
        title: 'Goal Almost Complete!',
        message: `You're 90%+ complete on ${nearGoals.length} goal${nearGoals.length > 1 ? 's' : ''}`,
        icon: Target
      })
    }
    
    // Low activity warning
    if (stats.monthlyTransactions < 5 && transactions.length > 0) {
      insights.push({
        type: 'info',
        title: 'Low Activity',
        message: 'Consider adding more transactions to get better insights',
        icon: Clock
      })
    }
    
    // No transactions yet
    if (transactions.length === 0) {
      insights.push({
        type: 'info',
        title: 'Get Started',
        message: 'Add your first transaction to start tracking your finances',
        icon: Plus
      })
    }
    
    return insights.slice(0, 3)
  }, [stats, financialHealth, goals, budgets, transactions])

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Sidebar isMobile={true} />
      
      <div className="lg:ml-20 transition-all duration-300">
        <div className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'User'}! 👋
                </h1>
                <p className="text-gray-600">Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
              
              {/* Quick Actions */}
              </div>
          </motion.div>

          {/* Main Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-500">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-medium flex items-center ${
                  stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.totalBalance >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(stats.totalBalance)}</h3>
              <p className="text-gray-600 text-sm">{t('totalBalance')}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-medium flex items-center ${
                  stats.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.incomeChange >= 0 ? '+' : ''}{stats.incomeChange.toFixed(1)}%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(stats.monthlyIncome)}</h3>
              <p className="text-gray-600 text-sm">{t('monthlyIncome')}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-red-500">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-medium flex items-center ${
                  stats.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.expenseChange >= 0 ? '+' : ''}{stats.expenseChange.toFixed(1)}%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(stats.monthlyExpenses)}</h3>
              <p className="text-gray-600 text-sm">{t('monthlyExpenses')}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-500">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalTransactions}</h3>
              <p className="text-gray-600 text-sm">{t('totalTransactions')}</p>
            </motion.div>
          </motion.div>

          {/* Active Goals Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">{t('goalsProgress')}</h2>
                </div>
                <span className="text-sm text-gray-500">
                  {goals.filter(g => !g.completed).length} {t('activeGoals').toLowerCase()}
                </span>
              </div>
            </div>
            
            {goals.filter(g => !g.completed).length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Goals</h3>
                <p className="text-sm text-gray-500 mb-4">Set your first financial goal to start tracking progress</p>
                <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300">
                  Create Goal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.filter(g => !g.completed).slice(0, 6).map((goal, index) => {
                  const progress = Number(goal.target_amount) > 0 ? (Number(goal.current_amount) / Number(goal.target_amount)) * 100 : 0
                  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
                  
                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800 text-sm">{goal.title}</h3>
                        {progress >= 100 && (
                          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                            Complete!
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-600 mb-3">
                        <span className="font-medium">{formatCurrency(Number(goal.current_amount))}</span>
                        <span>{formatCurrency(Number(goal.target_amount))}</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 1.5, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            progress >= 75 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                            progress >= 50 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' :
                            progress >= 25 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                            'bg-gradient-to-r from-pink-500 to-red-500'
                          }`}
                        >
                          <div className="h-full bg-white/20 animate-pulse" />
                        </motion.div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-700">
                          {progress.toFixed(1)}% complete
                        </span>
                        {daysLeft !== null && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            daysLeft < 0 ? 'bg-red-100 text-red-700' :
                            daysLeft <= 30 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
            
            {goals.filter(g => !g.completed).length > 6 && (
              <div className="text-center mt-6">
                <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                  View All Goals ({goals.filter(g => !g.completed).length})
                </button>
              </div>
            )}
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">{t('recentTransactions')}</h2>
                  </div>
                  <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                    View All
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {loading ? (
                  <div className="p-6 text-center text-gray-500">Loading transactions...</div>
                ) : recentTransactions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No transactions yet</div>
                ) : (
                  recentTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <CreditCard className={`w-4 h-4 ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800 text-sm">{transaction.description}</h3>
                            <p className="text-xs text-gray-500">{transaction.category}</p>
                          </div>
                        </div>
                        <span className={`font-semibold text-sm ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Category Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">{t('topCategories')}</h2>
                </div>
              </div>
              <div className="p-6">
                {categoryBreakdown.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No expense data available</h3>
                    <p className="text-sm text-gray-500">Start adding expenses to see your spending breakdown</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {categoryBreakdown.map(([category, amount], index) => {
                      const totalExpenses = categoryBreakdown.reduce((sum, [,amt]) => sum + amt, 0)
                      const percentage = (amount / totalExpenses) * 100
                      const IconComponent = getCategoryIcon(category)
                      const colorClass = getCategoryColor(index)
                      
                      return (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          className="relative group"
                        >
                          <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-300">
                            {/* Circular Progress */}
                            <div className="relative">
                              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-gray-200"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <motion.path
                                  className={`bg-gradient-to-r ${colorClass}`}
                                  stroke="url(#gradient-${index})"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  fill="none"
                                  initial={{ strokeDasharray: "0 100" }}
                                  animate={{ strokeDasharray: `${percentage} 100` }}
                                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <defs>
                                  <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={index === 0 ? '#8b5cf6' : index === 1 ? '#3b82f6' : index === 2 ? '#10b981' : index === 3 ? '#f97316' : '#6366f1'} />
                                    <stop offset="100%" stopColor={index === 0 ? '#ec4899' : index === 1 ? '#06b6d4' : index === 2 ? '#059669' : index === 3 ? '#dc2626' : '#8b5cf6'} />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className={`p-2 rounded-full bg-gradient-to-r ${colorClass}`}>
                                  <IconComponent className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            </div>
                            
                            {/* Category Info */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-800 text-lg">{category}</h3>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-800">{formatCurrency(amount)}</p>
                                  <p className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</p>
                                </div>
                              </div>
                              
                              {/* Animated Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                                  className={`h-full bg-gradient-to-r ${colorClass} rounded-full relative`}
                                >
                                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </motion.div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Rank Badge */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                            className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                          >
                            {index + 1}
                          </motion.div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Quick Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-8 mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-center"
              >
                <motion.div 
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="text-2xl font-bold mb-1"
                >
                  {formatCurrency(stats.monthlyIncome - stats.monthlyExpenses)}
                </motion.div>
                <div className="text-indigo-100 text-sm">{t('monthlySavings')}</div>
              </motion.div>
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-center"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 200 }}
                  className="text-2xl font-bold mb-1"
                >
                  {goals.filter(g => !g.completed).length}
                </motion.div>
                <div className="text-indigo-100 text-sm">{t('activeGoals')}</div>
              </motion.div>
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-center"
              >
                <motion.div 
                  initial={{ rotateY: 180, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                  className="text-2xl font-bold mb-1"
                >
                  {stats.monthlyTransactions}
                </motion.div>
                <div className="text-indigo-100 text-sm">{t('thisMonthTransactions')}</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Financial Health & Insights */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Financial Health Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{t('financialHealth')}</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="relative mb-6">
                  <svg className="w-32 h-32 mx-auto transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <motion.path
                      stroke={financialHealth.score >= 80 ? '#10b981' : financialHealth.score >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ strokeDasharray: "0 100" }}
                      animate={{ strokeDasharray: `${financialHealth.score} 100` }}
                      transition={{ duration: 2, delay: 0.5 }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{financialHealth.score}</div>
                      <div className="text-xs text-gray-600">Score</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Savings Rate</span>
                    <span className="font-medium">{financialHealth.savingsRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget Adherence</span>
                    <span className="font-medium">{financialHealth.budgetAdherence.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Goal Progress</span>
                    <span className="font-medium">{financialHealth.goalProgress.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Upcoming Bills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{t('upcomingBills')}</h3>
                </div>
              </div>
              <div className="p-6">
                {upcomingBills.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">No upcoming bills predicted</p>
                    <p className="text-sm text-gray-500">Add recurring transactions to see bill predictions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBills.map((bill, index) => (
                      <motion.div
                        key={`${bill.name}-${bill.dueDate}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                      >
                        <div>
                          <h4 className="font-medium text-gray-800">{bill.name}</h4>
                          <p className="text-sm text-gray-600">{bill.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-orange-600">{formatCurrency(bill.amount)}</p>
                          <p className="text-xs text-gray-500">{formatDate(bill.dueDate)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Smart Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{t('smartInsights')}</h3>
                </div>
              </div>
              <div className="p-6">
                {insights.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <p className="text-gray-600">You're doing great!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insights.map((insight, index) => {
                      const IconComponent = insight.icon
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                          className={`p-4 rounded-lg border ${
                            insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                            insight.type === 'success' ? 'bg-green-50 border-green-200' :
                            'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <IconComponent className={`w-5 h-5 mt-0.5 ${
                              insight.type === 'warning' ? 'text-yellow-600' :
                              insight.type === 'success' ? 'text-green-600' :
                              'text-blue-600'
                            }`} />
                            <div>
                              <h4 className="font-medium text-gray-800">{insight.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{t('todaySummary')}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {useMemo(() => {
                      const today = new Date().toISOString().split('T')[0]
                      return transactions.filter(t => t.date === today && t.type === 'income').length
                    }, [transactions])}
                  </div>
                  <div className="text-sm text-gray-600">Income Entries</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {useMemo(() => {
                      const today = new Date().toISOString().split('T')[0]
                      return transactions.filter(t => t.date === today && t.type === 'expense').length
                    }, [transactions])}
                  </div>
                  <div className="text-sm text-gray-600">Expense Entries</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {budgets.length}
                  </div>
                  <div className="text-sm text-gray-600">Active Budgets</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {financialHealth.score}/100
                  </div>
                  <div className="text-sm text-gray-600">Health Score</div>
                </div>
              </div>
            </div>
          </motion.div>
          
          </div>
        </div>
      </div>
    </div>
  )
}