import { useCallback, useEffect, useState } from 'react'
import apiClient from '../services/apiClient'

export interface PromptTemplate {
  template_id: string
  user_id: string
  title: string
  prompt_text: string
  tags: string[]
  use_count: number
  created_at: string
}

export function usePromptTemplates() {
  const [items, setItems] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.get<PromptTemplate[]>('/api/prompts')
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompt templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const createTemplate = useCallback(
    async (title: string, promptText: string, tags: string[]) => {
      const { data } = await apiClient.post<PromptTemplate>('/api/prompts', {
        title,
        prompt_text: promptText,
        tags,
      })
      setItems(prev => [data, ...prev])
      return data
    },
    []
  )

  const useTemplate = useCallback(async (templateId: string) => {
    const { data } = await apiClient.post<PromptTemplate>(`/api/prompts/${templateId}/use`)
    setItems(prev => prev.map(t => (t.template_id === templateId ? data : t)))
    return data
  }, [])

  const deleteTemplate = useCallback(async (templateId: string) => {
    await apiClient.delete(`/api/prompts/${templateId}`)
    setItems(prev => prev.filter(t => t.template_id !== templateId))
  }, [])

  return { items, loading, error, createTemplate, useTemplate, deleteTemplate, reload: load }
}
