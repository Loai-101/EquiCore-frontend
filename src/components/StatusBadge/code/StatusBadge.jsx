import { useTranslation } from 'react-i18next';
import '../styles/StatusBadge.css';

const VARIANTS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  active: 'active',
  inactive: 'inactive',
  suspended: 'suspended',
  competing: 'competing',
  rest: 'rest',
  training: 'training',
  neutral: 'neutral',
};

/**
 * Small pill for workflow states (stable registration, subscriptions, etc.).
 */
export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const key = String(status || '').toLowerCase();
  const variant = VARIANTS[key] ? key : 'neutral';
  const label =
    variant === 'neutral'
      ? status || t('enums.unknown')
      : t(`enums.${variant}`, { defaultValue: status || t('enums.unknown') });

  return (
    <span className={`ec-status-badge ec-status-badge--${variant}`}>{label}</span>
  );
}
