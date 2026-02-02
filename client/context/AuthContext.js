/**
 * AuthContext – single source of truth for auth state so Login/Register can
 * trigger a refresh and the app switches to the authenticated stack without restart.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { isAuthenticated } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({ checked: false, isAuth: false });

  const checkAuth = useCallback(async () => {
    const isAuth = await isAuthenticated();
    setAuthState({ checked: true, isAuth: !!isAuth });
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    isAuth: authState.isAuth,
    checked: authState.checked,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      isAuth: false,
      checked: false,
      checkAuth: async () => {},
    };
  }
  return ctx;
}
