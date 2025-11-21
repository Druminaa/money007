import { useState, useEffect } from 'react'
import { supabase, Transaction, Budget, Goal, UserSettings, UserProfile } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchTransactions = async () => {
    if (!user) {
      setTransactions([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      toast.error('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setTransactions(prev => [data, ...prev])
      toast.success('Transaction added successfully!')
      return data
    } catch (error) {
      toast.error('Failed to add transaction')
      throw error
    }
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single()

      if (error) throw error
      setTransactions(prev => prev.map(t => t.id === id ? data : t))
      toast.success('Transaction updated successfully!')
      return data
    } catch (error) {
      toast.error('Failed to update transaction')
      throw error
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      setTransactions(prev => prev.filter(t => t.id !== id))
      toast.success('Transaction deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete transaction')
      throw error
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [user])

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions
  }
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchBudgets = async () => {
    if (!user) {
      setBudgets([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBudgets(data || [])
    } catch (error) {
      toast.error('Failed to fetch budgets')
    } finally {
      setLoading(false)
    }
  }

  const addBudget = async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{ ...budget, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setBudgets(prev => [data, ...prev])
      toast.success('Budget added successfully!')
      return data
    } catch (error) {
      toast.error('Failed to add budget')
      throw error
    }
  }

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single()

      if (error) throw error
      setBudgets(prev => prev.map(b => b.id === id ? data : b))
      toast.success('Budget updated successfully!')
      return data
    } catch (error) {
      toast.error('Failed to update budget')
      throw error
    }
  }

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      setBudgets(prev => prev.filter(b => b.id !== id))
      toast.success('Budget deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete budget')
      throw error
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [user])

  return {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchBudgets
  }
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchGoals = async () => {
    if (!user) {
      setGoals([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGoals(data || [])
    } catch (error) {
      toast.error('Failed to fetch goals')
    } finally {
      setLoading(false)
    }
  }

  const addGoal = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([{ ...goal, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setGoals(prev => [data, ...prev])
      toast.success('Goal added successfully!')
      return data
    } catch (error) {
      toast.error('Failed to add goal')
      throw error
    }
  }

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single()

      if (error) throw error
      setGoals(prev => prev.map(g => g.id === id ? data : g))
      toast.success('Goal updated successfully!')
      return data
    } catch (error) {
      toast.error('Failed to update goal')
      throw error
    }
  }

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      setGoals(prev => prev.filter(g => g.id !== id))
      toast.success('Goal deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete goal')
      throw error
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [user])

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchSettings = async () => {
    if (!user) {
      setSettings(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (!data) {
        // Create default settings
        const defaultSettings = {
          user_id: user.id,
          currency: 'INR',
          language: 'en',
          date_format: 'dd-mm-yyyy',
          theme: 'light',
          email_notifications: true,
          push_notifications: true,
          budget_alerts: true,
          goal_reminders: true,
          weekly_reports: false,
          two_factor_auth: false,
          login_alerts: true
        }
        
        const { data: newData, error: insertError } = await supabase
          .from('user_settings')
          .insert([defaultSettings])
          .select()
          .single()
          
        if (insertError) throw insertError
        setSettings(newData)
      } else {
        setSettings(data)
      }
    } catch (error) {
      toast.error('Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      setSettings(data)
      toast.success('Settings updated successfully!')
      return data
    } catch (error) {
      toast.error('Failed to update settings')
      throw error
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [user])

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Profile fetch error:', error)
        setProfile(null)
      } else if (!data) {
        // No profile exists, set null
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return

    try {
      if (!profile) {
        // Create new profile if it doesn't exist
        const newProfile = {
          user_id: user.id,
          full_name: updates.full_name || 'User',
          phone: updates.phone || '',
          location: updates.location || '',
          date_of_birth: updates.date_of_birth || '',
          bio: updates.bio || '',
          avatar_url: updates.avatar_url || ''
        }
        
        const { data, error } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single()
          
        if (error) throw error
        setProfile(data)
        toast.success('Profile created successfully!')
        return data
      } else {
        // Update existing profile
        const { data, error } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error
        setProfile(data)
        toast.success('Profile updated successfully!')
        return data
      }
    } catch (error) {
      toast.error('Failed to update profile')
      throw error
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [user])

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile
  }
}