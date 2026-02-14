import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { characterApi, statApi } from '../api'
import type { CharacterSearchResponse, CharacterSummary } from '../api/characterApi'
import type { BoardUpdateItem } from '../api/characterApi'
import type {
  ChzzkLiveItem,
  DailySearchRankItem,
  NapolmeRankingResponse,
} from '../api/statApi'
import {
  getFavorites,
  isFavorite,
  removeFavorite,
  toggleFavorite,
  type FavoriteCharacter,
} from '../lib/favorites'

const serverStats = {
  registeredLegion: 41720,
  registeredCharacter: 1134506,
  elyosTotal: 520849,
  asmoTotal: 613657,
  elyos: [
    { name: '시엘', count: 37721 },
    { name: '바이젤', count: 32971 },
    { name: '네자칸', count: 34342 },
    { name: '유스티엘', count: 30038 },
    { name: '프레기온', count: 27516 },
    { name: '카이시넬', count: 29410 },
    { name: '타하바타', count: 22095 },
    { name: '히타니에', count: 20818, up: true },
    { name: '메스람타에다', count: 17273 },
    { name: '이슈타르', count: 20270 },
    { name: '페르노스', count: 17154 },
    { name: '아리엘', count: 41752, up: true },
    { name: '나니아', count: 31113, up: true },
    { name: '카사카', count: 21867 },
    { name: '포에타', count: 25706 },
    { name: '티아마트', count: 20290 },
    { name: '챈가룽', count: 20735 },
    { name: '바카르마', count: 18854 },
    { name: '루터스', count: 17552 },
    { name: '다미누', count: 18269, up: true },
    { name: '코치룽', count: 15103 },
  ],
  asmo: [
    { name: '이스라펠', count: 41334, up: true },
    { name: '지켈', count: 39660, up: true },
    { name: '아스펠', count: 41169, up: true },
    { name: '마르쿠탄', count: 37119, up: true },
    { name: '트리니엘', count: 36979, up: true },
    { name: '에레슈키갈', count: 31993, up: true },
    { name: '브리트라', count: 28420, up: true },
    { name: '울고른', count: 19334 },
    { name: '오다르', count: 18841, up: true },
    { name: '루미엘', count: 38793, up: true },
    { name: '하달', count: 25809, up: true },
    { name: '바바룽', count: 28361 },
    { name: '크로메데', count: 29703 },
    { name: '무닌', count: 26963, up: true },
    { name: '네몬', count: 29521, up: true },
    { name: '루드라', count: 29991, up: true },
    { name: '젠카카', count: 25023, up: true },
    { name: '콰이링', count: 20998, up: true },
    { name: '이스할겐', count: 22483, up: true },
    { name: '인드나흐', count: 17407 },
    { name: '파프니르', count: 23756, up: true },
  ],
}

const CHZZK_REFRESH_MS = 30 * 60 * 1000

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

