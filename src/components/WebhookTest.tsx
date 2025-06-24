import React, { useState } from 'react'
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { sendWebhookNotification } from '../services/webhookService'
import { IPRecord } from '../types/ip'

export const WebhookTest: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const handleTest = async () => {
    if (!webhookUrl.trim()) {
      setTestResult({
        success: false,
        message: '请输入Webhook URL'
      })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      // 创建测试用的IP记录
      const testRecord: IPRecord = {
        id: 'test-id',
        ip: '192.168.1.100',
        port: 1080,
        username: 'test_user',
        password: 'test_pass',
        name: '测试IP',
        notes: '这是一个测试通知',
        expiry_date: new Date().toISOString(),
        is_active: true,
        status: 'offline',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const success = await sendWebhookNotification(webhookUrl, {
        type: 'ip_offline',
        record: testRecord,
        message: '这是一个测试通知 - IP连接测试失败'
      })

      setTestResult({
        success,
        message: success ? '测试通知发送成功！' : '测试通知发送失败',
        details: { webhookUrl, timestamp: new Date().toISOString() }
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        details: { error: error instanceof Error ? error.stack : error }
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook 测试工具</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook URL
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
            className="input"
          />
          <p className="text-xs text-gray-500 mt-1">
            输入飞书机器人的Webhook URL进行测试
          </p>
        </div>

        <button
          onClick={handleTest}
          disabled={isTesting || !webhookUrl.trim()}
          className="btn-primary flex items-center space-x-2"
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span>{isTesting ? '发送中...' : '发送测试通知'}</span>
        </button>

        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-success-50 border-success-200' 
              : 'bg-error-50 border-error-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-success-600" />
              ) : (
                <XCircle className="h-5 w-5 text-error-600" />
              )}
              <span className={`font-medium ${
                testResult.success ? 'text-success-800' : 'text-error-800'
              }`}>
                {testResult.message}
              </span>
            </div>
            
            {testResult.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  查看详细信息
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">使用说明：</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. 在飞书群中添加机器人并获取Webhook URL</li>
            <li>2. 将Webhook URL粘贴到上方输入框</li>
            <li>3. 点击"发送测试通知"按钮测试连接</li>
            <li>4. 如果测试成功，在IP记录中填入相同的Webhook URL</li>
          </ul>
        </div>
      </div>
    </div>
  )
}