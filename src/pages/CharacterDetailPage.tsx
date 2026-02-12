import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { characterApi } from '../api'
import type {
  CharacterDaevanionBundleResponse,
  CharacterEquipmentItemResponse,
  CharacterEquipmentSkillResponse,
  CharacterInfoResponse,
  CharacterSummary,
} from '../api/characterApi'

const SKILL_LABELS: Record<string, string> = {
  Active: '액티브',
  Passive: '패시브',
  Dp: '스티그마',
}

const SKY_STAT_NAMES = new Set([
  '위력',
  '민첩',
  '지식',
  '체력',
  '정확',
  '의지',
  '정의[네자칸]',
  '자유[바이젤]',
  '환상[카이시넬]',
  '생명[유스티엘]',
  '시간[시엘]',
  '파괴[지켈]',
  '죽음[트리니엘]',
  '지혜[루미엘]',
  '운명[마르쿠탄]',
  '공간[이스라펠]',
])

const isSkyStatName = (name?: string | null) =>
  typeof name === 'string' && SKY_STAT_NAMES.has(name)

const EQUIPMENT_GROUPS = {
  weapon: '무기',
  armor: '방어구',
  accessory: '장신구',
  rune: '룬/아뮬렛',
  arcana: '아르카나',
  etc: '기타',
} as const

const WEAPON_SLOTS = new Set([
  'MainHand',
  'SubHand',
  'Greatsword',
  'Sword',
  'Dagger',
  'Bow',
  'Staff',
  'Mace',
  'Harp',
  'Gun',
  'Cannon',
  'Orb',
  'Shield',
  'Book',
])

const ARMOR_SLOTS = new Set([
  'Helmet',
  'Torso',
  'Shoulder',
  'Gloves',
  'Pants',
  'Boots',
  'Cape',
])

const ACCESSORY_SLOTS = new Set([
  'Necklace',
  'Earring1',
  'Earring2',
  'Ring1',
  'Ring2',
  'Bracelet1',
  'Bracelet2',
  'Belt',
])

const RUNE_SLOTS = new Set(['Rune1', 'Rune2', 'Rune3', 'Rune4', 'Rune5', 'Amulet'])

const ALL_SERVER_OPTION = { name: '전체 서버에서 검색', id: 'ALL' }

const elyosServers = [
  { name: '시엘', id: '1001' },
  { name: '네자칸', id: '1002' },
  { name: '바이젤', id: '1003' },
  { name: '카이시넬', id: '1004' },
  { name: '유스티엘', id: '1005' },
  { name: '아리엘', id: '1006' },
  { name: '프레기온', id: '1007' },
  { name: '메스', id: '1008' },
  { name: '히타니에', id: '1009' },
  { name: '나니아', id: '1010' },
  { name: '타하바타', id: '1011' },
  { name: '루터스', id: '1012' },
  { name: '페르', id: '1013' },
  { name: '다미누', id: '1014' },
  { name: '카사카', id: '1015' },
  { name: '바카르마', id: '1016' },
  { name: '첸가룽', id: '1017' },
  { name: '코치룽', id: '1018' },
  { name: '이슈타르', id: '1019' },
  { name: '티아마트', id: '1020' },
  { name: '포에타', id: '1021' },
]

const asmoServers = [
  { name: '이스라펠', id: '2001' },
  { name: '지켈', id: '2002' },
  { name: '트리니엘', id: '2003' },
  { name: '루미엘', id: '2004' },
  { name: '마르쿠탄', id: '2005' },
  { name: '아스펠', id: '2006' },
  { name: '에레슈키갈', id: '2007' },
  { name: '브리트라', id: '2008' },
  { name: '네몬', id: '2009' },
  { name: '하달', id: '2010' },
  { name: '루드라', id: '2011' },
  { name: '울고근', id: '2012' },
  { name: '무닌', id: '2013' },
  { name: '오다르', id: '2014' },
  { name: '젠카카', id: '2015' },
  { name: '크로메데', id: '2016' },
  { name: '콰이링', id: '2017' },
  { name: '바바룽', id: '2018' },
  { name: '파프니르', id: '2019' },
  { name: '인드나흐', id: '2020' },
  { name: '이스할겐', id: '2021' },
]

