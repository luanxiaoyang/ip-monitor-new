import { IPRecord, IPCheckResult } from '../types/ip'
import { sendWebhookNotification, logWebhookAttempt } from './webhookService'
import { differenceInDays, isAfter } from 'date-fns'

// 检查IP到期状态
const checkExpiryStatus = (record: IPRecord) => {
  const expiryDate = new Date(record.expiry_date)
  const now = new Date()
  const daysUntilExpiry = differenceInDays(expiryDate, now)
  
  if (isAfter(now, expiryDate)) {
    return 'expired' // 已过期
  } else if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
    return 'expiring_soon' // 即将到期
  }
  return 'valid' // 正常
}

// 发送到期通知
const sendExpiryNotification = async (record: IPRecord, expiryStatus: string) => {
  if (!record.webhook_url) return

  const notificationType = expiryStatus === 'expired' ? 'service_expiry' : 'ip_expiry'
  const message = expiryStatus === 'expired' 
    ? `IP ${record.ip}:${record.port} 已过期`
    : `IP ${record.ip}:${record.port} 即将到期`

  const success = await sendWebhookNotification(record.webhook_url, {
    type: notificationType,
    record,
    message
  })

  await logWebhookAttempt(
    notificationType,
    message,
    record.webhook_url,
    success ? 'success' : 'failed',
    record.id
  )
}

// 发送离线通知
const sendOfflineNotification = async (record: IPRecord) => {
  if (!record.webhook_url) return

  const message = `IP ${record.ip}:${record.port} 检测失败，状态：离线`

  const success = await sendWebhookNotification(record.webhook_url, {
    type: 'ip_offline',
    record,
    message
  })

  await logWebhookAttempt(
    'ip_offline',
    message,
    record.webhook_url,
    success ? 'success' : 'failed',
    record.id
  )
}

// 使用 Edge Function 进行真实的 IP 连接检测
export const checkIPConnection = async (record: IPRecord): Promise<IPCheckResult> => {
  // 首先检查到期状态
  const expiryStatus = checkExpiryStatus(record)
  if (expiryStatus !== 'valid') {
    await sendExpiryNotification(record, expiryStatus)
  }

  try {
    // 调用 Edge Function 进行真实的 SOCKS5 代理检测
    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-ip`
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ip: record.ip,
        port: record.port,
        username: record.username,
        password: record.password
      })
    })

    if (!response.ok) {
      throw new Error(`Edge Function error! status: ${response.status}`)
    }

    const result = await response.json()
    
    const ipCheckResult: IPCheckResult = {
      ip: record.ip,
      port: record.port,
      status: result.status === 'online' ? 'online' : 'offline',
      response_time: result.response_time,
      error: result.error
    }

    // 如果检测失败，发送离线通知
    if (ipCheckResult.status === 'offline') {
      await sendOfflineNotification(record)
    }

    return ipCheckResult
  } catch (error) {
    console.error('IP check failed:', error)
    
    const result: IPCheckResult = {
      ip: record.ip,
      port: record.port,
      status: 'offline',
      error: error instanceof Error ? error.message : 'Unknown error'
    }

    // 发送离线通知
    await sendOfflineNotification(record)
    
    return result
  }
}

export const batchCheckIPs = async (records: IPRecord[]): Promise<IPCheckResult[]> => {
  // 并发检测，但限制并发数量以避免过载
  const batchSize = 3 // 减少并发数量，避免过载
  const results: IPCheckResult[] = []
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(record => checkIPConnection(record))
    )
    results.push(...batchResults)
    
    // 批次之间添加短暂延迟
    if (i + batchSize < records.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

// 定期检查所有IP的到期状态（可以通过定时任务调用）
export const checkAllExpiryStatus = async (records: IPRecord[]) => {
  for (const record of records) {
    const expiryStatus = checkExpiryStatus(record)
    if (expiryStatus !== 'valid') {
      await sendExpiryNotification(record, expiryStatus)
    }
  }
}