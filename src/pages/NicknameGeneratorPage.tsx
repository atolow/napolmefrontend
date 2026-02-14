import { useState, useCallback, useMemo, useEffect } from 'react'
import { nicknameApi } from '../api/nicknameApi'
import type { GeneratedNickname, NicknameStatus } from '../api/nicknameApi'

type Mode = 'normal' | 'combination' | 'direct'
type ServerFilter = 'elyos' | 'asmo'

// 한국어 자모
const INITIAL_CONSONANTS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const MEDIAL_VOWELS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
const FINAL_CONSONANTS = ['ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

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

export default function NicknameGeneratorPage() {
  const [mode, setMode] = useState<Mode>('normal')
  const [serverFilter, setServerFilter] = useState<ServerFilter>('elyos')
  const [serverId, setServerId] = useState(elyosServers[0].id)
  const [excludeFinalConsonant, setExcludeFinalConsonant] = useState(true)
  const [excludeDoubleConsonant, setExcludeDoubleConsonant] = useState(true)
  const [excludeUType, setExcludeUType] = useState(true)
  const [excludeEType, setExcludeEType] = useState(true)
  const [fixedCharacters, setFixedCharacters] = useState('')
  const [useFixedCharacters, setUseFixedCharacters] = useState(false)
  const [excludedCharacters, setExcludedCharacters] = useState('')
  const [useExcludedCharacters, setUseExcludedCharacters] = useState(false)
  const [directInput, setDirectInput] = useState('')
  const [directInputError, setDirectInputError] = useState('')
  const [nicknames, setNicknames] = useState<GeneratedNickname[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  
  // 조합모드용 상태 (실제 적용된 상태)
  const [selectedInitials, setSelectedInitials] = useState<Set<string>>(new Set(INITIAL_CONSONANTS))
  const [selectedMedials, setSelectedMedials] = useState<Set<string>>(new Set(MEDIAL_VOWELS))
  const [selectedFinals, setSelectedFinals] = useState<Set<string>>(new Set(FINAL_CONSONANTS))
  // 임시 선택 상태 (드롭다운에서 선택 중인 상태)
  const [tempSelectedInitials, setTempSelectedInitials] = useState<Set<string>>(new Set(INITIAL_CONSONANTS))
  const [tempSelectedMedials, setTempSelectedMedials] = useState<Set<string>>(new Set(MEDIAL_VOWELS))
  const [tempSelectedFinals, setTempSelectedFinals] = useState<Set<string>>(new Set(FINAL_CONSONANTS))
  const [openDropdown, setOpenDropdown] = useState<'initial' | 'medial' | 'final' | null>(null)

  // 서버 필터에 따른 서버 옵션
  const serverOptions = useMemo(() => {
    if (serverFilter === 'elyos') {
      return elyosServers
    }
    return asmoServers
  }, [serverFilter])

  // 서버 필터 변경 시 서버 선택 초기화
  useEffect(() => {
    if (serverFilter === 'elyos') {
      setServerId(elyosServers[0].id)
    } else {
      setServerId(asmoServers[0].id)
    }
  }, [serverFilter])

  // 모드 변경 시 닉네임 목록 초기화
  useEffect(() => {
    setNicknames([])
  }, [mode])

  const generateNicknames = useCallback(async (length: number) => {
    if (isGenerating) return
    
    // 직접입력 모드일 때 유효성 검사
    if (mode === 'direct') {
      if (!directInput.trim() || directInput.trim().length < 1) {
        setDirectInputError('1글자 이상 입력해주세요.')
        return
      }
      setDirectInputError('')
    }
    
    setIsGenerating(true)
    try {
      const response = await nicknameApi.generate({
        mode,
        length: mode === 'direct' ? directInput.trim().length : length,
        excludeFinalConsonant: mode === 'direct' ? false : excludeFinalConsonant,
        excludeDoubleConsonant: mode === 'direct' ? false : excludeDoubleConsonant,
        excludeUType: mode === 'direct' ? false : excludeUType,
        excludeEType: mode === 'direct' ? false : excludeEType,
        fixedCharacters: useFixedCharacters ? fixedCharacters : undefined,
        excludedCharacters: useExcludedCharacters ? excludedCharacters : undefined,
        directInput: mode === 'direct' ? directInput.trim() : undefined,
        selectedInitials: mode === 'combination' ? Array.from(selectedInitials) : undefined,
        selectedMedials: mode === 'combination' ? Array.from(selectedMedials) : undefined,
        selectedFinals: mode === 'combination' ? Array.from(selectedFinals) : undefined,
        serverId: serverId,
      })
      setNicknames(response.data.data.nicknames)
    } catch (error) {
      console.error('닉네임 생성 실패:', error)
      alert('닉네임 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }, [
    mode,
    excludeFinalConsonant,
    excludeDoubleConsonant,
    excludeUType,
    excludeEType,
    fixedCharacters,
    useFixedCharacters,
    excludedCharacters,
    useExcludedCharacters,
    directInput,
    selectedInitials,
    selectedMedials,
    selectedFinals,
    serverId,
    isGenerating,
  ])

  // 드롭다운 열 때 임시 상태를 실제 상태로 초기화
  const handleOpenDropdown = useCallback((type: 'initial' | 'medial' | 'final') => {
    if (openDropdown === type) {
      setOpenDropdown(null)
    } else {
      setOpenDropdown(type)
      // 드롭다운이 열릴 때 임시 상태를 실제 상태로 초기화
      if (type === 'initial') {
        setTempSelectedInitials(new Set(selectedInitials))
      } else if (type === 'medial') {
        setTempSelectedMedials(new Set(selectedMedials))
      } else if (type === 'final') {
        setTempSelectedFinals(new Set(selectedFinals))
      }
    }
  }, [openDropdown, selectedInitials, selectedMedials, selectedFinals])

  // 임시 선택 상태 토글 (드롭다운에서 사용)
  const toggleTempInitial = useCallback((char: string) => {
    setTempSelectedInitials(prev => {
      const next = new Set(prev)
      if (next.has(char)) {
        next.delete(char)
      } else {
        next.add(char)
      }
      return next
    })
  }, [])

  const toggleTempMedial = useCallback((char: string) => {
    setTempSelectedMedials(prev => {
      const next = new Set(prev)
      if (next.has(char)) {
        next.delete(char)
      } else {
        next.add(char)
      }
      return next
    })
  }, [])

  const toggleTempFinal = useCallback((char: string) => {
    setTempSelectedFinals(prev => {
      const next = new Set(prev)
      if (next.has(char)) {
        next.delete(char)
      } else {
        next.add(char)
      }
      return next
    })
  }, [])

  // 모두 해제 (임시 상태)
  const deselectAllTempInitials = useCallback(() => {
    setTempSelectedInitials(new Set())
  }, [])

  const deselectAllTempMedials = useCallback(() => {
    setTempSelectedMedials(new Set())
  }, [])

  const deselectAllTempFinals = useCallback(() => {
    setTempSelectedFinals(new Set())
  }, [])

  // 단자음만 선택 (임시 상태)
  const selectSingleTempInitials = useCallback(() => {
    const singleInitials = INITIAL_CONSONANTS.filter(c => !['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'].includes(c))
    setTempSelectedInitials(new Set(singleInitials))
  }, [])

  // 선택 버튼 클릭 시 임시 상태를 실제 상태로 적용하고 드롭다운 닫기
  const handleApplySelection = useCallback((type: 'initial' | 'medial' | 'final') => {
    if (type === 'initial') {
      setSelectedInitials(new Set(tempSelectedInitials))
    } else if (type === 'medial') {
      setSelectedMedials(new Set(tempSelectedMedials))
    } else if (type === 'final') {
      setSelectedFinals(new Set(tempSelectedFinals))
    }
    setOpenDropdown(null)
  }, [tempSelectedInitials, tempSelectedMedials, tempSelectedFinals])

  // 직접입력 모드에서 엔터키로 생성
  const handleDirectInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && directInput.trim().length >= 1) {
      generateNicknames(0) // length는 직접입력 길이로 사용됨
    }
  }, [directInput, generateNicknames])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // 복사 성공 피드백은 UI에서 처리
    }).catch(() => {
      alert('복사에 실패했습니다.')
    })
  }, [])

  const handleNicknameClick = useCallback((nickname: GeneratedNickname) => {
    if (nickname.status === 'available') {
      copyToClipboard(nickname.name)
    }
  }, [copyToClipboard])

  const getStatusLabel = (status: NicknameStatus): string => {
    switch (status) {
      case 'available':
        return '생성가능 (클릭하여 복사)'
      case 'unavailable':
        return '생성불가'
      default:
        return ''
    }
  }

  const getStatusColor = (status: NicknameStatus): string => {
    switch (status) {
      case 'checking':
        return '#3b82f6' // blue
      case 'available':
        return '#3b82f6' // blue (생성가능)
      case 'unavailable':
        return '#ef4444' // red (생성불가)
      default:
        return '#64748b'
    }
  }

  return (
    <div className="nickname-generator-page">
      <div className="panel">
        <div className="panel-title">
          <span>닉네임 생성기</span>
          <span className="panel-sub">아이온2 닉네임 생성</span>
        </div>

        {/* 모드 선택 탭 */}
        <div className="generator-tabs">
          <button
            type="button"
            className={`generator-tab ${mode === 'normal' ? 'is-active' : ''}`}
            onClick={() => setMode('normal')}
          >
            일반모드
          </button>
          <button
            type="button"
            className={`generator-tab ${mode === 'combination' ? 'is-active' : ''}`}
            onClick={() => setMode('combination')}
          >
            조합모드
          </button>
          <button
            type="button"
            className={`generator-tab ${mode === 'direct' ? 'is-active' : ''}`}
            onClick={() => setMode('direct')}
          >
            직접입력
          </button>
        </div>

        {/* 서버 필터 탭 */}
        <div className="search-tabs">
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

        {/* 서버 선택 */}
        <div className="generator-server-select">
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
        </div>

        {/* 직접입력 모드 */}
        {mode === 'direct' && (
          <div className="generator-direct-input">
            <input
              id="direct-input"
              type="text"
              value={directInput}
              onChange={(e) => {
                setDirectInput(e.target.value)
                if (directInputError && e.target.value.trim().length >= 1) {
                  setDirectInputError('')
                }
              }}
              onKeyDown={handleDirectInputKeyDown}
              placeholder="닉네임 입력(1글자 이상)"
              maxLength={100}
              className={directInputError ? 'has-error' : ''}
            />
            {directInputError && (
              <div className="generator-error-message">
                {directInputError}
              </div>
            )}
            <button
              type="button"
              className="primary generator-direct-submit"
              onClick={() => generateNicknames(0)}
              disabled={isGenerating || !directInput.trim() || directInput.trim().length < 1}
            >
              생성
            </button>
          </div>
        )}

        {/* 조합모드 - 초성/중성/종성 선택 */}
        {mode === 'combination' && (
          <div className="generator-combination-selectors">
            <div className="generator-selector-group">
              <button
                type="button"
                className="generator-selector-btn"
                onClick={() => handleOpenDropdown('initial')}
              >
                초성 선택
                <span className="generator-selector-arrow">
                  {openDropdown === 'initial' ? '^' : 'v'}
                </span>
              </button>
              {openDropdown === 'initial' && (
                <div className="generator-selector-dropdown">
                  <div className="generator-selector-actions">
                    <button
                      type="button"
                      className="generator-selector-action"
                      onClick={deselectAllTempInitials}
                    >
                      초성 모두 해제
                    </button>
                    <button
                      type="button"
                      className="generator-selector-action"
                      onClick={selectSingleTempInitials}
                    >
                      단자음만 선택
                    </button>
                  </div>
                  <div className="generator-selector-list">
                    {INITIAL_CONSONANTS.map(char => (
                      <label key={char} className="generator-selector-item">
                        <input
                          type="checkbox"
                          checked={tempSelectedInitials.has(char)}
                          onChange={() => toggleTempInitial(char)}
                        />
                        <span>{char}</span>
                      </label>
                    ))}
                  </div>
                  <div className="generator-selector-apply">
                    <button
                      type="button"
                      className="generator-selector-apply-btn"
                      onClick={() => handleApplySelection('initial')}
                    >
                      선택
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="generator-selector-group">
              <button
                type="button"
                className="generator-selector-btn"
                onClick={() => handleOpenDropdown('medial')}
              >
                중성 선택
                <span className="generator-selector-arrow">
                  {openDropdown === 'medial' ? '^' : 'v'}
                </span>
              </button>
              {openDropdown === 'medial' && (
                <div className="generator-selector-dropdown">
                  <div className="generator-selector-actions">
                    <button
                      type="button"
                      className="generator-selector-action"
                      onClick={deselectAllTempMedials}
                    >
                      중성 모두 해제
                    </button>
                  </div>
                  <div className="generator-selector-list">
                    {MEDIAL_VOWELS.map(char => (
                      <label key={char} className="generator-selector-item">
                        <input
                          type="checkbox"
                          checked={tempSelectedMedials.has(char)}
                          onChange={() => toggleTempMedial(char)}
                        />
                        <span>{char}</span>
                      </label>
                    ))}
                  </div>
                  <div className="generator-selector-apply">
                    <button
                      type="button"
                      className="generator-selector-apply-btn"
                      onClick={() => handleApplySelection('medial')}
                    >
                      선택
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="generator-selector-group">
              <button
                type="button"
                className="generator-selector-btn"
                onClick={() => handleOpenDropdown('final')}
              >
                종성 선택
                <span className="generator-selector-arrow">
                  {openDropdown === 'final' ? '^' : 'v'}
                </span>
              </button>
              {openDropdown === 'final' && (
                <div className="generator-selector-dropdown">
                  <div className="generator-selector-actions">
                    <button
                      type="button"
                      className="generator-selector-action"
                      onClick={deselectAllTempFinals}
                    >
                      종성 모두 해제
                    </button>
                  </div>
                  <div className="generator-selector-list">
                    {FINAL_CONSONANTS.map(char => (
                      <label key={char} className="generator-selector-item">
                        <input
                          type="checkbox"
                          checked={tempSelectedFinals.has(char)}
                          onChange={() => toggleTempFinal(char)}
                        />
                        <span>{char}</span>
                      </label>
                    ))}
                  </div>
                  <div className="generator-selector-apply">
                    <button
                      type="button"
                      className="generator-selector-apply-btn"
                      onClick={() => handleApplySelection('final')}
                    >
                      선택
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 제외 옵션 (직접입력 모드 제외) */}
        {mode !== 'direct' && (
          <div className="generator-exclude-options">
            <label className="generator-checkbox">
              <input
                type="checkbox"
                checked={excludeFinalConsonant}
                onChange={(e) => setExcludeFinalConsonant(e.target.checked)}
              />
              <span>받침 제외</span>
            </label>
            <label className="generator-checkbox">
              <input
                type="checkbox"
                checked={excludeDoubleConsonant}
                onChange={(e) => setExcludeDoubleConsonant(e.target.checked)}
              />
              <span>쌍자음+자음군 제외</span>
            </label>
            <label className="generator-checkbox">
              <input
                type="checkbox"
                checked={excludeUType}
                onChange={(e) => setExcludeUType(e.target.checked)}
              />
              <span>ㅡ,ㅟ,ㅞ류 제외</span>
            </label>
            <label className="generator-checkbox">
              <input
                type="checkbox"
                checked={excludeEType}
                onChange={(e) => setExcludeEType(e.target.checked)}
              />
              <span>ㅔ,ㅐ류 제외</span>
            </label>
          </div>
        )}

        {/* 글자 고정/제외 (일반모드, 조합모드) */}
        {(mode === 'normal' || mode === 'combination') && (
          <div className="generator-character-controls">
            <div className="generator-character-group">
              <label className="generator-checkbox">
                <input
                  type="checkbox"
                  checked={useFixedCharacters}
                  onChange={(e) => setUseFixedCharacters(e.target.checked)}
                />
                <span>글자 고정</span>
              </label>
              <input
                type="text"
                value={fixedCharacters}
                onChange={(e) => setFixedCharacters(e.target.value)}
                placeholder="고정할 글자"
                disabled={!useFixedCharacters}
                maxLength={100}
              />
            </div>
            <div className="generator-character-group">
              <label className="generator-checkbox">
                <input
                  type="checkbox"
                  checked={useExcludedCharacters}
                  onChange={(e) => setUseExcludedCharacters(e.target.checked)}
                />
                <span>글자 제외</span>
              </label>
              <input
                type="text"
                value={excludedCharacters}
                onChange={(e) => setExcludedCharacters(e.target.value)}
                placeholder="ex) 가나다라 (최대 100글자)"
                disabled={!useExcludedCharacters}
                maxLength={100}
              />
            </div>
          </div>
        )}

        {/* 닉네임 버튼들 (직접입력 모드 제외) */}
        {mode !== 'direct' && (
          <div className="generator-gacha-buttons">
            <button
              type="button"
              className="generator-gacha-btn"
              onClick={() => generateNicknames(1)}
              disabled={
                isGenerating ||
                (mode === 'combination' && (selectedInitials.size === 0 || selectedMedials.size === 0))
              }
            >
              한글자 닉네임
            </button>
            <button
              type="button"
              className="generator-gacha-btn"
              onClick={() => generateNicknames(2)}
              disabled={
                isGenerating ||
                (mode === 'combination' && (selectedInitials.size === 0 || selectedMedials.size === 0))
              }
            >
              두글자 닉네임
            </button>
            <button
              type="button"
              className="generator-gacha-btn"
              onClick={() => generateNicknames(3)}
              disabled={
                isGenerating ||
                (mode === 'combination' && (selectedInitials.size === 0 || selectedMedials.size === 0))
              }
            >
              세글자 닉네임
            </button>
            <button
              type="button"
              className="generator-gacha-btn"
              onClick={() => generateNicknames(4)}
              disabled={
                isGenerating ||
                (mode === 'combination' && (selectedInitials.size === 0 || selectedMedials.size === 0))
              }
            >
              네글자 닉네임
            </button>
            <button
              type="button"
              className="generator-gacha-btn"
              onClick={() => generateNicknames(5)}
              disabled={
                isGenerating ||
                (mode === 'combination' && (selectedInitials.size === 0 || selectedMedials.size === 0))
              }
            >
              다섯글자 닉네임
            </button>
            <button
              type="button"
              className="generator-gacha-btn"
              onClick={() => generateNicknames(6)}
              disabled={
                isGenerating ||
                (mode === 'combination' && (selectedInitials.size === 0 || selectedMedials.size === 0))
              }
            >
              여섯글자 닉네임
            </button>
          </div>
        )}

        {/* 생성된 닉네임 */}
        {nicknames.length > 0 && (
          <div className="generator-results">
            <div className="panel-title">
              <span>생성된 닉네임</span>
              <span className="panel-sub">{nicknames.length}개</span>
            </div>
            <div className="nickname-grid">
              {nicknames
                .filter(nickname => nickname.status !== 'checking')
                .map((nickname, index) => (
                  <div
                    key={index}
                    className={`nickname-card nickname-card--${nickname.status} ${
                      nickname.status === 'available' ? 'is-clickable' : ''
                    }`}
                    onClick={() => handleNicknameClick(nickname)}
                    title={
                      nickname.status === 'available'
                        ? '클릭하여 복사'
                        : getStatusLabel(nickname.status)
                    }
                  >
                    <div className="nickname-text">{nickname.name}</div>
                    <div className="nickname-status">
                      {nickname.status === 'unavailable' && (
                        <span
                          className="nickname-status-indicator"
                          style={{
                            backgroundColor: '#ef4444',
                          }}
                        ></span>
                      )}
                      <span style={{ color: getStatusColor(nickname.status) }}>
                        {getStatusLabel(nickname.status)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            <div className="generator-legend">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                <span>생성가능 (클릭하여 복사)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
                <span>생성불가</span>
              </div>
            </div>
          </div>
        )}

        {nicknames.length === 0 && !isGenerating && mode !== 'direct' && (
          <div className="generator-empty">
            <p>위 버튼을 클릭하여 닉네임을 생성해보세요!</p>
          </div>
        )}

        {isGenerating && (
          <div className="generator-loading">
            <p>닉네임 생성 중...</p>
          </div>
        )}
      </div>
    </div>
  )
}
