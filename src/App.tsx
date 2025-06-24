import React, { useState, useMemo } from 'react'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { IPCard } from './components/IPCard'
import { IPForm } from './components/IPForm'
import { WebhookLogs } from './components/WebhookLogs'
import { WebhookTest } from './components/WebhookTest'
import { useIPRecords, useUpdateIPStatus } from './hooks/useIPRecords'
import { checkIPConnection, batchCheckIPs } from './services/ipChecker'
import { IPRecord } from './types/ip'
import { Loader2, AlertCircle, Bell, TestTube } from 'lucide-react'
import toast from 'react-hot-toast'

function App() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<IPRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [checkingIPs, setCheckingIPs] = useState<Set<string>>(new Set())
  const [isBatchChecking, setIsBatchChecking] = useState(false)
  const [showWebhookLogs, setShowWebhookLogs] = useState(false)
  const [showWebhookTest, setShowWebhookTest] = useState(false)

  const { data: records = [], isLoading, error } = useIPRecords()
  const updateStatusMutation = useUpdateIPStatus()

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records
    
    const term = searchTerm.toLowerCase()
    return records.filter(record => 
      record.ip.toLowerCase().includes(term) ||
      record.name?.toLowerCase().includes(term) ||
      record.notes?.toLowerCase().includes(term) ||
      record.username.toLowerCase().includes(term)
    )
  }, [records, searchTerm])

  const handleAddNew = () => {
    setEditingRecord(null)
    setIsFormOpen(true)
  }

  const handleEdit = (record: IPRecord) => {
    setEditingRecord(record)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingRecord(null)
  }

  const handleCheckIP = async (record: IPRecord) => {
    setCheckingIPs(prev => new Set(prev).add(record.id))
    
    try {
      const result = await checkIPConnection(record)
      await updateStatusMutation.mutateAsync({
        id: record.id,
        status: result.status
      })
      
      toast.success(`${record.ip} 检测完成: ${result.status === 'online' ? '在线' : '离线'}`)
    } catch (error) {
      toast.error(`检测 ${record.ip} 时出错`)
    } finally {
      setCheckingIPs(prev => {
        const newSet = new Set(prev)
        newSet.delete(record.id)
        return newSet
      })
    }
  }

  const handleBatchCheck = async () => {
    if (records.length === 0) {
      toast.error('没有IP记录可以检测')
      return
    }

    setIsBatchChecking(true)
    
    try {
      const results = await batchCheckIPs(records)
      
      // 批量更新状态
      await Promise.all(
        results.map(result => {
          const record = records.find(r => r.ip === result.ip && r.port === result.port)
          if (record) {
            return updateStatusMutation.mutateAsync({
              id: record.id,
              status: result.status
            })
          }
        })
      )
      
      const onlineCount = results.filter(r => r.status === 'online').length
      toast.success(`批量检测完成: ${onlineCount}/${results.length} 在线`)
    } catch (error) {
      toast.error('批量检测时出错')
    } finally {
      setIsBatchChecking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="text-lg text-gray-600">加载中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600">无法加载IP记录，请检查网络连接或刷新页面重试</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onAddNew={handleAddNew}
        onBatchCheck={handleBatchCheck}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isChecking={isBatchChecking}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Dashboard records={records} />

        <div className="flex items-center justify-end space-x-4 mb-6">
          <button
            onClick={() => setShowWebhookTest(!showWebhookTest)}
            className="btn-secondary flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>{showWebhookTest ? '隐藏' : '显示'}Webhook测试</span>
          </button>
          
          <button
            onClick={() => setShowWebhookLogs(!showWebhookLogs)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Bell className="h-4 w-4" />
            <span>{showWebhookLogs ? '隐藏' : '显示'}通知日志</span>
          </button>
        </div>

        {showWebhookTest && (
          <div className="mb-8">
            <WebhookTest />
          </div>
        )}

        {showWebhookLogs && (
          <div className="mb-8">
            <WebhookLogs />
          </div>
        )}

        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {searchTerm ? (
                <>
                  <p className="text-lg">未找到匹配的IP记录</p>
                  <p className="text-sm">尝试调整搜索条件</p>
                </>
              ) : (
                <>
                  <p className="text-lg">还没有IP记录</p>
                  <p className="text-sm">点击"添加IP"按钮开始添加</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecords.map((record) => (
              <IPCard
                key={record.id}
                record={record}
                onEdit={handleEdit}
                onCheck={handleCheckIP}
                isChecking={checkingIPs.has(record.id)}
              />
            ))}
          </div>
        )}
      </main>

      <IPForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editingRecord={editingRecord}
      />
    </div>
  )
}

export default App