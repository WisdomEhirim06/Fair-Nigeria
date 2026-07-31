'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { getMe, logout as apiLogout, refresh, type ApiUser } from '@/lib/api';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionValue {
  user: ApiUser | null;
  status: SessionStatus;
  signIn: () => Promise<ApiUser | null>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  const loadUser = useCallback(async (): Promise<ApiUser | null> => {
    try {
      const me = await getMe();
      setUser(me);
      setStatus('authenticated');
      return me;
    } catch {
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }
  }, []);

  // Bootstrap once on load: mint an access token from the refresh cookie, then
  // load the user. This is what survives a page reload.
  useEffect(() => {
    let active = true;
    void (async () => {
      const restored = await refresh();
      if (!active) return;
      if (restored) await loadUser();
      else setStatus('unauthenticated');
    })();
    return () => {
      active = false;
    };
  }, [loadUser]);

  const signIn = useCallback(async (): Promise<ApiUser | null> => {
    setStatus('loading');
    return loadUser();
  }, [loadUser]);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setStatus('unauthenticated');
    // Drop anything the service worker cached during this session, so a shared
    // phone doesn't hand the next person the last one's browsing.
    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHES' });
    }
  }, []);

  return (
    <SessionContext.Provider value={{ user, status, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within <SessionProvider>.');
  }
  return ctx;
}
