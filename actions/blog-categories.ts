'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BlogCategory } from '@/types'

// Helper: turn "My Category" → "my-category"
function createSlug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}

// ============================================
// GET all blog categories
// ============================================
export async function getBlogCategories(): Promise<BlogCategory[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('getBlogCategories error:', error)
    return []
  }

  return data as BlogCategory[]
}

// ============================================
// CREATE a new category
// ============================================
export async function createBlogCategory(name: string) {
  const supabase = createServerClient()

  if (!name.trim()) {
    return { success: false, error: 'Name is required' }
  }

  const slug = createSlug(name)

  const { error } = await supabase
    .from('blog_categories')
    .insert({ name: name.trim(), slug })

  if (error) {
    console.error('createBlogCategory error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/categories')
  revalidatePath('/blogs')
  return { success: true }
}

// ============================================
// UPDATE a category
// ============================================
export async function updateBlogCategory(id: number, name: string) {
  const supabase = createServerClient()

  if (!name.trim()) {
    return { success: false, error: 'Name is required' }
  }

  const slug = createSlug(name)

  const { error } = await supabase
    .from('blog_categories')
    .update({ name: name.trim(), slug })
    .eq('id', id)

  if (error) {
    console.error('updateBlogCategory error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/categories')
  revalidatePath('/blogs')
  return { success: true }
}

// ============================================
// DELETE a category
// ============================================
export async function deleteBlogCategory(id: number) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('blog_categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteBlogCategory error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/categories')
  revalidatePath('/blogs')
  return { success: true }
}