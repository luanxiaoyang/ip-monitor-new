import { IPRecord, IPCheckResult } from '../types/ip'

// 模拟IP检测功能 - 在实际应用中，这应该通过后端API或Edge Function实现
export const checkIPConnection = async (record: IPRecord): Promise<IPCheckResult> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // 模拟检测结果 - 80%概率在线
  const isOnline = Math.random() > 0.2
  
  return {
    ip: record.ip,
    port: record.port,
    status: isOnline ? 'online' : 'offline',
    response_time: isOnline ? Math.floor(Math.random() * 200) + 10 : undefined,
    error: isOnline ? undefined : 'Connection timeout'
  }
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