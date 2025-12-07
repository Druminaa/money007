import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import Sidebar from '../components/layout/Sidebar'
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  TrendingUp,
  X,
  Phone,
  ChevronDown,
  Wallet
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
    paidAmount: ''
  })
  const [showCategoryGrid, setShowCategoryGrid] = useState(false)

  const categories = [
    { value: 'personal', label: 'Personal', icon: '👤' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'emergency', label: 'Emergency', icon: '🚨' },
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
    const overdue = loans.filter(l => l.status === 'overdue').length
    return { 
      activeBorrowed, 
      activeLent, 
      netPosition: activeLent - activeBorrowed,
      overdue
    }
  }, [loans])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar />
      <Sidebar isMobile={true} />
      
      <div className="lg:ml-20 transition-all duration-300">
        <div className="p-4 lg:p-6 pt-16 lg:pt-6 max-w-7xl mx-auto">
            
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">Borrow & Loan</h1>
                  <p className="text-blue-100 text-sm">Track money you've borrowed and lent</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-white text-blue-600 px-4 py-2 lg:px-6 lg:py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center space-x-2 shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden lg:inline">Add Record</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-4 shadow-md text-white">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowDownLeft className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">You Borrowed</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold">₹{summary.activeBorrowed.toLocaleString()}</p>
              <p className="text-xs opacity-75 mt-1">Active debt</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 shadow-md text-white">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowUpRight className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">You Lent</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold">₹{summary.activeLent.toLocaleString()}</p>
              <p className="text-xs opacity-75 mt-1">To receive</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 shadow-md text-white">
              <div className="flex items-center space-x-2 mb-2">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Net Position</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold">
                {summary.netPosition >= 0 ? '+' : ''}₹{summary.netPosition.toLocaleString()}
              </p>
              <p className="text-xs opacity-75 mt-1">{summary.netPosition >= 0 ? 'In your favor' : 'You owe'}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-4 shadow-md text-white">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Overdue</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold">{summary.overdue}</p>
              <p className="text-xs opacity-75 mt-1">Pending items</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search person or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="borrowed">Borrowed</option>
                  <option value="lent">Lent</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            {filteredLoans.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No records yet</h3>
                <p className="text-gray-500 text-sm mb-6">Start tracking your loans and borrowings</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add First Record
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="bg-white rounded-xl p-5 hover:shadow-md transition-all border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2.5 rounded-lg shrink-0 ${
                          loan.type === 'borrowed' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {loan.type === 'borrowed' ? 
                            <ArrowDownLeft className="w-5 h-5" /> : 
                            <ArrowUpRight className="w-5 h-5" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800">{loan.person}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              loan.status === 'completed' ? 'bg-green-100 text-green-700' :
                              loan.status === 'overdue' ? 'bg-red-100 text-red-700' : 
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {loan.status}
                            </span>
                          </div>
                          <p className={`text-xl font-bold mb-1 ${
                            loan.type === 'borrowed' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ₹{loan.amount.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {categories.find(c => c.value === loan.category)?.icon} {categories.find(c => c.value === loan.category)?.label}
                            </span>
                            {loan.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due: {new Date(loan.dueDate).toLocaleDateString('en-GB')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {loan.status === 'active' && (
                          <button
                            onClick={() => markAsCompleted(loan.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mark completed"
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
                    </div>

                    {loan.description && (
                      <p className="text-gray-600 text-sm mb-3 pl-11">{loan.description}</p>
                    )}
                    {(loan.contact || loan.interestRate || loan.paidAmount) && (
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 pl-11">
                        {loan.contact && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {loan.contact}
                          </span>
                        )}
                        {loan.interestRate && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {loan.interestRate}% interest
                          </span>
                        )}
                        {loan.paidAmount && loan.paidAmount > 0 && (
                          <span className="text-green-600 font-medium">
                            Paid: ₹{loan.paidAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <AnimatePresence>
            {showModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Transaction Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
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
                        </button>
                        <button
                          type="button"
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
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">₹</span>
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
                        
                        {showCategoryGrid && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-3">
                            <div className="grid grid-cols-2 gap-2">
                              {categories.map((category) => (
                                <button
                                  key={category.value}
                                  type="button"
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
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

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

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg"
                      >
                        {selectedLoan ? 'Update Record' : 'Add Record'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
