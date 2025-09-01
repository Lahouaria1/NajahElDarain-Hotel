// src/context/AuthContext.tsx
/**
 * AuthContext
 * -----------
 * Centralizes authentication state (user + token) for the React app.
 * - Persists auth in localStorage
 * - Exposes login/register/logout helpers
 * - Connects/disconnects Socket.IO when auth changes
 * - Syncs auth state across multiple browser tabs via `storage` events
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { api, type User } from '../lib/api';

/** Shape of the auth context exposed to the rest of the app */
type Ctx = {
  user: User | null;                 // current user object or null if signed out
  token: string | null;              // JWT string or null if signed out
  login: (u: string, p: string) => Promise<void>;
  register: (u: string, p: string) => Promise<void>;
  logout: () => void;
};

/** Create the React context (undefined means "not inside provider") */
const AuthCtx = createContext<Ctx | undefined>(undefined);

/**
 * AuthProvider
 * Wraps the application and provides the auth context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize user from localStorage so a refresh keeps you signed in
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  // Initialize token from localStorage for the same reason
  const [tok, setTok] = useState<string | null>(() => localStorage.getItem('token'));

  /**
   * Helper to set both token + user consistently everywhere,
   * persist them to localStorage, and then connect the socket.
   */
  const setAuth = (t: string, u: User) => {
    setTok(t);
    setUser(u);
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    // Connect Socket.IO using the fresh token (server will authorize rooms)
    connectSocket(t);
  };

  /** Login via API then persist auth + connect socket */
  const login = async (u: string, p: string) => {
    const r = await api.login(u, p);
    setAuth(r.token, r.user);
  };

  /** Register via API then persist auth + connect socket */
  const register = async (u: string, p: string) => {
    const r = await api.register(u, p);
    setAuth(r.token, r.user);
  };

  /** Clear auth everywhere and disconnect socket */
  const logout = () => {
    setTok(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
  };

  /**
   * On first mount and whenever the token changes,
   * make sure the socket is connected with the current token.
   */
  useEffect(() => {
    if (tok) connectSocket(tok);
  }, [tok]);

  /**
   * Sync auth state across multiple tabs:
   * If another tab logs in/out, we mirror that change here.
   */
  useEffect(() => {
    const onStorage = () => {
      const t = localStorage.getItem('token');
      const raw = localStorage.getItem('user');
      setTok(t);
      setUser(raw ? JSON.parse(raw) : null);
      if (t) connectSocket(t);
      else disconnectSocket();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /**
   * Memoize the context value so consumers don't re-render unnecessarily
   * unless `user` or `tok` actually change.
   */
  const value = useMemo(
    () => ({ user, token: tok, login, register, logout }),
    [user, tok]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

/**
 * Hook for consuming the auth context safely.
 * Throws if used outside of <AuthProvider>.
 */
export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
