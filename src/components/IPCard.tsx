import React, { useState } from 'react'
import { format, isAfter, differenceInDays } from 'date-fns'
import { 
  Edit3, 
  Trash2, 
  Globe, 
  User, 
  Calendar, 
  MessageSquare, 
  Wifi,
  WifiOff,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { IPRecord } from '../types/ip'
import { useDeleteIPRecord } from '../hooks/useIPRecords'

interface IPCardProps {
  record: IPRecord
  onEdit: (record: IPRecord) => void
  onCheck: (record: IPRecord) => void
  isChecking?: boolean
}

export const IPCard: React.FC<IPCardProps> = ({ 
  record, 
  onEdit, 
  onCheck,
  isChecking = false 
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const deleteMutation = useDeleteIPRecord()

  const handleDelete = async () => {
    if (window.confirm('确定要删除这个IP记录吗？此操作不可撤销。')) {
      await deleteMutation.mutateAsync(record.id)
    }
  }

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    switch (record.status) {
      case 'online':
        return <Wifi className="h-4 w-4" />
      case 'offline':
        return <WifiOff className="h-4 w-4" />
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusClass = () => {
    if (isChecking) return 'status-checking'
    
    switch (record.status) {
      case 'online':
        return 'status-online'
      case 'offline':
        return 'status-offline'
      case 'checking':
        return 'status-checking'
      default:
        return 'status-unknown'
    }
  }

  const getStatusText = () => {
    if (isChecking) return '检测中'
    
    switch (record.status) {
      case 'online':
        return '在线'
      case 'offline':
        return '离线'
      case 'checking':
        return '检测中'
      default:
        return '未知'
    }
  }

  const isExpiringSoon = () => {
    const expiryDate = new Date(record.expiry_date)
    const daysUntilExpiry = differenceInDays(expiryDate, new Date())
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0
  }

  const isExpired = () => {
    return isAfter(new Date(), new Date(record.expiry_date))
  }

  return (
    <div className="card hover:shadow-md transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Globe className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {record.name || `${record.ip}:${record.port}`}
            </h3>
            <p className="text-sm text-gray-500">{record.ip}:{record.port}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={getStatusClass()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">用户名:</span>
          <span className="font-medium">{record.username}</span>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600">密码:</span>
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="font-mono text-sm bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
          >
            {showPassword ? record.password : '••••••••'}
          </button>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">到期时间:</span>
          <span className={`font-medium ${
            isExpired() ? 'text-error-600' : 
            isExpiringSoon() ? 'text-warning-600' : 
            'text-gray-900'
          }`}>
            {format(new Date(record.expiry_date), 'yyyy-MM-dd')}
            {isExpired() && ' (已过期)'}
            {isExpiringSoon() && !isExpired() && ' (即将到期)'}
          </span>
        </div>

        {record.notes && (
          <div className="flex items-start space-x-2 text-sm">
            <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <span className="text-gray-600">备注:</span>
              <p className="text-gray-900 mt-1">{record.notes}</p>
            </div>
          </div>
        )}

        {record.last_checked && (
          <div className="text-xs text-gray-500">
            最后检测: {format(new Date(record.last_checked), 'yyyy-MM-dd HH:mm:ss')}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={() => onCheck(record)}
          disabled={isChecking}
          className="btn-primary text-xs px-3 py-1.5"
        >
          {isChecking ? '检测中...' : '检测连接'}
        </button>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(record)}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}