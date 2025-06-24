import { IPRecord } from '../types/ip'

export interface WebhookNotification {
  type: 'ip_offline' | 'ip_expiry' | 'service_expiry'
  record: IPRecord
  message: string
}

// 创建飞书卡片格式的消息 - 移除图片，使用纯文本卡片
export const createLarkCard = (notification: WebhookNotification) => {
  const { type, record } = notification
  
  let headerColor = 'red'
  let headerTitle = ''
  let mainContent = ''
  let statusColor = 'red'
  let statusText = ''
  
  switch (type) {
    case 'ip_offline':
      headerColor = 'red'
      headerTitle = '🚨 IP 连接异常警告'
      mainContent = `IP地址 **${record.ip}:${record.port}** 检测失败，请及时处理！`
      statusColor = 'red'
      statusText = '离线'
      break
    case 'ip_expiry':
      headerColor = 'orange'
      headerTitle = '⏰ IP 即将到期提醒'
      mainContent = `IP地址 **${record.ip}:${record.port}** 即将到期，请及时续费！`
      statusColor = 'orange'
      statusText = '即将到期'
      break
    case 'service_expiry':
      headerColor = 'red'
      headerTitle = '❌ IP 已过期警告'
      mainContent = `IP地址 **${record.ip}:${record.port}** 已过期，请立即处理！`
      statusColor = 'red'
      statusText = '已过期'
      break
  }

  const expiryDate = new Date(record.expiry_date).toLocaleDateString('zh-CN')
  const currentTime = new Date().toLocaleString('zh-CN')

  return {
    config: {
      wide_screen_mode: true
    },
    elements: [
      {
        tag: "div",
        text: {
          content: mainContent,
          tag: "lark_md"
        }
      },
      {
        tag: "column_set",
        flex_mode: "none",
        background_style: "default",
        columns: [
          {
            tag: "column",
            width: "weighted",
            weight: 1,
            vertical_align: "top",
            elements: [
              {
                tag: "column_set",
                flex_mode: "none",
                background_style: "grey",
                columns: [
                  {
                    tag: "column",
                    width: "weighted",
                    weight: 1,
                    vertical_align: "top",
                    elements: [
                      {
                        tag: "markdown",
                        content: `**IP地址**\n${record.ip}:${record.port}`,
                        text_align: "center"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            tag: "column",
            width: "weighted",
            weight: 1,
            vertical_align: "top",
            elements: [
              {
                tag: "column_set",
                flex_mode: "none",
                background_style: "grey",
                columns: [
                  {
                    tag: "column",
                    width: "weighted",
                    weight: 1,
                    vertical_align: "top",
                    elements: [
                      {
                        tag: "markdown",
                        content: `**状态**\n<font color='${statusColor}'>${statusText}</font>`,
                        text_align: "center"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            tag: "column",
            width: "weighted",
            weight: 1,
            vertical_align: "top",
            elements: [
              {
                tag: "column_set",
                flex_mode: "none",
                background_style: "grey",
                columns: [
                  {
                    tag: "column",
                    width: "weighted",
                    weight: 1,
                    vertical_align: "top",
                    elements: [
                      {
                        tag: "markdown",
                        content: `**到期时间**\n${expiryDate}`,
                        text_align: "center"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        tag: "div",
        text: {
          content: `**📋 详细信息：**\n• **名称：** ${record.name || '未设置'}\n• **用户名：** ${record.username}\n• **备注：** ${record.notes || '无'}\n• **检测时间：** ${currentTime}`,
          tag: "lark_md"
        }
      },
      {
        tag: "note",
        elements: [
          {
            tag: "plain_text",
            content: "💡 请及时处理以确保服务正常运行"
          }
        ]
      }
    ],
    header: {
      template: headerColor,
      title: {
        content: headerTitle,
        tag: "plain_text"
      }
    }
  }
}

// 创建简化版本的消息（备用方案）
export const createSimpleMessage = (notification: WebhookNotification) => {
  const { type, record } = notification
  
  let emoji = ''
  let title = ''
  
  switch (type) {
    case 'ip_offline':
      emoji = '🚨'
      title = 'IP连接异常'
      break
    case 'ip_expiry':
      emoji = '⏰'
      title = 'IP即将到期'
      break
    case 'service_expiry':
      emoji = '❌'
      title = 'IP已过期'
      break
  }

  const expiryDate = new Date(record.expiry_date).toLocaleDateString('zh-CN')
  const currentTime = new Date().toLocaleString('zh-CN')

  return {
    text: `${emoji} ${title}\n\nIP地址: ${record.ip}:${record.port}\n名称: ${record.name || '未设置'}\n用户名: ${record.username}\n到期时间: ${expiryDate}\n检测时间: ${currentTime}\n\n${notification.message}`
  }
}

// 发送 webhook 通知
export const sendWebhookNotification = async (
  webhookUrl: string,
  notification: WebhookNotification
): Promise<boolean> => {
  try {
    console.log('Sending webhook notification:', { webhookUrl, type: notification.type })
    
    const card = createLarkCard(notification)
    const simpleMessage = createSimpleMessage(notification)
    
    console.log('Card payload:', JSON.stringify(card, null, 2))
    
    // 首先尝试发送卡片格式
    try {
      const cardResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(card)
      })

      console.log('Card webhook response:', {
        status: cardResponse.status,
        statusText: cardResponse.statusText,
        ok: cardResponse.ok
      })

      if (cardResponse.ok) {
        const responseText = await cardResponse.text()
        console.log('Card webhook response body:', responseText)
        console.log('Card webhook sent successfully')
        return true
      } else {
        const errorText = await cardResponse.text()
        console.log('Card webhook failed, response:', errorText)
        throw new Error(`Card webhook failed: ${cardResponse.status} ${errorText}`)
      }
    } catch (cardError) {
      console.log('Card webhook failed, trying simple message:', cardError)
      
      // 如果卡片格式失败，尝试简单文本格式
      try {
        const simpleResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(simpleMessage)
        })

        console.log('Simple message response:', {
          status: simpleResponse.status,
          statusText: simpleResponse.statusText,
          ok: simpleResponse.ok
        })

        if (simpleResponse.ok) {
          const responseText = await simpleResponse.text()
          console.log('Simple message response body:', responseText)
          console.log('Simple message sent successfully')
          return true
        } else {
          const errorText = await simpleResponse.text()
          console.log('Simple message failed, response:', errorText)
          throw new Error(`Simple message failed: ${simpleResponse.status} ${errorText}`)
        }
      } catch (simpleError) {
        console.log('Simple message also failed, trying Edge Function:', simpleError)
        throw simpleError
      }
    }
  } catch (directError) {
    console.log('Direct webhook failed, trying Edge Function:', directError)
    
    // 如果直接发送失败，使用 Edge Function
    try {
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-webhook`
      
      console.log('Using Edge Function:', edgeFunctionUrl)
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl,
          card: createLarkCard(notification),
          simpleMessage: createSimpleMessage(notification)
        })
      })

      console.log('Edge Function response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Edge Function error:', errorData)
        throw new Error(`Edge Function error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`)
      }

      const result = await response.json()
      console.log('Edge Function result:', result)
      return result.success === true
    } catch (edgeError) {
      console.error('Edge Function also failed:', edgeError)
      return false
    }
  }
}

// 记录 webhook 日志到数据库
export const logWebhookAttempt = async (
  type: string,
  message: string,
  url: string,
  status: 'success' | 'failed',
  recordId: string
) => {
  try {
    const { supabase } = await import('../lib/supabase')
    
    console.log('Logging webhook attempt:', { type, message, url, status, recordId })
    
    const { error } = await supabase
      .from('webhook_logs')
      .insert({
        type,
        message,
        url,
        status,
        record_id: recordId
      })

    if (error) {
      console.error('Failed to log webhook attempt:', error)
    } else {
      console.log('Webhook attempt logged successfully')
    }
  } catch (error) {
    console.error('Failed to log webhook attempt:', error)
  }
}