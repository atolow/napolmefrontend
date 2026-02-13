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

const serverInfo = [
  { name: '하이네', online: '40,924', rate: '50.05%', trend: 'up' },
  { name: '베르나', online: '40,522', rate: '49.57%', trend: 'down' },
  { name: '레비아', online: '31,988', rate: '39.98%', trend: 'down' },
  { name: '리니', online: '30,161', rate: '38.35%', trend: 'up' },
  { name: '카이루', online: '28,519', rate: '35.78%', trend: 'up' },
  { name: '베르칼', online: '23,256', rate: '33.26%', trend: 'down' },
  { name: '바오르', online: '22,483', rate: '31.89%', trend: 'down' },
  { name: '오르타', online: '21,829', rate: '30.12%', trend: 'down' },
]

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

/** 날짜·시간 표시 (초 제외, YYYY-MM-DD HH:mm) */
const formatDateTime = (value?: string | null) => {
  if (!value) {
    return ''
  }
  const normalized = value.replace('T', ' ')
  const match = normalized.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)
  if (match) {
    return match[0]
  }
  const fullMatch = normalized.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
  if (fullMatch) {
    return fullMatch[0].slice(0, 16)
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
    parsed.getDate(),
  )} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
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

  const handleSearch = async (searchQuery?: string) => {
    const trimmedQuery = (searchQuery ?? query).trim()
    if (!trimmedQuery || isSearchDisabled) {
      if (!trimmedQuery) {
        setStatusMessage('검색어를 입력해주세요.')
      }
      return
    }

    if (serverId === ALL_SERVER_OPTION.id) {
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
        server: serverId,
        name: trimmedQuery,
      })
      const payload = response.data
      setStatusMessage(payload.message || '검색 완료')
      setSearchResult(payload.data)
      if (
        payload.data.items.length === 1 &&
        payload.data.items[0]
      ) {
        const item = payload.data.items[0]
        const encodedId = encodeURIComponent(item.characterId)
        navigate(`/character/${item.serverId}/${encodedId}`)
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
                <span
                  className={`rank-name daily-rank-name ${
                    item.tribe === 'elyos'
                      ? 'tribe-elyos'
                      : item.tribe === 'asmo'
                        ? 'tribe-asmo'
                        : ''
                  }`}
                >
                  {item.name}
                </span>
                <span
                  className={`rank-change ${
                    item.rankChange === 'up'
                      ? 'rank-up'
                      : item.rankChange === 'down'
                        ? 'rank-down'
                        : ''
                  }`}
                >
                  {item.rankChange === 'up'
                    ? (item.changeAmount ? `${item.changeAmount} ` : '') + '▲'
                    : item.rankChange === 'down'
                      ? (item.changeAmount ? `${item.changeAmount} ` : '') + '▼'
                      : '-'}
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
            <button className="ghost" type="button">
              서버 현황 보기 &gt;
            </button>
          </div>
          <div className="server-header">
            <div>서버</div>
            <div>접속 인원</div>
            <div>접속률</div>
          </div>
          <ul className="server-list">
            {serverInfo.map((item) => (
              <li key={item.name} className="server-row">
                <span className="server-name">{item.name}</span>
                <span className="server-online">{item.online}</span>
                <span
                  className={`server-rate ${item.trend === 'up' ? 'up' : 'down'}`}
                >
                  {item.rate}
                </span>
              </li>
            ))}
          </ul>
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
                    <span className="rank-name">{item.nickname}</span>
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
                    <span className="rank-name">{item.nickname}</span>
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