const serverFilterLabels = {
  all: '서버 전체',
  elyos: '천족 서버',
  asmo: '마족 서버',
}

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return ''
  }
  const normalized = value.replace('T', ' ')
  const match = normalized.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
  if (match) {
    return match[0]
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
    parsed.getDate(),
  )} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(
    parsed.getSeconds(),
  )}`
}

export default function CharacterDetailPage() {
  const navigate = useNavigate()
  const { serverId, characterId } = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [characterInfo, setCharacterInfo] =
    useState<CharacterInfoResponse | null>(null)
  const [characterEquipment, setCharacterEquipment] =
    useState<CharacterEquipmentSkillResponse | null>(null)
  const [daevanionBundle, setDaevanionBundle] =
    useState<CharacterDaevanionBundleResponse | null>(null)
  const [isLoadingDaevanion, setIsLoadingDaevanion] = useState(false)
  const [daevanionError, setDaevanionError] = useState('')
  const [selectedDaevanionBoardId, setSelectedDaevanionBoardId] = useState<
    number | null
  >(null)
  const [detailTab, setDetailTab] = useState<'basic' | 'daevanion'>('basic')
  const [searchQuery, setSearchQuery] = useState('')
  const [serverFilter, setServerFilter] =
    useState<keyof typeof serverFilterLabels>('all')
  const [serverIdFilter, setServerIdFilter] = useState(ALL_SERVER_OPTION.id)
  const [searchStatus, setSearchStatus] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<CharacterSummary[]>([])
  const [equipmentDetails, setEquipmentDetails] = useState<
    Record<string, CharacterEquipmentItemResponse>
  >({})
  const [equipmentDetailFailures, setEquipmentDetailFailures] = useState<
    Record<string, boolean>
  >({})
  const [skillTooltip, setSkillTooltip] = useState<{
    visible: boolean
    title: string
    totalLevel: number
    arcanaBonus: number
    gearBonus: number
    otherBonus: number
    isStigma: boolean
    left: number
    top: number
  }>({
    visible: false,
    title: '',
    totalLevel: 0,
    arcanaBonus: 0,
    gearBonus: 0,
    otherBonus: 0,
    isStigma: false,
    left: 0,
    top: 0,
  })

  const decodedCharacterId = characterId ? decodeURIComponent(characterId) : ''

  const serverOptions = useMemo(() => {
    if (serverFilter === 'elyos') {
      return [ALL_SERVER_OPTION, ...elyosServers]
    }
    if (serverFilter === 'asmo') {
      return [ALL_SERVER_OPTION, ...asmoServers]
    }
    return [ALL_SERVER_OPTION, ...elyosServers, ...asmoServers]
  }, [serverFilter])

  useEffect(() => {
    setServerIdFilter(ALL_SERVER_OPTION.id)
  }, [serverFilter])

  useEffect(() => {
    if (!serverId || !decodedCharacterId) {
      setErrorMessage('캐릭터 정보를 찾을 수 없습니다.')
      return
    }

    const fetchDetail = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const [infoResponse, bundleResponse] = await Promise.all([
          characterApi.getInfo(serverId, decodedCharacterId),
          characterApi.getEquipmentBundle(serverId, decodedCharacterId),
        ])
        setCharacterInfo(infoResponse.data.data)
        setCharacterEquipment(bundleResponse.data.data.equipment)
        const detailMap: Record<string, CharacterEquipmentItemResponse> = {}
        const failureMap: Record<string, boolean> = {}
        ;(bundleResponse.data.data.details ?? []).forEach((item) => {
          if (item.detail) {
            detailMap[item.key] = item.detail
          } else {
            failureMap[item.key] = true
          }
        })
        setEquipmentDetails(detailMap)
        setEquipmentDetailFailures(failureMap)
      } catch (error) {
        setErrorMessage('캐릭터 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetail()
  }, [serverId, decodedCharacterId])

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery || isSearching) {
      if (!trimmedQuery) {
        setSearchStatus('검색어를 입력해주세요.')
      }
      return
    }
    if (serverIdFilter === ALL_SERVER_OPTION.id) {
      const params = new URLSearchParams({
        query: trimmedQuery,
        race: serverFilter,
      })
      navigate(`/search?${params.toString()}`)
      return
    }
    setIsSearching(true)
    setSearchStatus('')
    setSearchResults([])
    try {
      const response = await characterApi.search({
        query: trimmedQuery,
        server: serverIdFilter === ALL_SERVER_OPTION.id ? undefined : serverIdFilter,
        race:
          serverFilter === 'elyos'
            ? 1
            : serverFilter === 'asmo'
              ? 2
              : undefined,
      })
      const payload = response.data
      if (
        serverIdFilter !== ALL_SERVER_OPTION.id &&
        payload.data.items.length === 1 &&
        payload.data.items[0]
      ) {
        const item = payload.data.items[0]
        const encodedId = encodeURIComponent(item.characterId)
        navigate(`/character/${item.serverId}/${encodedId}`)
        return
      }
      setSearchResults(payload.data.items)
      setSearchStatus('검색 결과가 있습니다. 홈에서 확인해주세요.')
    } catch (error) {
      setSearchStatus('현재 서버 부하가 높음')
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    if (!serverId || !decodedCharacterId || !characterInfo?.daevanionBoards?.length) {
      return
    }
    const boardIds = (characterInfo.daevanionBoards ?? [])
      .map((board) => board.id)
      .filter((id): id is number => typeof id === 'number')
    if (boardIds.length === 0) {
      return
    }
    setIsLoadingDaevanion(true)
    setDaevanionError('')
    characterApi
      .getDaevanionBundle(serverId, decodedCharacterId, boardIds)
      .then((response) => {
        setDaevanionBundle(response.data.data)
      })
      .catch(() => {
        setDaevanionError('데바니온 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        setIsLoadingDaevanion(false)
      })
  }, [characterInfo?.daevanionBoards, serverId, decodedCharacterId])

  const skillBuckets = useMemo(() => {
    const list = characterEquipment?.skillList ?? []
    const grouped = list.reduce<Record<string, typeof list>>((acc, item) => {
      const key = item.category || '기타'
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(item)
      return acc
    }, {})

    Object.values(grouped).forEach((items) => {
      items.sort((a, b) => {
        const levelDiff = (b.skillLevel ?? 0) - (a.skillLevel ?? 0)
        if (levelDiff !== 0) {
          return levelDiff
        }
        return (a.name ?? '').localeCompare(b.name ?? '')
      })
    })

    return grouped
  }, [characterEquipment])

  const rankingItems = useMemo(() => {
    const base = characterInfo?.rankings ?? []
    const byName = new Map<string, (typeof base)[number]>()
    base.forEach((item) => {
      const key = item.contentName ?? ''
      if (key) {
        byName.set(key, item)
      }
    })
    const requiredNames = ['고독의 투기장', '협력의 투기장']
    const extras = requiredNames
      .filter((name) => !byName.has(name))
      .map((name) => ({
        contentName: name,
        rank: null,
        point: null,
        prevRank: null,
        rankChange: null,
        className: null,
        guildName: null,
      }))
    const merged = [...base, ...extras]
    const order = [
      '초월',
      '악몽',
      '토벌전',
      '각성전',
      '어비스',
      '고독의 투기장',
      '협력의 투기장',
    ]
    const orderMap = new Map(order.map((name, index) => [name, index]))
    return merged.slice().sort((a, b) => {
      const aName = a.contentName ?? ''
      const bName = b.contentName ?? ''
      const aRank = orderMap.get(aName)
      const bRank = orderMap.get(bName)
      if (aRank !== undefined && bRank !== undefined) {
        return aRank - bRank
      }
      if (aRank !== undefined) {
        return -1
      }
      if (bRank !== undefined) {
        return 1
      }
      return aName.localeCompare(bName)
    })
  }, [characterInfo?.rankings])

  const rankingToneByName = (name?: string | null) => {
    if (!name) {
      return undefined
    }
    const pvpNames = ['어비스', '고독의 투기장', '협력의 투기장']
    const pveNames = ['악몽', '초월', '각성전', '토벌전']
    if (pvpNames.includes(name)) {
      return 'pvp'
    }
    if (pveNames.includes(name)) {
      return 'pve'
    }
    return undefined
  }

  const daevanionMeta = useMemo(() => {
    const nameById = new Map<number, string>()
    const openById = new Map<number, string>()
    const percentById = new Map<number, number>()
    ;(characterInfo?.daevanionBoards ?? []).forEach((board) => {
      if (typeof board.id === 'number') {
        nameById.set(board.id, board.name ?? `보드 ${board.id}`)
        openById.set(
          board.id,
          `${board.openNodeCount ?? 0}/${board.totalNodeCount ?? 0}`,
        )
        if (typeof board.openPercent === 'number') {
          percentById.set(board.id, board.openPercent)
        }
      }
    })
    return { nameById, openById, percentById }
  }, [characterInfo?.daevanionBoards])

  useEffect(() => {
    if (selectedDaevanionBoardId !== null) {
      return
    }
    const firstId = (characterInfo?.daevanionBoards ?? [])
      .map((board) => board.id)
      .find((id): id is number => typeof id === 'number')
    if (firstId !== undefined) {
      setSelectedDaevanionBoardId(firstId)
    }
  }, [characterInfo?.daevanionBoards, selectedDaevanionBoardId])

  const equipmentGroups = useMemo(() => {
    const list = characterEquipment?.equipmentList ?? []
    const grouped: Record<keyof typeof EQUIPMENT_GROUPS, typeof list> = {
      weapon: [],
      armor: [],
      accessory: [],
      rune: [],
      arcana: [],
      etc: [],
    }

    for (const item of list) {
      const slotName = item.slotPosName ?? ''
      if (slotName.startsWith('Arcana')) {
        grouped.arcana.push(item)
      } else if (RUNE_SLOTS.has(slotName)) {
        grouped.rune.push(item)
      } else if (ACCESSORY_SLOTS.has(slotName)) {
        grouped.accessory.push(item)
      } else if (ARMOR_SLOTS.has(slotName)) {
        grouped.armor.push(item)
      } else if (WEAPON_SLOTS.has(slotName) || slotName.endsWith('Hand')) {
        grouped.weapon.push(item)
      } else {
        grouped.etc.push(item)
      }
    }

    return grouped
  }, [characterEquipment])

  const buildEquipmentKey = (item: {
    id: number | null
    slotPos: number | null
    enchantLevel: number | null
    exceedLevel?: number | null
  }) => {
    const totalEnchantLevel =
      (item.enchantLevel ?? 0) + (item.exceedLevel ?? 0)
    return `${item.id ?? 0}-${item.slotPos ?? 0}-${totalEnchantLevel}`
  }

  const skillBonusBySource = useMemo(() => {
    const arcana = new Map<string, number>()
    const gear = new Map<string, number>()

    const toKey = (id?: number | null, name?: string | null) => {
      if (id != null) {
        return `id:${id}`
      }
      return `name:${name ?? ''}`
    }

    const accumulate = (
      target: Map<string, number>,
      subSkills: { id?: number | null; name?: string | null; level?: number | null }[],
    ) => {
      subSkills.forEach((skill) => {
        const key = toKey(skill.id, skill.name)
        const level = skill.level ?? 0
        if (!key) {
          return
        }
        target.set(key, (target.get(key) ?? 0) + level)
      })
    }

    const arcanaItems = equipmentGroups.arcana ?? []
    arcanaItems.forEach((item) => {
      const detailKey = buildEquipmentKey(item)
      const detail = equipmentDetails[detailKey]
      const subSkills = detail?.subSkills ?? []
      if (subSkills.length > 0) {
        accumulate(arcana, subSkills)
      }
    })

    Object.entries(equipmentGroups).forEach(([key, items]) => {
      if (key === 'arcana') {
        return
      }
      items.forEach((item) => {
        const detailKey = buildEquipmentKey(item)
        const detail = equipmentDetails[detailKey]
        const subSkills = detail?.subSkills ?? []
        if (subSkills.length > 0) {
          accumulate(gear, subSkills)
        }
      })
    })

    return { arcana, gear }
  }, [equipmentDetails, equipmentGroups])

  const arcanaSetEffects = useMemo(() => {
    const list = equipmentGroups.arcana ?? []
    const vitalityCount = list.filter((item) =>
      (item.name ?? '').includes('활력'),
    ).length
    const magicCount = list.filter((item) =>
      (item.name ?? '').includes('마력'),
    ).length
    const effects: { title: string; desc: string }[] = []

    if (magicCount >= 2) {
      effects.push({
        title: '2 세트 효과 [마력]',
        desc: '정신력이 20% 이하로 감소할 경우, 1500의 정신력을 즉시 회복 [재사용 시간 30초]',
      })
    }
    if (magicCount >= 4) {
      effects.push({
        title: '4 세트 효과 [마력]',
        desc: '정신력이 50%이상일 때, PVE 방어력 1000 증가',
      })
    }
    if (vitalityCount >= 2) {
      effects.push({
        title: '2 세트 효과 [활력]',
        desc: '생명력이 70%이상일 때, PVE 공격력 60만큼 증가',
      })
    }
    if (vitalityCount >= 4) {
      effects.push({
        title: '4 세트 효과 [활력]',
        desc: '생명력이 70%이상일 때, PVE 공격력 150만큼 증가',
      })
    }

    return effects
  }, [equipmentGroups.arcana])

  const formatMainStatValue = (stat: {
    minValue?: string | null
    value?: string | null
    extra?: string | null
  }) => {
    const minValue = stat.minValue ?? ''
    const value = stat.value ?? ''
    const extra = stat.extra ?? ''
    const hasExtra = extra !== '' && extra !== '0' && extra !== '0%'
    if (minValue && value) {
      return `${minValue} ~ ${value}${hasExtra ? ` (+${extra})` : ''}`
    }
    if ((value === '0' || value === '0%') && hasExtra) {
      return `+${extra}`
    }
    if (value && hasExtra) {
      return `${value} (+${extra})`
    }
    if (hasExtra && (value === '' || value === '0' || value === '0%')) {
      return `+${extra}`
    }
    return value || extra || '-'
  }


  return (
    <section className="detail-view">
      <div className="panel detail-header">
        <div className="detail-identity">
          <div className="detail-avatar">
            {characterInfo?.profileImage ? (
              <img
                src={characterInfo.profileImage}
                alt={characterInfo?.name ?? 'character'}
              />
            ) : (
              <div className="detail-avatar placeholder" />
            )}
          </div>
          <div className="detail-text">
            <div className="detail-title">
              {characterInfo?.name ?? '캐릭터'}
            </div>
            <div className="detail-subtitle">
              {characterInfo?.serverName ?? '서버 미확인'}
              {characterInfo?.level ? ` · Lv.${characterInfo.level}` : ''}
              {characterInfo?.className ? ` · ${characterInfo.className}` : ''}
            </div>
          </div>
        </div>
        <div className="detail-actions">
          <button className="ghost" type="button" onClick={() => navigate('/')}>
            캐릭터 검색
          </button>
          <span className="detail-updated">
            {characterInfo?.lastUpdated
              ? `업데이트 ${formatDateTime(characterInfo.lastUpdated)}`
              : '업데이트 정보 없음'}
          </span>
        </div>
      </div>

      {errorMessage && <div className="result-empty">{errorMessage}</div>}

      <div className="panel search-panel">
        <div className="panel-title">
          <span>캐릭터 검색</span>
          <span className="panel-sub">{serverFilterLabels[serverFilter]}</span>
        </div>
        <div className="search-tabs">
          <button
            type="button"
            className={`tab ${serverFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setServerFilter('all')}
          >
            전체
          </button>
          <button
            type="button"
            className={`tab ${serverFilter === 'elyos' ? 'is-active' : ''}`}
            onClick={() => setServerFilter('elyos')}
          >
            천족
          </button>
          <button
            type="button"
            className={`tab ${serverFilter === 'asmo' ? 'is-active' : ''}`}
            onClick={() => setServerFilter('asmo')}
          >
            마족
          </button>
        </div>
        <div className="search-controls">
          <select
            aria-label="서버 선택"
            value={serverIdFilter}
            onChange={(event) => setServerIdFilter(event.target.value)}
          >
            {serverOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="캐릭터 이름을 입력하세요"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearch()
              }
            }}
          />
          <button type="button" onClick={handleSearch} disabled={isSearching}>
            검색
          </button>
        </div>
        {searchStatus && <div className="search-status">{searchStatus}</div>}
        {searchResults.length > 0 && (
          <div className="search-result-grid">
            {searchResults.map((item) => (
              <button
                type="button"
                key={`${item.serverId}-${item.characterId}`}
                className="search-result-card"
                onClick={() => {
                  const encodedId = encodeURIComponent(item.characterId)
                  navigate(`/character/${item.serverId}/${encodedId}`)
                }}
              >
                <div className="search-result-avatar">
                  {item.profileImageUrl ? (
                    <img src={item.profileImageUrl} alt={item.name} />
                  ) : (
                    <div className="search-result-avatar placeholder" />
                  )}
                </div>
                <div className="search-result-info">
                  <div className="search-result-name">{item.name}</div>
                  <div className="search-result-sub">
                    {item.serverName ?? '알 수 없음'}
                  </div>
                  <div className="search-result-stats">
                    <span>전투력 {item.combatPower ?? '-'}</span>
                    {item.level ? <span>· Lv.{item.level}</span> : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detail-tabs">
        <button
          type="button"
          className={`detail-tab ${detailTab === 'basic' ? 'is-active' : ''}`}
          onClick={() => setDetailTab('basic')}
        >
          기본정보
        </button>
        <button
          type="button"
          className={`detail-tab ${detailTab === 'daevanion' ? 'is-active' : ''}`}
          onClick={() => setDetailTab('daevanion')}
        >
          데바니온
        </button>
      </div>

      {detailTab === 'daevanion' && (
        <div className="panel detail-daevanion">
          <div className="panel-title">
            <span>데바니온</span>
            <span className="panel-sub">보드별 효과 요약</span>
          </div>
          {isLoadingDaevanion && <div className="detail-loading">불러오는 중...</div>}
          {daevanionError && <div className="result-empty">{daevanionError}</div>}
          {!isLoadingDaevanion && !daevanionError && (
            <div className="daevanion-body">
              <div className="daevanion-tabs">
              {(characterInfo?.daevanionBoards ?? []).map((board) => {
                if (board.id == null) {
                  return null
                }
                const label = daevanionMeta.nameById.get(board.id) ?? `보드 ${board.id}`
                const openText = daevanionMeta.openById.get(board.id)
                const isActive = selectedDaevanionBoardId === board.id
                return (
                  <button
                    type="button"
                    key={`daevanion-tab-${board.id}`}
                    className={`daevanion-tab ${isActive ? 'is-active' : ''}`}
                    onClick={() => setSelectedDaevanionBoardId(board.id ?? null)}
                  >
                    <span>{label}</span>
                    {openText && <span className="daevanion-tab-sub">({openText})</span>}
                  </button>
                )
              })}
              <button type="button" className="daevanion-effect-button">
                보드효과 +
              </button>
            </div>
              {(() => {
              const activeBoard = (daevanionBundle?.boards ?? []).find(
                (board) => board.boardId === selectedDaevanionBoardId,
              )
              if (!activeBoard) {
                return <div className="result-empty">데바니온 정보가 없습니다.</div>
              }
              const nodes = activeBoard.nodeList ?? []
              const maxRow = nodes.reduce((max, node) => Math.max(max, node.row ?? 0), 0)
              const maxCol = nodes.reduce((max, node) => Math.max(max, node.col ?? 0), 0)
              const cellSize = 44
              return (
                <div
                  className="daevanion-board-canvas"
                  style={{
                    gridTemplateRows: `repeat(${maxRow}, ${cellSize}px)`,
                    gridTemplateColumns: `repeat(${maxCol}, ${cellSize}px)`,
                  }}
                >
                  {nodes.map((node) => (
                    <div
                      key={`node-${node.nodeId}`}
                      className={`daevanion-node ${
                        node.open === 1 ? 'is-open' : 'is-closed'
                      } ${node.grade ? `grade-${node.grade.toLowerCase()}` : ''}`}
                      style={{
                        gridRow: node.row ?? 'auto',
                        gridColumn: node.col ?? 'auto',
                      }}
                      title={
                        node.name
                          ? `${node.name}\n${(node.effectList ?? [])
                              .map((effect) => effect.desc)
                              .filter(Boolean)
                              .join('\n')}`
                          : undefined
                      }
                    >
                      <div className="daevanion-node-text">
                        {node.name ??
                          (node.effectList ?? [])
                            .map((effect) => effect.desc)
                            .filter(Boolean)
                            .shift() ??
                          ''}
                      </div>
                    </div>
                  ))}
                </div>
              )
              })()}
            </div>
          )}
        </div>
      )}

      {detailTab === 'basic' && (
        <div className="detail-basic">
          <div className="panel detail-summary">
            <div className="summary-card">
              <div className="summary-label">서버</div>
              <div className="summary-value">{characterInfo?.serverName ?? '-'}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">종족/성별</div>
              <div className="summary-value">{characterInfo?.raceName ?? '-'}</div>
              <div className="summary-sub">{characterInfo?.genderName ?? ''}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">직업</div>
              <div className="summary-value">{characterInfo?.className ?? '-'}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">레기온</div>
              <div className="summary-value">{characterInfo?.regionName ?? '-'}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">전투력</div>
              <div className="summary-value">
                {characterInfo?.statsSummary.itemLevel ?? '-'}
              </div>
              <div className="summary-sub">장비 기반</div>
            </div>
          </div>

          <div className="panel detail-skills">
            <div className="panel-title">
              <span>스킬</span>
              <span className="panel-sub">장착/습득 스킬</span>
            </div>
            {Object.entries(skillBuckets).map(([category, items]) => {
              const filteredItems =
                category === 'Dp'
                  ? items.filter((item) => (item.skillLevel ?? 0) > 0)
                  : items
              return (
              <div key={category}>
                <div className="subpanel-title">
                  {SKILL_LABELS[category] ?? category}
                </div>
                <div className="skill-group">
                  <div className="skill-scroll">
                    <div className="skill-list">
                    {filteredItems.map((item) => {
                      const key =
                        item.id != null ? `id:${item.id}` : `name:${item.name ?? ''}`
                      const arcanaBonus = skillBonusBySource.arcana.get(key) ?? 0
                      const gearBonus = skillBonusBySource.gear.get(key) ?? 0
                      const totalLevel = item.skillLevel ?? 0
                      const otherBonus = Math.max(0, totalLevel - arcanaBonus - gearBonus)
                      const handleSkillEnter = (
                        event: React.MouseEvent<HTMLDivElement>,
                      ) => {
                        const rect = event.currentTarget.getBoundingClientRect()
                        setSkillTooltip({
                          visible: true,
                          title: item.name ?? '-',
                          totalLevel,
                          arcanaBonus,
                          gearBonus,
                          otherBonus,
                          isStigma: category === 'Dp',
                          left: rect.left,
                          top: rect.top,
                        })
                      }
                      const handleSkillLeave = () => {
                        setSkillTooltip((prev) => ({ ...prev, visible: false }))
                      }
                      return (
                      <div
                        className="skill-chip"
                        key={item.id ?? item.name ?? category}
                        onMouseEnter={handleSkillEnter}
                        onMouseLeave={handleSkillLeave}
                      >
                        <span className="skill-name-top">{item.name ?? '-'}</span>
                        <div className="skill-icon-wrap">
                          {item.icon ? (
                            <img
                              src={item.icon}
                              alt={item.name ?? 'skill'}
                              className="skill-icon"
                            />
                          ) : (
                            <div className="skill-icon placeholder" />
                          )}
                        </div>
                        <span className="skill-level-text">
                          Lv.{item.skillLevel ?? 0}
                        </span>
                      </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                {skillTooltip.visible && (
                  <div
                    className="skill-tooltip skill-tooltip-floating"
                    style={{ left: skillTooltip.left, top: skillTooltip.top }}
                  >
                    <div className="skill-tooltip-title">{skillTooltip.title}</div>
                    <div className="skill-tooltip-desc">
                      {skillTooltip.isStigma &&
                      (skillTooltip.arcanaBonus === 0 ||
                        skillTooltip.gearBonus === 0) ? (
                        <>Lv.{skillTooltip.totalLevel} (기타 포인트 {skillTooltip.otherBonus})</>
                      ) : (
                        <>
                          Lv.{skillTooltip.totalLevel} (
                          <span className="skill-bonus-arcana">
                            아르카나 {skillTooltip.arcanaBonus}
                          </span>{' '}
                          +{' '}
                          <span className="skill-bonus-gear">
                            장비/장신구 {skillTooltip.gearBonus}
                          </span>{' '}
                          + 기타 포인트 {skillTooltip.otherBonus})
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              )
            })}
          </div>

          <div className="panel detail-rankings">
            <div className="panel-title">
              <span>랭킹</span>
              <span className="panel-sub">콘텐츠별 랭킹</span>
            </div>
            <div className="ranking-grid">
              {rankingItems.map((item) => (
                <div
                  className="ranking-card"
                  data-tone={rankingToneByName(item.contentName)}
                  key={item.contentName ?? 'rank'}
                >
                  <div className="ranking-name">{item.contentName ?? '-'}</div>
                  <div className="ranking-value">
                    {item.rank ? `${item.rank}위` : '-위'}
                  </div>
                  <div className="ranking-sub">
                    점수 {item.point ?? '-'} · 변동 {item.rankChange ?? 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel detail-equipment">
            <div className="panel-title">
              <span>장비</span>
              <span className="panel-sub">주요 장착 아이템</span>
            </div>
        {Object.entries(equipmentGroups).map(([key, items]) => {
          if (items.length === 0) {
            return null
          }
          if (key === 'arcana') {
            return null
          }

          return (
            <div key={key}>
              <div className="subpanel-title">
                {EQUIPMENT_GROUPS[key as keyof typeof EQUIPMENT_GROUPS]} ({items.length})
              </div>
              {['weapon', 'armor', 'accessory', 'rune'].includes(key) ? (
                <div className="equipment-group-detail-grid">
                  {items.map((item) => {
                    const detailKey = buildEquipmentKey(item)
                    const detail = equipmentDetails[detailKey]
                    if (!detail) {
                      if (equipmentDetailFailures[detailKey]) {
                        return (
                          <div
                            className="weapon-detail-card"
                            key={`${item.id}-${item.slotPosName}`}
                          >
                            <div className="equipment-detail-header">
                              <div className="equipment-detail-icon">
                                {item.icon ? (
                                  <img
                                    src={item.icon}
                                    alt={item.name ?? 'equipment'}
                                  />
                                ) : (
                                  <div className="equipment-detail-icon placeholder" />
                                )}
                              </div>
                              <div className="equipment-detail-info">
                                <div className="equipment-detail-title">
                                  <span
                                    className="gear-name"
                                    data-grade={item.grade ?? 'Common'}
                                  >
                                    {item.enchantLevel && item.enchantLevel > 0
                                      ? `+${item.enchantLevel} `
                                      : ''}
                                    {item.name ?? '-'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div
                          className="weapon-detail-card is-loading"
                          key={`${item.id}-${item.slotPosName}`}
                        >
                          <div className="equipment-detail-header">
                            <div className="equipment-detail-icon">
                              {item.icon ? (
                                <img
                                  src={item.icon}
                                  alt={item.name ?? 'equipment'}
                                />
                              ) : (
                                <div className="equipment-detail-icon placeholder" />
                              )}
                            </div>
                            <div className="equipment-detail-info">
                              <div className="equipment-detail-title">
                                <span
                                  className="gear-name"
                                  data-grade={item.grade ?? 'Common'}
                                >
                                  {item.enchantLevel && item.enchantLevel > 0
                                    ? `+${item.enchantLevel} `
                                    : ''}
                                  {item.name ?? '-'}
                                </span>
                              </div>
                              <div className="equipment-detail-sub">
                                불러오는 중...
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    const soulBindSections = (() => {
                      const stats = (detail.subStats ?? []).map((stat) => ({
                        name: stat.name ?? '-',
                        value: stat.value ?? '-',
                        icon: null as string | null,
                      }))
                      const hasExtend = (detail.categoryName ?? '').includes('늘어남')
                      const alreadyIncluded = stats.some((stat) =>
                        (stat.name ?? '').includes('늘어남'),
                      )
                      const normalizedStats =
                        hasExtend && !alreadyIncluded
                          ? [{ name: '늘어남', value: '적용', icon: null }, ...stats]
                          : stats
                      const skills = (detail.subSkills ?? []).map((skill) => ({
                        name: skill.name ?? '-',
                        value: `+${skill.level ?? '-'}`,
                        icon: skill.icon ?? null,
                      }))
                      return { stats: normalizedStats, skills }
                    })()
                    return (
                      <div
                        className="weapon-detail-card"
                        key={`${item.id}-${item.slotPosName}`}
                      >
                        <div className="equipment-detail-header">
                          <div className="equipment-detail-icon">
                            {detail.icon ? (
                              <img
                                src={detail.icon}
                                alt={detail.name ?? 'equipment'}
                              />
                            ) : (
                              <div className="equipment-detail-icon placeholder" />
                            )}
                          </div>
                          <div className="equipment-detail-info">
                            <div className="equipment-detail-title">
                              {Number(detail.maxExceedEnchantLevel) > 0 &&
                                Number(detail.enchantLevel) >
                                  Number(detail.maxEnchantLevel) && (
                                  <span className="equipment__slots-exceed">
                                    <span>
                                      {Number(detail.enchantLevel ?? 0) -
                                        Number(detail.maxEnchantLevel ?? 0)}
                                    </span>
                                  </span>
                                )}
                              <span
                                className="gear-name"
                                data-grade={detail.grade ?? 'Common'}
                              >
                                {detail.enchantLevel && detail.enchantLevel > 0
                                  ? `+${detail.enchantLevel} `
                                  : ''}
                                {detail.name ?? '-'}
                              </span>
                            </div>
                            {(detail.level || detail.levelValue) && (
                              <div className="equipment-detail-sub">
                                아이템 레벨 +{detail.level ?? '-'}
                                {detail.levelValue
                                  ? ` (+${detail.levelValue})`
                                  : ''}
                              </div>
                            )}
                            {detail.soulBindRate && (
                              <div className="equipment-detail-sub">
                                영혼 각인율 {detail.soulBindRate}%
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="equipment-detail-grid">
                          <div className="equipment-detail-card">
                            <div className="equipment-detail-card-title">
                              기본 옵션
                            </div>
                            <div className="equipment-detail-list">
                              {(detail.mainStats ?? []).map((stat, index) => (
                                <div
                                  className={`equipment-detail-row ${
                                    stat.exceed ? 'is-exceed' : ''
                                  }`}
                                  key={`${stat.name}-${index}`}
                                >
                                  <span>{stat.name ?? '-'}</span>
                                  <span>{formatMainStatValue(stat)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="equipment-detail-card">
                            <div className="equipment-detail-card-title">
                              영혼 각인
                            </div>
                            <div className="equipment-detail-list">
                              {soulBindSections.stats.map((stat, index) => (
                                <div
                                  className="equipment-detail-row"
                                  key={`${stat.name}-${index}`}
                                >
                                  <span className="soulbind-skill-name">
                                    {stat.icon ? (
                                      <img
                                        src={stat.icon}
                                        alt={stat.name ?? 'skill'}
                                        className="soulbind-skill-icon"
                                      />
                                    ) : null}
                                    {stat.name ?? '-'}
                                  </span>
                                  <span>{stat.value ?? '-'}</span>
                                </div>
                              ))}
                              {soulBindSections.stats.length > 0 &&
                                soulBindSections.skills.length > 0 && (
                                  <div className="equipment-detail-divider" />
                                )}
                              {soulBindSections.skills.map((stat, index) => (
                                <div
                                  className="equipment-detail-row"
                                  key={`${stat.name}-skill-${index}`}
                                >
                                  <span className="soulbind-skill-name">
                                    {stat.icon ? (
                                      <img
                                        src={stat.icon}
                                        alt={stat.name ?? 'skill'}
                                        className="soulbind-skill-icon"
                                      />
                                    ) : null}
                                    {stat.name ?? '-'}
                                  </span>
                                  <span>{stat.value ?? '-'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="equipment-detail-card">
                            <div className="equipment-detail-card-title">
                              마석 각인
                            </div>
                            <div className="equipment-detail-list">
                                {(detail.magicStoneStat ?? []).map((stat, index) => (
                                <div
                                  className="equipment-detail-row"
                                  key={`${stat.name}-${index}`}
                                >
                                  <span
                                    className="equipment-stone-name"
                                    data-grade={stat.grade ?? 'Common'}
                                  >
                                    {stat.name ?? '-'}
                                  </span>
                                  <span>{stat.value ?? '-'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {(detail.godStoneStat ?? []).length > 0 && (
                          <div className="equipment-detail-card">
                            <div className="equipment-detail-card-title">신석</div>
                            {(detail.godStoneStat ?? []).map((stat, index) => (
                              <div
                                className="equipment-detail-god"
                                key={`${stat.name}-${index}`}
                              >
                              <div className="equipment-detail-god-title">
                                {stat.icon ? (
                                  <img
                                    src={stat.icon}
                                    alt={stat.name ?? 'godstone'}
                                    className="equipment-detail-god-icon"
                                  />
                                ) : null}
                                <span
                                  className="godstone-name"
                                  data-grade={stat.grade ?? 'Common'}
                                >
                                  {stat.name ?? '-'}
                                </span>
                              </div>
                                <div className="equipment-detail-god-desc">
                                  {stat.desc ?? '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="gear-grid">
                  {items.map((item) => (
                    <div className="gear-card" key={`${item.id}-${item.slotPosName}`}>
                      <div className="gear-slot">{item.slotPosName ?? '-'}</div>
                      <div className="gear-main">
                        <div className="gear-icon-wrap">
                          {item.icon ? (
                            <img
                              src={item.icon}
                              alt={item.name ?? 'equipment'}
                              className="gear-icon"
                            />
                          ) : (
                            <div className="gear-icon placeholder" />
                          )}
                        </div>
                        <div className="gear-name-row">
                          {Number(item.exceedLevel) > 0 && (
                            <span className="equipment__slots-exceed">
                              <span>{item.exceedLevel}</span>
                            </span>
                          )}
                          <div
                            className="gear-name"
                            data-grade={item.grade ?? 'Common'}
                          >
                            {item.enchantLevel && item.enchantLevel > 0
                              ? `+${item.enchantLevel} `
                              : ''}
                            {item.name ?? '-'}
                          </div>
                        </div>
                      </div>
                      <div className="gear-meta">
                        {item.enchantLevel && item.enchantLevel > 0 && (
                          <span className="gear-enhance">
                            {item.enchantLevel}강화
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <div className="subpanel-title">스킨/코스튬</div>
        <div className="gear-skins">
          {(characterEquipment?.skinList ?? []).map((item) => (
            <div className="skin-chip" key={`${item.id}-${item.slotPosName}`}>
                    {item.icon ? (
                      <img
                        src={item.icon}
                        alt={item.name ?? 'skin'}
                        className="skin-icon"
                      />
                    ) : (
                      <div className="skin-icon placeholder" />
                    )}
                    <span className="skin-name" data-grade={item.grade ?? 'Common'}>
                      {item.name ?? '-'}
                    </span>
            </div>
          ))}
        </div>

      </div>

      {(equipmentGroups.arcana ?? []).length > 0 && (
        <div className="arcana-card">
          <div className="arcana-panel">
            <div className="subpanel-title arcana-title">
              {EQUIPMENT_GROUPS.arcana}
            </div>
            <div className="arcana-strip">
            {(equipmentGroups.arcana ?? []).map((item) => {
              const detailKey = buildEquipmentKey(item)
              const detail = equipmentDetails[detailKey]
              const arcanaMainStats = detail?.mainStats ?? []
              const arcanaSubStats = detail?.subStats ?? []
              const arcanaSubSkills = detail?.subSkills ?? []
              const arcanaSubSkillStones = detail?.magicStoneStat ?? []
              const hasArcanaDetail =
                arcanaMainStats.length > 0 ||
                arcanaSubStats.length > 0 ||
                arcanaSubSkills.length > 0 ||
                arcanaSubSkillStones.length > 0
              return (
              <div className="arcana-item" key={`${item.id}-${item.slotPosName}`}>
                  <div className="arcana-icon">
                    {item.icon ? (
                      <img src={item.icon} alt={item.name ?? 'arcana'} />
                    ) : (
                      <div className="arcana-icon placeholder" />
                    )}
                  </div>
                  <div className="arcana-name" data-grade={item.grade ?? 'Common'}>
                    {item.enchantLevel && item.enchantLevel > 0
                      ? `+${item.enchantLevel} `
                      : ''}
                    {item.name ?? '-'}
                  </div>
                {hasArcanaDetail && (
                  <div className="arcana-tooltip">
                    {arcanaMainStats.length > 0 && (
                      <>
                        <div className="arcana-tooltip-title">기본 옵션</div>
                        <div className="arcana-tooltip-list">
                          {arcanaMainStats.map((stat, index) => (
                            <div
                              className="arcana-tooltip-row"
                              key={`${stat.name}-${index}`}
                            >
                              <span>{stat.name ?? '-'}</span>
                              <span>{formatMainStatValue(stat)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {(arcanaSubStats.length > 0 ||
                      arcanaSubSkills.length > 0 ||
                      arcanaSubSkillStones.length > 0) && (
                      <>
                        <div className="arcana-tooltip-title">부스킬</div>
                        <div className="arcana-tooltip-list">
                          {arcanaSubStats.length > 0
                            ? arcanaSubStats.map((skill, index) => (
                                <div
                                  className="arcana-tooltip-row"
                                  key={`${skill.name}-${index}`}
                                >
                                  <span>{skill.name ?? '-'}</span>
                                  <span>{skill.value ?? '-'}</span>
                                </div>
                              ))
                            : arcanaSubSkills.length > 0
                              ? arcanaSubSkills.map((skill, index) => (
                                  <div
                                    className="arcana-tooltip-row"
                                    key={`${skill.name}-${index}`}
                                  >
                                    <span className="arcana-tooltip-skill">
                                      {skill.icon ? (
                                        <img
                                          src={skill.icon}
                                          alt={skill.name ?? 'skill'}
                                        />
                                      ) : null}
                                      {skill.name ?? '-'}
                                    </span>
                                    <span>+{skill.level ?? '-'}</span>
                                  </div>
                                ))
                              : arcanaSubSkillStones.map((skill, index) => (
                                <div
                                  className="arcana-tooltip-row"
                                  key={`${skill.name}-${index}`}
                                >
                                  <span className="arcana-tooltip-skill">
                                    {skill.icon ? (
                                      <img
                                        src={skill.icon}
                                        alt={skill.name ?? 'skill'}
                                      />
                                    ) : null}
                                    {skill.name ?? '-'}
                                  </span>
                                  <span>{skill.value ?? '-'}</span>
                                </div>
                              ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                </div>
              )
            })}
            </div>
            {arcanaSetEffects.length > 0 ? (
              <div className="arcana-set-effects arcana-set-effects--spaced">
                {arcanaSetEffects.map((effect, index) => (
                  <div className="arcana-set-effect" key={`${effect.title}-${index}`}>
                    <div className="arcana-set-title">{effect.title}</div>
                    <div className="arcana-set-desc">{effect.desc}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {(characterInfo?.topTitles ?? []).length > 0 && (
        <div className="panel">
          <div className="subpanel-title arcana-title">칭호</div>
          <div className="summary-titles">
            {(characterInfo?.topTitles ?? []).slice(0, 3).map((title, index) => (
              <div className="summary-title-card" key={title.id ?? index}>
                <span
                  className="summary-title-name"
                  data-grade={title.grade ?? 'Common'}
                >
                  {title.name ?? '-'}
                </span>
                {(title.equipCategory ||
                  title.ownedCount !== null ||
                  title.totalCount !== null) && (
                  <div className="summary-title-meta">
                    {title.equipCategory && (
                      <span className="summary-title-sub">
                        {title.equipCategory}
                      </span>
                    )}
                    {title.ownedCount !== null && title.totalCount !== null && (
                      <span className="summary-title-sub">
                        {title.ownedCount}/{title.totalCount}
                      </span>
                    )}
                  </div>
                )}
                {(title.equipStatList ?? []).length > 0 && (
                  <div className="summary-title-effects">
                    <span className="summary-title-sub">장착 효과:</span>
                    {(title.equipStatList ?? []).map((stat, statIndex) => (
                      <span
                        className="summary-title-sub"
                        key={`${stat}-${statIndex}`}
                      >
                        {stat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel detail-stats">
        <div className="panel-title">
          <span>주요 능력치</span>
        </div>
        {isLoading && <div className="detail-loading">불러오는 중...</div>}
        <div className="stat-grid">
          {(characterInfo?.statsSummary.primaryStats ?? []).map((stat) => (
            <div className="stat-card" key={stat.type}>
              <div className="stat-title">
                <span
                  className={isSkyStatName(stat.name) ? 'stat-name-sky' : undefined}
                >
                  {stat.name}
                </span>{' '}
                <span>{stat.type}</span>
              </div>
              <div className="stat-value">{stat.value ?? '-'}</div>
              <div className="stat-notes">
                {(stat.statSecondList ?? []).map((note) => (
                  <span key={note}>{note}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel detail-stats">
        <div className="panel-title">
          <span className="arcana-title">특성 스탯</span>
        </div>
        {isLoading && <div className="detail-loading">불러오는 중...</div>}
        <div className="stat-grid">
          {(characterInfo?.statsSummary.specialStats ?? []).map((stat) => (
            <div className="stat-card is-muted" key={stat.type}>
              <div className="stat-title">
                <span
                  className={isSkyStatName(stat.name) ? 'stat-name-sky' : undefined}
                >
                  {stat.name}
                </span>{' '}
                <span>{stat.type}</span>
              </div>
              <div className="stat-value">{stat.value ?? '-'}</div>
              <div className="stat-notes">
                {(stat.statSecondList ?? []).map((note) => (
                  <span key={note}>{note}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel detail-petwing">
        <div className="panel-title">
          <span>펫/날개</span>
          <span className="panel-sub">보유 장착 상태</span>
        </div>
        <div className="petwing-grid">
          <div className="petwing-card">
            <div className="petwing-label">펫</div>
            <div className="petwing-name">{characterEquipment?.pet?.name ?? '-'}</div>
            <div className="petwing-sub">
              Lv.{characterEquipment?.pet?.level ?? 0}
            </div>
          </div>
          <div className="petwing-card">
            <div className="petwing-label">날개</div>
            <div className="petwing-name">{characterEquipment?.wing?.name ?? '-'}</div>
            <div className="petwing-sub" />
          </div>
          <div className="petwing-card">
            <div className="petwing-label">날개 스킨</div>
            <div className="petwing-name">
              {characterEquipment?.wingSkin?.name ?? '-'}
            </div>
            <div className="petwing-sub" />
          </div>
        </div>
      </div>
        </div>
      )}
    </section>
  )
}
