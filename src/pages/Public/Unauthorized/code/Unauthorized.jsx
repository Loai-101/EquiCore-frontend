/**
 * Shown when an authenticated user hits a route their role cannot access.
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { BRAND_LOGO_URL, getRoleHomePath, ROUTES } from '../../../../utils/constants';
import '../styles/Unauthorized.css';

export default function Unauthorized() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useAuth();

  const goDashboard = () => {
    if (!auth.user) {
      navigate(ROUTES.login, { replace: true });
      return;
    }
    navigate(getRoleHomePath(auth.user), { replace: true });
  };

  return (
    <div className="ec-unauthorized">
      <div className="ec-unauthorized__glow" aria-hidden />
      <div className="ec-unauthorized__card">
        <img
          className="ec-unauthorized__logo"
          src={BRAND_LOGO_URL}
          alt=""
          width={56}
          height={56}
          decoding="async"
        />
        <h1 className="ec-unauthorized__title">{t('pages.unauthorized.title')}</h1>
        <p className="ec-unauthorized__message">{t('pages.unauthorized.message')}</p>
        <button type="button" className="ec-unauthorized__btn" onClick={goDashboard}>
          {t('pages.unauthorized.cta')}
        </button>
      </div>
    </div>
  );
}
