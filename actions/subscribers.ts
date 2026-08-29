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
    return { subscribers: [], count: 0 }
  }

  return {
    subscribers: (data as Subscriber[]) || [],
    count: count || 0,
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

// Called when someone newly subscribes
export async function sendWelcomeEmail(email: string) {
  try {
    await resend.emails.send({
      from: 'Nowhere Isle <onboarding@resend.dev>', // change later
      to: email,
      subject: 'Welcome to Nowhere Isle',
      html: `
        <h1>Welcome!</h1>
        <p>Thanks for subscribing to Nowhere Isle updates.</p>
        <p>We’ll only send you meaningful news and releases.</p>
      `,
    })
    return { success: true }
  } catch (err: any) {
    console.error('Welcome email failed:', err)
    return { success: false, error: err.message }
  }
}

// 'use server'

// import { createServerClient } from '@/lib/supabase/server'
// import { revalidatePath } from 'next/cache'
// import type { Subscriber } from '@/types'

// // ============================================
// // GET all subscribers + total count
// // ============================================
// export async function getSubscribers(): Promise<{
//   subscribers: Subscriber[]
//   count: number
// }> {
//   const supabase = createServerClient()

//   const { data, error, count } = await supabase
//     .from('newsletter_subscribers')
//     .select('*', { count: 'exact' })
//     .order('created_at', { ascending: false })

//   if (error) {
//     console.error('getSubscribers error:', error)
//     return { subscribers: [], count: 0 }
//   }

//   return {
//     subscribers: (data as Subscriber[]) || [],
//     count: count || 0,
//   }
// }

// // ============================================
// // UPDATE note
// // ============================================
// export async function updateSubscriberNote(id: number, note: string | null) {
//   const supabase = createServerClient()

//   const { error } = await supabase
//     .from('newsletter_subscribers')
//     .update({ note: note?.trim() || null })
//     .eq('id', id)

//   if (error) {
//     console.error('updateSubscriberNote error:', error)
//     return { success: false, error: error.message }
//   }

//   revalidatePath('/subscribers')
//   return { success: true }
// }

// // ============================================
// // DELETE subscriber
// // ============================================
// export async function deleteSubscriber(id: number) {
//   const supabase = createServerClient()

//   const { error } = await supabase
//     .from('newsletter_subscribers')
//     .delete()
//     .eq('id', id)

//   if (error) {
//     console.error('deleteSubscriber error:', error)
//     return { success: false, error: error.message }
//   }

//   revalidatePath('/subscribers')
//   return { success: true }
// }

// // Get only active (not unsubscribed) subscribers
// export async function getActiveSubscribers(): Promise<Subscriber[]> {
//   const supabase = createServerClient()

//   const { data, error } = await supabase
//     .from('newsletter_subscribers')
//     .select('*')
//     .is('unsubscribed_at', null)
//     .order('created_at', { ascending: false })

//   if (error) {
//     console.error('getActiveSubscribers error:', error)
//     return []
//   }

//   return (data as Subscriber[]) || []
// }

// // Unsubscribe by token (used by the public unsubscribe page)
// export async function unsubscribeByToken(token: string) {
//   const supabase = createServerClient()

//   const { data, error } = await supabase
//     .from('newsletter_subscribers')
//     .update({ unsubscribed_at: new Date().toISOString() })
//     .eq('unsubscribe_token', token)
//     .is('unsubscribed_at', null)
//     .select()
//     .single()

//   if (error || !data) {
//     return { success: false, error: 'Invalid or already unsubscribed' }
//   }

//   return { success: true, email: data.email }
// }

