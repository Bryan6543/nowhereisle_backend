'use server'

import { createServerClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import type { SupportMessage, SupportStatus, SupportTicket } from '@/types'
import { unstable_noStore as noStore } from 'next/cache'

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

function adminUrl() {
  return process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
}

function makeTicketNumber() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `NI-${y}${m}${d}-${rand}`
}

async function sendEmail(to: string, subject: string, html: string) {
  return resend.emails.send({
    from: 'Nowhere Isle Support <info@nowhereisle.com>',
    to,
    subject,
    html,
  })
}

// ============================================
// CREATE TICKET (used by frontend form)
// ============================================
export async function createSupportTicket(input: {
  report_type: string
  game_report_type?: string | null
  subject: string
  description: string
  email?: string | null
}) {
  const supabase = createServerClient()

  if (!input.subject.trim() || !input.description.trim() || !input.report_type) {
    return { success: false, error: 'Missing required fields' }
  }

  const ticket_number = makeTicketNumber()

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      ticket_number,
      report_type: input.report_type,
      game_report_type: input.game_report_type || null,
      subject: input.subject.trim(),
      description: input.description.trim(),
      email: input.email?.trim() || null,
      status: 'open',
      priority: 'normal',
    })
    .select('*')
    .single()

  if (error || !ticket) {
    console.error(error)
    return { success: false, error: error?.message || 'Failed to create ticket' }
  }

  // First message = original description
  await supabase.from('support_messages').insert({
    ticket_id: ticket.id,
    sender_type: 'User',
    sender_name: input.email || 'User',
    message: input.description.trim(),
  })

  const viewUrl = `${siteUrl()}/isle/support/ticket/${ticket.public_token}`

  // Confirmation email (if email provided)
  if (ticket.email) {
    await sendEmail(
      ticket.email,
      `[${ticket.ticket_number}] We received your support request`,
      `
        <h2>Message received</h2>
        <p>Thanks for contacting Nowhere Isle Support.</p>
        <p><strong>Ticket:</strong> ${ticket.ticket_number}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p>You can view updates here:</p>
        <p><a href="${viewUrl}">${viewUrl}</a></p>
      `
    )
  }

  return {
    success: true,
    ticket_number: ticket.ticket_number,
    public_token: ticket.public_token,
    view_url: viewUrl,
  }
}

// ============================================
// ADMIN: list tickets
// ============================================
export async function getSupportTickets() {
  noStore()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return (data as SupportTicket[]) || []
}

// ============================================
// ADMIN/PUBLIC: get ticket by id
// ============================================
export async function getSupportTicketById(id: string) {
  noStore()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as SupportTicket
}

// ============================================
// PUBLIC: get ticket by token (no login)
// ============================================
export async function getSupportTicketByToken(token: string) {
  noStore()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('public_token', token)
    .single()

  if (error) return null
  return data as SupportTicket
}

// ============================================
// Messages
// ============================================
export async function getSupportMessages(ticketId: string) {
  noStore()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error(error)
    return []
  }
  return (data as SupportMessage[]) || []
}

export async function updateSupportStatus(ticketId: string, status: SupportStatus) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/support')
  revalidatePath(`/support/${ticketId}`)
  return { success: true }
}

// Admin reply
export async function replyAsAdmin(ticketId: string, message: string) {
  const supabase = createServerClient()

  if (!message.trim()) {
    return { success: false, error: 'Message is required' }
  }

  const ticket = await getSupportTicketById(ticketId)
  if (!ticket) return { success: false, error: 'Ticket not found' }

  const { error } = await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_type: 'admin',
    sender_name: 'Nowhere Isle Support',
    message: message.trim(),
  })

  if (error) return { success: false, error: error.message }

  await supabase
    .from('support_tickets')
    .update({
      status: ticket.status === 'open' ? 'in_progress' : ticket.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)

  if (ticket.email) {
    const viewUrl = `${siteUrl()}/support/ticket/${ticket.public_token}`
    await sendEmail(
      ticket.email,
      `[${ticket.ticket_number}] New reply from Support`,
      `
        <h2>New support reply</h2>
        <p><strong>Ticket:</strong> ${ticket.ticket_number}</p>
        <p>${message}</p>
        <p>View full conversation:</p>
        <p><a href="${viewUrl}">${viewUrl}</a></p>
      `
    )
  }

  revalidatePath(`/support/${ticketId}`)
  return { success: true }
}

// Customer reply via public token
export async function replyAsCustomer(token: string, message: string) {
  const supabase = createServerClient()

  if (!message.trim()) {
    return { success: false, error: 'Message is required' }
  }

  const ticket = await getSupportTicketByToken(token)
  if (!ticket) return { success: false, error: 'Ticket not found' }

  const { error } = await supabase.from('support_messages').insert({
    ticket_id: ticket.id,
    sender_type: 'user',
    sender_name: ticket.email || 'User',
    message: message.trim(),
  })

  if (error) return { success: false, error: error.message }

  await supabase
    .from('support_tickets')
    .update({
      status: 'open',
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticket.id)

  return { success: true }
}