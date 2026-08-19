import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const res = await api.get(ENDPOINTS.auth.me);
        if (!cancelled) setUser(res.data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post(ENDPOINTS.auth.login, { email, password });
    setUser(res.data.user);
    return res.data;
  }, []);

  const signup = useCallback(async (name, username, email, password) => {
    const res = await api.post(ENDPOINTS.auth.signup, { name, username, email, password });
    return res.data;
  }, []);

  const verifyOtp = useCallback(async (email, code) => {
    return (await api.post(ENDPOINTS.auth.verifyOtp, { email, code })).data;
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return (await api.post(ENDPOINTS.auth.forgotPassword, { email })).data;
  }, []);

  const resetPassword = useCallback(async (email, code, newPassword) => {
    return (await api.post(ENDPOINTS.auth.resetPassword, { email, code, newPassword })).data;
  }, []);

  const updateCurrency = useCallback(async (currencyPreference) => {
    const res = await api.patch(ENDPOINTS.auth.me, { currencyPreference });
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    await api.post(ENDPOINTS.auth.logout);
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    verifyOtp,
    forgotPassword,
    resetPassword,
    updateCurrency,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}