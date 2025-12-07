#!/bin/bash

echo "🚀 Installing Money Manager Improvements..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "📚 Next steps:"
    echo "1. Run 'npm run dev' to start the development server"
    echo "2. Open START_HERE.md for a quick guide"
    echo "3. Read IMPLEMENTATION_SUMMARY.md for full details"
    echo ""
    echo "🧪 Test the improvements:"
    echo "- Go to /signup and test password validation"
    echo "- Try rate limiting on /login (5 wrong attempts)"
    echo "- Test input sanitization in forms"
    echo ""
    echo "📖 Documentation files created:"
    echo "- START_HERE.md (Quick start guide)"
    echo "- IMPLEMENTATION_SUMMARY.md (Complete overview)"
    echo "- SETUP_IMPROVEMENTS.md (Setup & testing)"
    echo "- QUICK_FIXES.md (Quick reference)"
    echo "- CHECKLIST.md (Progress tracking)"
    echo "- IMPROVEMENTS.md (Detailed tracking)"
    echo ""
    echo "🎉 You're all set! Happy coding!"
else
    echo ""
    echo "❌ Installation failed. Please check the errors above."
    echo ""
    echo "💡 Try:"
    echo "1. Delete node_modules and package-lock.json"
    echo "2. Run 'npm install' again"
    echo "3. Check your internet connection"
fi
