import { IPRecord } from '../types/ip'

export interface WebhookNotification {
  type: 'ip_offline' | 'ip_expiry' | 'service_expiry'
  record: IPRecord
  message: string
}

// 创建飞书卡片格式的消息
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

// 发送 webhook 通知
export const sendWebhookNotification = async (
  webhookUrl: string,
  notification: WebhookNotification
): Promise<boolean> => {
  try {
    const card = createLarkCard(notification)
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error('Failed to send webhook notification:', error)
    return false
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
    
    await supabase
      .from('webhook_logs')
      .insert({
        type,
        message,
        url,
        status,
        record_id: recordId
      })
  } catch (error) {
    console.error('Failed to log webhook attempt:', error)
  }
}