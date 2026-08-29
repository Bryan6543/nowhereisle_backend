'use server'

import { createServerClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import type { EmailTemplate } from '@/types'

function applyVariables(input: string, vars: Record<string, string>) {
  let output = input
  for (const [key, value] of Object.entries(vars)) {
    output = output.replaceAll(`{{${key}}}`, value)
  }
  return output
}

export async function getEmailTemplate(id: string): Promise<EmailTemplate | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getEmailTemplate error:', error)
    return null
  }

  return data as EmailTemplate
}

export async function saveEmailTemplate(input: {
  id: string
  subject: string
  html_content: string
}) {
  const supabase = createServerClient()

  if (!input.subject.trim() || !input.html_content.trim()) {
    return { success: false, error: 'Subject and content are required' }
  }

  const { data, error } = await supabase
    .from('email_templates')
    .update({
      subject: input.subject.trim(),
      html_content: input.html_content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select('*')
    .single()

  if (error) {
    console.error('saveEmailTemplate error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/email-templates/welcome')
  return { success: true, template: data as EmailTemplate }
}

export async function sendWelcomeEmail(email: string) {
  try {
    const supabase = createServerClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Get subscriber token for unsubscribe link
    const { data: subscriber } = await supabase
      .from('newsletter_subscribers')
      .select('unsubscribe_token')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    const unsubscribeUrl = subscriber?.unsubscribe_token
      ? `${siteUrl}/unsubscribe?token=${subscriber.unsubscribe_token}`
      : `${siteUrl}/unsubscribe`

    const template = await getEmailTemplate('welcome')

    const subject = template?.subject || 'Welcome to Nowhere Isle'
    const htmlTemplate =
      template?.html_content ||
      `<h1>Welcome!</h1><p>Thanks for subscribing to Nowhere Isle updates.</p>`

    // Apply template variables
    let html = applyVariables(htmlTemplate, {
      email,
      site_url: siteUrl,
    })

    const finalSubject = applyVariables(subject, {
      email,
      site_url: siteUrl,
    })

    // Always append unsubscribe footer at the bottom
    html = `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #111;">
        ${html}
      </div>

      <hr style="margin-top: 40px; border: none; border-top: 1px solid #e5e5e5;" />

      <div style="font-size: 12px; line-height: 1.5; color: #888888; text-align: center; padding-top: 12px;">
        <p style="margin: 0 0 8px 0;">
          You received this email because you subscribed to Nowhere Isle updates.
        </p>
        <p style="margin: 0;">
          <a href="${unsubscribeUrl}" style="color: #888888; text-decoration: underline;">
            Unsubscribe
          </a>
        </p>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: 'Nowhere Isle <info@nowhereisle.com>',
      to: email,
      subject: finalSubject,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
      },
    })

    if (error) {
      console.error('Welcome email failed:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('Welcome email failed:', err)
    return { success: false, error: err.message }
  }
}

export async function sendTestWelcomeEmail(toEmail: string) {
  return sendWelcomeEmail(toEmail)
}