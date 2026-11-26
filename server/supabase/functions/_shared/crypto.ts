// 변환값과 서명. 기술설계_3 2.4
// Web Crypto만 쓴다. Edge Functions(Deno)와 로컬 검사(Node)에서 같은 코드가 돈다.

const enc = new TextEncoder();
const dec = new TextDecoder();

export function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(text: string): Uint8Array {
  const pad = text.length % 4 === 0 ? "" : "=".repeat(4 - (text.length % 4));
  const s = atob(text.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function hmacKey(key: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
  return await crypto.subtle.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, usage);
}

/** 변환값. HMAC-SHA-256 */
export async function hmac(key: Uint8Array, text: string): Promise<Uint8Array> {
  const k = await hmacKey(key, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(text)));
}

/** 가명 값. 표 이름을 섞어 표마다 다른 값이 나오게 한다. */
export async function pseudonym(key: Uint8Array, table: string, ...parts: string[]): Promise<Uint8Array> {
  return await hmac(key, [table, ...parts].join("|"));
}

export function randomToken(bytes = 32): string {
  return b64urlEncode(crypto.getRandomValues(new Uint8Array(bytes)));
}

// 접속 인증값 ---------------------------------------------------------------
// 담는 것은 연결 번호와 끝나는 때뿐이다. 계정 번호는 담지 않는다. 기술설계_4 2.3
// 꼴: om1.<내용>.<서명>

export interface AccessClaims {
  /** 연결 번호 */
  l: string;
  /** 끝나는 때. 초 */
  e: number;
  /** 서명 키 번호 */
  k: number;
}

export interface SigningKeys {
  current: number;
  keys: Map<number, Uint8Array>;
}

const TOKEN_PREFIX = "om1";

export async function signAccessToken(
  signing: SigningKeys,
  linkId: string,
  ttlSec: number,
  nowMs = Date.now(),
): Promise<string> {
  const key = signing.keys.get(signing.current);
  if (!key) throw new Error("signing key missing");
  const claims: AccessClaims = { l: linkId, e: Math.floor(nowMs / 1000) + ttlSec, k: signing.current };
  const payload = b64urlEncode(enc.encode(JSON.stringify(claims)));
  const sig = await hmac(key, `${TOKEN_PREFIX}.${payload}`);
  return `${TOKEN_PREFIX}.${payload}.${b64urlEncode(sig)}`;
}

/** 서명이 맞고 살아 있으면 연결 번호를 준다. 아니면 null이다. */
export async function verifyAccessToken(
  signing: SigningKeys,
  token: string,
  nowMs = Date.now(),
): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return null;
  let claims: AccessClaims;
  let sig: Uint8Array;
  try {
    claims = JSON.parse(dec.decode(b64urlDecode(parts[1])));
    sig = b64urlDecode(parts[2]);
  } catch {
    return null;
  }
  if (typeof claims?.l !== "string" || typeof claims.e !== "number" || typeof claims.k !== "number") {
    return null;
  }
  const key = signing.keys.get(claims.k);
  if (!key) return null;
  const k = await hmacKey(key, ["verify"]);
  const ok = await crypto.subtle.verify("HMAC", k, sig as BufferSource, enc.encode(`${TOKEN_PREFIX}.${parts[1]}`));
  if (!ok) return null;
  if (claims.e * 1000 <= nowMs) return null;
  if (!/^[0-9a-f-]{36}$/.test(claims.l)) return null;
  return claims.l;
}
