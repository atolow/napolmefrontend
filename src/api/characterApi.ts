import { http } from '../lib/http'

export type ApiResponse<T> = {
  success: boolean
  code: string
  message: string
  data: T
  cacheHit: boolean
  cooldown: number
  timestamp: string
}

export type CachePolicy = {
  cacheHit: boolean
  canRefresh: boolean
}

export type CharacterSummary = {
  characterId: string
  name: string
  level: number | null
  serverId: number | null
  serverName: string | null
  race: number | null
  classId: number | null
  profileImageUrl: string | null
  combatPower?: number | null
}

export type CharacterSearchResponse = {
  query: string
  server: string | null
  total: number
  items: CharacterSummary[]
  cache: CachePolicy
  redirectUrl?: string | null
}

export type BoardUpdateItem = {
  title: string
  url: string
  date: string | null
}

export type BoardUpdateResponse = {
  items: BoardUpdateItem[]
  lastUpdated: string
  cache: CachePolicy
}

export type CharacterDetailResponse = {
  server: string
  name: string
  level: number | null
  characterClass: string | null
  combatPower: number | null
  guildName: string | null
  avatarUrl: string | null
  lastUpdated: string
  cache: CachePolicy
}

export type CharacterSearchParams = {
  query: string
  server?: string
  race?: number
}

/** POST /api/characters/fetch 응답 (URL로 가져온 저장 캐릭터) */
export type CharacterResponse = {
  id: number
  characterId: string
  serverId: string
  nickname: string
  level: number | null
  serverName: string | null
  className: string | null
  tribe: string | null
  guild: string | null
  profileImage: string | null
  itemLevel: number | null
  napolmePoint: number | null
  lastSyncedAt: string | null
  createdAt: string
  updatedAt: string
}

/** /api/characters/search 요청: server+name 또는 nickname */
export type CharactersSearchParams = {
  server?: string
  name?: string
  nickname?: string
  race?: number
}

export type CharacterInfoResponse = {
  characterId: string
  name: string
  level: number | null
  serverId: number | null
  serverName: string | null
  regionName: string | null
  className: string | null
  raceName: string | null
  genderName: string | null
  profileImage: string | null
  statsSummary: {
    itemLevel: number | null
    primaryStats: {
      type: string
      name: string
      value: number | null
      statSecondList: string[] | null
    }[]
    specialStats: {
      type: string
      name: string
      value: number | null
      statSecondList: string[] | null
    }[]
  }
  rankings: {
    contentName: string | null
    rank: number | null
    point: number | null
    prevRank: number | null
    rankChange: number | null
    className: string | null
    guildName: string | null
  }[]
  topTitles: {
    id: number | null
    equipCategory: string | null
    name: string | null
    grade: string | null
    totalCount: number | null
    ownedCount: number | null
    ownedPercent: number | null
    statList: string[]
    equipStatList: string[]
  }[]
  daevanionBoards: {
    id: number | null
    name: string | null
    totalNodeCount: number | null
    openNodeCount: number | null
    openPercent: number | null
    icon: string | null
  }[]
  lastUpdated: string
  cache: CachePolicy
}

export type CharacterEquipmentSkillResponse = {
  equipmentList: {
    id: number | null
    name: string | null
    enchantLevel: number | null
    exceedLevel: number | null
    grade: string | null
    slotPos: number | null
    slotPosName: string | null
    icon: string | null
  }[]
  skinList: {
    id: number | null
    name: string | null
    enchantLevel: number | null
    exceedLevel: number | null
    grade: string | null
    slotPos: number | null
    slotPosName: string | null
    icon: string | null
  }[]
  pet: {
    id: number | null
    name: string | null
    level: number | null
    icon: string | null
  } | null
  wing: {
    id: number | null
    name: string | null
    enchantLevel: number | null
    grade: string | null
    icon: string | null
  } | null
  wingSkin: {
    id: number | null
    name: string | null
    enchantLevel: number | null
    grade: string | null
    icon: string | null
  } | null
  skillList: {
    id: number | null
    name: string | null
    needLevel: number | null
    skillLevel: number | null
    icon: string | null
    category: string | null
    acquired: number | null
    equip: number | null
  }[]
  lastUpdated: string
  cache: CachePolicy
}

export type CharacterEquipmentItemResponse = {
  id: number | null
  name: string | null
  grade: string | null
  gradeName: string | null
  icon: string | null
  level: number | null
  levelValue: number | null
  enchantLevel: number | null
  maxEnchantLevel: number | null
  maxExceedEnchantLevel: number | null
  raceName: string | null
  classNames: string[]
  categoryName: string | null
  equipLevel: number | null
  magicStoneSlotCount: number | null
  godStoneSlotCount: number | null
  costumes: string[]
  subStatCount: number | null
  subSkillCountMax: number | null
  subStatRandom: boolean | null
  mainStats: {
    name: string | null
    minValue: string | null
    value: string | null
    extra: string | null
    exceed: boolean | null
  }[]
  soulBindRate: string | null
  subStats: {
    name: string | null
    value: string | null
  }[]
  subSkills: {
    id: number | null
    level: number | null
    icon: string | null
    name: string | null
  }[]
  magicStoneStat: {
    icon: string | null
    value: string | null
    name: string | null
    grade: string | null
    slotPos: number | null
  }[]
  godStoneStat: {
    icon: string | null
    name: string | null
    desc: string | null
    grade: string | null
    slotPos: number | null
  }[]
  sources: string[]
  cache: CachePolicy
}

