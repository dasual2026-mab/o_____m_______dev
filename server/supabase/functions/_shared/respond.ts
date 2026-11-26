// 응답의 틀. 기술설계_4 2.2

import { ERRORS, type ErrorBody, type ErrorCode, HEADERS, type SuccessBody } from "./defs/index.ts";

type ErrorExtra = Omit<ErrorBody["error"], "code" | "message">;

/** 창구가 던지는 오류. 오류 번호만 응답으로 나간다. */
export class ApiError extends Error {
  code: ErrorCode;
  extra: ErrorExtra;
  constructor(code: ErrorCode, extra: ErrorExtra = {}) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.extra = extra;
  }
}

function json(status: number, body: unknown, requestId: string, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      [HEADERS.requestId]: requestId,
      ...headers,
    },
  });
}

export function ok<T>(data: T, requestId: string, now = new Date()): Response {
  const body: SuccessBody<T> = {
    data,
    meta: { server_time: now.toISOString().replace(/\.\d{3}Z$/, "Z") },
  };
  return json(200, body, requestId);
}

export function fail(code: ErrorCode, requestId: string, extra: ErrorExtra = {}): Response {
  const def = ERRORS[code];
  const body: ErrorBody = { error: { code, message: def.message, ...extra } };
  const headers: Record<string, string> = {};
  if (extra.retry_after !== undefined) headers["Retry-After"] = String(extra.retry_after);
  return json(def.http, body, requestId, headers);
}
