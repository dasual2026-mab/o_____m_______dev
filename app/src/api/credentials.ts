// 기기 연결 인증값. 기기의 보안 저장소(iOS 키체인, Android 키스토어)에만 둔다(기술설계_1 4.8).
// 접속 인증값은 수명이 15분이라 메모리에만 둔다.
// 웹 미리보기에는 보안 저장소가 없어 아무것도 남기지 않는다.

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY_LINK = "om.link";
const KEY_REFRESH = "om.refresh";

let accessToken: string | null = null;

const canStore = Platform.OS !== "web";
const opts: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function getLink(): Promise<{ link: string; refresh: string } | null> {
  if (!canStore) return null;
  const [link, refresh] = await Promise.all([SecureStore.getItemAsync(KEY_LINK, opts), SecureStore.getItemAsync(KEY_REFRESH, opts)]);
  return link && refresh ? { link, refresh } : null;
}

export async function saveLink(link: string, refresh: string): Promise<void> {
  if (!canStore) return;
  await SecureStore.setItemAsync(KEY_LINK, link, opts);
  await SecureStore.setItemAsync(KEY_REFRESH, refresh, opts);
}

/** 연결 해제, 탈퇴, OM-1002를 받았을 때 */
export async function clearLink(): Promise<void> {
  accessToken = null;
  if (!canStore) return;
  await Promise.all([SecureStore.deleteItemAsync(KEY_LINK, opts), SecureStore.deleteItemAsync(KEY_REFRESH, opts)]);
}