export type CharacterEquipmentDetailBundleResponse = {
  equipment: CharacterEquipmentSkillResponse
  details: {
    key: string
    id: number | null
    slotPos: number | null
    slotPosName: string | null
    enchantLevel: number | null
    exceedLevel: number | null
    detail: CharacterEquipmentItemResponse | null
  }[]
  cache: CachePolicy
}

export type CharacterDaevanionBundleResponse = {
  boards: {
    boardId: number | null
    nodeList: {
      nodeId: number | null
      name: string | null
      row: number | null
      col: number | null
      grade: string | null
      type: string | null
      icon: string | null
      effectList: { desc: string | null }[]
      open: number | null
    }[]
    openStatEffectList: { desc: string | null }[]
    openSkillEffectList: { desc: string | null }[]
  }[]
  cache: CachePolicy
}
export const characterApi = {
  /** 기존 검색 (전체 서버 등): /api/character/search */
  search(params: CharacterSearchParams) {
    return http.get<ApiResponse<CharacterSearchResponse>>(
      '/api/character/search',
      { params },
    )
  },

  /** 새 검색: server+name 또는 nickname → /api/characters/search */
  searchCharacters(params: CharactersSearchParams) {
    return http.get<ApiResponse<CharacterSearchResponse>>(
      '/api/characters/search',
      { params },
    )
  },

  /** URL로 캐릭터 가져오기·저장 → /api/characters/fetch */
  fetchByUrl(url: string) {
    return http.post<ApiResponse<CharacterResponse>>('/api/characters/fetch', {
      url,
    })
  },

  /** 저장된 캐릭터 ID로 조회 → /api/characters/:id */
  getCharacterById(id: number) {
    return http.get<ApiResponse<CharacterResponse>>(
      `/api/characters/${id}`,
    )
  },

  /** serverId+characterId로 저장된 캐릭터 조회 (갱신 버튼 노출용) → /api/characters/by-ref */
  getCharacterByRef(serverId: string, characterId: string) {
    return http.get<ApiResponse<CharacterResponse>>(
      '/api/characters/by-ref',
      { params: { serverId, characterId } },
    )
  },

  /** serverId+characterId로 저장 (없으면 공식 API 조회 후 저장) → /api/characters/fetch-by-ref */
  fetchByRef(serverId: string, characterId: string) {
    return http.post<ApiResponse<CharacterResponse>>(
      '/api/characters/fetch-by-ref',
      null,
      { params: { serverId, characterId } },
    )
  },

  /** 저장된 캐릭터 갱신 → /api/characters/:id/refresh */
  refreshCharacter(id: number) {
    return http.post<ApiResponse<CharacterResponse>>(
      `/api/characters/${id}/refresh`,
    )
  },

  getDetail(server: string, name: string) {
    return http.get<ApiResponse<CharacterDetailResponse>>(
      `/api/character/${server}/${name}`,
    )
  },

  getInfo(serverId: string, characterId: string) {
    return http.get<ApiResponse<CharacterInfoResponse>>('/api/character/info', {
      params: { serverId, characterId, lang: 'ko' },
    })
  },

  getEquipment(serverId: string, characterId: string) {
    return http.get<ApiResponse<CharacterEquipmentSkillResponse>>(
      '/api/character/equipment',
      { params: { serverId, characterId, lang: 'ko' } },
    )
  },

  getEquipmentBundle(serverId: string, characterId: string) {
    return http.get<ApiResponse<CharacterEquipmentDetailBundleResponse>>(
      '/api/character/equipment/bundle',
      { params: { serverId, characterId, lang: 'ko' } },
    )
  },

  getDaevanionBundle(
    serverId: string,
    characterId: string,
    boardIds: number[],
  ) {
    return http.get<ApiResponse<CharacterDaevanionBundleResponse>>(
      '/api/character/daevanion/bundle',
      { params: { serverId, characterId, boardIds: boardIds.join(','), lang: 'ko' } },
    )
  },

  getEquipmentItem(params: {
    id: number | null
    enchantLevel: number | null
    characterId: string
    serverId: string
    slotPos: number | null
  }) {
    return http.get<ApiResponse<CharacterEquipmentItemResponse>>(
      '/api/character/equipment/item',
      {
        params: {
          ...params,
          lang: 'ko',
        },
      },
    )
  },

  getBoardUpdates(size = 4) {
    return http.get<ApiResponse<BoardUpdateResponse>>('/api/board/updates', {
      params: { size, lang: 'ko' },
    })
  },

  getNapolmeUpdates() {
    return http.get<ApiResponse<NapolmeUpdatesResponse>>('/api/board/napolme-updates')
  },

  createNapolmeUpdate(title: string, content: string) {
    return http.post<ApiResponse<NapolmeUpdateItem>>('/api/board/napolme-updates', {
      title,
      content,
    })
  },
}

export type NapolmeUpdateItem = {
  id: number
  title: string
  content: string
  createdAt: string
}

export type NapolmeUpdatesResponse = {
  items: NapolmeUpdateItem[]
  allowWrite: boolean
  /** 서버가 본 클라이언트 IP (debug=1 쿼리 시에만 내려옴) */
  seenIp?: string | null
}
