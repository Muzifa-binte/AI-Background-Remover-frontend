import apiClient from './apiClient'
import type { Favorite } from '../types'

export const favoriteService = {
  async list(): Promise<Favorite[]> {
    const { data } = await apiClient.get<Favorite[]>('/api/favorites')
    return data
  },
  async create(content: string, source: Favorite['source'] = 'chat'): Promise<Favorite> {
    const { data } = await apiClient.post<Favorite>('/api/favorites', { content, source })
    return data
  },
  async remove(favoriteId: string): Promise<void> {
    await apiClient.delete(`/api/favorites/${favoriteId}`)
  },
}
