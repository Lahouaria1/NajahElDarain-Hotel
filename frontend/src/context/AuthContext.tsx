// src/context/AuthContext.tsx
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

type Ctx = {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthCtx = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const [tok, setTok] = useState<string | null>(() => localStorage.getItem('token'));

  const setAuth = (token: string, u: User) => {
    setTok(token);
    setUser(u);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    connectSocket(token);
  };

  const login = async (username: string, password: string) => {
    const r = await api.login(username, password);
    setAuth(r.token, r.user);
  };

  const register = async (username: string, password: string) => {
    const r = await api.register(username, password);
    setAuth(r.token, r.user);
  };

  const logout = () => {
    setTok(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
  };

  useEffect(() => {
    if (tok) connectSocket(tok);
  }, [tok]);

  useEffect(() => {
    const onStorage = () => {
      const token = localStorage.getItem('token');
      const raw = localStorage.getItem('user');
      setTok(token);
      setUser(raw ? JSON.parse(raw) : null);
      if (token) connectSocket(token);
      else disconnectSocket();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({ user, token: tok, login, register, logout }),
    [user, tok]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
