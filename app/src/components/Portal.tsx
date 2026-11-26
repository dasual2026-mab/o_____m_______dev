import { createContext, useContext, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

// 시트와 토스트를 화면 맨 위 층에 그리는 작은 포털. 화면 어디에서 선언해도 앱 맨 위에 그린다.

interface PortalApi {
  mount: (key: string, node: ReactNode, z: number) => void;
  unmount: (key: string) => void;
}

const PortalContext = createContext<PortalApi | null>(null);

export function PortalHost({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<Record<string, { node: ReactNode; z: number }>>({});
  const api = useMemo<PortalApi>(
    () => ({
      mount: (key, node, z) => setNodes(n => ({ ...n, [key]: { node, z } })),
      unmount: key =>
        setNodes(n => {
          const { [key]: _, ...rest } = n;
          return rest;
        }),
    }),
    [],
  );
  const list = Object.entries(nodes).sort((a, b) => a[1].z - b[1].z);
  return (
    <PortalContext.Provider value={api}>
      {children}
      {list.map(([k, v]) => (
        <View key={k} style={[StyleSheet.absoluteFill, { zIndex: v.z }]} pointerEvents="box-none">
          {v.node}
        </View>
      ))}
    </PortalContext.Provider>
  );
}

/** 이 안의 내용을 앱 맨 위 층에 그린다. z가 클수록 위 */
export function Portal({ children, z = 30 }: { children: ReactNode; z?: number }) {
  const api = useContext(PortalContext);
  const key = useId();
  useEffect(() => {
    api?.mount(key, children, z);
  }, [api, key, children, z]);
  useEffect(() => () => api?.unmount(key), [api, key]);
  return null;
}
