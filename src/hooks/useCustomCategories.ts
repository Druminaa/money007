import { useState, useEffect } from 'react'
import { supabase, CustomCategory } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

export function useCustomCategories() {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchCustomCategories = async () => {
    if (!user) {
      setCustomCategories([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomCategories(data || [])
    } catch (error) {
      toast.error('Failed to fetch custom categories')
    } finally {
      setLoading(false)
    }
  }

  const addCustomCategory = async (category: Omit<CustomCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('custom_categories')
        .insert([{ ...category, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setCustomCategories(prev => [data, ...prev])
      return data
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Category already exists')
      } else {
        toast.error('Failed to add custom category')
      }
      throw error
    }
  }

  const deleteCustomCategory = async (id: number) => {
    try {
      const { error } = await supabase
        .from('custom_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      setCustomCategories(prev => prev.filter(c => c.id !== id))
      toast.success('Custom category deleted')
    } catch (error) {
      toast.error('Failed to delete custom category')
      throw error
    }
  }

  useEffect(() => {
    fetchCustomCategories()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    customCategories,
    loading,
    addCustomCategory,
    deleteCustomCategory,
    refetch: fetchCustomCategories
  }
}