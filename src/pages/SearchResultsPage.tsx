import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { characterApi } from '../api'
import type { CharacterSearchResponse, CharacterSummary } from '../api/characterApi'

const raceLabelMap: Record<string, string> = {
  all: '전체 종족',
  elyos: '천족',
  asmo: '마족',
}

const getRaceParam = (race: string | null) => {
  if (race === 'elyos') {
    return 1
  }
  if (race === 'asmo') {
    return 2
  }
  return undefined
}

export default function SearchResultsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [searchResult, setSearchResult] =
    useState<CharacterSearchResponse | null>(null)

  const query = useMemo(
    () => (searchParams.get('query') ?? '').trim(),
    [searchParams],
  )
  const raceFilter = useMemo(
    () => searchParams.get('race') ?? 'all',
    [searchParams],
  )
  const serverId = useMemo(() => searchParams.get('server'), [searchParams])

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setStatusMessage('검색어를 입력해주세요.')
        setSearchResult(null)
        return
      }
      setIsLoading(true)
      setStatusMessage('')
      setSearchResult(null)
      try {
        // 서버가 자동으로 판단하도록 항상 동일한 API 호출
        const response = await characterApi.searchCharacters({
          server: serverId && serverId !== 'ALL' ? serverId : undefined,
          name: query,
          race: getRaceParam(raceFilter),
        })
        setSearchResult(response.data.data)
        setStatusMessage('')
      } catch (error) {
        setStatusMessage('현재 서버 부하가 높음')
        setSearchResult(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [query, raceFilter, serverId])

  const handleSelectCharacter = (item: CharacterSummary) => {
    const encodedId = encodeURIComponent(item.characterId)
    navigate(`/character/${item.serverId}/${encodedId}`)
  }

  const raceLabel = raceLabelMap[raceFilter] ?? raceLabelMap.all

  return (
    <div className="search-list-page">
      <div className="panel">
        <div className="panel-title">
          <span>캐릭터 검색 목록</span>
          <span className="panel-sub">{raceLabel}</span>
        </div>
        <div className="search-list-meta">
          <span>검색어: {query || '-'}</span>
          {serverId && serverId !== 'ALL' ? <span>서버: {serverId}</span> : null}
        </div>
        {statusMessage ? (
          <div className="search-list-status">{statusMessage}</div>
        ) : null}
        {isLoading && <div className="detail-loading">불러오는 중...</div>}
        {searchResult && (
          <>
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
              <div className="result-empty">일치하는 캐릭터가 없습니다.</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
