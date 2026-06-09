/**
 * Top navigation for public marketing and authenticated dashboard shells.
 * variant: "public" | "super" | "stable" — drives which actions render.
 */
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { DashboardNavContext } from '../../../context/DashboardNavContext';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES, BRAND_LOGO_URL } from '../../../utils/constants';
import LanguageSwitcher from '../../LanguageSwitcher/code/LanguageSwitcher.jsx';
import '../styles/Navbar.css';

export default function Navbar({ variant = 'public', tenantLabel }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useAuth();
  const dashNav = useContext(DashboardNavContext);

  const go = (path) => () => navigate(path);

  return (
    <header className="ec-navbar">
      <div className="ec-navbar__inner">
        <div className="ec-navbar__start">
          {(variant === 'super' || variant === 'stable') && dashNav ? (
            <button
              type="button"
              className="ec-navbar__menu-btn"
              onClick={() => dashNav.openSidebar()}
              aria-expanded={dashNav.sidebarOpen}
              aria-controls="ec-app-sidebar"
              aria-label={t('common.openNavigation')}
            >
              <Menu size={22} strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            className="ec-navbar__brand"
            onClick={go(ROUTES.home)}
            aria-label={t('app.name')}
          >
            <img
              className="ec-navbar__logo"
              src={BRAND_LOGO_URL}
              alt=""
              aria-hidden
              width={38}
              height={38}
              decoding="async"
              fetchPriority="high"
            />
            <span className="ec-navbar__titles">
              <span className="ec-navbar__wordmark">{t('app.name')}</span>
              <span className="ec-navbar__tagline">{t('app.tagline')}</span>
            </span>
          </button>
        </div>

        {variant === 'public' && (
          <div className="ec-navbar__actions">
            <LanguageSwitcher />
            <button
              type="button"
              className="ec-navbar__btn ec-navbar__btn--ghost"
              onClick={go(ROUTES.login)}
            >
              {t('common.login')}
            </button>
            <button
              type="button"
              className="ec-navbar__btn ec-navbar__btn--solid"
              onClick={go(ROUTES.registerStable)}
            >
              {t('common.registerStable')}
            </button>
          </div>
        )}

        {(variant === 'super' || variant === 'stable') && (
          <div className="ec-navbar__actions">
            <div className="ec-navbar__dashboard-utilities">
              <LanguageSwitcher />
              <button
                type="button"
                className="ec-navbar__btn ec-navbar__btn--ghost"
                onClick={() => {
                  auth.logout();
                  navigate(ROUTES.login);
                }}
              >
                <span className="ec-navbar__logout-inner">
                  <LogOut size={18} />
                  {t('common.logout')}
                </span>
              </button>
            </div>
            {tenantLabel ? (
              <div className="ec-navbar__meta">
                <p className="ec-navbar__meta-label">
                  {variant === 'super' ? t('nav.superAdmin') : t('nav.activeStable')}
                </p>
                <p className="ec-navbar__meta-value">{tenantLabel}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
}
