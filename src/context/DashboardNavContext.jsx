import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

const DashboardNavContext = createContext(null);

export { DashboardNavContext };

export function DashboardNavProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const closeMobileNav = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const toggleMobileNav = useCallback(() => setSidebarOpen((v) => !v), []);

  useEffect(() => {
    closeMobileNav();
  }, [location.pathname, closeMobileNav]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeMobileNav();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeMobileNav]);

  const value = useMemo(
    () => ({
      sidebarOpen,
      /** @deprecated use sidebarOpen — kept for any external callers */
      mobileNavOpen: sidebarOpen,
      openSidebar,
      toggleMobileNav,
      closeMobileNav,
    }),
    [sidebarOpen, openSidebar, toggleMobileNav, closeMobileNav]
  );

  return (
    <DashboardNavContext.Provider value={value}>{children}</DashboardNavContext.Provider>
  );
}

/** @returns {{ sidebarOpen: boolean, mobileNavOpen: boolean, openSidebar: () => void, toggleMobileNav: () => void, closeMobileNav: () => void } | null} */
export function useDashboardNavOptional() {
  return useContext(DashboardNavContext);
}
