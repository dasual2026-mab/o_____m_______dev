// 서버 시각. 남은 시간은 기기 시계가 아니라 응답의 meta.server_time과의 차이로 센다(기술설계_4 2.2).
// 응답을 받을 때마다 '서버 시각 − 기기 시각'을 다시 잰다.

let offsetMs = 0;

/** 응답의 meta.server_time으로 차이를 다시 잰다. client.ts가 부른다 */
export function syncServerTime(serverTime: string, receivedAt: number = Date.now()): void {
  const t = Date.parse(serverTime);
  if (Number.isFinite(t)) offsetMs = t - receivedAt;
}

/** 지금의 서버 시각(ms) */
export function serverNow(): number {
  return Date.now() + offsetMs;
}

/** 끝나는 때(ISO)까지 남은 초. 지났으면 0 */
export function secondsUntil(iso: string): number {
  const end = Date.parse(iso);
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - serverNow()) / 1000));
}
