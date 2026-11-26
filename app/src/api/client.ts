// 서버 요청 틀. 앱의 서버 요청은 모두 call()을 거친다.
// - 주소는 공통 정의 ENDPOINTS의 이름으로만 고른다. 주소 글자를 앱에 따로 적지 않는다.
// - 앱은 데이터베이스에 직접 접근하지 않는다. 이 틀은 앱 서버 함수 하나만 부른다.
// - 요청 본문과 응답을 기록(console)에 남기지 않는다.

import Constants from "expo-constants";
import { Platform } from "react-native";
import { getAccessToken } from "./credentials";
import { syncServerTime } from "./serverTime";
import { API_METHOD, ENDPOINTS, ERRORS, HEADERS, type EndpointName, type ErrorBody, type ErrorCode, type SuccessBody } from "./shared";

const API_BASE: string = (Constants.expoConfig?.extra as { apiBase?: string } | undefined)?.apiBase ?? "";
const APP_VERSION: string = Constants.expoConfig?.version ?? "0.0.0";
const PLATFORM = Platform.OS === "android" ? "android" : "ios";

/** 서버가 오류 번호로 답했거나, 서버에 닿지 못한 경우 */
export class ApiError extends Error {
  /** 서버에 닿지 못했으면 'NETWORK' */
  readonly code: ErrorCode | "NETWORK";
  readonly body: ErrorBody["error"] | null;
  constructor(code: ErrorCode | "NETWORK", body: ErrorBody["error"] | null) {
    super(code === "NETWORK" ? "서버에 닿지 못했습니다." : ERRORS[code].message);
    this.code = code;
    this.body = body;
  }
}

export interface CallOptions {
  /** Idempotency-Key. 창구가 idempotent일 때 같은 요청을 다시 보낼 때 같은 값을 쓴다 */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

/**
 * 창구 하나를 부른다. 모든 요청은 POST다(기술설계_4 2.1).
 * 성공하면 data를 돌려주고 meta.server_time으로 서버 시각을 맞춘다.
 * 실패하면 ApiError를 던진다. 화면 문장은 화면이 오류 번호를 보고 고른다.
 */
export async function call<Res, Req extends object = Record<string, never>>(name: EndpointName, body?: Req, opts: CallOptions = {}): Promise<Res> {
  const ep = ENDPOINTS[name];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    [HEADERS.appVersion]: APP_VERSION,
    [HEADERS.platform]: PLATFORM,
  };
  if (ep.auth === "access") {
    const token = getAccessToken();
    if (token) headers[HEADERS.authorization] = `Bearer ${token}`;
  }
  if ("idempotent" in ep && ep.idempotent) {
    if (!opts.idempotencyKey) throw new Error(`${name}에는 Idempotency-Key가 필요합니다.`);
    headers[HEADERS.idempotencyKey] = opts.idempotencyKey;
  }

  let res: Response;
  try {
    res = await fetch(API_BASE + ep.path, { method: API_METHOD, headers, body: JSON.stringify(body ?? {}), signal: opts.signal });
  } catch {
    throw new ApiError("NETWORK", null);
  }
  const receivedAt = Date.now();

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.ok ? "OM-9000" : "NETWORK", null);
  }

  if (res.ok && json && typeof json === "object" && "data" in json) {
    const ok = json as SuccessBody<Res>;
    if (ok.meta?.server_time) syncServerTime(ok.meta.server_time, receivedAt);
    return ok.data;
  }
  const err = (json as ErrorBody | null)?.error;
  const code = err && err.code in ERRORS ? err.code : "OM-9000";
  throw new ApiError(code, err ?? null);
}
