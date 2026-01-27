interface DiscordEmbed {
  title: string
  description: string
  color: number
  timestamp: string
  footer?: {
    text: string
  }
}

interface DiscordWebhookPayload {
  content?: string
  embeds?: DiscordEmbed[]
}

export async function sendDiscordNotification(
  webhookUrl: string,
  message: string,
  monitorName: string,
  status: 'down' | 'up'
): Promise<{ success: boolean; error?: string }> {
  try {
    const color = status === 'down' ? 0xff0000 : 0x00ff00 // Red or Green
    const statusText = status === 'down' ? 'DOWN' : 'UP'

    const payload: DiscordWebhookPayload = {
      embeds: [
        {
          title: `${monitorName} is ${statusText}`,
          description: message,
          color,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'API Monitor Dashboard',
          },
        },
      ],
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      return { success: false, error: `Discord API error: ${text}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
