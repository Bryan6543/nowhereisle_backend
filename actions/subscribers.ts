'use server'

import { createServerClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import type { Subscriber } from '@/types'

export async function getSubscribers() {
  const supabase = createServerClient()

  const { data, error, count } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return { subscribers: [], count: 0, activeCount: 0 }
  }

  const subscribers = (data as Subscriber[]) || []
  const activeCount = subscribers.filter((s) => !s.unsubscribed_at).length

  return {
    subscribers,
    count: count || 0,
    activeCount,
  }
}

export async function getActiveSubscribers(tags: string[] = []) {
  const supabase = createServerClient()

  let query = supabase
    .from('newsletter_subscribers')
    .select('*')
    .is('unsubscribed_at', null)

  // If tags provided, only subscribers that have ANY of those tags
  if (tags.length > 0) {
    query = query.overlaps('tags', tags)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return (data as Subscriber[]) || []
}

export async function updateSubscriberNote(id: number, note: string | null) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ note: note?.trim() || null })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/subscribers')
  return { success: true }
}

export async function updateSubscriberTags(id: number, tags: string[]) {
  const supabase = createServerClient()
  const cleanTags = tags.map((t) => t.trim().toLowerCase()).filter(Boolean)

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ tags: cleanTags })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/subscribers')
  return { success: true }
}

export async function deleteSubscriber(id: number) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/subscribers')
  return { success: true }
}

export async function unsubscribeByToken(token: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .is('unsubscribed_at', null)
    .select('email')
    .single()

  if (error || !data) {
    return { success: false, error: 'Invalid or already unsubscribed' }
  }

  return { success: true, email: data.email }
}
