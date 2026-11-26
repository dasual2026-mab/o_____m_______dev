// 서버 설정. 값은 Edge Functions의 비밀 값 저장소에서 읽는다. 코드와 저장소에 넣지 않는다.
// 이름의 목록은 server/.env.example에 있다.

import { b64urlDecode, type SigningKeys } from "./crypto.ts";
import { LIMITS, type Limits } from "./defs/index.ts";

export type ServerEnv = "dev" | "test" | "review" | "prod";

export interface Config {
  env: ServerEnv;
  /** 쓸 수 있는 가장 낮은 앱 판 */
  minVersion: string;
  /** 점검 중이면 안내 글 */
  maintenance: string | null;
  /** 심사 중인 앱 판. 이 판에서만 심사용 길을 보인다 */
  reviewVersion: string | null;
  signing: SigningKeys;
  /** 가명용 변환 키 */
  pseudonymKey: Uint8Array;
  limits: Limits;
  product: { product_id: string; tokens: number; price: number };
}

type Getter = (name: string) => string | undefined;

function need(get: Getter, name: string): string {
  const v = get(name);
  if (!v) throw new Error(`서버 설정이 없습니다: ${name}`);
  return v;
}

function key(get: Getter, name: string): Uint8Array {
  const bytes = b64urlDecode(need(get, name));
  if (bytes.length < 32) throw new Error(`키가 32바이트보다 짧습니다: ${name}`);
  return bytes;
}

export function loadConfig(get: Getter): Config {
  const env = (get("OM_ENV") ?? "dev") as ServerEnv;
  if (!["dev", "test", "review", "prod"].includes(env)) throw new Error("OM_ENV가 맞지 않습니다");

  // 서명 키는 번호를 붙여 여러 개 둘 수 있다. 키를 바꿀 때 옛 키로 서명한 값을 잠시 받아 준다.
  const current = Number(need(get, "OM_KEY_SIGNING_CURRENT"));
  const keys = new Map<number, Uint8Array>();
  for (let id = 1; id <= current; id++) {
    if (get(`OM_KEY_SIGNING_${id}`)) keys.set(id, key(get, `OM_KEY_SIGNING_${id}`));
  }
  if (!keys.has(current)) throw new Error("지금 쓰는 서명 키가 없습니다");

  return {
    env,
    minVersion: get("OM_MIN_VERSION") ?? "1.0.0",
    maintenance: get("OM_MAINTENANCE") || null,
    reviewVersion: get("OM_REVIEW_VERSION") || null,
    signing: { current, keys },
    pseudonymKey: key(get, "OM_KEY_PSEUDONYM"),
    limits: { ...LIMITS },
    product: { product_id: get("OM_PRODUCT_ID") ?? "token_100", tokens: 100, price: 6900 },
  };
}

/** 앱 판 비교. a가 b보다 낮으면 음수다. 읽을 수 없는 판은 가장 낮은 판으로 본다. */
export function compareVersion(a: string, b: string): number {
  const parse = (v: string) => (/^\d+(\.\d+){0,3}$/.test(v) ? v.split(".").map(Number) : [-1]);
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
