import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setAuthSession, clearAuthSession, USER_KEY } from '../services/api';
import { reconnectSocketWithToken, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => getToken());
  const [loading, setLoading] = useState(true);

  // Synchronize on startup and validate token
  useEffect(() => {
    async function initAuth() {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.user) {
            setUser(res.user);
            reconnectSocketWithToken(storedToken);
          } else {
            clearAuthSession();
            setUser(null);
            setToken(null);
          }
        } catch (err) {
          console.warn('Session verification failed, cleared invalid session.');
          clearAuthSession();
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const loginDemo = async (role = 'student') => {
    try {
      let idNumber = 'S1001';
      let password = 'student123';

      if (role === 'faculty' || role === 'teacher') {
        idNumber = 'T2001';
        password = 'teacher123';
      } else if (role === 'admin') {
        idNumber = 'A3001';
        password = 'admin123';
      } else if (role === 'transport_manager' || role === 'transport') {
        idNumber = 'TM4001';
        password = 'transport123';
      } else if (role === 'hostel_warden' || role === 'hostel') {
        idNumber = 'HW5001';
        password = 'warden123';
      }

      const res = await api.login(idNumber, password);
      setUser(res.user);
      setToken(res.token);
      reconnectSocketWithToken(res.token);
      return res;
    } catch (err) {
      console.error('Demo login error:', err);
      throw err;
    }
  };

  const login = async (idNumber, password) => {
    const res = await api.login(idNumber, password);
    setUser(res.user);
    setToken(res.token);
    reconnectSocketWithToken(res.token);
    return res;
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    if (res.token && res.user) {
      setUser(res.user);
      setToken(res.token);
      reconnectSocketWithToken(res.token);
    }
    return res;
  };

  const logout = () => {
    clearAuthSession();
    disconnectSocket();
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.user) setUser(res.user);
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isPending: user?.status === 'pending',
        role: user?.role || 'student',
        loading,
        login,
        register,
        logout,
        loginDemo,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
