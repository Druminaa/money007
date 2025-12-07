import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../components/layout/Sidebar'
import { useTransactions, useBudgets, useGoals } from '../hooks/useSupabase'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Filter, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3 
} from 'lucide-react'

type DatePeriod = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ff0000']

export default function Analytics() {
  const { transactions } = useTransactions()
  const { budgets } = useBudgets()
  const { goals } = useGoals()
  const [dateFilter, setDateFilter] = useState<DatePeriod>('all')
  const [selectedDate, setSelectedDate] = useState(new Date())

  const getDateRange = (date: Date, period: DatePeriod) => {
    if (period === 'all') return { start: new Date(0), end: new Date(9999, 11, 31) }
    
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()

    switch (period) {
      case 'daily':
        return {
          start: new Date(year, month, day, 0, 0, 0, 0),
          end: new Date(year, month, day, 23, 59, 59, 999)
        }
      case 'weekly':
        const dayOfWeek = date.getDay()
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        return {
          start: new Date(year, month, day - daysToMonday, 0, 0, 0, 0),
          end: new Date(year, month, day - daysToMonday + 6, 23, 59, 59, 999)
        }
      case 'monthly':
        return {
          start: new Date(year, month, 1, 0, 0, 0, 0),
          end: new Date(year, month + 1, 0, 23, 59, 59, 999)
        }
      case 'yearly':
        return {
          start: new Date(year, 0, 1, 0, 0, 0, 0),
          end: new Date(year, 11, 31, 23, 59, 59, 999)
        }
      default:
        return { start: new Date(0), end: new Date(9999, 11, 31) }
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
    if (dateFilter === 'all') return 'All Time Analytics'
    
    const { start, end } = getDateRange(selectedDate, dateFilter)
    switch (dateFilter) {
      case 'daily':
        const today = new Date()
        if (selectedDate.toDateString() === today.toDateString()) {
          return 'Today - ' + selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })
        }
        return selectedDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      case 'weekly':
        return `Week: ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      case 'monthly':
        return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      case 'yearly':
        return selectedDate.getFullYear().toString()
      default:
        return 'All Time Analytics'
    }
  }

  const filteredTransactions = useMemo(() => {
    if (dateFilter === 'all') return transactions
    
    const { start, end } = getDateRange(selectedDate, dateFilter)
    const startTime = start.getTime()
    const endTime = end.getTime()
    
    return transactions.filter(transaction => {
      try {
        const transactionTime = new Date(transaction.date || '').getTime()
        return !isNaN(transactionTime) && transactionTime >= startTime && transactionTime <= endTime
      } catch {
        return false
      }
    })
  }, [transactions, dateFilter, selectedDate])

  const analytics = useMemo(() => {
    // Category breakdown
    const categoryData = filteredTransactions
      .filter(transaction => transaction.type === 'expense')
      .reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + Number(transaction.amount)
        return acc
      }, {} as Record<string, number>)

    const pieData = Object.entries(categoryData).map(([category, amount]) => ({
      name: category,
      value: amount
    }))

    // Monthly trends
    const monthlyData = filteredTransactions.reduce((acc, transaction) => {
      try {
        const month = (transaction.date || '').slice(0, 7)
        if (month && !acc[month]) acc[month] = { month, income: 0, expense: 0 }
        if (month) acc[month][transaction.type] += Number(transaction.amount || 0)
      } catch {}
      return acc
    }, {} as Record<string, any>)

    const trendData = Object.values(monthlyData).map((monthlyEntry: any) => ({
      ...monthlyEntry,
      savings: monthlyEntry.income - monthlyEntry.expense
    }))

    // Summary stats
    const totalIncome = filteredTransactions.filter(transaction => transaction.type === 'income').reduce((acc, transaction) => acc + Number(transaction.amount), 0)
    const totalExpenses = filteredTransactions.filter(transaction => transaction.type === 'expense').reduce((acc, transaction) => acc + Number(transaction.amount), 0)
    const completedGoals = goals.filter(g => g.completed).length
    const budgetAdherence = budgets.length > 0 
      ? budgets.filter(b => {
          try {
            const spent = filteredTransactions
              .filter(transaction => transaction.type === 'expense' && transaction.category === b.category && transaction.date?.startsWith(b.month || ''))
              .reduce((acc, transaction) => acc + Number(transaction.amount || 0), 0)
            return spent <= Number(b.amount || 0)
          } catch {
            return false
          }
        }).length / budgets.length * 100
      : 0

    return {
      pieData,
      trendData,
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      completedGoals,
      budgetAdherence
    }
  }, [filteredTransactions, budgets, goals])

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      <Sidebar />
      
      <div className="lg:ml-20 transition-all duration-300">
        <div className="p-6 lg:p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 rounded-3xl"></div>
          <div className="relative z-10">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Analytics & Insights</h1>
                  <p className="text-gray-600">Understand your financial patterns and trends</p>
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
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Filter Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as DatePeriod[]).map((period) => (
                      <button
                        key={period}
                        onClick={() => setDateFilter(period)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                          dateFilter === period
                            ? 'bg-cyan-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-cyan-50'
                        }`}
                      >
                        {period === 'all' ? <Filter className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                        <span>{period.charAt(0).toUpperCase() + period.slice(1)}</span>
                      </button>
                    ))}
                  </div>

                  {/* Date Navigation */}
                  {dateFilter !== 'all' && (
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => navigateDate('prev')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      <div className="text-center min-w-[250px]">
                        <h3 className="font-semibold text-gray-800">{formatDateRange()}</h3>
                      </div>

                      <button
                        onClick={() => navigateDate('next')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Net Savings</p>
                    <p className={`text-2xl font-bold ${analytics.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{analytics.netSavings.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Goals Completed</p>
                    <p className="text-2xl font-bold text-purple-600">{analytics.completedGoals}</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Budget Adherence</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.budgetAdherence.toFixed(0)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg Monthly Expense</p>
                    <p className="text-2xl font-bold text-red-600">
                      ₹{analytics.trendData.length > 0 
                        ? (analytics.totalExpenses / analytics.trendData.length).toFixed(2)
                        : '0.00'
                      }
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </motion.div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Expense Breakdown */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Breakdown</h3>
                {analytics.pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No expense data available
                  </div>
                )}
              </motion.div>

              {/* Monthly Trends */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trends</h3>
                {analytics.trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, '']} />
                      <Bar dataKey="income" fill="#10b981" name="Income" />
                      <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No transaction data available
                  </div>
                )}
              </motion.div>

              {/* Savings Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 lg:col-span-2"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Savings Trend</h3>
                {analytics.trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Savings']} />
                      <Line 
                        type="monotone" 
                        dataKey="savings" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No savings data available
                  </div>
                )}
              </motion.div>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}