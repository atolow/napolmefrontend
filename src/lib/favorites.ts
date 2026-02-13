const STORAGE_KEY = 'napolme-favorites'

export type FavoriteCharacter = {
  serverId: string
  characterId: string
  name?: string
  serverName?: string
  /** 캐릭터 프로필 이미지 URL */
  profileImage?: string
}

function load(): FavoriteCharacter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x): x is FavoriteCharacter =>
        x != null &&
        typeof x === 'object' &&
        typeof (x as FavoriteCharacter).serverId === 'string' &&
        typeof (x as FavoriteCharacter).characterId === 'string',
    )
  } catch {
    return []
  }
}

function save(list: FavoriteCharacter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function getFavorites(): FavoriteCharacter[] {
  return load()
}

export function isFavorite(serverId: string, characterId: string): boolean {
  const list = load()
  return list.some(
    (f) =>
      String(f.serverId) === String(serverId) &&
      String(f.characterId) === String(characterId),
  )
}

export function addFavorite(char: FavoriteCharacter): FavoriteCharacter[] {
  const list = load()
  const key = (s: string, c: string) => `${s}:${c}`
  const exists = list.some(
    (f) =>
      key(f.serverId, f.characterId) ===
      key(String(char.serverId), String(char.characterId)),
  )
  if (exists) return list
  const next = [...list, { ...char, serverId: String(char.serverId), characterId: String(char.characterId) }]
  save(next)
  return next
}

export function removeFavorite(
  serverId: string,
  characterId: string,
): FavoriteCharacter[] {
  const list = load().filter(
    (f) =>
      String(f.serverId) !== String(serverId) ||
      String(f.characterId) !== String(characterId),
  )
  save(list)
  return list
}

export function toggleFavorite(
  char: FavoriteCharacter,
  current: FavoriteCharacter[],
): FavoriteCharacter[] {
  const isIn = current.some(
    (f) =>
      String(f.serverId) === String(char.serverId) &&
      String(f.characterId) === String(char.characterId),
  )
  if (isIn) return removeFavorite(char.serverId, char.characterId)
  return addFavorite(char)
}
