import { createContext, useCallback, useContext, useState } from 'react';
import * as authApi from '../api/auth.js';
import { getToken } from '../api/client.js';

const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/lorelei/svg';

/** DiceBear avatar URL. Seed determines the avatar; random seed = new avatar each time. */
export function getAvatarUrl(seed) {
  if (!seed) return null;
  return `${DICEBEAR_BASE}?seed=${encodeURIComponent(String(seed))}`;
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = getToken();
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    if (!payload) return null;
    const role = payload.role ?? 'user';
    return {
      id: payload.id ?? payload._id ?? payload.sub,
      email: payload.email ?? payload.sub,
      name: payload.name ?? null,
      role,
    };
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      const userFromApi = data?.user;
      const role = userFromApi?.role ?? decodeJwtPayload(data?.token)?.role ?? 'user';
      const avatarSeed = `${Date.now()}-${Math.random()}`;
      setUser(userFromApi ? {
        id: userFromApi.id ?? userFromApi._id ?? userFromApi.sub,
        email: userFromApi.email ?? email,
        name: userFromApi.name ?? null,
        role,
        avatarUrl: getAvatarUrl(avatarSeed),
      } : { id: null, email: data?.email ?? email, name: null, role: 'user', avatarUrl: getAvatarUrl(avatarSeed) });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    setLoading(true);
    try {
      const data = await authApi.register(email, password, name);
      const userFromApi = data?.user;
      const role = userFromApi?.role ?? decodeJwtPayload(data?.token)?.role ?? 'user';
      const avatarSeed = `${Date.now()}-${Math.random()}`;
      setUser(userFromApi ? {
        id: userFromApi.id ?? userFromApi._id ?? userFromApi.sub,
        email: userFromApi.email ?? email,
        name: userFromApi.name ?? name ?? null,
        role,
        avatarUrl: getAvatarUrl(avatarSeed),
      } : { id: null, email: data?.email ?? email, name: name ?? null, role: 'user', avatarUrl: getAvatarUrl(avatarSeed) });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const updateUser = useCallback((partial) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const token = getToken();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, loading, isAdmin, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
