"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
const KEY = "nepal-tv:favorites:v1";
function parse(value: string | null): string[] {
  try {
    const data: unknown = JSON.parse(value || "[]");
    return Array.isArray(data)
      ? data.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}
const Context = createContext<{
  ids: string[];
  ready: boolean;
  storageError: boolean;
  toggle: (id: string) => void;
}>({ ids: [], ready: false, storageError: false, toggle: () => {} });
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      setIds(parse(localStorage.getItem(KEY)));
    } catch {
      setStorageError(true);
    }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null)
        setIds(parse(event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const toggle = useCallback(
    (id: string) => {
      const next = ids.includes(id)
        ? ids.filter((item) => item !== id)
        : [...ids, id];
      setIds(next);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    },
    [ids],
  );
  return (
    <Context.Provider value={{ ids, ready, storageError, toggle }}>
      {children}
    </Context.Provider>
  );
}
export function useFavorites() {
  return useContext(Context);
}
