import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend the jsPDF interface to include the autoTable method
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
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(22, 163, 74); // Emerald-600 color
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Report', 14, 16);

  // Summary Section
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55); // text-gray-800
  doc.text('Summary', 14, 40);

  const summaryY = 48;
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99); // text-gray-600
  doc.text('Total Income:', 14, summaryY);
  doc.text('Total Expenses:', 70, summaryY);
  doc.text('Balance:', 140, summaryY);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 107, 74); // text-green-700
  doc.text(formatCurrency(totalIncome), 14, summaryY + 6);
  doc.setTextColor(190, 24, 93); // text-red-700
  doc.text(formatCurrency(totalExpenses), 70, summaryY + 6);
  doc.setTextColor(balance >= 0 ? '#166c4a' : '#be185d'); // green or red
  doc.text(formatCurrency(balance), 140, summaryY + 6);

  // Define table columns
  const tableColumn = ["Date", "Description", "Category", "Type", "Amount"];
  const tableRows: (string | number)[][] = [];

  // Populate table rows with transaction data
  transactions.forEach(transaction => {
    const transactionData = [
      formatDate(transaction.date),
      transaction.description,
      transaction.category,
      transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
      `${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(Number(transaction.amount))}`
    ];
    tableRows.push(transactionData);
  });

  // Add the table to the PDF
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 70,
    theme: 'grid',
    headStyles: {
      fillColor: [4, 120, 87], // Emerald-700
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244], // Emerald-50
    },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(150);
      const pageCount = doc.getNumberOfPages();
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, data.settings.margin.left, pageHeight - 10);
      doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - data.settings.margin.right, pageHeight - 10, { align: 'right' });
    }
  });

  // Save the PDF
  doc.save('transactions_report.pdf');
};