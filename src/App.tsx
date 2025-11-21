import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { PreferencesProvider } from './context/PreferencesContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import EmailConfirmation from './pages/EmailConfirmation'
import ResendConfirmation from './pages/ResendConfirmation'
import Transactions from './pages/Transactions'
import Budget from './pages/Budget'
import Goals from './pages/Goals'
import Analytics from './pages/Analytics'
import BorrowLoan from './pages/BorrowLoan'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import ResetPassword from './pages/ResetPassword'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" />
}

function PublicRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth()
  return !user ? <>{children}</> : <Navigate to="/dashboard" />
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <PreferencesProvider>
          <Router>
          <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } />
            <Route path="/confirm" element={<EmailConfirmation />} />
            <Route path="/resend-confirmation" element={<ResendConfirmation />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } />

            <Route path="/budget" element={
              <ProtectedRoute>
                <Budget />
              </ProtectedRoute>
            } />
            <Route path="/goals" element={
              <ProtectedRoute>
                <Goals />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/borrow-loan" element={
              <ProtectedRoute>
                <BorrowLoan />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </div>
          </Router>
        </PreferencesProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App