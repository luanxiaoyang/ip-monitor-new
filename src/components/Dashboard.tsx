import React from 'react'
import { 
  Globe, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Calendar,
  TrendingUp
} from 'lucide-react'
import { IPRecord } from '../types/ip'
import { isAfter, differenceInDays } from 'date-fns'

interface DashboardProps {
  records: IPRecord[]
}

export const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const totalRecords = records.length
  const onlineRecords = records.filter(r => r.status === 'online').length
  const offlineRecords = records.filter(r => r.status === 'offline').length
  const expiredRecords = records.filter(r => isAfter(new Date(), new Date(r.expiry_date))).length
  const expiringSoonRecords = records.filter(r => {
    const daysUntilExpiry = differenceInDays(new Date(r.expiry_date), new Date())
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0
  }).length

  const stats = [
    {
      title: '总IP数量',
      value: totalRecords,
      icon: Globe,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100'
    },
    {
      title: '在线IP',
      value: onlineRecords,
      icon: Wifi,
      color: 'text-success-600',
      bgColor: 'bg-success-100'
    },
    {
      title: '离线IP',
      value: offlineRecords,
      icon: WifiOff,
      color: 'text-error-600',
      bgColor: 'bg-error-100'
    },
    {
      title: '即将到期',
      value: expiringSoonRecords,
      icon: Calendar,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100'
    },
    {
      title: '已过期',
      value: expiredRecords,
      icon: AlertTriangle,
      color: 'text-error-600',
      bgColor: 'bg-error-100'
    },
    {
      title: '在线率',
      value: totalRecords > 0 ? `${Math.round((onlineRecords / totalRecords) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="card animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}