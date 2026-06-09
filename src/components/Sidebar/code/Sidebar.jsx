/**
 * Primary navigation rail for dashboard layouts (Super Admin + Stable).
 */
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { DashboardNavContext } from '../../../context/DashboardNavContext';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../utils/constants';
import LanguageSwitcher from '../../LanguageSwitcher/code/LanguageSwitcher.jsx';
import '../styles/Sidebar.css';

export default function Sidebar({ title, subtitle, items, hint }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useAuth();
  const dashNav = useContext(DashboardNavContext);

  const closeIfMobile = () => {
    dashNav?.closeMobileNav();
  };

  const drawerOpen = Boolean(dashNav?.sidebarOpen);

  const handleLogout = () => {
    auth.logout();
    navigate(ROUTES.login);
    closeIfMobile();
  };

  return (
    <>
      {dashNav ? (
        <div
          className={`ec-sidebar-backdrop${drawerOpen ? ' ec-sidebar-backdrop--visible' : ''}`}
          onClick={dashNav.closeMobileNav}
          aria-hidden="true"
        />
      ) : null}
      <aside
        id="ec-app-sidebar"
        className={`ec-sidebar${drawerOpen ? ' ec-sidebar--open' : ''}`}
      >
        <div className="ec-sidebar__crest">
          <div className="ec-sidebar__crest-top">
            <div className="ec-sidebar__crest-text">
              <p className="ec-sidebar__crest-title">{title}</p>
              {subtitle ? <div className="ec-sidebar__crest-sub">{subtitle}</div> : null}
            </div>
            {dashNav ? (
              <button
                type="button"
                className="ec-sidebar__close"
                onClick={dashNav.closeMobileNav}
                aria-label={t('common.closeNavigation')}
              >
                <X size={20} strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
        <p className="ec-sidebar__section-label">{t('sidebar.sectionNavigation')}</p>
        <nav className="ec-sidebar__nav" aria-label={t('sidebar.sectionNavigation')}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `ec-sidebar__link${isActive ? ' ec-sidebar__link--active' : ''}`
                }
                end={item.end}
                onClick={closeIfMobile}
              >
                {Icon ? <Icon size={18} strokeWidth={1.75} /> : null}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        {dashNav ? (
          <div className="ec-sidebar__drawer-utilities" aria-label={t('sidebar.drawerUtilities')}>
            <LanguageSwitcher />
            <button type="button" className="ec-sidebar__logout" onClick={handleLogout}>
              <LogOut size={18} strokeWidth={1.75} aria-hidden />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        ) : null}
        {hint ? <p className="ec-sidebar__hint">{hint}</p> : null}
      </aside>
    </>
  );
}
