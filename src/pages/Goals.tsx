import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../context/ToastContext'
import { useGoals } from '../hooks/useSupabase'
import Sidebar from '../components/Sidebar'
import { 
  Plus, 
  Edit, 
  Target, 
  CheckCircle, 
  Calendar,
  Trophy,
  Star,
  Zap,
  Home,
  Car,
  Plane,
  GraduationCap,
  Heart,
  Gift,
  Briefcase,
  X,
  TrendingUp,
  Clock,
  Award,
  Coins,
  Filter,
  Trash2
} from 'lucide-react'

export default function Goals() {
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals()
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    category: 'savings'
  })
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [recreatingGoal, setRecreatingGoal] = useState<any>(null)
  const [showRecreateNotification, setShowRecreateNotification] = useState<any>(null)

  const goalCategories = [
    { id: 'savings', name: 'Emergency Fund', icon: Target, color: 'from-blue-500 to-cyan-500' },
    { id: 'house', name: 'House/Property', icon: Home, color: 'from-green-500 to-emerald-500' },
    { id: 'car', name: 'Vehicle', icon: Car, color: 'from-purple-500 to-pink-500' },
    { id: 'vacation', name: 'Vacation', icon: Plane, color: 'from-orange-500 to-red-500' },
    { id: 'education', name: 'Education', icon: GraduationCap, color: 'from-indigo-500 to-purple-500' },
    { id: 'health', name: 'Health/Medical', icon: Heart, color: 'from-red-500 to-pink-500' },
    { id: 'gift', name: 'Gift/Special', icon: Gift, color: 'from-pink-500 to-rose-500' },
    { id: 'business', name: 'Business', icon: Briefcase, color: 'from-gray-500 to-slate-600' }
  ]

  const getCategoryInfo = (category: string) => {
    return goalCategories.find(cat => cat.id === category) || goalCategories[0]
  }

  const getAchievementBadge = (progress: number) => {
    if (progress >= 100) return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Completed!' }
    if (progress >= 75) return { icon: Award, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Almost There!' }
    if (progress >= 50) return { icon: Star, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Halfway!' }
    if (progress >= 25) return { icon: Zap, color: 'text-green-500', bg: 'bg-green-100', label: 'Good Start!' }
    return { icon: Target, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Just Started' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetAmount = parseFloat(formData.targetAmount)
    if (!targetAmount || !formData.title || !formData.deadline) return

    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, {
          title: formData.title,
          target_amount: targetAmount,
          deadline: formData.deadline
        })
      } else {
        await addGoal({
          title: formData.title,
          target_amount: targetAmount,
          current_amount: 0,
          deadline: formData.deadline,
          completed: false
        })
      }

      setShowModal(false)
      setEditingGoal(null)
      setRecreatingGoal(null)
      setFormData({ title: '', targetAmount: '', deadline: '', category: 'savings' })
    } catch (error) {
      // Error handled by hook
    }
  }

  const addProgress = async (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId)
    if (goal) {
      const newAmount = Number(goal.current_amount) + amount
      const completed = newAmount >= Number(goal.target_amount)
      
      try {
        await updateGoal(goalId, {
          current_amount: newAmount,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        
        if (completed) {
          toast.success('Goal completed! 🎉')
          // Show recreate notification after a short delay
          setTimeout(() => {
            setShowRecreateNotification(goal)
          }, 2000)
          // Auto-delete after 30 days
          setTimeout(() => {
            deleteGoal(goalId)
          }, 30 * 24 * 60 * 60 * 1000) // 30 days in milliseconds
        } else {
          toast.success('Progress added!')
        }
      } catch (error) {
        // Error handled by hook
      }
    }
  }

  const recreateGoal = (originalGoal: any) => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    setRecreatingGoal(originalGoal)
    setFormData({
      title: originalGoal.title,
      targetAmount: Number(originalGoal.target_amount).toString(),
      deadline: nextMonth.toISOString().split('T')[0],
      category: originalGoal.category || 'savings'
    })
    setShowModal(true)
  }

  const createRecurringGoal = async (originalGoal: any) => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(Math.min(nextMonth.getDate(), new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()))
    
    try {
      await addGoal({
        title: `${originalGoal.title} (Next Month)`,
        target_amount: Number(originalGoal.target_amount),
        current_amount: 0,
        deadline: nextMonth.toISOString().split('T')[0],
        completed: false,
        category: originalGoal.category || 'savings'
      })
      toast.success('Next month goal created! 🎯')
    } catch (error) {
      toast.error('Failed to create recurring goal')
    }
  }

  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      const statusMatch = statusFilter === 'all' || 
        (statusFilter === 'completed' && goal.completed) ||
        (statusFilter === 'active' && !goal.completed)
      
      const categoryMatch = categoryFilter === 'all' || goal.category === categoryFilter
      
      return statusMatch && categoryMatch
    })
  }, [goals, statusFilter, categoryFilter])

  const goalStats = useMemo(() => {
    const totalGoals = filteredGoals.length
    const completedGoals = filteredGoals.filter(g => g.completed).length
    const totalTarget = filteredGoals.reduce((sum, g) => sum + Number(g.target_amount), 0)
    const totalSaved = filteredGoals.reduce((sum, g) => sum + Number(g.current_amount), 0)
    
    return {
      totalGoals,
      completedGoals,
      totalTarget,
      totalSaved,
      completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0
    }
  }, [filteredGoals])

  useEffect(() => {
    if (goals.length > 0) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      goals.forEach(goal => {
        if (goal.completed && goal.completed_at && new Date(goal.completed_at) < thirtyDaysAgo) {
          deleteGoal(goal.id)
        }
      })
    }
  }, [goals])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50">
      <Sidebar />
      <Sidebar isMobile={true} />
      
      <div className="lg:ml-20 transition-all duration-300">
        <div className="p-6 lg:p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/10 to-orange-400/10 rounded-3xl"></div>
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
                    <div className="p-3 bg-gradient-to-r from-pink-500 to-orange-600 rounded-xl">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-800">Financial Goals</h1>
                      <p className="text-gray-600">Track your savings targets and celebrate achievements</p>
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowModal(true)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-pink-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Goal</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Filter Controls */}
            {goals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Status Filter */}
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'active', 'completed'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                            statusFilter === status
                              ? 'bg-pink-600 text-white'
                              : 'bg-white text-gray-600 hover:bg-pink-50'
                          }`}
                        >
                          {status === 'all' ? <Filter className="w-4 h-4" /> : 
                           status === 'completed' ? <Trophy className="w-4 h-4" /> : 
                           <Target className="w-4 h-4" />}
                          <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                        </button>
                      ))}
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Category:</span>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="all">All Categories</option>
                        {goalCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stats Overview */}
            {filteredGoals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
              >
                <motion.div 
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Goals</p>
                      <p className="text-2xl font-bold text-pink-600">{goalStats.totalGoals}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-pink-400 to-rose-500 rounded-xl">
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
                      <p className="text-sm text-gray-600 mb-1">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{goalStats.completedGoals}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Target</p>
                      <p className="text-2xl font-bold text-blue-600">₹{goalStats.totalTarget.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Saved</p>
                      <p className="text-2xl font-bold text-orange-600">₹{goalStats.totalSaved.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading goals...</p>
                </div>
              ) : filteredGoals.map((goal, index) => {
                const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100
                const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                
                const categoryInfo = getCategoryInfo(goal.category || 'savings')
                const IconComponent = categoryInfo.icon
                const achievement = getAchievementBadge(progress)
                const AchievementIcon = achievement.icon
                
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -8 }}
                    className={`bg-gradient-to-br from-white via-white to-gray-50/50 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group ${
                      goal.completed ? 'ring-2 ring-emerald-400 shadow-emerald-100' : ''
                    }`}
                  >
                    {/* Background Pattern */}
                    <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${categoryInfo.color} opacity-5 rounded-full group-hover:opacity-10 transition-opacity duration-500`} />
                    <div className={`absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr ${categoryInfo.color} opacity-3 rounded-full group-hover:opacity-8 transition-opacity duration-500`} />
                    
                    {/* Achievement Badge */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 + index * 0.1, type: "spring" }}
                      className={`absolute -top-3 -right-3 w-14 h-14 ${achievement.bg} rounded-full flex items-center justify-center shadow-xl border-2 border-white group-hover:scale-110 transition-transform duration-300`}
                      style={{ boxShadow: `0 0 20px ${goal.completed ? '#10b981' : '#ec4899'}20` }}
                    >
                      <AchievementIcon className={`w-7 h-7 ${achievement.color} drop-shadow-sm`} />
                    </motion.div>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center space-x-4">
                        <div className={`p-4 bg-gradient-to-r ${categoryInfo.color} rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                          <IconComponent className="w-7 h-7 text-white drop-shadow-sm" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-xl mb-1">{goal.title}</h3>
                          <p className="text-sm text-gray-500 font-medium">{categoryInfo.name}</p>
                        </div>
                      </div>
                      {!goal.completed && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingGoal(goal)
                              setFormData({
                                title: goal.title,
                                targetAmount: Number(goal.target_amount).toString(),
                                deadline: goal.deadline,
                                category: goal.category || 'savings'
                              })
                              setShowModal(true)
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this goal?')) {
                                deleteGoal(goal.id)
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Progress Circle */}
                    <div className="flex items-center justify-center mb-8">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full opacity-50"></div>
                        <svg className="w-32 h-32 transform -rotate-90 relative z-10" viewBox="0 0 36 36">
                          <path
                            className="text-gray-200"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <motion.path
                            stroke="url(#gradient-goal-${index})"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            fill="none"
                            initial={{ strokeDasharray: "0 100" }}
                            animate={{ strokeDasharray: `${Math.min(progress, 100)} 100` }}
                            transition={{ duration: 2, delay: 0.5 + index * 0.1, ease: "easeOut" }}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                          />
                          <defs>
                            <linearGradient id={`gradient-goal-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={goal.completed ? '#10b981' : '#ec4899'} />
                              <stop offset="50%" stopColor={goal.completed ? '#059669' : '#f97316'} />
                              <stop offset="100%" stopColor={goal.completed ? '#047857' : '#ea580c'} />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          <div className="text-center">
                            <div className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">{Math.round(progress)}%</div>
                            <div className="text-xs text-gray-500 font-medium mt-1">{achievement.label}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Goal Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Target</span>
                        <span className="font-semibold text-gray-800">₹{Number(goal.target_amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Saved</span>
                        <span className="font-semibold text-green-600">₹{Number(goal.current_amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Remaining</span>
                        <span className="font-semibold text-orange-600">
                          ₹{Math.max(0, Number(goal.target_amount) - Number(goal.current_amount)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm font-medium ${
                            daysLeft < 0 ? 'text-red-600' : daysLeft < 30 ? 'text-orange-600' : 'text-gray-600'
                          }`}>
                            {daysLeft > 0 ? `${daysLeft} days left` : 
                             daysLeft === 0 ? 'Due today' : 'Overdue'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(goal.deadline).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {!goal.completed && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-3 font-medium">Quick Add</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => addProgress(goal.id, 500)}
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            +₹500
                          </button>
                          <button
                            onClick={() => addProgress(goal.id, 1000)}
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            +₹1K
                          </button>
                          <button
                            onClick={() => addProgress(goal.id, 5000)}
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            +₹5K
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Completion Celebration */}
                    {goal.completed && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 pt-4 border-t border-gray-100 text-center"
                      >
                        <div className="flex items-center justify-center space-x-2 text-green-600 mb-3">
                          <Trophy className="w-5 h-5" />
                          <span className="font-semibold">Goal Achieved!</span>
                          <Trophy className="w-5 h-5" />
                        </div>
                        {goal.completed_at && (
                          <p className="text-xs text-gray-500 mb-4">
                            Completed on {new Date(goal.completed_at).toLocaleDateString('en-GB')}
                          </p>
                        )}
                        
                        <div className="space-y-3">
                          <p className="text-xs text-gray-500 font-medium text-center">Continue Your Journey</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => recreateGoal(goal)}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                            >
                              <Target className="w-4 h-4" />
                              <span>Recreate</span>
                            </button>
                            
                            <button
                              onClick={() => createRecurringGoal(goal)}
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                            >
                              <Clock className="w-4 h-4" />
                              <span>Next Month</span>
                            </button>
                          </div>
                          
                          <button
                            onClick={() => setShowModal(true)}
                            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Create New Goal</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {filteredGoals.length === 0 && goals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full text-center py-16"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/50 max-w-md mx-auto">
                  <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No goals match your filters</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filter criteria to see more goals</p>
                  <button
                    onClick={() => {
                      setStatusFilter('all')
                      setCategoryFilter('all')
                    }}
                    className="text-pink-600 hover:text-pink-700 font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </motion.div>
            )}

            {goals.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full text-center py-16"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/50 max-w-md mx-auto">
                  <div className="p-4 bg-gradient-to-r from-pink-500 to-orange-600 rounded-full w-20 h-20 mx-auto mb-6">
                    <Target className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">No goals set yet</h3>
                  <p className="text-gray-500 mb-6">Create your first financial goal and start your journey towards financial freedom</p>
                  <motion.button
                    onClick={() => setShowModal(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-pink-500 to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Goal</span>
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
                  <div className="p-2 bg-gradient-to-r from-pink-500 to-orange-600 rounded-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {editingGoal ? 'Edit Goal' : recreatingGoal ? 'Recreate Goal' : 'Create Goal'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingGoal(null)
                    setRecreatingGoal(null)
                    setFormData({ title: '', targetAmount: '', deadline: '', category: 'savings' })
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {recreatingGoal && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-700">
                    <strong>Recreating:</strong> {recreatingGoal.title} - You can modify the details below
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Goal Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {goalCategories.map(category => {
                      const IconComponent = category.icon
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 flex items-center space-x-2 ${
                            formData.category === category.id
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span className="text-sm font-medium">{category.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Emergency Fund"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter target amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingGoal(null)
                      setRecreatingGoal(null)
                      setFormData({ title: '', targetAmount: '', deadline: '', category: 'savings' })
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-orange-600 text-white rounded-xl hover:from-pink-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {editingGoal ? 'Update Goal' : recreatingGoal ? 'Recreate Goal' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recreate Goal Notification */}
      <AnimatePresence>
        {showRecreateNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="text-center">
                <div className="p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full w-20 h-20 mx-auto mb-4">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Congratulations! 🎉
                </h3>
                
                <p className="text-gray-600 mb-2">
                  You've completed your goal:
                </p>
                
                <p className="text-lg font-semibold text-emerald-600 mb-6">
                  "{showRecreateNotification.title}"
                </p>
                
                <p className="text-sm text-gray-500 mb-6">
                  Would you like to recreate this goal for next time?
                </p>
                
                <div className="space-y-3">
                  <motion.button
                    onClick={() => {
                      setShowRecreateNotification(null)
                      recreateGoal(showRecreateNotification)
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Target className="w-5 h-5" />
                    <span>Yes, Recreate Goal</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => {
                      setShowRecreateNotification(null)
                      createRecurringGoal(showRecreateNotification)
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Clock className="w-5 h-5" />
                    <span>Create for Next Month</span>
                  </motion.button>
                  
                  <button
                    onClick={() => setShowRecreateNotification(null)}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}