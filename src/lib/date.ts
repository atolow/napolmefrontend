/**
 * 모든 날짜·시간 표시는 한국 시간(KST, Asia/Seoul) 기준.
 */

const KST = 'Asia/Seoul'

/**
 * ISO 문자열 또는 날짜 값을 한국 시간으로 포맷.
 * @param value - ISO 날짜 문자열 또는 null/undefined
 * @param options.withSeconds - true면 초 포함 (YYYY-MM-DD HH:mm:ss)
 */
export function formatDateTimeKST(
  value?: string | null,
  options?: { withSeconds?: boolean }
): string {
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
    second: options?.withSeconds ? '2-digit' : undefined,
    hour12: false,
  }).formatToParts(parsed)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const base = `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`
  return options?.withSeconds ? `${base}:${get('second')}` : base
}
