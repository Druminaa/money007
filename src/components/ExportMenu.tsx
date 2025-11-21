import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../context/ToastContext'
import { usePreferences } from '../context/PreferencesContext'
import { jsPDF } from 'jspdf'
import { saveAs } from 'file-saver'
import { 
  Download, 
  FileText, 
  Table, 
  Share2,
  MessageCircle,
  Send,
  Mail
} from 'lucide-react'

interface Transaction {
  id: number
  description: string
  amount: number
  date: string
  category: string
  type: 'income' | 'expense'
}

interface ExportMenuProps {
  transactions: Transaction[]
}

export function ExportMenu({ transactions }: ExportMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const { toast } = useToast()
  const { formatCurrency, formatDate, t } = usePreferences()

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount']
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        formatDate(t.date),
        `"${t.description}"`,
        t.category,
        t.type.toUpperCase(),
        Number(t.amount)
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `transactions-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('CSV exported successfully!')
    setShowMenu(false)
  }

  const exportToPDF = () => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
    const balance = totalIncome - totalExpenses

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Transaction Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #0891b2; }
    .summary { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-item { display: flex; justify-content: space-between; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #0891b2; color: white; }
    .income { color: #10b981; }
    .expense { color: #ef4444; }
  </style>
</head>
<body>
  <h1>Transaction Report</h1>
  <p>Generated on ${new Date().toLocaleDateString()}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-item"><strong>Total Income:</strong> <span class="income">${formatCurrency(totalIncome)}</span></div>
    <div class="summary-item"><strong>Total Expenses:</strong> <span class="expense">${formatCurrency(totalExpenses)}</span></div>
    <div class="summary-item"><strong>Balance:</strong> <span>${formatCurrency(balance)}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Title</th>
        <th>Category</th>
        <th>Type</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.map(transaction => `
        <tr>
          <td>${formatDate(transaction.date)}</td>
          <td>${transaction.description}</td>
          <td>${transaction.category}</td>
          <td class="${transaction.type}">${transaction.type}</td>
          <td class="${transaction.type}">${formatCurrency(Number(transaction.amount))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transaction-report-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(t('pdfGeneratedSuccess') || 'HTML report generated successfully!')
    setShowMenu(false)
  }

  const generateSummaryText = () => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
    const balance = totalIncome - totalExpenses

    return `💰 Transaction Summary\n\n📊 Total Transactions: ${transactions.length}\n💵 Income: ${formatCurrency(totalIncome)}\n💸 Expenses: ${formatCurrency(totalExpenses)}\n💰 Balance: ${formatCurrency(balance)}\n\n📱 Generated from Money Manager App`
  }

  const shareViaWhatsApp = () => {
    const summary = generateSummaryText()
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(summary)}`
    window.open(whatsappUrl, '_blank')
    toast.success('Shared to WhatsApp!')
    setShowMenu(false)
  }

  const shareViaTelegram = () => {
    const summary = generateSummaryText()
    const telegramUrl = `https://t.me/share/url?text=${encodeURIComponent(summary)}`
    window.open(telegramUrl, '_blank')
    toast.success('Shared to Telegram!')
    setShowMenu(false)
  }

  const shareViaEmail = () => {
    const summary = generateSummaryText()
    const subject = 'Transaction Summary - Money Manager'
    const body = summary.replace(/\\n/g, '%0D%0A')
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(emailUrl)
    toast.success('Email client opened!')
    setShowMenu(false)
  }

  const shareFiles = async (type: 'csv' | 'pdf') => {
    if (navigator.share && navigator.canShare) {
      try {
        if (type === 'csv') {
          const headers = ['Date', 'Description', 'Category', 'Type', 'Amount']
          const csvContent = [
            headers.join(','),
            ...transactions.map(t => [
              formatDate(t.date),
              `"${t.description}"`,
              t.category,
              t.type.toUpperCase(),
              Number(t.amount)
            ].join(','))
          ].join('\n')
          
          const file = new File([csvContent], `transactions-${new Date().toISOString().split('T')[0]}.csv`, {
            type: 'text/csv'
          })
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Transaction Data'
            })
            toast.success('CSV file shared successfully!')
          } else {
            toast.error('File sharing not supported')
          }
        } else {
          const summary = generateSummaryText()
          await navigator.share({
            title: 'Transaction Summary',
            text: summary
          })
          toast.success('Shared successfully!')
        }
      } catch (error) {
        toast.error('Sharing failed')
      }
    } else {
      toast.error('Sharing not supported on this device')
    }
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
      >
        <Download className="w-5 h-5" />
        <span>Export & Share</span>
      </motion.button>
      
      <AnimatePresence>
        {showMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
            <h3 className="text-white font-semibold text-lg">Export & Share</h3>
            <p className="text-blue-100 text-sm">Choose your preferred option</p>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Export Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Download Files</h4>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={exportToCSV}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl border border-green-200 transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-2 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors">
                      <Table className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">CSV File</div>
                      <div className="text-xs text-gray-500">Excel format</div>
                    </div>
                  </div>
                </motion.button>
                
                <motion.button
                  onClick={exportToPDF}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-gradient-to-br from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 rounded-xl border border-red-200 transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-2 bg-red-500 rounded-lg group-hover:bg-red-600 transition-colors">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">PDF Report</div>
                      <div className="text-xs text-gray-500">Formatted</div>
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>
            
            {/* Share Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Quick Share</h4>
              <div className="space-y-2">
                <motion.button
                  onClick={shareViaWhatsApp}
                  whileHover={{ x: 4 }}
                  className="w-full p-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">WhatsApp</span>
                </motion.button>
                
                <motion.button
                  onClick={shareViaTelegram}
                  whileHover={{ x: 4 }}
                  className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl"
                >
                  <Send className="w-5 h-5" />
                  <span className="font-medium">Telegram</span>
                </motion.button>
                
                <motion.button
                  onClick={shareViaEmail}
                  whileHover={{ x: 4 }}
                  className="w-full p-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl"
                >
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">Email</span>
                </motion.button>
              </div>
            </div>
            
            {/* Advanced Share */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Advanced Share</h4>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={() => shareFiles('csv')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 rounded-xl border border-orange-200 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-2">
                    <Share2 className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Share CSV</span>
                  </div>
                </motion.button>
                
                <motion.button
                  onClick={() => shareFiles('pdf')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 rounded-xl border border-indigo-200 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-2">
                    <Share2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Share PDF</span>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
      
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}