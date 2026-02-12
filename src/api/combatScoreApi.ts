import { http } from '../lib/http'
import type { ApiResponse } from './characterApi'

/** 나폴미 점수(전투력) 계산 결과 */
export type CombatScoreResponse = {
  dpsScore: number
  defenseScore: number
  survivalScore: number
  utilityScore: number
  totalCombatPower: number
  breakdown: {
    baseAttack: number
    critMultiplier: number
    speedMultiplier: number
    penetrationBonus: number
    effectiveDps: number
  }
  buffedStats: {
    attack: number
    magicAttack: number
    defense: number
    magicDefense: number
    criticalRate: number
    criticalDamage: number
    attackSpeed: number
    accuracy: number
  } | null
  grade: 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C' | 'D'
}

export const combatScoreApi = {
  /** 캐릭터 상세용: serverId + characterId로 나폴미 점수 조회 */
  getCombatScore(serverId: string, characterId: string) {
    return http.get<ApiResponse<CombatScoreResponse>>('/api/combat-score', {
      params: { serverId, characterId },
    })
  },
}
