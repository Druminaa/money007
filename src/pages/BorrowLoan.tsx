import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  X,
  Phone,
  Mail,
  ChevronDown
} from 'lucide-react'

type LoanType = 'borrowed' | 'lent'
type LoanStatus = 'active' | 'completed' | 'overdue'
type LoanCategory = 'personal' | 'business' | 'emergency' | 'investment' | 'education' | 'medical' | 'other'

interface Loan {
  id: string
  type: LoanType
  category: LoanCategory
  amount: number
  person: string
  description: string
  date: string
  dueDate: string
  status: LoanStatus
  contact?: string
  interestRate?: number
  installments?: number
  paidAmount?: number
}

export default function BorrowLoan() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    type: 'borrowed' as LoanType,
    category: 'personal' as LoanCategory,
    amount: '',
    person: '',
    description: '',
    dueDate: '',
    contact: '',
    interestRate: '',
    installments: '',
    paidAmount: ''
  })
  const [showCategoryGrid, setShowCategoryGrid] = useState(false)

  const categories = [
    { value: 'personal', label: 'Personal Loan', icon: '👤' },
    { value: 'business', label: 'Business Loan', icon: '💼' },
    { value: 'emergency', label: 'Emergency Fund', icon: '🚨' },
    { value: 'investment', label: 'Investment', icon: '📈' },
    { value: 'education', label: 'Education', icon: '🎓' },
    { value: 'medical', label: 'Medical', icon: '🏥' },
    { value: 'other', label: 'Other', icon: '📋' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(formData.amount)
    if (!amount || !formData.person) return

    const newLoan: Loan = {
      id: Date.now().toString(),
      type: formData.type,
      category: formData.category,
      amount,
      person: formData.person,
      description: formData.description,
      date: new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate,
      status: formData.dueDate && new Date(formData.dueDate) < new Date() ? 'overdue' : 'active',
      contact: formData.contact,
      interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
      installments: formData.installments ? parseInt(formData.installments) : undefined,
      paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : 0
    }

    if (selectedLoan) {
      setLoans(loans.map(loan => loan.id === selectedLoan.id ? { ...newLoan, id: selectedLoan.id } : loan))
    } else {
      setLoans([...loans, newLoan])
    }

    resetForm()
  }

  const resetForm = () => {
    setShowModal(false)
    setSelectedLoan(null)
    setShowCategoryGrid(false)
    setFormData({ 
      type: 'borrowed', 
      category: 'personal', 
      amount: '', 
      person: '', 
      description: '', 
      dueDate: '', 
      contact: '', 
      interestRate: '', 
      installments: '', 
      paidAmount: '' 
    })
  }

  const markAsCompleted = (id: string) => {
    setLoans(loans.map(loan => 
      loan.id === id ? { ...loan, status: 'completed' as LoanStatus } : loan
    ))
  }

  const deleteLoan = (id: string) => {
    setLoans(loans.filter(loan => loan.id !== id))
  }

  const editLoan = (loan: Loan) => {
    setSelectedLoan(loan)
    setFormData({
      type: loan.type,
      category: loan.category,
      amount: loan.amount.toString(),
      person: loan.person,
      description: loan.description,
      dueDate: loan.dueDate,
      contact: loan.contact || '',
      interestRate: loan.interestRate?.toString() || '',
      installments: loan.installments?.toString() || '',
      paidAmount: loan.paidAmount?.toString() || ''
    })
    setShowModal(true)
  }

  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      const typeMatch = typeFilter === 'all' || loan.type === typeFilter
      const statusMatch = statusFilter === 'all' || loan.status === statusFilter
      const searchMatch = searchTerm === '' || 
        loan.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.description.toLowerCase().includes(searchTerm.toLowerCase())
      return typeMatch && statusMatch && searchMatch
    })
  }, [loans, typeFilter, statusFilter, searchTerm])

  const summary = useMemo(() => {
    const activeBorrowed = loans.filter(l => l.type === 'borrowed' && l.status === 'active').reduce((sum, l) => sum + l.amount, 0)
    const activeLent = loans.filter(l => l.type === 'lent' && l.status === 'active').reduce((sum, l) => sum + l.amount, 0)
    const totalBorrowed = loans.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + l.amount, 0)
    const totalLent = loans.filter(l => l.type === 'lent').reduce((sum, l) => sum + l.amount, 0)
    const overdue = loans.filter(l => l.status === 'overdue').length
    return { 
      activeBorrowed, 
      activeLent, 
      totalBorrowed,
      totalLent,
      netPosition: activeLent - activeBorrowed,
      overdue
    }
  }, [loans])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar isMobile={true} />
      
      <div className="lg:ml-20 transition-all duration-300">
        <div className="p-4 lg:p-6 pt-16 lg:pt-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-indigo-400/5 rounded-3xl"></div>
          <div className="relative z-10 max-w-7xl mx-auto">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-800">Loans & Borrowings</h1>
                      <p className="text-gray-600">Manage your lending and borrowing activities</p>
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowModal(true)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Record</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Summary Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 mb-1 font-medium">Active Borrowed</p>
                    <p className="text-2xl font-bold text-red-600">₹{summary.activeBorrowed.toFixed(0)}</p>
                  </div>
                  <div className="p-3 bg-red-200 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 mb-1 font-medium">Active Lent</p>
                    <p className="text-2xl font-bold text-green-600">₹{summary.activeLent.toFixed(0)}</p>
                  </div>
                  <div className="p-3 bg-green-200 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 mb-1 font-medium">Net Position</p>
                    <p className={`text-2xl font-bold ${summary.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.netPosition >= 0 ? '+' : '-'}₹{Math.abs(summary.netPosition).toFixed(0)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700 mb-1 font-medium">Overdue Items</p>
                    <p className="text-2xl font-bold text-orange-600">{summary.overdue}</p>
                  </div>
                  <div className="p-3 bg-orange-200 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by person or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-600" />
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Types</option>
                        <option value="borrowed">Borrowed</option>
                        <option value="lent">Lent</option>
                      </select>
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Loans Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {filteredLoans.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Records Found</h3>
                  <p className="text-gray-500 mb-6">Start tracking your borrowing and lending activities</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add First Record
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredLoans.map((loan, index) => (
                    <motion.div
                      key={loan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-lg ${
                            loan.type === 'borrowed' 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {loan.type === 'borrowed' ? 
                              <ArrowDownLeft className="w-5 h-5" /> : 
                              <ArrowUpRight className="w-5 h-5" />
                            }
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-800 text-lg">{loan.person}</h3>
                              <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                                {categories.find(c => c.value === loan.category)?.icon} {categories.find(c => c.value === loan.category)?.label}
                              </span>
                            </div>
                            <p className={`text-2xl font-bold ${
                              loan.type === 'borrowed' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              ₹{loan.amount.toLocaleString()}
                              {loan.paidAmount && loan.paidAmount > 0 && (
                                <span className="text-sm text-gray-500 ml-2">
                                  (Paid: ₹{loan.paidAmount.toLocaleString()})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            loan.status === 'completed' ? 'bg-green-100 text-green-700' :
                            loan.status === 'overdue' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {loan.status === 'completed' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                            {loan.status === 'overdue' && <AlertCircle className="w-3 h-3 inline mr-1" />}
                            {loan.status === 'active' && <Clock className="w-3 h-3 inline mr-1" />}
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          </div>
                        </div>
                      </div>

                      {loan.description && (
                        <p className="text-gray-600 mb-3 text-sm">{loan.description}</p>
                      )}

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Created: {new Date(loan.date).toLocaleDateString()}</span>
                        </div>
                        {loan.dueDate && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {loan.contact && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="w-4 h-4 mr-2" />
                            <span>{loan.contact}</span>
                          </div>
                        )}
                        {loan.interestRate && (
                          <div className="flex items-center text-sm text-gray-500">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            <span>Interest: {loan.interestRate}%</span>
                          </div>
                        )}
                        {loan.installments && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Installments: {loan.installments}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                        {loan.status === 'active' && (
                          <button
                            onClick={() => markAsCompleted(loan.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mark as completed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => editLoan(loan)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteLoan(loan.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Enhanced Modal */}
            <AnimatePresence>
              {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <Plus className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">
                              {selectedLoan ? 'Edit Record' : 'Add New Record'}
                            </h2>
                            <p className="text-blue-100 text-sm">Track your borrowing and lending</p>
                          </div>
                        </div>
                        <button
                          onClick={resetForm}
                          className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                      {/* Type Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Transaction Type</label>
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFormData({...formData, type: 'borrowed'})}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                              formData.type === 'borrowed'
                                ? 'border-red-500 bg-red-50 text-red-700 shadow-md'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <ArrowDownLeft className="w-6 h-6" />
                            <span className="font-semibold text-sm">I Borrowed</span>
                            <span className="text-xs opacity-75">Money I owe</span>
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFormData({...formData, type: 'lent'})}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                              formData.type === 'lent'
                                ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <ArrowUpRight className="w-6 h-6" />
                            <span className="font-semibold text-sm">I Lent</span>
                            <span className="text-xs opacity-75">Money owed to me</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-medium"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowCategoryGrid(!showCategoryGrid)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-left flex items-center justify-between bg-white"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{categories.find(c => c.value === formData.category)?.icon}</span>
                              <span className="font-medium">{categories.find(c => c.value === formData.category)?.label}</span>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCategoryGrid ? 'rotate-180' : ''}`} />
                          </button>
                          
                          <AnimatePresence>
                            {showCategoryGrid && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-3"
                              >
                                <div className="grid grid-cols-2 gap-2">
                                  {categories.map((category) => (
                                    <motion.button
                                      key={category.value}
                                      type="button"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        setFormData({...formData, category: category.value as LoanCategory})
                                        setShowCategoryGrid(false)
                                      }}
                                      className={`p-3 rounded-lg border transition-all flex items-center space-x-2 text-sm ${
                                        formData.category === category.value
                                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                                          : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                                      }`}
                                    >
                                      <span className="text-base">{category.icon}</span>
                                      <span className="font-medium truncate">{category.label}</span>
                                    </motion.button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Person Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Person Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.person}
                            onChange={(e) => setFormData({...formData, person: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter person's name"
                            required
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                          placeholder="What was this loan for?"
                          rows={3}
                        />
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date (Optional)</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {/* Contact */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact (Optional)</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.contact}
                            onChange={(e) => setFormData({...formData, contact: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Phone number or email"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={resetForm}
                          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg"
                        >
                          {selectedLoan ? 'Update Record' : 'Add Record'}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  )
}