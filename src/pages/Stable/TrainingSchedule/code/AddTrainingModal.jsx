/**
 * Modal to pick a training activity type (demo — persists when API ships).
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  trainingActivityTypeKeys,
  trainingOtherTypeKeys,
} from '../../../../features/training-schedule/trainingScheduleDummy';
import '../styles/TrainingSchedule.css';

function formatLongDate(date, lang) {
  if (!date) return '';
  const loc = lang === 'ar' ? 'ar' : 'en';
  return new Intl.DateTimeFormat(loc, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export default function AddTrainingModal({ open, onClose, date }) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !date) return null;

  const onPick = (key) => {
    toast.success(
      t('pages.trainingSchedule.toastActivityQueued', {
        label: t(`pages.trainingSchedule.types.${key}`),
      })
    );
    onClose();
  };

  const onPickOther = (key) => {
    toast(
      t('pages.trainingSchedule.toastOtherQueued', {
        label: t(`pages.trainingSchedule.other.${key}`),
      })
    );
    onClose();
  };

  return (
    <div
      className="ec-ts-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ec-ts-modal-title"
    >
      <button type="button" className="ec-ts-modal__backdrop" onClick={onClose} aria-label={t('pages.trainingSchedule.modalClose')} />
      <div className="ec-ts-modal__panel">
        <div className="ec-ts-modal__head">
          <div>
            <h2 id="ec-ts-modal-title" className="ec-ts-modal__title">
              {formatLongDate(date, i18n.language)}
            </h2>
            <p className="ec-ts-modal__lead">{t('pages.trainingSchedule.modalLead')}</p>
          </div>
          <button type="button" className="ec-ts-modal__close" onClick={onClose} aria-label={t('pages.trainingSchedule.modalClose')}>
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        <section className="ec-ts-modal__section ec-ts-modal__section--training">
          <h3 className="ec-ts-modal__section-title">{t('pages.trainingSchedule.modalSectionTraining')}</h3>
          <div className="ec-ts-modal__grid">
            {trainingActivityTypeKeys.map((key) => (
              <button
                key={key}
                type="button"
                className="ec-ts-modal__tile"
                onClick={() => onPick(key)}
              >
                <span>{t(`pages.trainingSchedule.types.${key}`)}</span>
                <ChevronRight className="ec-ts-modal__chev" size={18} aria-hidden />
              </button>
            ))}
          </div>
        </section>

        <section className="ec-ts-modal__section ec-ts-modal__section--other">
          <h3 className="ec-ts-modal__section-title">{t('pages.trainingSchedule.modalSectionOther')}</h3>
          <div className="ec-ts-modal__grid">
            {trainingOtherTypeKeys.map(({ key, dot }) => (
              <button
                key={key}
                type="button"
                className="ec-ts-modal__tile"
                onClick={() => onPickOther(key)}
              >
                {dot ? <span className="ec-ts-modal__dot" aria-hidden /> : null}
                <span>{t(`pages.trainingSchedule.other.${key}`)}</span>
                <ChevronRight className="ec-ts-modal__chev" size={18} aria-hidden />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
