'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Blog } from '@/types'

// ============================================
// GET all blogs (with category name)
// ============================================
export async function getBlogs(): Promise<Blog[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('blogs')
    .select(`
      *,
      blog_categories (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getBlogs error:', error)
    return []
  }

  return data as Blog[]
}

// ============================================
// GET one blog by ID
// ============================================
export async function getBlogById(id: string): Promise<Blog | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getBlogById error:', error)
    return null
  }

  return data as Blog
}

// ============================================
// CREATE a new blog
// ============================================
export async function createBlog(formData: FormData) {
  const supabase = createServerClient()

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const categoryId = formData.get('category_id') as string
  const thumbnail = formData.get('thumbnail') as File | null

  if (!title || !content) {
    return { success: false, error: 'Title and content are required' }
  }

  let thumbnailUrl: string | null = null

  // Upload thumbnail if provided
  if (thumbnail && thumbnail.size > 0) {
    const fileExt = thumbnail.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('blog-thumbnails')
      .upload(fileName, thumbnail, { upsert: true })

    if (uploadError) {
      console.error('Thumbnail upload error:', uploadError)
      return { success: false, error: 'Image upload failed: ' + uploadError.message }
    }

    const { data: urlData } = supabase.storage
      .from('blog-thumbnails')
      .getPublicUrl(fileName)

    thumbnailUrl = urlData.publicUrl
  }

  const { error } = await supabase.from('blogs').insert({
    title,
    content,
    thumbnail_url: thumbnailUrl,
    category_id: categoryId ? Number(categoryId) : null,
  })

  if (error) {
    console.error('createBlog error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/blogs')
  return { success: true }
}

// ============================================
// UPDATE an existing blog
// ============================================
export async function updateBlog(id: string, formData: FormData) {
  const supabase = createServerClient()

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const categoryId = formData.get('category_id') as string
  const newThumbnail = formData.get('thumbnail') as File | null
  const currentThumbnail = formData.get('current_thumbnail') as string | null

  if (!title || !content) {
    return { success: false, error: 'Title and content are required' }
  }

  let finalThumbnail = currentThumbnail || null

  // Upload new thumbnail if provided
  if (newThumbnail && newThumbnail.size > 0) {
    const fileName = `${Date.now()}-${newThumbnail.name}`

    const { error: uploadError } = await supabase.storage
      .from('blog-thumbnails')
      .upload(fileName, newThumbnail, { upsert: true })

    if (uploadError) {
      console.error('Thumbnail upload error:', uploadError)
      return { success: false, error: 'Upload failed: ' + uploadError.message }
    }

    const { data: urlData } = supabase.storage
      .from('blog-thumbnails')
      .getPublicUrl(fileName)

    finalThumbnail = urlData.publicUrl
  }

  const { error } = await supabase
    .from('blogs')
    .update({
      title,
      content,
      thumbnail_url: finalThumbnail,
      category_id: categoryId ? Number(categoryId) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('updateBlog error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/blogs')
  return { success: true }
}

// ============================================
// DELETE a blog
// ============================================
export async function deleteBlog(id: string) {
  const supabase = createServerClient()

  const { error } = await supabase.from('blogs').delete().eq('id', id)

  if (error) {
    console.error('deleteBlog error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/blogs')
  return { success: true }
}