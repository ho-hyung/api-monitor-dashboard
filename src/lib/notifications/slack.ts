interface SlackMessage {
  text: string
  blocks?: SlackBlock[]
}

interface SlackBlock {
  type: 'section' | 'divider' | 'context'
  text?: {
    type: 'mrkdwn' | 'plain_text'
    text: string
  }
  elements?: {
    type: 'mrkdwn'
    text: string
  }[]
}

export async function sendSlackNotification(
  webhookUrl: string,
  message: string,
  monitorName: string,
  status: 'down' | 'up'
): Promise<{ success: boolean; error?: string }> {
  try {
    const emoji = status === 'down' ? ':red_circle:' : ':large_green_circle:'
    const statusText = status === 'down' ? 'DOWN' : 'UP'

    const payload: SlackMessage = {
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *${monitorName}* is *${statusText}*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_Sent at ${new Date().toISOString()}_`,
            },
          ],
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
      return { success: false, error: `Slack API error: ${text}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
