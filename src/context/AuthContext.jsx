import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ROLES, STABLE_STATUS } from '../utils/constants';

const AuthContext = createContext(null);

const STORAGE_KEY = 'equicore_auth';

function readStoredUser() {
  try {
    const fromSession = sessionStorage.getItem(STORAGE_KEY);
    if (fromSession) return JSON.parse(fromSession);
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    if (!fromLocal) return null;
    return JSON.parse(fromLocal);
  } catch {
    return null;
  }
}

function persistUser(nextUser, rememberMe) {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (!nextUser) return;
  const raw = JSON.stringify(nextUser);
  if (rememberMe) {
    localStorage.setItem(STORAGE_KEY, raw);
  } else {
    sessionStorage.setItem(STORAGE_KEY, raw);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());

  const login = useCallback((nextUser, options = {}) => {
    const rememberMe = Boolean(options.rememberMe);
    setUser(nextUser);
    persistUser(nextUser, rememberMe);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const isStableAdmin = user?.role === ROLES.STABLE_ADMIN;
  const isStableUser = user?.role === ROLES.STABLE_USER;
  const isPendingStable = user?.role === ROLES.STABLE_PENDING;
  const stableId = user?.stableId ?? null;
  const registrationStatus = user?.registrationStatus ?? null;

  const canAccessStableApp =
    (isStableAdmin || isStableUser) &&
    registrationStatus === STABLE_STATUS.APPROVED &&
    Boolean(stableId);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isSuperAdmin,
      isStableAdmin,
      isStableUser,
      isPendingStable,
      stableId,
      registrationStatus,
      canAccessStableApp,
    }),
    [
      user,
      login,
      logout,
      isSuperAdmin,
      isStableAdmin,
      isStableUser,
      isPendingStable,
      stableId,
      registrationStatus,
      canAccessStableApp,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
