import { http } from '../lib/http'
import type { ApiResponse, CachePolicy } from './characterApi'

export type PopularStatItem = {
  key: string
  label: string
  count: number
}

export type PopularStatResponse = {
  type: string
  asOf: string
  items: PopularStatItem[]
  cache: CachePolicy
}

export const statApi = {
  getPopular() {
    return http.get<ApiResponse<PopularStatResponse>>('/api/stat/popular')
  },
}
