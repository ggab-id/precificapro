import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, updateUser } from '../utils/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('precificapro_session');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const u = loginUser(email, password);
    if (!u) return { error: 'E-mail ou senha incorretos.' };
    setUser(u);
    localStorage.setItem('precificapro_session', JSON.stringify(u));
    return { user: u };
  };

  const register = (name, email, password) => {
    const result = registerUser(name, email, password);
    if (result.error) return result;
    setUser(result.user);
    localStorage.setItem('precificapro_session', JSON.stringify(result.user));
    return result;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('precificapro_session');
  };

  const updateProfile = (updates) => {
    const updated = updateUser(user.id, updates);
    if (updated) {
      setUser(updated);
      localStorage.setItem('precificapro_session', JSON.stringify(updated));
    }
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
