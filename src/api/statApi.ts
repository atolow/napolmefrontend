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

export type DailySearchRankItem = {
  name: string
  count: number
  /** 전일 대비 순위 변동: up(▲), down(▼), same/new(-) */
  rankChange: string
  /** 순위 변동 폭 (올라간/내려간 칸 수, same/new일 때 0) */
  changeAmount?: number
  /** elyos(천족) | asmo(마족) | null */
  tribe?: string | null
  /** 해당 캐릭터가 검색된 서버 ID (클릭 시 해당 서버로 검색) */
  serverId?: string | null
}

export type NapolmeRankItem = {
  nickname: string
  napolmePoint: number
  serverId: string | null
  serverName: string | null
}

export type NapolmeRankingResponse = {
  elyos: NapolmeRankItem[]
  asmo: NapolmeRankItem[]
}

export type ChzzkLiveItem = {
  liveId: number
  liveTitle: string
  liveImageUrl: string | null
  concurrentUserCount: number
  channelId: string
  channelName: string
  channelImageUrl: string | null
  liveUrl: string
}

const DAILY_RANKING_DEDUPE_WINDOW_MS = 1500
type DailyRankingPromise = ReturnType<
  typeof http.get<ApiResponse<DailySearchRankItem[]>>
>
type DailyRankingResponse = Awaited<DailyRankingPromise>

let dailyRankingInFlight: DailyRankingPromise | null = null
let dailyRankingLastResponse: DailyRankingResponse | null = null
let dailyRankingLastFetchedAt = 0

export const statApi = {
  getPopular() {
    return http.get<ApiResponse<PopularStatResponse>>('/api/stat/popular')
  },

  getDailySearchRanking(options?: {
    force?: boolean
    dedupeWindowMs?: number
  }) {
    const force = options?.force === true
    const dedupeWindowMs =
      options?.dedupeWindowMs ?? DAILY_RANKING_DEDUPE_WINDOW_MS
    const now = Date.now()

    if (!force) {
      if (dailyRankingInFlight) {
        return dailyRankingInFlight
      }
      if (
        dailyRankingLastResponse &&
        now - dailyRankingLastFetchedAt < dedupeWindowMs
      ) {
        return Promise.resolve(dailyRankingLastResponse)
      }
    }

    const request = http
      .get<ApiResponse<DailySearchRankItem[]>>('/api/stat/daily-search-ranking')
      .then((res) => {
        dailyRankingLastResponse = res
        dailyRankingLastFetchedAt = Date.now()
        return res
      })
      .finally(() => {
        dailyRankingInFlight = null
      })

    dailyRankingInFlight = request
    return request
  },

  getNapolmeRanking() {
    return http.get<ApiResponse<NapolmeRankingResponse>>('/api/stat/napolme-ranking')
  },

  getChzzkLives() {
    return http.get<ApiResponse<ChzzkLiveItem[]>>('/api/stat/chzzk-lives')
  },

}
