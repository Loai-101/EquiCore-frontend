/**
 * Super Admin detail view for a single stable registration.
 * Approve / reject / request-info actions update local demo state only.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import StatusBadge from '../../../../components/StatusBadge/code/StatusBadge';
import { useData } from '../../../../context/DataContext';
import { ROUTES } from '../../../../utils/constants';
import '../styles/StableReview.css';

function stableTypeKey(type) {
  return `enums.stableType.${String(type).replace(/\s/g, '')}`;
}

export default function StableReview() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { stables, updateStable } = useData();

  const stable = useMemo(
    () => stables.find((s) => s.id === id),
    [stables, id]
  );

  if (!stable) {
    return (
      <div>
        <p>{t('common.stableNotFound')}</p>
        <Link to={ROUTES.superAdmin.stableRequests}>{t('common.backToRequests')}</Link>
      </div>
    );
  }

  const rows = useMemo(
    () => [
      [t('tables.stable'), stable.stableName],
      [t('tables.owner'), stable.ownerName],
      [t('tables.email'), stable.email],
      [t('tables.phone'), stable.phone],
      [t('tables.countryCity'), `${stable.country} · ${stable.city}`],
      [t('pages.register.stableType'), t(stableTypeKey(stable.stableType))],
      [t('tables.horseRiderCounts'), `${stable.horseCount} / ${stable.riderCount}`],
      [t('pages.register.commercialReg'), stable.commercialReg || t('common.emptyCell')],
      [t('pages.register.notes'), stable.notes || t('common.emptyCell')],
      [t('tables.submitted'), stable.submittedAt],
    ],
    [t, stable]
  );

  const approve = () => {
    updateStable(stable.id, { status: 'approved', rejectionReason: null });
    toast.success(t('toast.stableApproved'));
    navigate(ROUTES.superAdmin.stableRequests);
  };

  const reject = () => {
    updateStable(stable.id, {
      status: 'rejected',
      rejectionReason: t('pages.stableReview.demoRejectionReason'),
    });
    toast.error(t('toast.stableRejected'));
    navigate(ROUTES.superAdmin.rejectedStables);
  };

  const moreInfo = () => {
    toast(t('toast.infoRequestDemo'), { icon: '✉️' });
  };

  return (
    <div className="stable-review-page">
      <header className="stable-review-page__header">
        <h1 className="stable-review-page__title">{t('pages.stableReview.title')}</h1>
        <p className="stable-review-page__subtitle">
          {t('pages.stableReview.subtitleLead')} <code>{stable.id}</code> {t('pages.stableReview.subtitleTail')}{' '}
          <StatusBadge status={stable.status} />
        </p>
      </header>

      <div className="stable-review-page__grid">
        <section className="stable-review-page__card">
          <h2>{t('pages.stableReview.registrationProfile')}</h2>
          {rows.map(([label, value]) => (
            <div key={label} className="stable-review-page__row">
              <span>{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </section>
        <section className="stable-review-page__card">
          <h2>{t('common.complianceChecklist')}</h2>
          <div className="stable-review-page__row">
            <span>{t('common.facilityVerification')}</span>
            <span>{t('common.pendingApi')}</span>
          </div>
          <div className="stable-review-page__row">
            <span>{t('common.documentVault')}</span>
            <span>{t('common.notConnected')}</span>
          </div>
          <div className="stable-review-page__row">
            <span>{t('common.billingProfile')}</span>
            <span>{t('common.createdPostApproval')}</span>
          </div>
          <div className="stable-review-page__actions">
            <button
              type="button"
              className="stable-review-page__btn stable-review-page__btn--approve"
              onClick={approve}
            >
              {t('common.approveStable')}
            </button>
            <button
              type="button"
              className="stable-review-page__btn stable-review-page__btn--reject"
              onClick={reject}
            >
              {t('common.rejectStable')}
            </button>
            <button
              type="button"
              className="stable-review-page__btn stable-review-page__btn--info"
              onClick={moreInfo}
            >
              {t('common.requestMoreInfo')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
