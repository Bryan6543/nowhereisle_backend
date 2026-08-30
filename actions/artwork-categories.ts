'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Category } from '@/types'

// ============================================
// GET all categories
// ============================================
export async function getCategories(): Promise<Category[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('artwork_categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('getCategories error:', error)
    return []
  }

  return data as Category[]
}

// ============================================
// CREATE a new category
// ============================================
export async function createCategory(name: string) {
  const supabase = createServerClient()

  if (!name.trim()) {
    return { success: false, error: 'Name is required' }
  }

  const { error } = await supabase
    .from('artwork_categories')
    .insert({ name: name.trim() })

  if (error) {
    console.error('createCategory error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/artworks')
  return { success: true }
}

// ============================================
// DELETE a category
// ============================================
export async function deleteCategory(id: string) {
  const supabase = createServerClient()

  const { error } = await supabase.from('artwork_categories').delete().eq('id', id)

  if (error) {
    console.error('deleteCategory error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/artworks')
  return { success: true }
}