import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmailNotification(
  to: string,
  message: string,
  monitorName: string,
  status: 'down' | 'up'
): Promise<{ success: boolean; error?: string }> {
  try {
    const statusText = status === 'down' ? 'DOWN' : 'UP'
    const statusEmoji = status === 'down' ? '🔴' : '🟢'

    const { error } = await resend.emails.send({
      from: 'API Monitor <noreply@resend.dev>',
      to: [to],
      subject: `${statusEmoji} [${statusText}] ${monitorName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${status === 'down' ? '#dc2626' : '#16a34a'};">
            ${monitorName} is ${statusText}
          </h2>
          <p style="color: #374151; line-height: 1.5;">
            ${message}
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Sent at ${new Date().toISOString()} by API Monitor Dashboard
          </p>
        </div>
      `,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
