/**
 * Marketing landing for EquiCore (public, unauthenticated).
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shield, Users, Activity } from 'lucide-react';
import { ROUTES } from '../../../../utils/constants';
import '../styles/LandingPage.css';

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const whoLeadText = t('pages.landing.whoLead');
  const modulesLeadText = t('pages.landing.modulesLead');

  return (
    <div className="landing-page">
      <section className="landing-page__hero">
        <div className="landing-page__hero-main">
          <span className="landing-page__hero-eyebrow">
            <Sparkles size={14} />
            {t('pages.landing.eyebrow')}
          </span>
          <h1 className="landing-page__hero-title">{t('pages.landing.heroTitle')}</h1>
          <p className="landing-page__hero-lead">{t('pages.landing.heroLead')}</p>
          <div className="landing-page__hero-actions">
            <button
              type="button"
              className="landing-page__btn landing-page__btn--primary"
              onClick={() => navigate(ROUTES.registerStable)}
            >
              {t('common.registerStable')}
            </button>
            <button
              type="button"
              className="landing-page__btn landing-page__btn--secondary"
              onClick={() => navigate(ROUTES.login)}
            >
              {t('common.login')}
            </button>
          </div>
        </div>
        <div className="landing-page__hero-panel" aria-hidden>
          <div className="landing-page__hero-panel-grid">
            <div className="landing-page__mini-card">
              <h4>{t('pages.landing.cardApprovalTitle')}</h4>
              <p>{t('pages.landing.cardApprovalBody')}</p>
            </div>
            <div className="landing-page__mini-card">
              <h4>{t('pages.landing.cardScopedTitle')}</h4>
              <p>{t('pages.landing.cardScopedBody')}</p>
            </div>
            <div className="landing-page__mini-card">
              <h4>{t('pages.landing.cardMobileTitle')}</h4>
              <p>{t('pages.landing.cardMobileBody')}</p>
            </div>
            <div className="landing-page__mini-card">
              <h4>{t('pages.landing.cardLuxuryTitle')}</h4>
              <p>{t('pages.landing.cardLuxuryBody')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-page__section landing-page__section--why">
        <div className="landing-page__section-inner">
          <h2 className="landing-page__section-title">{t('pages.landing.whyIntroTitle')}</h2>
          <p className="landing-page__section-lead">{t('pages.landing.whyIntroBody')}</p>
          <h2 className="landing-page__section-title">{t('pages.landing.whyTitle')}</h2>
          <p className="landing-page__section-lead">{t('pages.landing.whyLead')}</p>
          <div className="landing-page__grid-3">
            <article className="landing-page__card">
              <div className="landing-page__card-icon" aria-hidden>
                <Shield size={22} color="#c9a227" strokeWidth={1.75} />
              </div>
              <h3>{t('pages.landing.featureGovTitle')}</h3>
              <p>{t('pages.landing.featureGovBody')}</p>
            </article>
            <article className="landing-page__card">
              <div className="landing-page__card-icon" aria-hidden>
                <Users size={22} color="#c9a227" strokeWidth={1.75} />
              </div>
              <h3>{t('pages.landing.featureRolesTitle')}</h3>
              <p>{t('pages.landing.featureRolesBody')}</p>
            </article>
            <article className="landing-page__card">
              <div className="landing-page__card-icon" aria-hidden>
                <Activity size={22} color="#c9a227" strokeWidth={1.75} />
              </div>
              <h3>{t('pages.landing.featureIntelTitle')}</h3>
              <p>{t('pages.landing.featureIntelBody')}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-page__section landing-page__section--muted">
        <div className="landing-page__section-inner">
          <h2 className="landing-page__section-title">{t('pages.landing.whoTitle')}</h2>
          {whoLeadText.trim() ? (
            <p className="landing-page__section-lead">{whoLeadText}</p>
          ) : null}
          <div className="landing-page__pill-list">
            <span className="landing-page__pill">{t('pages.landing.pillEndurance')}</span>
            <span className="landing-page__pill">{t('pages.landing.pillJumping')}</span>
            <span className="landing-page__pill">{t('pages.landing.pillFlat')}</span>
            <span className="landing-page__pill">{t('pages.landing.pillMixed')}</span>
            <span className="landing-page__pill">{t('pages.landing.pillVet')}</span>
          </div>
        </div>
      </section>

      <section className="landing-page__section">
        <div className="landing-page__section-inner">
          <h2 className="landing-page__section-title">{t('pages.landing.modulesTitle')}</h2>
          {modulesLeadText.trim() ? (
            <p className="landing-page__section-lead">{modulesLeadText}</p>
          ) : null}
          <div className="landing-page__modules">
            <div className="landing-page__module">
              <h4>{t('pages.landing.moduleOpsTitle')}</h4>
              <p>{t('pages.landing.moduleOpsBody')}</p>
            </div>
            <div className="landing-page__module">
              <h4>{t('pages.landing.moduleCareTitle')}</h4>
              <p>{t('pages.landing.moduleCareBody')}</p>
            </div>
            <div className="landing-page__module">
              <h4>{t('pages.landing.moduleCommercialTitle')}</h4>
              <p>{t('pages.landing.moduleCommercialBody')}</p>
            </div>
            <div className="landing-page__module">
              <h4>{t('pages.landing.moduleIntelTitle')}</h4>
              <p>{t('pages.landing.moduleIntelBody')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-page__section landing-page__section--cta">
        <div className="landing-page__section-inner">
          <div className="landing-page__cta">
            <div className="landing-page__cta-copy">
              <h2 className="landing-page__cta-title">{t('pages.landing.ctaTitle')}</h2>
              <p className="landing-page__cta-lead">{t('pages.landing.ctaLead')}</p>
            </div>
            <button
              type="button"
              className="landing-page__btn landing-page__btn--primary landing-page__cta-btn"
              onClick={() => navigate(ROUTES.registerStable)}
            >
              {t('common.startRegistration')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
