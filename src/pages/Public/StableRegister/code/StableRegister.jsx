/**
 * Captures stable profile; pushes Pending row into demo data context.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useData } from '../../../../context/DataContext';
import { ROUTES, STABLE_TYPES } from '../../../../utils/constants';
import '../styles/StableRegister.css';

const initialForm = {
  stableName: '',
  ownerName: '',
  email: '',
  phone: '',
  country: '',
  city: '',
  stableType: 'Endurance',
  horseCount: '',
  riderCount: '',
  commercialReg: '',
  notes: '',
};

function stableTypeKey(type) {
  return `enums.stableType.${String(type).replace(/\s/g, '')}`;
}

export default function StableRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addStableRegistration } = useData();
  const [form, setForm] = useState(initialForm);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    addStableRegistration(form);
    toast.success(t('toast.registrationSubmitted'));
    navigate(ROUTES.pendingApproval);
  };

  return (
    <div className="stable-register-page">
      <header className="stable-register-page__header">
        <h1>{t('pages.register.title')}</h1>
        <p>
          {t('pages.register.leadBefore')}{' '}
          <strong>{t('pages.register.leadStrong')}</strong>{' '}
          {t('pages.register.leadAfter')}
        </p>
      </header>

      <form className="stable-register-page__form" onSubmit={onSubmit}>
        <div className="stable-register-page__grid">
          <label className="stable-register-page__field">
            <span className="stable-register-page__label">{t('pages.register.stableName')}</span>
            <input
              className="stable-register-page__input"
              name="stableName"
              value={form.stableName}
              onChange={onChange}
              required
            />
          </label>
          <label className="stable-register-page__field">
            <span className="stable-register-page__label">{t('pages.register.ownerName')}</span>
            <input
              className="stable-register-page__input"
              name="ownerName"
              value={form.ownerName}
              onChange={onChange}
              required
            />
          </label>
          <label className="stable-register-page__field">
            <span className="stable-register-page__label">{t('pages.register.email')}</span>
            <input
              className="stable-register-page__input"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>
          <label className="stable-register-page__field">
            <span className="stable-register-page__label">{t('pages.register.phone')}</span>
            <input
              className="stable-register-page__input"
              name="phone"
              value={form.phone}
              onChange={onChange}
              required
            />
          </label>
          <label className="stable-register-page__field">
            <span className="stable-register-page__label">{t('pages.register.country')}</span>
            <input
              className="stable-register-page__input"
              name="country"
              value={form.country}
              onChange={onChange}
              required
            />
          </label>
          <label className="stable-register-page__field">
            <span className="stable-register-page__label">{t('pages.register.city')}</span>
            <input
              className="stable-register-page__input"
              name="city"
              value={form.city}
              onChange={onChange}
              required
            />
          </label>
          <label className="stable-register-page__field">
            <span className="stable-register-page__label">{t('pages.register.stableType')}</span>
            <select
              className="stable-register-page__select"
              name="stableType"
              value={form.stableType}
              onChange={onChange}
            >
              {STABLE_TYPES.map((typeValue) => (
                <option key={typeValue} value={typeValue}>
                  {t(stableTypeKey(typeValue))}
                </option>
              ))}
            </select>
          </label>
          <label className="stable-register-page__field">
            <span className="stable-register-page__label">{t('pages.register.horseCount')}</span>
            <input
              className="stable-register-page__input"
              type="number"
              min="0"
              name="horseCount"
              value={form.horseCount}
              onChange={onChange}
              required
            />
          </label>
          <label className="stable-register-page__field">
            <span className="stable-register-page__label">{t('pages.register.riderCount')}</span>
            <input
              className="stable-register-page__input"
              type="number"
              min="0"
              name="riderCount"
              value={form.riderCount}
              onChange={onChange}
              required
            />
          </label>
          <label className="stable-register-page__field">
            <span className="stable-register-page__label">{t('pages.register.commercialReg')}</span>
            <input
              className="stable-register-page__input"
              name="commercialReg"
              value={form.commercialReg}
              onChange={onChange}
            />
          </label>
          <label className="stable-register-page__field stable-register-page__field--full">
            <span className="stable-register-page__label">{t('pages.register.documentLabel')}</span>
            <input className="stable-register-page__input" type="file" disabled />
            <p className="stable-register-page__hint">{t('pages.register.documentHint')}</p>
          </label>
          <label className="stable-register-page__field stable-register-page__field--full">
            <span className="stable-register-page__label">{t('pages.register.notes')}</span>
            <textarea
              className="stable-register-page__textarea"
              name="notes"
              value={form.notes}
              onChange={onChange}
            />
          </label>
        </div>
        <div className="stable-register-page__actions">
          <button type="submit" className="stable-register-page__submit">
            {t('common.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
