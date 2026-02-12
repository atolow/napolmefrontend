import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { characterApi } from '../api'
import type { CharacterSearchResponse, CharacterSummary } from '../api/characterApi'
import type { BoardUpdateItem } from '../api/characterApi'

const dailyRanking = [
  { name: '린', count: '274,854' },
  { name: '레비아', count: '263,942' },
  { name: '카이슈', count: '255,188' },
  { name: '세베니', count: '253,074' },
  { name: '베르카', count: '248,903' },
]

const topScores = [
  { name: '레비아', score: '388,214' },
  { name: '헤리스', score: '370,429' },
  { name: '비테르', score: '358,885' },
  { name: '루카', score: '351,772' },
  { name: '세라', score: '346,219' },
]

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

const liveItems = [
  { title: '어비스 (PvP)', viewers: '2,482' },
  { title: '정령 (사냥)', viewers: '1,924' },
  { title: '로데스 (던전)', viewers: '1,632' },
  { title: '하늘성 (레이드)', viewers: '1,228' },
]

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

const useDebouncedValue = <T,>(value: T, delayMs = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
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
  const debouncedQuery = useDebouncedValue(query, 350)
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
    const trimmedQuery = (searchQuery ?? debouncedQuery).trim()
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

  return (
    <>
      <section className="grid top-grid">
        <div className="panel">
          <div className="panel-title">
            <span>일일 검색 랭킹</span>
            <span className="panel-sub">TOP 5</span>
          </div>
          <ul className="ranking-list">
            {dailyRanking.map((item, index) => (
              <li key={item.name}>
                <span className="rank-index">{index + 1}</span>
                <span className="rank-name">{item.name}</span>
                <span className="rank-count">{item.count}</span>
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
          {helperMessage && <div className="search-helper">{helperMessage}</div>}
          <div className="result-section">
            {searchResult && (
              <div className="result-state result-success">
                <div className="result-message">
                  {statusMessage || '검색 완료'}
                </div>
                {searchResult.items.length > 0 ? (
                  <div className="search-result-grid">
                    {searchResult.items.map((item) => (
                      <button
                        type="button"
                        className="search-result-card"
                        key={`${item.serverId}-${item.characterId}`}
                        onClick={() => handleSelectCharacter(item)}
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
                ) : (
                  <div className="result-empty">
                    일치하는 캐릭터가 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="divider" />
          <div className="panel-title">
            <span>즐겨찾기한 캐릭터</span>
            <span className="panel-sub">0명</span>
          </div>
          <div className="empty-state">즐겨찾기한 캐릭터를 등록해주세요.</div>
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
        <div className="panel">
          <div className="panel-title">
            <span>나폴미 점수 TOP 5</span>
            <span className="panel-sub">금주 기준</span>
          </div>
          <ul className="ranking-list">
            {topScores.map((item, index) => (
              <li key={item.name}>
                <span className="rank-index">{index + 1}</span>
                <span className="rank-name">{item.name}</span>
                <span className="rank-count">{item.score}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel live-panel">
          <div className="panel-title">
            <span>아이온2 LIVE</span>
            <span className="panel-sub">AION2 공식 채널</span>
          </div>
          <div className="live-grid">
            {liveItems.map((item) => (
              <div className="live-card" key={item.title}>
                <div className="live-badge">LIVE</div>
                <div className="live-thumb" />
                <div className="live-title">{item.title}</div>
                <div className="live-viewers">{item.viewers} watching</div>
              </div>
            ))}
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
            <span>개발 중입니다</span>
          </div>
        </div>
      </section>
    </>
  )
}
