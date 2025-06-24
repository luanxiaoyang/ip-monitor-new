import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { CheckCircle, XCircle, Clock, AlertTriangle, Calendar } from 'lucide-react'

interface WebhookLog {
  id: string
  type: string
  message: string
  url: string
  status: string
  record_id: string
  timestamp: string
}

export const WebhookLogs: React.FC = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['webhook-logs'],
    queryFn: async (): Promise<WebhookLog[]> => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50)

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    refetchInterval: 30000, // 每30秒刷新一次
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ip_offline':
        return <XCircle className="h-4 w-4 text-error-500" />
      case 'ip_expiry':
        return <Clock className="h-4 w-4 text-warning-500" />
      case 'service_expiry':
        return <AlertTriangle className="h-4 w-4 text-error-500" />
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'ip_offline':
        return 'IP离线'
      case 'ip_expiry':
        return 'IP即将到期'
      case 'service_expiry':
        return 'IP已过期'
      default:
        return '未知'
    }
  }

  const getStatusIcon = (status: string) => {
    return status === 'success' ? (
      <CheckCircle className="h-4 w-4 text-success-500" />
    ) : (
      <XCircle className="h-4 w-4 text-error-500" />
    )
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook 通知日志</h3>
      
      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>暂无通知记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getTypeIcon(log.type)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {getTypeText(log.type)}
                    </span>
                    {getStatusIcon(log.status)}
                  </div>
                  <p className="text-sm text-gray-600">{log.message}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  log.status === 'success' 
                    ? 'bg-success-100 text-success-800' 
                    : 'bg-error-100 text-error-800'
                }`}>
                  {log.status === 'success' ? '发送成功' : '发送失败'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}