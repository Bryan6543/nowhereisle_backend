// actions/newsletter.ts
'use server'

import { resend } from '@/lib/resend'

export async function sendTestEmail(toEmail: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Nowhere Isle <info@nowhereisle.com>', 

            to: toEmail,
            subject: 'Test email from Nowhere Isle',
            html: `
        <h1>Hello!</h1>
        <p>This is a test email from your Nowhere Isle admin dashboard.</p>
        <p>If you received this, Resend is working correctly.</p>
      `,
        })

        if (error) {
            console.error('Resend error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}