'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Artwork } from '@/types'
import { unstable_noStore as noStore } from 'next/cache'

// ============================================
// GET all artworks (optionally filter by category)
// ============================================
export async function getArtworks(category?: string): Promise<Artwork[]> {
  noStore()
  const supabase = createServerClient()

  let query = supabase
    .from('artworks')
    .select('*')
    .order('created_at', { ascending: false })

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('getArtworks error:', error)
    return []
  }

  return data as Artwork[]
}

// ============================================
// CREATE a new artwork (with image upload)
// ============================================
export async function createArtwork(formData: FormData) {
  const supabase = createServerClient()

  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const description = (formData.get('description') as string) || ''

  // Basic validation
  if (!file || !title || !category) {
    return { success: false, error: 'Missing required fields' }
  }

  // Create a unique file name
  const extension = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

  // 1. Upload image to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('artworks')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { success: false, error: uploadError.message }
  }

  // 2. Get the public URL of the uploaded image
  const {
    data: { publicUrl },
  } = supabase.storage.from('artworks').getPublicUrl(fileName)

  // 3. Insert the artwork record into the database
  const { data, error: dbError } = await supabase
    .from('artworks')
    .insert({
      title,
      description,
      image_url: publicUrl,
      category,
    })
    .select()
    .single()

  if (dbError) {
    console.error('Database insert error:', dbError)
    return { success: false, error: dbError.message }
  }

  // Tell Next.js to refresh the artworks page
  revalidatePath('/artworks')

  return { success: true, data }
}

// ============================================
// DELETE an artwork
// ============================================
export async function deleteArtwork(id: string) {
  const supabase = createServerClient()

  const { error } = await supabase.from('artworks').delete().eq('id', id)

  if (error) {
    console.error('deleteArtwork error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/artworks')
  return { success: true }
}