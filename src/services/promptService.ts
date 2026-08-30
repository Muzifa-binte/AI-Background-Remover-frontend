import apiClient from './apiClient'
import type { PromptTemplate } from '../types'

export const promptService = {
  async list(): Promise<PromptTemplate[]> {
    const { data } = await apiClient.get<PromptTemplate[]>('/api/prompts')
    return data
  },
  async create(title: string, promptText: string, tags: string[] = []): Promise<PromptTemplate> {
    const { data } = await apiClient.post<PromptTemplate>('/api/prompts', {
      title,
      prompt_text: promptText,
      tags,
    })
    return data
  },
  async use(templateId: string): Promise<PromptTemplate> {
    const { data } = await apiClient.post<PromptTemplate>(`/api/prompts/${templateId}/use`)
    return data
  },
  async remove(templateId: string): Promise<void> {
    await apiClient.delete(`/api/prompts/${templateId}`)
  },
}
