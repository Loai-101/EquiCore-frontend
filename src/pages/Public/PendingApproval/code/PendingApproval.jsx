/**
 * Explains approval gating for new stable registrations.
 */
import { useTranslation } from 'react-i18next';
import { Hourglass } from 'lucide-react';
import '../styles/PendingApproval.css';

export default function PendingApproval() {
  const { t } = useTranslation();

  return (
    <div className="pending-approval-page">
      <div className="pending-approval-page__icon" aria-hidden>
        <Hourglass size={30} />
      </div>
      <h1>{t('pages.pending.title')}</h1>
      <p>
        {t('pages.pending.leadBefore')}{' '}
        <strong>{t('pages.pending.leadStrong')}</strong>
        {t('pages.pending.leadAfter')}
      </p>
      <div className="pending-approval-page__panel">
        <h2>{t('pages.pending.panelTitle')}</h2>
        <ul>
          <li>{t('pages.pending.li1')}</li>
          <li>{t('pages.pending.li2')}</li>
          <li>{t('pages.pending.li3')}</li>
        </ul>
      </div>
    </div>
  );
}