/** 날짜·시간 표시 (한국 시간 KST, YYYY-MM-DD HH:mm) */
const KST = 'Asia/Seoul'
const formatDateTime = (value?: string | null) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(parsed)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`
}

/** 일일 검색 랭킹 순위 변동 표시: 7▲(7위 상승) / 3▼(3위 하락) / - */
function formatRankChange(
  rankChange: string | undefined,
  changeAmount?: number
): string {
  const n = Number(changeAmount)
  const amount = Number.isFinite(n) && n > 0 ? n : 0
  if (rankChange === 'up') return amount > 0 ? `${amount}▲` : '▲'
  if (rankChange === 'down') return amount > 0 ? `${amount}▼` : '▼'
  return '-'
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [serverFilter, setServerFilter] =
    useState<keyof typeof serverFilterLabels>('all')
  const [serverId, setServerId] = useState(ALL_SERVER_OPTION.id)
  const [statusMessage, setStatusMessage] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] =
    useState<CharacterSearchResponse | null>(null)
  const [dailySearchRanking, setDailySearchRanking] = useState<
    DailySearchRankItem[]
  >([])
  const [napolmeRanking, setNapolmeRanking] = useState<
    NapolmeRankingResponse
  >({ elyos: [], asmo: [] })
  const [favorites, setFavorites] = useState<FavoriteCharacter[]>(() =>
    getFavorites(),
  )
  const [chzzkLives, setChzzkLives] = useState<ChzzkLiveItem[]>([])
  const [chzzkLoaded, setChzzkLoaded] = useState(false)
  const [updates, setUpdates] = useState<BoardUpdateItem[]>([])
  const [updateStatus, setUpdateStatus] = useState('')

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
    setServerId(ALL_SERVER_OPTION.id)
  }, [serverFilter])

  useEffect(() => {
    statApi
      .getDailySearchRanking()
      .then((res) => setDailySearchRanking(res.data?.data ?? []))
      .catch(() => setDailySearchRanking([]))
  }, [])

  useEffect(() => {
    statApi
      .getNapolmeRanking()
      .then((res) =>
        setNapolmeRanking(res.data?.data ?? { elyos: [], asmo: [] }),
      )
      .catch(() => setNapolmeRanking({ elyos: [], asmo: [] }))
  }, [])

  useEffect(() => {
    const fetchChzzk = () => {
      statApi
        .getChzzkLives()
        .then((res) => {
          setChzzkLives(res.data?.data ?? [])
          setChzzkLoaded(true)
        })
        .catch(() => {
          setChzzkLives([])
          setChzzkLoaded(true)
        })
    }
    fetchChzzk()
    const timer = window.setInterval(fetchChzzk, CHZZK_REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let mounted = true

    const fetchUpdates = async () => {
      try {
        const response = await characterApi.getBoardUpdates(4)
        if (!mounted) {
          return
        }
        setUpdates(response.data.data.items ?? [])
        setUpdateStatus('')
      } catch (error) {
        if (!mounted) {
          return
        }
        setUpdateStatus('업데이트를 불러오지 못했습니다.')
      }
    }

    fetchUpdates()
    const timer = window.setInterval(fetchUpdates, 30 * 60 * 1000)
    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [])

  const isSearchDisabled = isSearching
  const helperMessage = statusMessage

  const handleSearch = async (searchQuery?: string, overrideServerId?: string | null) => {
    const trimmedQuery = (searchQuery ?? query).trim()
    if (!trimmedQuery || isSearchDisabled) {
      if (!trimmedQuery) {
        setStatusMessage('검색어를 입력해주세요.')
      }
      return
    }

    const effectiveServerId = overrideServerId !== undefined && overrideServerId !== null && overrideServerId !== ''
      ? overrideServerId
      : serverId
    if (overrideServerId !== undefined && overrideServerId !== null && overrideServerId !== '') {
      setServerId(overrideServerId)
    }
    setQuery(trimmedQuery)

    if (effectiveServerId === ALL_SERVER_OPTION.id) {
      const params = new URLSearchParams({
        query: trimmedQuery,
        race: serverFilter,
      })
      navigate(`/search?${params.toString()}`)
      return
    }

    setIsSearching(true)
    setStatusMessage('')
    setSearchResult(null)

    try {
      const response = await characterApi.searchCharacters({
        server: effectiveServerId,
        name: trimmedQuery,
      })
      const payload = response.data
      setStatusMessage(payload.message || '검색 완료')
      setSearchResult(payload.data)
      // 검색 후 랭킹 갱신 → 서버가 직전 랭킹과 비교해 N▲/N▼ 계산
      statApi
        .getDailySearchRanking()
        .then((res) => setDailySearchRanking(res.data?.data ?? []))
        .catch(() => {})
      // 서버가 redirectUrl을 제공하면 자동으로 이동
      if (payload.data.redirectUrl) {
        navigate(payload.data.redirectUrl)
        return
      }
    } catch (error) {
      setStatusMessage('현재 서버 부하가 높음')
      setSearchResult(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectCharacter = (item: CharacterSummary) => {
    const encodedId = encodeURIComponent(item.characterId)
    navigate(`/character/${item.serverId}/${encodedId}`)
  }

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent, item: CharacterSummary) => {
      e.preventDefault()
      e.stopPropagation()
      const char: FavoriteCharacter = {
        serverId: String(item.serverId ?? ''),
        characterId: item.characterId,
        name: item.name,
        serverName: item.serverName ?? undefined,
        profileImage: item.profileImageUrl ?? undefined,
      }
      setFavorites((prev) => toggleFavorite(char, prev))
    },
    [],
  )

  return (
    <>
      <section className="grid top-grid">
        <div className="panel">
          <div className="panel-title">
            <span>일일 검색 랭킹</span>
            <span className="panel-sub">TOP 10</span>
          </div>
          <ul className="ranking-list">
            {dailySearchRanking.map((item, index) => (
              <li key={`${item.name}-${index}`}>
                <span className="rank-index">{index + 1}</span>
                <button
                  type="button"
                  className={`rank-name daily-rank-name rank-name-link ${
                    item.tribe === 'elyos'
                      ? 'tribe-elyos'
                      : item.tribe === 'asmo'
                        ? 'tribe-asmo'
                        : ''
                  }`}
                  onClick={() => {
                    handleSearch(item.name, item.serverId ?? undefined)
                  }}
                >
                  {item.name}
                </button>
                <span
                  className={`rank-change ${
                    item.rankChange === 'up'
                      ? 'rank-up'
                      : item.rankChange === 'down'
                        ? 'rank-down'
                        : ''
                  }`}
                >
                  {formatRankChange(
                    item.rankChange,
                    item.changeAmount ??
                      (item as { change_amount?: number }).change_amount
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

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
              value={serverId}
              onChange={(event) => setServerId(event.target.value)}
            >
              {serverOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <input
              placeholder="캐릭터 닉네임 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch(query)
                }
              }}
            />
            <button
              type="button"
              className="primary"
              onClick={() => handleSearch(query)}
              disabled={isSearchDisabled}
            >
              {isSearching ? '검색 중' : '검색'}
            </button>
          </div>
          {helperMessage &&
            !(searchResult && searchResult.items.length === 0) && (
              <div className="search-helper">{helperMessage}</div>
            )}
          <div className="result-section">
            {searchResult && (
              <div className="result-state result-success">
                {searchResult.items.length > 0 && (
                  <div className="result-message">
                    {statusMessage || '검색 완료'}
                  </div>
                )}
                {searchResult.items.length > 0 ? (
                  <div className="search-result-grid">
                    {searchResult.items.map((item) => {
                      const fav = isFavorite(
                        String(item.serverId ?? ''),
                        item.characterId,
                      )
                      return (
                        <div
                          className="search-result-card-wrap"
                          key={`${item.serverId}-${item.characterId}`}
                        >
                          <button
                            type="button"
                            className="search-result-card"
                            onClick={() => handleSelectCharacter(item)}
                          >
                            <div className="search-result-avatar">
                              {item.profileImageUrl ? (
                                <img
                                  src={item.profileImageUrl}
                                  alt={item.name}
                                />
                              ) : (
                                <div className="search-result-avatar placeholder" />
                              )}
                            </div>
                            <div className="search-result-info">
                              <div className="search-result-name">
                                {item.name}
                              </div>
                              <div className="search-result-sub-row">
                                <span className="search-result-sub">
                                  {item.serverName ?? '알 수 없음'}
                                </span>
                                <button
                                  type="button"
                                  className={`favorite-star ${fav ? 'is-favorite' : ''}`}
                                  aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                                  onClick={(e) => handleFavoriteClick(e, item)}
                                >
                                  {fav ? '★' : '☆'}
                                </button>
                              </div>
                              <div className="search-result-stats">
                                <span>전투력 {item.combatPower ?? '-'}</span>
                                {item.level ? (
                                  <span>· Lv.{item.level}</span>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="result-empty">
                    일치하는 캐릭터가 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="divider" />
          <div className="favorites-panel">
            <div className="panel-title favorites-panel-title">
              <span className="favorites-panel-title-left">
                <span className="favorites-panel-title-icon">★</span>
                <span>즐겨찾기한 캐릭터</span>
              </span>
              <span className="panel-sub">{favorites.length}명</span>
            </div>
            <div className="favorites-panel-body">
              {favorites.length === 0 ? (
                <div className="favorites-empty">
                  즐겨찾는 캐릭터를 등록해보세요
                </div>
              ) : (
                <ul className="favorites-list">
                  {favorites.map((fav) => (
                    <li key={`${fav.serverId}-${fav.characterId}`}>
                      <button
                        type="button"
                        className="favorites-item"
                        onClick={() => {
                          const encodedId = encodeURIComponent(fav.characterId)
                          navigate(`/character/${fav.serverId}/${encodedId}`)
                        }}
                      >
                        <div className="favorites-item-avatar">
                          {fav.profileImage ? (
                            <img
                              src={fav.profileImage}
                              alt={fav.name ?? ''}
                            />
                          ) : (
                            <div className="favorites-item-avatar placeholder" />
                          )}
                        </div>
                        <div className="favorites-item-text">
                          <span className="favorites-item-name">
                            {fav.name ?? fav.characterId}
                          </span>
                          <span className="favorites-item-server">
                            {fav.serverName ?? fav.serverId}
                          </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="favorite-star is-favorite"
                        aria-label="즐겨찾기 해제"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setFavorites(() =>
                            removeFavorite(fav.serverId, fav.characterId),
                          )
                        }}
                      >
                        ★
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="panel server-panel">
          <div className="panel-title">
            <span>서버 정보</span>
          </div>

          <div className="server-summary-grid">
            <div className="server-summary-card">
              <span className="server-summary-label">등록된 레기온</span>
              <span className="server-summary-value">
                {serverStats.registeredLegion.toLocaleString()}
              </span>
            </div>
            <div className="server-summary-card">
              <span className="server-summary-label">등록된 캐릭터</span>
              <span className="server-summary-value">
                {serverStats.registeredCharacter.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="server-faction-grid">
            <div className="server-faction-card server-faction-elyos">
              <div className="server-faction-title">
                천족 <span>({serverStats.elyosTotal.toLocaleString()})</span>
              </div>
              <ul className="server-detail-list">
                {serverStats.elyos.map((item) => (
                  <li key={`elyos-${item.name}`} className="server-detail-row">
                    <span className="server-detail-name">
                      {item.name}
                      {item.up ? (
                        <span className="server-detail-up">▲</span>
                      ) : null}
                    </span>
                    <span className="server-detail-count">
                      {item.count.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="server-faction-card server-faction-asmo">
              <div className="server-faction-title">
                마족 <span>({serverStats.asmoTotal.toLocaleString()})</span>
              </div>
              <ul className="server-detail-list">
                {serverStats.asmo.map((item) => (
                  <li key={`asmo-${item.name}`} className="server-detail-row">
                    <span className="server-detail-name">
                      {item.name}
                      {item.up ? (
                        <span className="server-detail-up">▲</span>
                      ) : null}
                    </span>
                    <span className="server-detail-count">
                      {item.count.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="grid mid-grid">
        <div className="panel napolme-ranking-panel">
          <div className="panel-title">
            <span>나폴미 점수 TOP 5</span>
          </div>
          <div className="napolme-ranking-columns">
            <div className="napolme-ranking-col napolme-col-elyos">
              <div className="napolme-ranking-col-title">천족</div>
              <ul className="ranking-list">
                {napolmeRanking.elyos.map((item, index) => (
                  <li key={`elyos-${item.nickname}-${index}`}>
                    <span className="rank-index">{index + 1}</span>
                    <button
                      type="button"
                      className="rank-name rank-name-link"
                      onClick={() => {
                        handleSearch(item.nickname, item.serverId ?? undefined)
                      }}
                    >
                      {item.nickname}
                    </button>
                    <span className="rank-count">
                      {item.napolmePoint.toLocaleString()}
                    </span>
                  </li>
                ))}
                {napolmeRanking.elyos.length === 0 && (
                  <li className="ranking-empty">데이터 없음</li>
                )}
              </ul>
            </div>
            <div className="napolme-ranking-col napolme-col-asmo">
              <div className="napolme-ranking-col-title">마족</div>
              <ul className="ranking-list">
                {napolmeRanking.asmo.map((item, index) => (
                  <li key={`asmo-${item.nickname}-${index}`}>
                    <span className="rank-index">{index + 1}</span>
                    <button
                      type="button"
                      className="rank-name rank-name-link"
                      onClick={() => {
                        handleSearch(item.nickname, item.serverId ?? undefined)
                      }}
                    >
                      {item.nickname}
                    </button>
                    <span className="rank-count">
                      {item.napolmePoint.toLocaleString()}
                    </span>
                  </li>
                ))}
                {napolmeRanking.asmo.length === 0 && (
                  <li className="ranking-empty">데이터 없음</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="panel live-panel">
          <div className="panel-title">
            <span>아이온2 LIVE</span>
            <a
              className="panel-sub"
              href="https://www.youtube.com/@AION2"
              target="_blank"
              rel="noreferrer"
            >
              AION2 공식 채널
            </a>
          </div>
          <div className="live-column">
            <div className="live-column-title">치지직</div>
            <div className="live-grid live-grid-2x3">
              {!chzzkLoaded ? (
                <div className="live-empty">로딩 중…</div>
              ) : chzzkLives.length === 0 ? (
                <div className="live-empty">데이터 없음</div>
              ) : (
                chzzkLives.map((item) => (
                  <a
                    key={item.liveId}
                    className="live-card"
                    href={item.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="live-badge">LIVE</div>
                    <div className="live-thumb">
                      {item.liveImageUrl ? (
                        <img
                          src={item.liveImageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <div className="live-thumb-placeholder" />
                      )}
                    </div>
                    <div className="live-title">{item.liveTitle}</div>
                    <div className="live-meta">
                      <span className="live-channel">{item.channelName}</span>
                      <span className="live-viewers">
                        {item.concurrentUserCount.toLocaleString()} watching
                      </span>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

      </section>

      <section className="grid bottom-grid">
        <div className="panel updates-panel">
          <div className="panel-title">
            <span>아이온2 업데이트 내역</span>
            <a
              className="panel-sub"
              href="https://aion2.plaync.com/ko-kr/board/update/list"
              target="_blank"
              rel="noreferrer"
            >
              전체보기
            </a>
          </div>
          <ul className="updates-list">
            {updates.length > 0 ? (
              updates.map((item) => (
                <li key={`${item.url}-${item.title}`}>
                  {item.date ? (
                    <span className="update-date">
                      {formatDateTime(item.date)}
                    </span>
                  ) : null}
                  <a
                    className="update-link"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.title}
                  </a>
                </li>
              ))
            ) : (
              <li className="updates-empty">
                {updateStatus || '업데이트가 없습니다.'}
              </li>
            )}
          </ul>
        </div>

        <div className="panel notice-panel">
          <div className="panel-title">
            <span>나폴미 업데이트 내역</span>
          </div>
        </div>

      </section>
    </>
  )
}
