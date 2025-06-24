import React, { useState } from 'react'
import { Send, CheckCircle, XCircle, Loader2, Copy } from 'lucide-react'
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

  // 示例卡片格式（用于参考）
  const exampleCard = {
    "config": {
      "wide_screen_mode": true
    },
    "elements": [
      {
        "tag": "div",
        "text": {
          "content": "🚨 **IP连接异常警告** - 这是一个测试消息",
          "tag": "lark_md"
        }
      },
      {
        "tag": "column_set",
        "flex_mode": "none",
        "background_style": "default",
        "columns": [
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "vertical_align": "top",
            "elements": [
              {
                "tag": "column_set",
                "flex_mode": "none",
                "background_style": "grey",
                "columns": [
                  {
                    "tag": "column",
                    "width": "weighted",
                    "weight": 1,
                    "vertical_align": "top",
                    "elements": [
                      {
                        "tag": "markdown",
                        "content": "**IP地址**\n192.168.1.100:1080",
                        "text_align": "center"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "vertical_align": "top",
            "elements": [
              {
                "tag": "column_set",
                "flex_mode": "none",
                "background_style": "grey",
                "columns": [
                  {
                    "tag": "column",
                    "width": "weighted",
                    "weight": 1,
                    "vertical_align": "top",
                    "elements": [
                      {
                        "tag": "markdown",
                        "content": "**状态**\n<font color='red'>离线</font>",
                        "text_align": "center"
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
        "tag": "note",
        "elements": [
          {
            "tag": "plain_text",
            "content": "💡 这是一个测试通知，请忽略"
          }
        ]
      }
    ],
    "header": {
      "template": "red",
      "title": {
        "content": "🔥 IP监测系统测试通知",
        "tag": "plain_text"
      }
    }
  }

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
        message: success ? '测试通知发送成功！请检查你的飞书群是否收到消息。' : '测试通知发送失败，请检查Webhook URL是否正确。',
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

  const handleTestSimpleMessage = async () => {
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
      // 发送简单文本消息
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: "🚨 测试消息\n\n这是来自IP监测系统的测试通知，如果你看到这条消息，说明Webhook配置正确！\n\n时间: " + new Date().toLocaleString('zh-CN')
        })
      })

      const success = response.ok
      const responseText = await response.text()

      setTestResult({
        success,
        message: success ? '简单文本测试发送成功！' : '简单文本测试发送失败',
        details: { 
          status: response.status, 
          response: responseText,
          webhookUrl, 
          timestamp: new Date().toISOString() 
        }
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: `简单文本测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        details: { error: error instanceof Error ? error.stack : error }
      })
    } finally {
      setIsTesting(false)
    }
  }

  const copyExampleCard = () => {
    navigator.clipboard.writeText(JSON.stringify(exampleCard, null, 2))
    alert('示例卡片格式已复制到剪贴板')
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

        <div className="flex space-x-3">
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
            <span>{isTesting ? '发送中...' : '发送卡片测试'}</span>
          </button>

          <button
            onClick={handleTestSimpleMessage}
            disabled={isTesting || !webhookUrl.trim()}
            className="btn-secondary flex items-center space-x-2"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{isTesting ? '发送中...' : '发送文本测试'}</span>
          </button>
        </div>

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
          <ul className="text-sm text-blue-700 space-y-1 mb-3">
            <li>1. 在飞书群中添加机器人并获取Webhook URL</li>
            <li>2. 将Webhook URL粘贴到上方输入框</li>
            <li>3. 先点击"发送文本测试"确认基本连接</li>
            <li>4. 再点击"发送卡片测试"测试完整格式</li>
            <li>5. 如果测试成功，在IP记录中填入相同的Webhook URL</li>
          </ul>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={copyExampleCard}
              className="btn-secondary text-xs flex items-center space-x-1"
            >
              <Copy className="h-3 w-3" />
              <span>复制示例卡片格式</span>
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">故障排除：</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 如果显示发送成功但没收到消息，可能是卡片格式问题</li>
            <li>• 尝试先发送文本测试，确认Webhook URL正确</li>
            <li>• 检查飞书机器人是否有发送消息权限</li>
            <li>• 查看浏览器控制台的详细错误信息</li>
          </ul>
        </div>
      </div>
    </div>
  )
}