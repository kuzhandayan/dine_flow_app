import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteEmail(
  to: string,
  token: string,
  restaurantName: string
): Promise<void> {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `You're invited to join ${restaurantName} on DineFlow`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#f97316;">You've been invited!</h2>
        <p>You have been invited to join <strong>${restaurantName}</strong> on DineFlow POS.</p>
        <p>Click the link below to set up your account. This link expires in 48 hours.</p>
        <a href="${inviteUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Accept Invite</a>
        <p style="color:#888;font-size:12px;margin-top:24px;">If you did not expect this email, please ignore it.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: 'Reset your DineFlow password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#f97316;">Password Reset Request</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
        <p style="color:#888;font-size:12px;margin-top:24px;">If you did not request this, ignore this email.</p>
      </div>
    `,
  })
}
