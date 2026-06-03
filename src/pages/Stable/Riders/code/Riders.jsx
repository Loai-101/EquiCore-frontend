/**
 * Stable Riders — premium card grid + profile view (frontend demo, local state).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  Eye,
  Filter,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { DEFAULT_HORSE_IMAGE_URL } from '../../Horses/code/horseMediaLibrary';
import '../styles/Riders.css';

const SECTION_IDS = ['identification', 'qualification', 'requirements', 'systemMetadata'];

const DISCIPLINE_OPTIONS = [
  { value: 'Endurance', key: 'endurance' },
  { value: 'Show Jumping', key: 'showJumping' },
  { value: 'Flat Racing', key: 'flatRacing' },
  { value: 'Dressage', key: 'dressage' },
  { value: 'Mixed', key: 'mixed' },
];

const QUALIFICATION_STATUS_OPTIONS = [
  { value: 'Qualified', key: 'qualified' },
  { value: 'Pending', key: 'pending' },
  { value: 'Expired', key: 'expired' },
  { value: 'Not Qualified', key: 'notQualified' },
];

const VALUE_I18N_KEYS = {
  '20 years': 'years20',
  '24 years': 'years24',
  '22 years': 'years22',
  '28 years': 'years28',
  '5 years': 'years5',
  '6 years': 'years6',
  '8 years': 'years8',
  '12 years': 'years12',
  'Qualified for CEI1* competitions': 'notesQualifiedCei1',
  'Cleared for CEI2* — strong recovery metrics': 'notesClearedCei2',
  'Awaiting federation clearance': 'notesAwaitingFederation',
  'Senior rider — mentor for junior squad': 'notesSeniorMentor',
  'Added via demo form.': 'notesAddedViaForm',
  'New profile — pending full vet record.': 'notesAddedViaForm',
};

function useRiderI18n() {
  const { t } = useTranslation();

  const th = useCallback((key, opts) => t(`pages.riders.${key}`, opts), [t]);
  const tf = useCallback((key) => t(`pages.riders.fields.${key}`), [t]);
  const ts = useCallback((id) => t(`pages.riders.sections.${id}`), [t]);

  const translateDiscipline = useCallback(
    (value) => {
      const opt = DISCIPLINE_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.riders.enums.discipline.${opt.key}`) : value;
    },
    [t]
  );

  const translateQualStatus = useCallback(
    (value) => {
      const opt = QUALIFICATION_STATUS_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.riders.enums.qualStatus.${opt.key}`) : value;
    },
    [t]
  );

  const translateValue = useCallback(
    (value) => {
      if (value == null || value === '' || value === '—') {
        return value === '—' ? t('common.emptyCell') : value;
      }
      const key = VALUE_I18N_KEYS[value];
      if (key) return t(`pages.riders.values.${key}`, { defaultValue: value });
      return value;
    },
    [t]
  );

  return { t, th, tf, ts, translateDiscipline, translateQualStatus, translateValue };
}

const EMPTY_FORM = {
  name: '',
  feiId: '',
  discipline: 'Endurance',
  starLevel: '1★',
  age: '',
  weight: '',
  height: '',
  experience: '',
  teamName: '',
  qualificationStatus: 'Pending',
};

const DEFAULT_FILTERS = {
  query: '',
  discipline: '',
  qualificationStatus: '',
};

const DEFAULT_EXPANDED = {
  identification: true,
  qualification: false,
  requirements: false,
  systemMetadata: false,
};

const PROFILE_EXPANDED_AFTER_ADD = {
  identification: true,
  qualification: true,
  requirements: true,
  systemMetadata: true,
};

function formValue(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed || '—';
}

function buildAhmed() {
  return {
    id: 'rider_001',
    stableId: 'stable-1',
    image: '',
    identification: {
      displayId: '#1',
      feiId: 'FEI10000001',
      name: 'Ahmed Al-Mansoori',
      discipline: 'Endurance',
      starLevel: '1★',
      age: '20 years',
      weight: '60 kg',
      height: '160 cm',
      experience: '5 years',
      teamName: 'Elite Riders',
    },
    qualification: {
      status: 'Qualified',
      qualificationDate: '5/17/2026',
      expiryDate: '5/17/2027',
      feiReferenceCode: 'FEI-END-1000001',
    },
    requirements: {
      minimumCompletedRides: '3',
      minimumDistanceKm: '40 km',
      maximumAllowedSpeedKmh: '20 km/h',
      minimumRestPeriodDays: '7 days',
    },
    systemMetadata: {
      notes: 'Qualified for CEI1* competitions',
      createdAt: '5/17/2026',
      updatedAt: '5/17/2026',
    },
  };
}

function buildKhalid() {
  return {
    id: 'rider_002',
    stableId: 'stable-1',
    image: '',
    identification: {
      displayId: '#2',
      feiId: 'FEI10000042',
      name: 'Khalid Hassan',
      discipline: 'Endurance',
      starLevel: '2★',
      age: '24 years',
      weight: '65 kg',
      height: '175 cm',
      experience: '8 years',
      teamName: 'Elite Riders',
    },
    qualification: {
      status: 'Qualified',
      qualificationDate: '4/10/2026',
      expiryDate: '4/10/2027',
      feiReferenceCode: 'FEI-END-1000042',
    },
    requirements: {
      minimumCompletedRides: '6',
      minimumDistanceKm: '80 km',
      maximumAllowedSpeedKmh: '22 km/h',
      minimumRestPeriodDays: '10 days',
    },
    systemMetadata: {
      notes: 'Cleared for CEI2* — strong recovery metrics',
      createdAt: '3/1/2026',
      updatedAt: '5/10/2026',
    },
  };
}

function buildSara() {
  return {
    id: 'rider_003',
    stableId: 'stable-1',
    image: '',
    identification: {
      displayId: '#3',
      feiId: 'FEI10000088',
      name: 'Sara Al-Khalifa',
      discipline: 'Show Jumping',
      starLevel: '1★',
      age: '22 years',
      weight: '58 kg',
      height: '168 cm',
      experience: '6 years',
      teamName: 'Gulf Jump Team',
    },
    qualification: {
      status: 'Pending',
      qualificationDate: '5/1/2026',
      expiryDate: '—',
      feiReferenceCode: 'FEI-SJ-1000088',
    },
    requirements: {
      minimumCompletedRides: '2',
      minimumDistanceKm: '—',
      maximumAllowedSpeedKmh: '—',
      minimumRestPeriodDays: '5 days',
    },
    systemMetadata: {
      notes: 'Awaiting federation clearance',
      createdAt: '2/14/2026',
      updatedAt: '5/15/2026',
    },
  };
}

function buildMohammed() {
  return {
    id: 'rider_004',
    stableId: 'stable-1',
    image: '',
    identification: {
      displayId: '#4',
      feiId: 'FEI10000119',
      name: 'Mohammed Al-Salem',
      discipline: 'Endurance',
      starLevel: '3★',
      age: '28 years',
      weight: '70 kg',
      height: '178 cm',
      experience: '12 years',
      teamName: 'Desert Champions',
    },
    qualification: {
      status: 'Qualified',
      qualificationDate: '1/20/2026',
      expiryDate: '1/20/2027',
      feiReferenceCode: 'FEI-END-1000119',
    },
    requirements: {
      minimumCompletedRides: '12',
      minimumDistanceKm: '120 km',
      maximumAllowedSpeedKmh: '24 km/h',
      minimumRestPeriodDays: '14 days',
    },
    systemMetadata: {
      notes: 'Senior rider — mentor for junior squad',
      createdAt: '1/5/2025',
      updatedAt: '5/17/2026',
    },
  };
}

const INITIAL_RIDERS = [buildAhmed(), buildKhalid(), buildSara(), buildMohammed()];

function nextRiderId(riders) {
  const nums = riders
    .map((r) => r.id)
    .filter((id) => /^rider_\d+$/.test(id))
    .map((id) => Number(id.replace('rider_', ''), 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `rider_${String(max + 1).padStart(3, '0')}`;
}

function nextDisplayId(riders) {
  const nums = riders
    .map((r) => r.identification.displayId)
    .filter((id) => /^#\d+$/.test(id))
    .map((id) => Number(id.replace('#', ''), 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `#${max + 1}`;
}

function badgeTone(status) {
  const v = String(status || '').toLowerCase();
  if (v === 'qualified') return 'positive';
  if (v === 'pending') return 'warning';
  if (v === 'expired' || v === 'not qualified') return 'danger';
  return 'neutral';
}

function RiderBadge({ label, rawValue }) {
  if (!label || label === '—') {
    return <span className="rp-badge rp-badge--neutral">—</span>;
  }
  return <span className={`rp-badge rp-badge--${badgeTone(rawValue ?? label)}`}>{label}</span>;
}

function FieldGrid({ fields }) {
  return (
    <div className="rp-field-grid">
      {fields.map(({ label, value }) => (
        <div key={label} className="rp-field rp-field--card">
          <span className="rp-field__label">{label}</span>
          <span className="rp-field__value">{value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
}

function RiderAccordion({ title, expanded, onToggle, onEdit, editLabel, children }) {
  return (
    <section className={`rp-accordion ${expanded ? 'rp-accordion--open' : ''}`}>
      <button type="button" className="rp-accordion__head" onClick={onToggle} aria-expanded={expanded}>
        <span className="rp-accordion__title">{title}</span>
        <span className="rp-accordion__actions">
          <span
            role="button"
            tabIndex={0}
            className="rp-btn rp-btn--ghost rp-btn--sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }
            }}
          >
            <Pencil size={14} aria-hidden />
            {editLabel}
          </span>
          <ChevronDown size={18} className="rp-accordion__chevron" aria-hidden />
        </span>
      </button>
      {expanded ? <div className="rp-accordion__body">{children}</div> : null}
    </section>
  );
}

function buildSectionFields(rider, sectionId, i18n) {
  const { tf, translateDiscipline, translateQualStatus, translateValue } = i18n;
  const id = rider.identification;
  const qual = rider.qualification;
  const req = rider.requirements;
  const meta = rider.systemMetadata;

  switch (sectionId) {
    case 'identification':
      return [
        { label: tf('displayId'), value: id.displayId },
        { label: tf('feiId'), value: id.feiId },
        { label: tf('name'), value: id.name },
        { label: tf('discipline'), value: translateDiscipline(id.discipline) },
        { label: tf('starLevel'), value: id.starLevel },
        { label: tf('age'), value: translateValue(id.age) },
        { label: tf('weight'), value: id.weight },
        { label: tf('height'), value: id.height },
        { label: tf('experience'), value: translateValue(id.experience) },
        { label: tf('teamName'), value: id.teamName },
      ];
    case 'qualification':
      return [
        { label: tf('status'), value: translateQualStatus(qual.status) },
        { label: tf('qualificationDate'), value: qual.qualificationDate },
        { label: tf('expiryDate'), value: translateValue(qual.expiryDate) },
        { label: tf('feiReferenceCode'), value: qual.feiReferenceCode },
      ];
    case 'requirements':
      return [
        { label: tf('minimumCompletedRides'), value: req.minimumCompletedRides },
        { label: tf('minimumDistanceKm'), value: translateValue(req.minimumDistanceKm) },
        { label: tf('maximumAllowedSpeedKmh'), value: translateValue(req.maximumAllowedSpeedKmh) },
        { label: tf('minimumRestPeriodDays'), value: translateValue(req.minimumRestPeriodDays) },
      ];
    case 'systemMetadata':
      return [
        { label: tf('notes'), value: translateValue(meta.notes) },
        { label: tf('createdAt'), value: meta.createdAt },
        { label: tf('updatedAt'), value: meta.updatedAt },
      ];
    default:
      return [];
  }
}

function filterRiders(riders, filters) {
  const q = filters.query.trim().toLowerCase();
  return riders.filter((r) => {
    const name = r.identification.name.toLowerCase();
    const feiId = r.identification.feiId.toLowerCase();
    if (q && !name.includes(q) && !feiId.includes(q)) return false;
    if (filters.discipline && r.identification.discipline !== filters.discipline) return false;
    if (filters.qualificationStatus && r.qualification.status !== filters.qualificationStatus) {
      return false;
    }
    return true;
  });
}

function getRiderImage(rider, imageOverrides) {
  return imageOverrides[rider.id] || rider.image || '';
}

function createRiderFromForm(form, { id, stableId, displayId, imageUrl, today }) {
  const name = form.name.trim();
  return {
    id,
    stableId: stableId || 'stable-1',
    image: imageUrl,
    identification: {
      displayId,
      feiId: form.feiId.trim(),
      name,
      discipline: form.discipline,
      starLevel: formValue(form.starLevel),
      age: formValue(form.age),
      weight: formValue(form.weight),
      height: formValue(form.height),
      experience: formValue(form.experience),
      teamName: formValue(form.teamName),
    },
    qualification: {
      status: form.qualificationStatus,
      qualificationDate: today,
      expiryDate: '—',
      feiReferenceCode: `FEI-${form.discipline.slice(0, 3).toUpperCase()}-${form.feiId.replace(/\D/g, '').slice(-7) || 'NEW'}`,
    },
    requirements: {
      minimumCompletedRides: '0',
      minimumDistanceKm: '—',
      maximumAllowedSpeedKmh: '—',
      minimumRestPeriodDays: '—',
    },
    systemMetadata: {
      notes: 'Added via demo form.',
      createdAt: today,
      updatedAt: today,
    },
  };
}

function RiderCard({ rider, imageSrc, onView, i18n }) {
  const id = rider.identification;
  const { th, translateDiscipline, translateQualStatus } = i18n;
  const hasUpload = Boolean(imageSrc);
  const mediaSrc = imageSrc || DEFAULT_HORSE_IMAGE_URL;
  return (
    <article className="rp-card">
      <button
        type="button"
        className={`rp-card__media rp-card__media--photo${hasUpload ? '' : ' rp-card__media--default'}`}
        onClick={onView}
        aria-label={th('viewProfileA11y', { name: id.name })}
      >
        <img
          src={mediaSrc}
          alt=""
          className={`rp-card__img${hasUpload ? '' : ' rp-card__img--default'}`}
          loading="lazy"
        />
        {hasUpload ? <span className="rp-card__media-overlay" aria-hidden /> : null}
      </button>
      <div className="rp-card__body">
        <div className="rp-card__head">
          <h3 className="rp-card__name">{id.name}</h3>
          <div className="rp-card__badges">
            <RiderBadge
              label={translateQualStatus(rider.qualification.status)}
              rawValue={rider.qualification.status}
            />
          </div>
        </div>
        <dl className="rp-card__meta">
          <div>
            <dt>{th('cardFeiId')}</dt>
            <dd>{id.feiId}</dd>
          </div>
          <div>
            <dt>{th('cardDiscipline')}</dt>
            <dd>{translateDiscipline(id.discipline)}</dd>
          </div>
          <div>
            <dt>{th('cardStarLevel')}</dt>
            <dd>{id.starLevel}</dd>
          </div>
        </dl>
        <p className="rp-card__team">{id.teamName}</p>
        <button type="button" className="rp-btn rp-btn--outline rp-btn--sm rp-card__cta" onClick={onView}>
          <Eye size={14} aria-hidden />
          {th('viewProfile')}
        </button>
      </div>
    </article>
  );
}

function RiderProfile({
  rider,
  imageSrc,
  expandedSections,
  onToggleSection,
  onEditSection,
  onBack,
  onImageChange,
  i18n,
}) {
  const fileRef = useRef(null);
  const id = rider.identification;
  const { th, ts, translateDiscipline, translateQualStatus, translateValue } = i18n;
  const hasUpload = Boolean(imageSrc);
  const profileMediaSrc = imageSrc || DEFAULT_HORSE_IMAGE_URL;

  return (
    <div className="rp-profile">
      <button type="button" className="rp-btn rp-btn--ghost rp-profile__back" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden />
        {th('backToList')}
      </button>

      <header className="rp-profile__hero">
        <div className={`rp-profile__image-wrap${hasUpload ? '' : ' rp-profile__image-wrap--default'}`}>
          <img
            src={profileMediaSrc}
            alt=""
            className={`rp-profile__image${hasUpload ? '' : ' rp-profile__image--default'}`}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="rp-sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageChange(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="rp-btn rp-btn--gold rp-profile__upload"
            onClick={() => fileRef.current?.click()}
          >
            <Camera size={16} aria-hidden />
            {th('changeImage')}
          </button>
        </div>
        <div className="rp-profile__intro">
          <p className="rp-profile__eyebrow">{id.teamName}</p>
          <h2 className="rp-profile__name">{id.name}</h2>
          <div className="rp-profile__id-row">
            <span className="rp-profile__id-chip">
              <span className="rp-profile__id-chip-label">{th('profileFeiId')}</span>
              <span className="rp-profile__id-chip-value">{id.feiId}</span>
            </span>
            <span className="rp-profile__id-chip">
              <span className="rp-profile__id-chip-label">{th('profileDiscipline')}</span>
              <span className="rp-profile__id-chip-value">{translateDiscipline(id.discipline)}</span>
            </span>
          </div>
          <div className="rp-profile__badges">
            <RiderBadge
              label={translateQualStatus(rider.qualification.status)}
              rawValue={rider.qualification.status}
            />
            <RiderBadge label={id.starLevel} rawValue={id.starLevel} />
          </div>
          <div className="rp-profile__stats">
            <div className="rp-stat-pill">
              <span className="rp-stat-pill__label">{th('statAge')}</span>
              <span className="rp-stat-pill__value">{translateValue(id.age)}</span>
            </div>
            <div className="rp-stat-pill">
              <span className="rp-stat-pill__label">{th('statWeight')}</span>
              <span className="rp-stat-pill__value">{id.weight}</span>
            </div>
            <div className="rp-stat-pill">
              <span className="rp-stat-pill__label">{th('statExperience')}</span>
              <span className="rp-stat-pill__value">{translateValue(id.experience)}</span>
            </div>
            <div className="rp-stat-pill">
              <span className="rp-stat-pill__label">{th('statStarLevel')}</span>
              <span className="rp-stat-pill__value">{id.starLevel}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="rp-profile__sections">
        {SECTION_IDS.map((sectionId) => (
          <RiderAccordion
            key={sectionId}
            title={ts(sectionId)}
            expanded={!!expandedSections[sectionId]}
            onToggle={() => onToggleSection(sectionId)}
            onEdit={onEditSection}
            editLabel={th('edit')}
          >
            <FieldGrid fields={buildSectionFields(rider, sectionId, i18n)} />
          </RiderAccordion>
        ))}
      </div>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <fieldset className="rp-form-section">
      <legend className="rp-form-section__title">{title}</legend>
      <div className="rp-form-grid">{children}</div>
    </fieldset>
  );
}

function AddRiderModal({ open, form, imagePreview, onChange, onClose, onSubmit, onImagePick, i18n }) {
  const fileRef = useRef(null);
  const { th, ts, translateDiscipline, translateQualStatus } = i18n;
  if (!open) return null;

  return (
    <div className="rp-modal" role="dialog" aria-modal="true" aria-labelledby="rp-add-title">
      <button type="button" className="rp-modal__backdrop" onClick={onClose} aria-label={th('close')} />
      <div className="rp-modal__panel">
        <header className="rp-modal__head">
          <h2 id="rp-add-title" className="rp-modal__title">
            {th('modalAddTitle')}
          </h2>
          <button type="button" className="rp-btn rp-btn--icon" onClick={onClose} aria-label={th('close')}>
            <X size={20} />
          </button>
        </header>
        <form
          className="rp-modal__form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <label className="rp-field rp-field--full rp-form-image">
            <span className="rp-field__label">{th('formImage')}</span>
            <div className="rp-form-image__row">
              {imagePreview ? (
                <img src={imagePreview} alt="" className="rp-form-image__preview" />
              ) : (
                <span className="rp-form-image__icon" aria-hidden>
                  <UserRound size={36} strokeWidth={1.25} />
                </span>
              )}
              <button
                type="button"
                className="rp-btn rp-btn--outline"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={16} aria-hidden />
                {th('formUploadImage')}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="rp-sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImagePick(file);
                e.target.value = '';
              }}
            />
          </label>

          <FormSection title={ts('identification')}>
            <label className="rp-field">
              <span className="rp-field__label">{th('formName')} *</span>
              <input
                className="rp-input"
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                required
              />
            </label>
            <label className="rp-field">
              <span className="rp-field__label">{th('formFeiId')} *</span>
              <input
                className="rp-input"
                value={form.feiId}
                onChange={(e) => onChange('feiId', e.target.value)}
                required
              />
            </label>
            <label className="rp-field">
              <span className="rp-field__label">{th('formDiscipline')}</span>
              <select
                className="rp-input"
                value={form.discipline}
                onChange={(e) => onChange('discipline', e.target.value)}
              >
                {DISCIPLINE_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {translateDiscipline(d.value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="rp-field">
              <span className="rp-field__label">{th('formStarLevel')}</span>
              <input
                className="rp-input"
                value={form.starLevel}
                onChange={(e) => onChange('starLevel', e.target.value)}
                placeholder="1★"
              />
            </label>
            <label className="rp-field">
              <span className="rp-field__label">{th('formAge')}</span>
              <input
                className="rp-input"
                value={form.age}
                onChange={(e) => onChange('age', e.target.value)}
                placeholder="20 years"
              />
            </label>
            <label className="rp-field">
              <span className="rp-field__label">{th('formWeight')}</span>
              <input
                className="rp-input"
                value={form.weight}
                onChange={(e) => onChange('weight', e.target.value)}
                placeholder="60 kg"
              />
            </label>
            <label className="rp-field">
              <span className="rp-field__label">{th('formHeight')}</span>
              <input
                className="rp-input"
                value={form.height}
                onChange={(e) => onChange('height', e.target.value)}
                placeholder="160 cm"
              />
            </label>
            <label className="rp-field">
              <span className="rp-field__label">{th('formExperience')}</span>
              <input
                className="rp-input"
                value={form.experience}
                onChange={(e) => onChange('experience', e.target.value)}
                placeholder="5 years"
              />
            </label>
            <label className="rp-field">
              <span className="rp-field__label">{th('formTeam')}</span>
              <input
                className="rp-input"
                value={form.teamName}
                onChange={(e) => onChange('teamName', e.target.value)}
              />
            </label>
          </FormSection>

          <FormSection title={ts('qualification')}>
            <label className="rp-field">
              <span className="rp-field__label">{th('formQualificationStatus')}</span>
              <select
                className="rp-input"
                value={form.qualificationStatus}
                onChange={(e) => onChange('qualificationStatus', e.target.value)}
              >
                {QUALIFICATION_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {translateQualStatus(s.value)}
                  </option>
                ))}
              </select>
            </label>
          </FormSection>

          <footer className="rp-modal__foot">
            <button type="button" className="rp-btn rp-btn--ghost" onClick={onClose}>
              {th('cancel')}
            </button>
            <button type="submit" className="rp-btn rp-btn--gold">
              <Plus size={16} aria-hidden />
              {th('addRider')}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default function Riders() {
  const i18n = useRiderI18n();
  const { th, translateDiscipline, translateQualStatus } = i18n;
  const { stableId } = useAuth();
  const [riders, setRiders] = useState([]);
  const [imageOverrides, setImageOverrides] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addImagePreview, setAddImagePreview] = useState(null);
  const [expandedSections, setExpandedSections] = useState(DEFAULT_EXPANDED);
  const objectUrlsRef = useRef([]);

  useEffect(() => {
    setRiders(INITIAL_RIDERS.filter((r) => r.stableId === (stableId || 'stable-1')));
    setSelectedId(null);
    setImageOverrides({});
    setFilters(DEFAULT_FILTERS);
  }, [stableId]);

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  const registerObjectUrl = useCallback((url) => {
    objectUrlsRef.current.push(url);
    return url;
  }, []);

  const filtered = useMemo(() => filterRiders(riders, filters), [riders, filters]);
  const selectedRider = useMemo(
    () => riders.find((r) => r.id === selectedId) ?? null,
    [riders, selectedId]
  );

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => String(v).trim() !== ''),
    [filters]
  );

  const handleEditPlaceholder = useCallback(() => {
    toast(th('toast.editPlaceholder'));
  }, [th]);

  const handleToggleSection = useCallback((sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  const handleProfileImage = useCallback(
    (riderId, file) => {
      const url = registerObjectUrl(URL.createObjectURL(file));
      setImageOverrides((prev) => ({ ...prev, [riderId]: url }));
      toast.success(th('toast.imageUpdated'));
    },
    [registerObjectUrl, th]
  );

  const handleAddImagePick = useCallback(
    (file) => {
      if (addImagePreview) URL.revokeObjectURL(addImagePreview);
      const url = registerObjectUrl(URL.createObjectURL(file));
      setAddImagePreview(url);
    },
    [addImagePreview, registerObjectUrl]
  );

  const handleAddSubmit = useCallback(() => {
    const id = nextRiderId(riders);
    const today = new Date().toLocaleDateString();
    const name = addForm.name.trim();
    const imageUrl = addImagePreview || '';
    const newRider = createRiderFromForm(addForm, {
      id,
      stableId: stableId || 'stable-1',
      displayId: nextDisplayId(riders),
      imageUrl,
      today,
    });

    setRiders((prev) => [...prev, newRider]);
    if (addImagePreview) {
      setImageOverrides((prev) => ({ ...prev, [id]: addImagePreview }));
      setAddImagePreview(null);
    }
    setAddForm(EMPTY_FORM);
    setAddOpen(false);
    setExpandedSections(PROFILE_EXPANDED_AFTER_ADD);
    setSelectedId(id);
    toast.success(th('toast.riderAdded', { name }));
  }, [addForm, addImagePreview, riders, stableId, th]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (selectedRider) {
    return (
      <div className="rp-page">
        <RiderProfile
          rider={selectedRider}
          imageSrc={getRiderImage(selectedRider, imageOverrides)}
          expandedSections={expandedSections}
          onToggleSection={handleToggleSection}
          onEditSection={handleEditPlaceholder}
          onBack={() => setSelectedId(null)}
          onImageChange={(file) => handleProfileImage(selectedRider.id, file)}
          i18n={i18n}
        />
      </div>
    );
  }

  return (
    <div className="rp-page">
      <header className="rp-page__header">
        <div>
          <h1 className="rp-page__title">{th('title')}</h1>
          <p className="rp-page__subtitle">{th('subtitle')}</p>
        </div>
        <button type="button" className="rp-btn rp-btn--gold" onClick={() => setAddOpen(true)}>
          <Plus size={18} aria-hidden />
          {th('addRider')}
        </button>
      </header>

      <section className="rp-filters" aria-label={th('filtersA11y')}>
        <div className="rp-filters__head">
          <Filter size={18} aria-hidden />
          <span>{th('filtersTitle')}</span>
          {hasActiveFilters ? (
            <button
              type="button"
              className="rp-btn rp-btn--ghost rp-btn--sm"
              onClick={() => setFilters(DEFAULT_FILTERS)}
            >
              <RotateCcw size={14} aria-hidden />
              {th('resetFilters')}
            </button>
          ) : null}
        </div>
        <div className="rp-filters__grid">
          <label className="rp-filter rp-filter--search">
            <Search size={16} aria-hidden />
            <input
              type="search"
              placeholder={th('searchName')}
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
            />
          </label>
          <label className="rp-filter">
            <span className="rp-filter__label">{th('filterDiscipline')}</span>
            <select
              value={filters.discipline}
              onChange={(e) => updateFilter('discipline', e.target.value)}
            >
              <option value="">{th('allDisciplines')}</option>
              {DISCIPLINE_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {translateDiscipline(d.value)}
                </option>
              ))}
            </select>
          </label>
          <label className="rp-filter">
            <span className="rp-filter__label">{th('filterQualification')}</span>
            <select
              value={filters.qualificationStatus}
              onChange={(e) => updateFilter('qualificationStatus', e.target.value)}
            >
              <option value="">{th('allStatuses')}</option>
              {QUALIFICATION_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {translateQualStatus(s.value)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rp-empty">
          <UserRound size={40} strokeWidth={1.25} aria-hidden />
          <p>{hasActiveFilters ? th('emptyFiltered') : th('empty')}</p>
          {hasActiveFilters ? (
            <button type="button" className="rp-btn rp-btn--outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
              {th('resetFilters')}
            </button>
          ) : (
            <button type="button" className="rp-btn rp-btn--gold" onClick={() => setAddOpen(true)}>
              <Plus size={16} aria-hidden />
              {th('addFirstRider')}
            </button>
          )}
        </div>
      ) : (
        <div className="rp-grid">
          {filtered.map((rider) => (
            <RiderCard
              key={rider.id}
              rider={rider}
              imageSrc={getRiderImage(rider, imageOverrides)}
              i18n={i18n}
              onView={() => {
                setExpandedSections(DEFAULT_EXPANDED);
                setSelectedId(rider.id);
              }}
            />
          ))}
        </div>
      )}

      <AddRiderModal
        open={addOpen}
        form={addForm}
        imagePreview={addImagePreview}
        i18n={i18n}
        onChange={(key, value) => setAddForm((prev) => ({ ...prev, [key]: value }))}
        onClose={() => {
          setAddOpen(false);
          setAddForm(EMPTY_FORM);
          if (addImagePreview) {
            URL.revokeObjectURL(addImagePreview);
            setAddImagePreview(null);
          }
        }}
        onSubmit={handleAddSubmit}
        onImagePick={handleAddImagePick}
      />
    </div>
  );
}
