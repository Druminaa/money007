import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

interface PDFOptions {
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export const generateTransactionsPDF = (transactions: Transaction[], options: PDFOptions) => {
  const { formatCurrency, formatDate, totalIncome, totalExpenses, balance } = options;
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(22, 163, 74);
  doc.text('Transaction Report', 14, 20);
  
  // Summary
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Income: ${formatCurrency(totalIncome)}`, 14, 40);
  doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, 14, 50);
  doc.text(`Balance: ${formatCurrency(balance)}`, 14, 60);
  
  // Table
  const tableData = transactions.map(t => [
    formatDate(t.date),
    t.description,
    t.category,
    t.type,
    `${t.type === 'income' ? '+' : '-'}${formatCurrency(Number(t.amount))}`
  ]);
  
  doc.autoTable({
    head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
    body: tableData,
    startY: 70,
  });
  
  doc.save('transactions_report.pdf');
};