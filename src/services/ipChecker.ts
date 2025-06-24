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

// 模拟IP检测功能 - 在实际应用中，这应该通过后端API或Edge Function实现
export const checkIPConnection = async (record: IPRecord): Promise<IPCheckResult> => {
  // 首先检查到期状态
  const expiryStatus = checkExpiryStatus(record)
  if (expiryStatus !== 'valid') {
    await sendExpiryNotification(record, expiryStatus)
  }

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // 模拟检测结果 - 80%概率在线
  const isOnline = Math.random() > 0.2
  
  const result: IPCheckResult = {
    ip: record.ip,
    port: record.port,
    status: isOnline ? 'online' : 'offline',
    response_time: isOnline ? Math.floor(Math.random() * 200) + 10 : undefined,
    error: isOnline ? undefined : 'Connection timeout'
  }

  // 如果检测失败，发送离线通知
  if (!isOnline) {
    await sendOfflineNotification(record)
  }

  return result
}

export const batchCheckIPs = async (records: IPRecord[]): Promise<IPCheckResult[]> => {
  // 并发检测，但限制并发数量以避免过载
  const batchSize = 5
  const results: IPCheckResult[] = []
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(record => checkIPConnection(record))
    )
    results.push(...batchResults)
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