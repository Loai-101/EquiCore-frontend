/**
 * Frontend-only credential form. Swap `authenticateDummyUser` for API auth later.
 */
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { authenticateDummyUser, dummyRowToSessionUser } from '../../../../auth/dummyUsers';
import { useAuth } from '../../../../context/AuthContext';
import { BRAND_LOGO_URL, ROUTES, ROLES } from '../../../../utils/constants';
import '../styles/Login.css';

function postLoginPath(user) {
  if (user?.role === ROLES.SUPER_ADMIN) return ROUTES.superAdmin.dashboard;
  return ROUTES.dashboard;
}

function canUseSavedRedirect(user, path) {
  if (!path || typeof path !== 'string' || !path.startsWith('/')) return false;
  if (path === ROUTES.login || path === ROUTES.unauthorized) return false;
  if (path.startsWith('/super-admin')) return user?.role === ROLES.SUPER_ADMIN;
  if (path.startsWith('/stable') || path === ROUTES.dashboard) {
    return user?.role === ROLES.STABLE_ADMIN || user?.role === ROLES.STABLE_USER;
  }
  return false;
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;
  const redirectTarget =
    typeof from === 'string' && from !== ROUTES.login ? from : null;

  if (user) {
    const dest =
      redirectTarget && canUseSavedRedirect(user, redirectTarget)
        ? redirectTarget
        : postLoginPath(user);
    return <Navigate to={dest} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => {
      setTimeout(r, 380);
    });
    try {
      const row = authenticateDummyUser(username, password);
      if (!row) {
        toast.error(t('pages.login.invalidCredentials'));
        setSubmitting(false);
        return;
      }
      const sessionUser = dummyRowToSessionUser(row);
      login(sessionUser, { rememberMe });
      const dest =
        redirectTarget && canUseSavedRedirect(sessionUser, redirectTarget)
          ? redirectTarget
          : postLoginPath(sessionUser);
      navigate(dest, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__ambient" aria-hidden />
      <div className="login-page__card">
        <div className="login-page__brand">
          <img
            className="login-page__logo"
            src={BRAND_LOGO_URL}
            alt=""
            width={52}
            height={52}
            decoding="async"
          />
          <div>
            <p className="login-page__brand-name">{t('app.name')}</p>
            <p className="login-page__brand-tag">{t('app.tagline')}</p>
          </div>
        </div>

        <h1 className="login-page__title">{t('pages.login.title')}</h1>
        <p className="login-page__lead">{t('pages.login.lead')}</p>

        <form className="login-page__form" onSubmit={onSubmit} noValidate>
          <label className="login-page__field">
            <span className="login-page__label">{t('pages.login.username')}</span>
            <input
              className="login-page__input"
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(ev) => setUsername(ev.target.value)}
              placeholder={t('pages.login.usernamePlaceholder')}
              disabled={submitting}
            />
          </label>

          <label className="login-page__field">
            <span className="login-page__label">{t('pages.login.password')}</span>
            <div className="login-page__password-wrap">
              <input
                className="login-page__input login-page__input--password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                placeholder="••••••••"
                disabled={submitting}
              />
              <button
                type="button"
                className="login-page__toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? t('pages.login.hidePassword') : t('pages.login.showPassword')}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </label>

          <label className="login-page__remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(ev) => setRememberMe(ev.target.checked)}
              disabled={submitting}
            />
            <span>{t('pages.login.rememberMe')}</span>
          </label>

          <button type="submit" className="login-page__submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="login-page__spinner" size={20} aria-hidden />
                {t('pages.login.signingIn')}
              </>
            ) : (
              t('pages.login.submit')
            )}
          </button>
        </form>

        <p className="login-page__footnote">{t('pages.login.footnote')}</p>
      </div>
    </div>
  );
}
