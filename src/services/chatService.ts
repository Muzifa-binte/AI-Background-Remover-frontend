import apiClient from './apiClient'
import type { ChatResponse } from '../types'

export const chatService = {
  async sendMessage(message: string, file?: File | null): Promise<ChatResponse> {
    const formData = new FormData()
    formData.append('message', message)
    if (file) {
      formData.append('file', file)
    }
    // Do NOT set Content-Type manually — axios auto-sets multipart/form-data
    // with the correct boundary when it detects a FormData body.
    // Manually setting it drops the boundary and causes FastAPI to reject the request.
    const { data } = await apiClient.post<ChatResponse>('/api/chat', formData)
    return data
  },
}
