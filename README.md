# Money Manager Website

A modern, responsive Money Manager application built with React, Tailwind CSS, and Framer Motion.

## Features

### 🔐 Authentication System
- **Sign Up Page**: Email, password, confirm password with validation
- **Login Page**: Email, password, "Remember Me" checkbox, forgot password link
- **Form Validation**: Email format, password matching, required fields
- **Auto-redirect**: Successful registration redirects to login, login redirects to dashboard

### 🧭 Dashboard Layout
- **Animated Sidebar**: Collapsible with hover expansion
- **Profile Section**: User avatar and name
- **Navigation Links**: Dashboard, Transactions, Analytics, Budget Planner, Goals
- **Settings & Logout**: Easy access buttons
- **Smooth Animations**: CSS transitions and Framer Motion

### 📱 Responsive Design
- **Desktop**: Full sidebar with hover expansion
- **Tablet**: Optimized layout
- **Mobile**: Hamburger menu with slide-out sidebar

### 🎨 Modern UI
- **Clean Design**: Minimalistic with pastel colors
- **Smooth Transitions**: 0.3s-0.5s ease-in-out animations
- **Consistent Styling**: Rounded corners, light shadows, proper padding
- **Interactive Elements**: Hover effects and micro-animations

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Forms**: React Hook Form

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd money-manager
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   └── Sidebar.jsx          # Animated sidebar component
├── context/
│   └── AuthContext.jsx      # Authentication context
├── pages/
│   ├── Login.jsx           # Login page
│   ├── SignUp.jsx          # Sign up page
│   ├── ForgotPassword.jsx  # Password reset page
│   └── Dashboard.jsx       # Main dashboard
├── App.jsx                 # Main app component
├── main.jsx               # React entry point
└── index.css              # Global styles

```

## Features Overview

### Authentication
- Mock authentication system (ready for backend integration)
- Form validation with error handling
- Remember me functionality
- Password visibility toggle
- Responsive design

### Dashboard
- Financial overview cards
- Recent transactions list
- Quick action buttons
- Animated components
- Mobile-responsive layout

### Sidebar Navigation
- Hover to expand on desktop
- Mobile hamburger menu
- Smooth animations
- User profile section
- Settings and logout options

## Customization

### Colors
Update the color scheme in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    50: '#f0f9ff',
    500: '#0ea5e9',
    600: '#0284c7',
  },
  // Add more colors
}
```

### Animations
Modify animations in `src/index.css` or component files using Framer Motion.

## Future Enhancements

- [ ] Backend API integration
- [ ] Real authentication with JWT
- [ ] CRUD operations for transactions
- [ ] Charts and analytics
- [ ] Budget planning features
- [ ] Goal tracking
- [ ] Profile management
- [ ] Dark mode support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.