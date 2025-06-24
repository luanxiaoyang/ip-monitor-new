import React from 'react'
import { Plus, RefreshCw, Search } from 'lucide-react'

interface HeaderProps {
  onAddNew: () => void
  onBatchCheck: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  isChecking: boolean
}

export const Header: React.FC<HeaderProps> = ({
  onAddNew,
  onBatchCheck,
  searchTerm,
  onSearchChange,
  isChecking
}) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">IP监测系统</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索IP、名称或备注..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
              />
            </div>
            
            <button
              onClick={onBatchCheck}
              disabled={isChecking}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? '检测中...' : '批量检测'}</span>
            </button>
            
            <button
              onClick={onAddNew}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>添加IP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}