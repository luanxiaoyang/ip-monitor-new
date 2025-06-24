import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { IPRecord, IPFormData } from '../types/ip'
import toast from 'react-hot-toast'

export const useIPRecords = () => {
  return useQuery({
    queryKey: ['ip-records'],
    queryFn: async (): Promise<IPRecord[]> => {
      const { data, error } = await supabase
        .from('ip_records')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
  })
}

export const useCreateIPRecord = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: IPFormData): Promise<IPRecord> => {
      const { data: result, error } = await supabase
        .from('ip_records')
        .insert([{
          ...data,
          is_active: true,
          status: 'unknown'
        }])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-records'] })
      toast.success('IP记录创建成功')
    },
    onError: (error: Error) => {
      toast.error(`创建失败: ${error.message}`)
    },
  })
}

export const useUpdateIPRecord = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IPFormData> }): Promise<IPRecord> => {
      const { data: result, error } = await supabase
        .from('ip_records')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-records'] })
      toast.success('IP记录更新成功')
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`)
    },
  })
}

export const useDeleteIPRecord = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('ip_records')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-records'] })
      toast.success('IP记录删除成功')
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`)
    },
  })
}

export const useUpdateIPStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }): Promise<void> => {
      const { error } = await supabase
        .from('ip_records')
        .update({ 
          status,
          last_checked: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-records'] })
    },
    onError: (error: Error) => {
      console.error('Status update failed:', error)
    },
  })
}