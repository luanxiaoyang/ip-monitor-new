import React from 'react'
import { useForm } from 'react-hook-form'
import { X, Plus, Edit3 } from 'lucide-react'
import { IPFormData, IPRecord } from '../types/ip'
import { useCreateIPRecord, useUpdateIPRecord } from '../hooks/useIPRecords'

interface IPFormProps {
  isOpen: boolean
  onClose: () => void
  editingRecord?: IPRecord | null
}

export const IPForm: React.FC<IPFormProps> = ({ isOpen, onClose, editingRecord }) => {
  const createMutation = useCreateIPRecord()
  const updateMutation = useUpdateIPRecord()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<IPFormData>({
    defaultValues: editingRecord ? {
      ip: editingRecord.ip,
      port: editingRecord.port,
      username: editingRecord.username,
      password: editingRecord.password,
      name: editingRecord.name || '',
      notes: editingRecord.notes || '',
      expiry_date: editingRecord.expiry_date.split('T')[0],
      webhook_url: editingRecord.webhook_url || ''
    } : {
      port: 80,
      expiry_date: new Date().toISOString().split('T')[0]
    }
  })

  const onSubmit = async (data: IPFormData) => {
    try {
      if (editingRecord) {
        await updateMutation.mutateAsync({ id: editingRecord.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
      reset()
      onClose()
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {editingRecord ? (
              <Edit3 className="h-6 w-6 text-primary-600" />
            ) : (
              <Plus className="h-6 w-6 text-primary-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {editingRecord ? '编辑IP记录' : '添加新IP记录'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IP地址 *
              </label>
              <input
                type="text"
                {...register('ip', { 
                  required: 'IP地址是必填项',
                  pattern: {
                    value: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                    message: '请输入有效的IP地址'
                  }
                })}
                className="input"
                placeholder="192.168.1.1"
              />
              {errors.ip && (
                <p className="mt-1 text-sm text-error-600">{errors.ip.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                端口 *
              </label>
              <input
                type="number"
                {...register('port', { 
                  required: '端口是必填项',
                  min: { value: 1, message: '端口必须大于0' },
                  max: { value: 65535, message: '端口必须小于65536' }
                })}
                className="input"
                placeholder="80"
              />
              {errors.port && (
                <p className="mt-1 text-sm text-error-600">{errors.port.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名 *
              </label>
              <input
                type="text"
                {...register('username', { required: '用户名是必填项' })}
                className="input"
                placeholder="admin"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-error-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码 *
              </label>
              <input
                type="password"
                {...register('password', { required: '密码是必填项' })}
                className="input"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名称/标识
            </label>
            <input
              type="text"
              {...register('name')}
              className="input"
              placeholder="服务器名称或标识"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              到期日期 *
            </label>
            <input
              type="date"
              {...register('expiry_date', { required: '到期日期是必填项' })}
              className="input"
            />
            {errors.expiry_date && (
              <p className="mt-1 text-sm text-error-600">{errors.expiry_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input resize-none"
              placeholder="添加备注信息，如使用者、用途等..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              {...register('webhook_url')}
              className="input"
              placeholder="https://example.com/webhook"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : editingRecord ? '更新' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}