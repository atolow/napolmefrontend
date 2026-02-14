import { http } from '../lib/http'
import type { ApiResponse } from './characterApi'

export type NicknameStatus = 'checking' | 'available' | 'unavailable'

export type GeneratedNickname = {
  name: string
  status: NicknameStatus
}

export type NicknameGenerateRequest = {
  mode: 'normal' | 'combination' | 'direct'
  length: number
  excludeFinalConsonant: boolean
  excludeDoubleConsonant: boolean
  excludeUType: boolean
  excludeEType: boolean
  fixedCharacters?: string
  excludedCharacters?: string
  directInput?: string
  selectedInitials?: string[]
  selectedMedials?: string[]
  selectedFinals?: string[]
  serverId?: string
}

export type NicknameGenerateResponse = {
  nicknames: GeneratedNickname[]
}

export const nicknameApi = {
  generate(params: NicknameGenerateRequest) {
    return http.post<ApiResponse<NicknameGenerateResponse>>('/api/nickname/generate', params)
  },
}
