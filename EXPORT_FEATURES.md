# Export & Share Features

## Overview
The Transactions page now includes a comprehensive Export & Share button with multiple options for exporting and sharing your transaction data.

## Features

### 📊 Export Options
1. **Export to CSV**
   - Downloads transactions in Excel-compatible CSV format
   - Includes: Date, Description, Category, Type, Amount
   - File name: `transactions-YYYY-MM-DD.csv`

2. **Export to PDF**
   - Generates a formatted PDF report with:
     - Transaction summary (total income, expenses, balance)
     - Complete transaction list in table format
     - Professional formatting with headers and pagination
   - File name: `transactions-YYYY-MM-DD.pdf`

### 📱 Share Summary
Quick sharing of transaction summary text:

1. **WhatsApp Share**
   - Opens WhatsApp with pre-formatted summary
   - Includes emoji icons and formatted text
   - Works on both mobile and desktop

2. **Telegram Share**
   - Opens Telegram with transaction summary
   - Clean, formatted message ready to send

3. **Email Share**
   - Opens default email client
   - Pre-filled subject and body with transaction summary
   - Professional format for business use

### 📤 Share Files
Advanced file sharing (requires modern browser support):

1. **Share CSV File**
   - Uses native device sharing if available
   - Shares actual CSV file through device share menu
   - Fallback to download if sharing not supported

2. **Share PDF Summary**
   - Shares transaction summary text through native sharing
   - Works with any app that accepts text sharing

## Usage

1. Navigate to the Transactions page
2. Click the "Export & Share" button (blue gradient button)
3. Select your desired export or sharing option from the dropdown menu
4. The action will be performed automatically with success notifications

## Browser Compatibility

- **CSV/PDF Export**: Works in all modern browsers
- **Basic Sharing**: Works in all browsers
- **File Sharing**: Requires modern browsers with Web Share API support
- **Mobile**: Full functionality on iOS Safari and Android Chrome

## Technical Details

- Uses jsPDF for PDF generation
- Uses FileSaver.js for reliable downloads
- Implements Web Share API for native sharing
- Graceful fallbacks for unsupported features
- Toast notifications for user feedback

## File Formats

### CSV Structure
```
Date,Description,Category,Type,Amount
2024-01-15,"Grocery Shopping",Food,EXPENSE,45.67
2024-01-14,"Salary",Salary,INCOME,3000.00
```

### PDF Content
- Header with report title and generation date
- Summary section with totals
- Transaction table with all details
- Automatic pagination for large datasets