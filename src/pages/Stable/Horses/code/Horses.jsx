/**
 * Stable Horses — premium card grid + full profile view (frontend demo, local state).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Filter,
  Award,
  Footprints,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { HorseMediaLibrary } from './HorseMediaGallery';
import {
  buildInitialMediaByHorse,
  DEFAULT_HORSE_IMAGE_URL,
  emptyMediaForHorse,
  getHorseMedia,
  isVideoFile,
  MEDIA_CATEGORIES,
  nextMediaId,
} from './horseMediaLibrary';
import '../styles/Horses.css';

const SECTION_IDS = [
  'identification',
  'ownership',
  'veterinary',
  'competition',
  'performance',
  'feedingTraining',
  'documents',
  'mediaLibrary',
  'systemMetadata',
];

const DOCUMENT_KEYS = [
  'feiPassportFile',
  'ownershipCertificate',
  'vetClearanceCertificate',
  'competitionResults',
];

const DISCIPLINE_OPTIONS = [
  { value: 'Endurance', key: 'endurance' },
  { value: 'Show Jumping', key: 'showJumping' },
  { value: 'Flat Racing', key: 'flatRacing' },
  { value: 'Dressage', key: 'dressage' },
  { value: 'Mixed', key: 'mixed' },
];

const GENDER_OPTIONS = [
  { value: 'Stallion', key: 'stallion' },
  { value: 'Mare', key: 'mare' },
  { value: 'Gelding', key: 'gelding' },
];

const VET_STATUS_OPTIONS = [
  { value: 'Fit', key: 'fit' },
  { value: 'Under Observation', key: 'underObservation' },
  { value: 'Restricted', key: 'restricted' },
  { value: 'Not Cleared', key: 'notCleared' },
];

const REG_STATUS_OPTIONS = [
  { value: 'Active', key: 'active' },
  { value: 'Pending', key: 'pending' },
  { value: 'Expired', key: 'expired' },
  { value: 'Suspended', key: 'suspended' },
];

const VALUE_I18N_KEYS = {
  Fit: 'fit',
  Active: 'active',
  Clear: 'clear',
  Valid: 'valid',
  Excellent: 'excellent',
  Good: 'good',
  Normal: 'normal',
  Optimal: 'optimal',
  Yes: 'yes',
  No: 'no',
  'Under Observation': 'underObservation',
  Restricted: 'restricted',
  Pending: 'pending',
  'Under review': 'underReview',
  'Low battery': 'lowBattery',
  Inactive: 'inactive',
  'Elevated at exercise': 'elevatedAtExercise',
  '3 years': 'years3',
  '5 years': 'years5',
  '7 years': 'years7',
  '4 years': 'years4',
};

function useHorseI18n() {
  const { t } = useTranslation();

  const th = useCallback((key, opts) => t(`pages.horses.${key}`, opts), [t]);
  const tf = useCallback((key) => t(`pages.horses.fields.${key}`), [t]);
  const td = useCallback((key) => t(`pages.horses.documents.${key}`), [t]);
  const ts = useCallback((id) => t(`pages.horses.sections.${id}`), [t]);

  const translateDiscipline = useCallback(
    (value) => {
      const opt = DISCIPLINE_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.horses.enums.discipline.${opt.key}`) : value;
    },
    [t]
  );

  const translateGender = useCallback(
    (value) => {
      const opt = GENDER_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.horses.enums.gender.${opt.key}`) : value;
    },
    [t]
  );

  const translateVetStatus = useCallback(
    (value) => {
      const opt = VET_STATUS_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.horses.enums.vetStatus.${opt.key}`) : VALUE_I18N_KEYS[value] ? t(`pages.horses.values.${VALUE_I18N_KEYS[value]}`) : value;
    },
    [t]
  );

  const translateRegStatus = useCallback(
    (value) => {
      const opt = REG_STATUS_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.horses.enums.regStatus.${opt.key}`) : VALUE_I18N_KEYS[value] ? t(`pages.horses.values.${VALUE_I18N_KEYS[value]}`) : value;
    },
    [t]
  );

  const translateValue = useCallback(
    (value) => {
      if (value == null || value === '' || value === '—') {
        return value === '—' ? t('common.emptyCell') : value;
      }
      const key = VALUE_I18N_KEYS[value];
      if (key) return t(`pages.horses.values.${key}`, { defaultValue: value });
      return value;
    },
    [t]
  );

  const resolveAge = useCallback(
    (horse) => resolveHorseAge(horse, t, translateValue),
    [t, translateValue]
  );

  return {
    t,
    th,
    tf,
    td,
    ts,
    translateDiscipline,
    translateGender,
    translateVetStatus,
    translateRegStatus,
    translateValue,
    resolveAge,
  };
}

const EMPTY_FORM = {
  horseName: '',
  feiHorseId: '',
  feiPassportNumber: '',
  uelnNumber: '',
  dateOfBirth: '',
  gender: 'Stallion',
  breed: '',
  color: '',
  countryOfBirth: '',
  ownerName: '',
  ownerFeiId: '',
  nationalFederation: '',
  registrationStatus: 'Active',
  registrationValidFrom: '',
  registrationValidTo: '',
  discipline: 'Endurance',
  stableName: '',
  veterinaryStatus: 'Fit',
  lastVetInspectionDate: '',
  medicalNotes: '',
  ceiStarLevel: '',
  trainerName: '',
  notes: '',
};

const PROFILE_EXPANDED_AFTER_ADD = {
  identification: true,
  ownership: true,
  veterinary: true,
  competition: true,
  performance: false,
  feedingTraining: true,
  documents: false,
  systemMetadata: true,
};

function formValue(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed || '—';
}

function formatAgeFromDob(dateOfBirth, t) {
  if (!dateOfBirth) return '—';
  const dob = new Date(`${dateOfBirth}T12:00:00`);
  if (Number.isNaN(dob.getTime())) return '—';
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    years -= 1;
  }
  if (years < 0) return '—';
  return t('pages.horses.ageYears', { count: years });
}

function resolveHorseAge(horse, t, translateValue) {
  const fromDob = formatAgeFromDob(horse.identification.dateOfBirth, t);
  if (fromDob !== '—') return fromDob;
  const stored = horse.identification.age;
  if (stored && stored !== '—') return translateValue(stored);
  return t('common.emptyCell');
}

function createHorseFromAddForm(form, { id, stableId, imageUrl, today, t }) {
  const stableName = formValue(form.stableName);
  const ownerName = formValue(form.ownerName);

  return {
    id,
    stableId: stableId || 'stable-1',
    image: imageUrl,
    stableName: stableName === '—' ? 'A1 Stable' : stableName,
    discipline: form.discipline,
    veterinaryStatus: form.veterinaryStatus,
    registrationStatus: form.registrationStatus,
    identification: {
      feiHorseId: form.feiHorseId.trim(),
      feiPassportNumber: form.feiPassportNumber.trim(),
      horseName: form.horseName.trim(),
      uelnNumber: formValue(form.uelnNumber),
      dateOfBirth: form.dateOfBirth || today,
      age: formatAgeFromDob(form.dateOfBirth, t),
      gender: form.gender,
      breed: formValue(form.breed),
      color: formValue(form.color),
      countryOfBirth: formValue(form.countryOfBirth),
    },
    ownership: {
      ownerName,
      ownerFeiId: formValue(form.ownerFeiId),
      nationalFederation: formValue(form.nationalFederation),
      registrationStatus: form.registrationStatus,
      registrationValidFrom: formValue(form.registrationValidFrom),
      registrationValidTo: formValue(form.registrationValidTo),
    },
    veterinary: {
      lastVetInspectionDate: form.lastVetInspectionDate || today,
      veterinaryStatus: form.veterinaryStatus,
      heartHealthStatus: 'Normal',
      lamenessStatus: 'Clear',
      medicationControlStatus: 'Clear',
      antiDopingStatus: 'Clear',
      influenzaVaccination: 'Valid',
      medicalNotes: formValue(form.medicalNotes) === '—' ? 'New profile — pending full vet record.' : form.medicalNotes.trim(),
    },
    competition: {
      discipline: form.discipline,
      ceiStarLevel: formValue(form.ceiStarLevel),
      maxDistanceCompletedKm: '—',
      totalFeiRides: '0',
      successfulCompletions: '0',
      eliminations: '0',
      lastCompetitionDate: '—',
      requiredRestPeriodDays: '—',
    },
    performance: {
      averageHeartRateBpm: '—',
      maxHeartRateBpm: '—',
      recoveryTime5MinBpm: '—',
      recoveryTime10MinBpm: '—',
      averageSpeedKmh: '—',
      maxSpeedKmh: '—',
      enduranceIndex: '—',
    },
    feedingTraining: {
      feedType: '—',
      lastFeedChangeDate: '—',
      trainingLevel: '—',
      trainingLoadStatus: '—',
      trainerName: formValue(form.trainerName),
      stableName: stableName === '—' ? 'A1 Stable' : stableName,
    },
    documents: {
      feiPassportFile: 'pending_passport.pdf',
      ownershipCertificate: 'pending_ownership.pdf',
      vetClearanceCertificate: 'pending_vet.pdf',
      competitionResults: '—',
    },
    systemMetadata: {
      profileVerified: 'No',
      verifiedBy: '—',
      createdAt: today,
      updatedAt: today,
      notes: formValue(form.notes) === '—' ? 'Added via demo form.' : form.notes.trim(),
    },
  };
}

function buildThunder() {
  return {
    id: 'horse_001',
    stableId: 'stable-1',
    image: '',
    stableName: 'A1 Stable',
    discipline: 'Endurance',
    veterinaryStatus: 'Fit',
    registrationStatus: 'Active',
    identification: {
      feiHorseId: '10000001',
      feiPassportNumber: '0AA0',
      horseName: 'Thunder',
      uelnNumber: '05600000000001',
      dateOfBirth: '2023-01-01',
      age: '3 years',
      gender: 'Stallion',
      breed: 'Arabian',
      color: 'Grey',
      countryOfBirth: 'Bahrain',
    },
    ownership: {
      ownerName: 'Victorious Team',
      ownerFeiId: '10270512',
      nationalFederation: 'Bahrain (BRN)',
      registrationStatus: 'Active',
      registrationValidFrom: '2023-12-31',
      registrationValidTo: '2025-12-30',
    },
    veterinary: {
      lastVetInspectionDate: '2026-05-17',
      veterinaryStatus: 'Fit',
      heartHealthStatus: 'Normal',
      lamenessStatus: 'Clear',
      medicationControlStatus: 'Clear',
      antiDopingStatus: 'Clear',
      influenzaVaccination: 'Valid',
      medicalNotes: 'No issues',
    },
    competition: {
      discipline: 'Endurance',
      ceiStarLevel: '2★',
      maxDistanceCompletedKm: '50 km',
      totalFeiRides: '1',
      successfulCompletions: '0',
      eliminations: '1 (Metabolic)',
      lastCompetitionDate: '2026-05-17',
      requiredRestPeriodDays: '7 days',
    },
    performance: {
      averageHeartRateBpm: '110 bpm',
      maxHeartRateBpm: '160 bpm',
      recoveryTime5MinBpm: '50 bpm',
      recoveryTime10MinBpm: '45 bpm',
      averageSpeedKmh: '11.0 km/h',
      maxSpeedKmh: '20.0 km/h',
      enduranceIndex: 'Excellent',
    },
    feedingTraining: {
      feedType: 'Premium Hay',
      lastFeedChangeDate: '2026-05-17',
      trainingLevel: 'Beginner',
      trainingLoadStatus: 'Optimal',
      trainerName: 'Ali Hussein Salman',
      stableName: 'A1 Stable',
    },
    documents: {
      feiPassportFile: 'passport.pdf',
      ownershipCertificate: 'ownership.pdf',
      vetClearanceCertificate: 'vet_clearance.pdf',
      competitionResults: 'cei2_results.pdf',
    },
    systemMetadata: {
      profileVerified: 'Yes',
      verifiedBy: 'Admin',
      createdAt: '2026-05-17',
      updatedAt: '2026-05-17',
      notes: 'Ready for CEI3*',
    },
  };
}

function buildDesertPearl() {
  return {
    id: 'horse_002',
    stableId: 'stable-1',
    image: '',
    stableName: 'A1 Stable',
    discipline: 'Endurance',
    veterinaryStatus: 'Fit',
    registrationStatus: 'Active',
    identification: {
      feiHorseId: '10000042',
      feiPassportNumber: '1BB2',
      horseName: 'Desert Pearl',
      uelnNumber: '05600000000042',
      dateOfBirth: '2021-06-14',
      age: '5 years',
      gender: 'Mare',
      breed: 'Arabian',
      color: 'Chestnut',
      countryOfBirth: 'UAE',
    },
    ownership: {
      ownerName: 'Al Noor Endurance',
      ownerFeiId: '10288104',
      nationalFederation: 'UAE (UAE)',
      registrationStatus: 'Active',
      registrationValidFrom: '2024-01-15',
      registrationValidTo: '2026-01-14',
    },
    veterinary: {
      lastVetInspectionDate: '2026-05-10',
      veterinaryStatus: 'Fit',
      heartHealthStatus: 'Normal',
      lamenessStatus: 'Clear',
      medicationControlStatus: 'Clear',
      antiDopingStatus: 'Clear',
      influenzaVaccination: 'Valid',
      medicalNotes: 'Mild seasonal allergy — monitored',
    },
    competition: {
      discipline: 'Endurance',
      ceiStarLevel: '3★',
      maxDistanceCompletedKm: '120 km',
      totalFeiRides: '8',
      successfulCompletions: '7',
      eliminations: '1 (Lameness)',
      lastCompetitionDate: '2026-04-22',
      requiredRestPeriodDays: '14 days',
    },
    performance: {
      averageHeartRateBpm: '102 bpm',
      maxHeartRateBpm: '168 bpm',
      recoveryTime5MinBpm: '48 bpm',
      recoveryTime10MinBpm: '42 bpm',
      averageSpeedKmh: '14.2 km/h',
      maxSpeedKmh: '24.5 km/h',
      enduranceIndex: 'Excellent',
    },
    feedingTraining: {
      feedType: 'Competition Mix + Hay',
      lastFeedChangeDate: '2026-04-01',
      trainingLevel: 'Advanced',
      trainingLoadStatus: 'Optimal',
      trainerName: 'Sara Al Mansoori',
      stableName: 'A1 Stable',
    },
    documents: {
      feiPassportFile: 'desert_pearl_passport.pdf',
      ownershipCertificate: 'desert_pearl_ownership.pdf',
      vetClearanceCertificate: 'desert_pearl_vet.pdf',
      competitionResults: 'cei3_results.pdf',
    },
    systemMetadata: {
      profileVerified: 'Yes',
      verifiedBy: 'Stable Admin',
      createdAt: '2025-11-02',
      updatedAt: '2026-05-10',
      notes: 'Primary CEI3 campaign horse',
    },
  };
}

function buildRoyalFlame() {
  return {
    id: 'horse_003',
    stableId: 'stable-1',
    image: '',
    stableName: 'Victorious Team Barn',
    discipline: 'Show Jumping',
    veterinaryStatus: 'Under Observation',
    registrationStatus: 'Active',
    identification: {
      feiHorseId: '10000218',
      feiPassportNumber: '2CC4',
      horseName: 'Royal Flame',
      uelnNumber: '05600000000218',
      dateOfBirth: '2019-03-20',
      age: '7 years',
      gender: 'Gelding',
      breed: 'Warmblood',
      color: 'Bay',
      countryOfBirth: 'Germany',
    },
    ownership: {
      ownerName: 'Victorious Team',
      ownerFeiId: '10270512',
      nationalFederation: 'Bahrain (BRN)',
      registrationStatus: 'Active',
      registrationValidFrom: '2023-08-01',
      registrationValidTo: '2025-07-31',
    },
    veterinary: {
      lastVetInspectionDate: '2026-05-14',
      veterinaryStatus: 'Under Observation',
      heartHealthStatus: 'Normal',
      lamenessStatus: 'Mild — left fore',
      medicationControlStatus: 'Clear',
      antiDopingStatus: 'Clear',
      influenzaVaccination: 'Valid',
      medicalNotes: 'Light tendon strain — rehab protocol',
    },
    competition: {
      discipline: 'Show Jumping',
      ceiStarLevel: '—',
      maxDistanceCompletedKm: '—',
      totalFeiRides: '12',
      successfulCompletions: '10',
      eliminations: '2 (Time faults)',
      lastCompetitionDate: '2026-05-05',
      requiredRestPeriodDays: '10 days',
    },
    performance: {
      averageHeartRateBpm: '95 bpm',
      maxHeartRateBpm: '145 bpm',
      recoveryTime5MinBpm: '55 bpm',
      recoveryTime10MinBpm: '50 bpm',
      averageSpeedKmh: '—',
      maxSpeedKmh: '—',
      enduranceIndex: 'Good',
    },
    feedingTraining: {
      feedType: 'Sport Pellets + Timothy Hay',
      lastFeedChangeDate: '2026-05-01',
      trainingLevel: 'Intermediate',
      trainingLoadStatus: 'Reduced',
      trainerName: 'James Whitfield',
      stableName: 'Victorious Team Barn',
    },
    documents: {
      feiPassportFile: 'royal_flame_passport.pdf',
      ownershipCertificate: 'royal_flame_ownership.pdf',
      vetClearanceCertificate: 'royal_flame_vet.pdf',
      competitionResults: 'sj_national_2026.pdf',
    },
    systemMetadata: {
      profileVerified: 'Yes',
      verifiedBy: 'Veterinarian',
      createdAt: '2024-02-18',
      updatedAt: '2026-05-14',
      notes: 'Jumping squad — limited workload',
    },
  };
}

function buildSilverArrow() {
  return {
    id: 'horse_004',
    stableId: 'stable-1',
    image: '',
    stableName: 'A1 Stable',
    discipline: 'Flat Racing',
    veterinaryStatus: 'Restricted',
    registrationStatus: 'Pending',
    identification: {
      feiHorseId: '10000305',
      feiPassportNumber: '3DD7',
      horseName: 'Silver Arrow',
      uelnNumber: '05600000000305',
      dateOfBirth: '2022-09-08',
      age: '4 years',
      gender: 'Stallion',
      breed: 'Thoroughbred',
      color: 'Grey',
      countryOfBirth: 'UK',
    },
    ownership: {
      ownerName: 'Silver Crest Racing',
      ownerFeiId: '10310288',
      nationalFederation: 'Great Britain (GBR)',
      registrationStatus: 'Pending',
      registrationValidFrom: '—',
      registrationValidTo: '—',
    },
    veterinary: {
      lastVetInspectionDate: '2026-05-12',
      veterinaryStatus: 'Restricted',
      heartHealthStatus: 'Elevated at exercise',
      lamenessStatus: 'Clear',
      medicationControlStatus: 'Under review',
      antiDopingStatus: 'Clear',
      influenzaVaccination: 'Valid',
      medicalNotes: 'Cardiac screening follow-up scheduled',
    },
    competition: {
      discipline: 'Flat Racing',
      ceiStarLevel: '—',
      maxDistanceCompletedKm: '16 km',
      totalFeiRides: '4',
      successfulCompletions: '3',
      eliminations: '1 (Vet out)',
      lastCompetitionDate: '2026-04-18',
      requiredRestPeriodDays: '21 days',
    },
    performance: {
      averageHeartRateBpm: '118 bpm',
      maxHeartRateBpm: '195 bpm',
      recoveryTime5MinBpm: '62 bpm',
      recoveryTime10MinBpm: '58 bpm',
      averageSpeedKmh: '48.0 km/h',
      maxSpeedKmh: '62.0 km/h',
      enduranceIndex: 'Good',
    },
    feedingTraining: {
      feedType: 'Race Ration A',
      lastFeedChangeDate: '2026-04-20',
      trainingLevel: 'Professional',
      trainingLoadStatus: 'Restricted',
      trainerName: 'Omar Khalid',
      stableName: 'A1 Stable',
    },
    documents: {
      feiPassportFile: 'silver_arrow_passport.pdf',
      ownershipCertificate: 'silver_arrow_ownership.pdf',
      vetClearanceCertificate: 'pending_vet_clearance.pdf',
      competitionResults: 'flat_race_2026_q1.pdf',
    },
    systemMetadata: {
      profileVerified: 'No',
      verifiedBy: '—',
      createdAt: '2026-01-20',
      updatedAt: '2026-05-12',
      notes: 'Awaiting federation registration confirmation',
    },
  };
}

const INITIAL_HORSES = [buildThunder(), buildDesertPearl(), buildRoyalFlame(), buildSilverArrow()];

function nextHorseId(horses) {
  const nums = horses
    .map((h) => h.id)
    .filter((id) => /^horse_\d+$/.test(id))
    .map((id) => Number(id.replace('horse_', ''), 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `horse_${String(max + 1).padStart(3, '0')}`;
}

function badgeTone(value) {
  const v = String(value || '').toLowerCase();
  if (['fit', 'active', 'clear', 'valid', 'excellent', 'normal', 'optimal', 'yes'].includes(v)) {
    return 'positive';
  }
  if (
    ['under observation', 'pending', 'restricted', 'reduced', 'low battery', 'under review', 'no'].includes(
      v
    )
  ) {
    return 'warning';
  }
  if (['not cleared', 'expired', 'suspended', 'elevated at exercise'].includes(v)) {
    return 'danger';
  }
  return 'neutral';
}

function HorseBadge({ label, rawValue }) {
  if (!label || label === '—') return <span className="hp-badge hp-badge--neutral">—</span>;
  return <span className={`hp-badge hp-badge--${badgeTone(rawValue ?? label)}`}>{label}</span>;
}

function FieldGrid({ fields }) {
  return (
    <div className="hp-field-grid">
      {fields.map(({ label, value }) => (
        <div key={label} className="hp-field hp-field--card">
          <span className="hp-field__label">{label}</span>
          <span className="hp-field__value">{value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
}


function HorseAccordion({ sectionId, title, expanded, onToggle, onEdit, editLabel, children }) {
  return (
    <section className={`hp-accordion ${expanded ? 'hp-accordion--open' : ''}`}>
      <button type="button" className="hp-accordion__head" onClick={onToggle} aria-expanded={expanded}>
        <span className="hp-accordion__title">{title}</span>
        <span className="hp-accordion__actions">
          <span
            role="button"
            tabIndex={0}
            className="hp-btn hp-btn--ghost hp-btn--sm"
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
          <ChevronDown size={18} className="hp-accordion__chevron" aria-hidden />
        </span>
      </button>
      {expanded ? <div className="hp-accordion__body">{children}</div> : null}
    </section>
  );
}

function hasDocumentFile(fileName) {
  const name = String(fileName ?? '').trim();
  return Boolean(name && name !== '—');
}

function buildDemoDocumentText(horseName, docLabel, fileName) {
  return [
    'EquiCore — Horse document (demo)',
    '',
    `Horse: ${horseName}`,
    `Document: ${docLabel}`,
    `File: ${fileName}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'Placeholder content until the document API is connected.',
  ].join('\n');
}

function triggerFileDownload(url, fileName) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function DocumentRow({
  label,
  fileName,
  canView,
  canDownload,
  onView,
  onReplace,
  onDownload,
  docView,
  docReplace,
  docDownload,
}) {
  const replaceRef = useRef(null);

  return (
    <div className="hp-doc-row hp-doc-row--card">
      <div className="hp-doc-row__info">
        <FileText size={16} aria-hidden />
        <div>
          <span className="hp-doc-row__label">{label}</span>
          <span className="hp-doc-row__file">{fileName || '—'}</span>
        </div>
      </div>
      <div className="hp-doc-row__actions">
        <input
          ref={replaceRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/*"
          className="hp-sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onReplace(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          className="hp-btn hp-btn--ghost hp-btn--xs"
          onClick={onView}
          disabled={!canView}
          title={docView}
        >
          <Eye size={14} aria-hidden />
          {docView}
        </button>
        <button
          type="button"
          className="hp-btn hp-btn--ghost hp-btn--xs"
          onClick={() => replaceRef.current?.click()}
          title={docReplace}
        >
          <Upload size={14} aria-hidden />
          {docReplace}
        </button>
        <button
          type="button"
          className="hp-btn hp-btn--ghost hp-btn--xs"
          onClick={onDownload}
          disabled={!canDownload}
          title={docDownload}
        >
          <Download size={14} aria-hidden />
          {docDownload}
        </button>
      </div>
    </div>
  );
}

function getHorseImage(horse, imageOverrides) {
  return imageOverrides[horse.id] || horse.image || '';
}

function filterHorses(horses, filters) {
  const nameQ = filters.nameQuery.trim().toLowerCase();
  const passportQ = filters.passportQuery.trim().toLowerCase();

  return horses.filter((h) => {
    const name = h.identification.horseName.toLowerCase();
    const passport = h.identification.feiPassportNumber.toLowerCase();

    if (nameQ && !name.includes(nameQ)) return false;
    if (passportQ && !passport.includes(passportQ)) return false;
    if (filters.discipline && h.discipline !== filters.discipline) return false;
    if (filters.gender && h.identification.gender !== filters.gender) return false;
    if (filters.veterinaryStatus && h.veterinaryStatus !== filters.veterinaryStatus) return false;
    if (filters.registrationStatus && h.registrationStatus !== filters.registrationStatus) return false;
    return true;
  });
}

function buildSectionFields(horse, sectionId, i18n) {
  const {
    tf,
    translateDiscipline,
    translateGender,
    translateRegStatus,
    translateVetStatus,
    translateValue,
    resolveAge,
  } = i18n;
  const id = horse.identification;
  const own = horse.ownership;
  const vet = horse.veterinary;
  const comp = horse.competition;
  const perf = horse.performance;
  const feed = horse.feedingTraining;
  const meta = horse.systemMetadata;

  switch (sectionId) {
    case 'identification':
      return [
        { label: tf('feiHorseId'), value: id.feiHorseId },
        { label: tf('feiPassportNumber'), value: id.feiPassportNumber },
        { label: tf('horseName'), value: id.horseName },
        { label: tf('uelnNumber'), value: id.uelnNumber },
        { label: tf('dateOfBirth'), value: id.dateOfBirth },
        { label: tf('age'), value: resolveAge(horse) },
        { label: tf('gender'), value: translateGender(id.gender) },
        { label: tf('breed'), value: id.breed },
        { label: tf('color'), value: id.color },
        { label: tf('countryOfBirth'), value: id.countryOfBirth },
      ];
    case 'ownership':
      return [
        { label: tf('ownerName'), value: own.ownerName },
        { label: tf('ownerFeiId'), value: own.ownerFeiId },
        { label: tf('nationalFederation'), value: own.nationalFederation },
        { label: tf('registrationStatus'), value: translateRegStatus(own.registrationStatus) },
        { label: tf('registrationValidFrom'), value: own.registrationValidFrom },
        { label: tf('registrationValidTo'), value: own.registrationValidTo },
      ];
    case 'veterinary':
      return [
        { label: tf('lastVetInspectionDate'), value: vet.lastVetInspectionDate },
        { label: tf('veterinaryStatus'), value: translateVetStatus(vet.veterinaryStatus) },
        { label: tf('heartHealthStatus'), value: translateValue(vet.heartHealthStatus) },
        { label: tf('lamenessStatus'), value: vet.lamenessStatus },
        { label: tf('medicationControlStatus'), value: translateValue(vet.medicationControlStatus) },
        { label: tf('antiDopingStatus'), value: translateValue(vet.antiDopingStatus) },
        { label: tf('influenzaVaccination'), value: translateValue(vet.influenzaVaccination) },
        { label: tf('medicalNotes'), value: vet.medicalNotes },
      ];
    case 'competition':
      return [
        { label: tf('discipline'), value: translateDiscipline(comp.discipline) },
        { label: tf('ceiStarLevel'), value: comp.ceiStarLevel },
        { label: tf('maxDistanceCompletedKm'), value: comp.maxDistanceCompletedKm },
        { label: tf('totalFeiRides'), value: comp.totalFeiRides },
        { label: tf('successfulCompletions'), value: comp.successfulCompletions },
        { label: tf('eliminations'), value: comp.eliminations },
        { label: tf('lastCompetitionDate'), value: comp.lastCompetitionDate },
        { label: tf('requiredRestPeriodDays'), value: comp.requiredRestPeriodDays },
      ];
    case 'performance':
      return [
        { label: tf('averageHeartRateBpm'), value: perf.averageHeartRateBpm },
        { label: tf('maxHeartRateBpm'), value: perf.maxHeartRateBpm },
        { label: tf('recoveryTime5MinBpm'), value: perf.recoveryTime5MinBpm },
        { label: tf('recoveryTime10MinBpm'), value: perf.recoveryTime10MinBpm },
        { label: tf('averageSpeedKmh'), value: perf.averageSpeedKmh },
        { label: tf('maxSpeedKmh'), value: perf.maxSpeedKmh },
        { label: tf('enduranceIndex'), value: translateValue(perf.enduranceIndex) },
      ];
    case 'feedingTraining':
      return [
        { label: tf('feedType'), value: feed.feedType },
        { label: tf('lastFeedChangeDate'), value: feed.lastFeedChangeDate },
        { label: tf('trainingLevel'), value: feed.trainingLevel },
        { label: tf('trainingLoadStatus'), value: translateValue(feed.trainingLoadStatus) },
        { label: tf('trainerName'), value: feed.trainerName },
        { label: tf('stableName'), value: feed.stableName },
      ];
    case 'systemMetadata':
      return [
        { label: tf('profileVerified'), value: translateValue(meta.profileVerified) },
        { label: tf('verifiedBy'), value: meta.verifiedBy },
        { label: tf('createdAt'), value: meta.createdAt },
        { label: tf('updatedAt'), value: meta.updatedAt },
        { label: tf('notes'), value: meta.notes },
      ];
    default:
      return [];
  }
}

function HorseCard({ horse, imageSrc, onView, i18n }) {
  const { identification: id } = horse;
  const { th, translateDiscipline, translateVetStatus, translateRegStatus } = i18n;
  const hasUpload = Boolean(imageSrc);
  const mediaSrc = imageSrc || DEFAULT_HORSE_IMAGE_URL;
  return (
    <article className="hp-card">
      <button
        type="button"
        className={`hp-card__media hp-card__media--photo${hasUpload ? '' : ' hp-card__media--default'}`}
        onClick={onView}
        aria-label={th('viewProfileA11y', { name: id.horseName })}
      >
        <img
          src={mediaSrc}
          alt=""
          className={`hp-card__img${hasUpload ? '' : ' hp-card__img--default'}`}
          loading="lazy"
        />
        {hasUpload ? <span className="hp-card__media-overlay" aria-hidden /> : null}
      </button>
      <div className="hp-card__body">
        <div className="hp-card__head">
          <h3 className="hp-card__name">{id.horseName}</h3>
          <div className="hp-card__badges">
            <HorseBadge label={translateVetStatus(horse.veterinaryStatus)} rawValue={horse.veterinaryStatus} />
            <HorseBadge label={translateRegStatus(horse.registrationStatus)} rawValue={horse.registrationStatus} />
          </div>
        </div>
        <dl className="hp-card__meta">
          <div>
            <dt>{th('cardFeiPassport')}</dt>
            <dd>{id.feiPassportNumber}</dd>
          </div>
          <div>
            <dt>{th('cardDiscipline')}</dt>
            <dd>{translateDiscipline(horse.discipline)}</dd>
          </div>
        </dl>
        <p className="hp-card__stable">{horse.stableName}</p>
        <button type="button" className="hp-btn hp-btn--outline hp-btn--sm hp-card__cta" onClick={onView}>
          <Eye size={14} aria-hidden />
          {th('viewProfile')}
        </button>
      </div>
    </article>
  );
}

function HorseProfile({
  horse,
  imageSrc,
  expandedSections,
  onToggleSection,
  onEditSection,
  onBack,
  onImageChange,
  onDocumentView,
  onDocumentReplace,
  onDocumentDownload,
  uploadedDocuments,
  horseMedia,
  onMediaUpload,
  onMediaRemove,
  i18n,
}) {
  const fileRef = useRef(null);
  const { identification: id } = horse;
  const {
    th,
    ts,
    td,
    translateDiscipline,
    translateVetStatus,
    translateRegStatus,
    translateValue,
    resolveAge,
  } = i18n;
  const hasUpload = Boolean(imageSrc);
  const profileMediaSrc = imageSrc || DEFAULT_HORSE_IMAGE_URL;

  const mediaLabels = useMemo(() => ({
    lead: th('mediaLibraryLead'),
    ownerTitle: th('mediaOwnerTitle'),
    ownerHint: th('mediaOwnerHint'),
    riderCoachTitle: th('mediaRiderCoachTitle'),
    riderCoachHint: th('mediaRiderCoachHint'),
    upload: th('mediaUpload'),
    empty: th('mediaEmpty'),
    remove: th('mediaRemove'),
    demoPlaceholder: th('mediaDemoPlaceholder'),
    close: th('close'),
  }), [th]);

  return (
    <div className="hp-profile">
      <button type="button" className="hp-btn hp-btn--ghost hp-profile__back" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden />
        {th('backToList')}
      </button>

      <header className="hp-profile__hero">
        <div className={`hp-profile__image-wrap${hasUpload ? '' : ' hp-profile__image-wrap--default'}`}>
          <img
            src={profileMediaSrc}
            alt=""
            className={`hp-profile__image${hasUpload ? '' : ' hp-profile__image--default'}`}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hp-sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageChange(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="hp-btn hp-btn--gold hp-profile__upload"
            onClick={() => fileRef.current?.click()}
          >
            <Camera size={16} aria-hidden />
            {th('changeImage')}
          </button>
        </div>
        <div className="hp-profile__intro">
          <p className="hp-profile__eyebrow">{horse.stableName}</p>
          <h2 className="hp-profile__name">{id.horseName}</h2>
          <div className="hp-profile__id-row">
            <span className="hp-profile__id-chip">
              <span className="hp-profile__id-chip-label">{th('profileFeiPassport')}</span>
              <span className="hp-profile__id-chip-value">{id.feiPassportNumber}</span>
            </span>
            <span className="hp-profile__id-chip">
              <span className="hp-profile__id-chip-label">{th('profileFeiId')}</span>
              <span className="hp-profile__id-chip-value">{id.feiHorseId}</span>
            </span>
          </div>
          <div className="hp-profile__badges">
            <HorseBadge label={translateVetStatus(horse.veterinaryStatus)} rawValue={horse.veterinaryStatus} />
            <HorseBadge label={translateRegStatus(horse.registrationStatus)} rawValue={horse.registrationStatus} />
            <HorseBadge label={translateDiscipline(horse.discipline)} rawValue={horse.discipline} />
          </div>
          <div className="hp-profile__stats">
            <div className="hp-stat-pill">
              <span className="hp-stat-pill__label">{th('statAge')}</span>
              <span className="hp-stat-pill__value">{resolveAge(horse)}</span>
            </div>
            <div className="hp-stat-pill">
              <span className="hp-stat-pill__label">{th('statDiscipline')}</span>
              <span className="hp-stat-pill__value">{translateDiscipline(horse.discipline)}</span>
            </div>
            <div className="hp-stat-pill">
              <span className="hp-stat-pill__label">{th('statVeterinary')}</span>
              <span className="hp-stat-pill__value">{translateVetStatus(horse.veterinaryStatus)}</span>
            </div>
            <div className="hp-stat-pill">
              <span className="hp-stat-pill__label">{th('statEnduranceIndex')}</span>
              <span className="hp-stat-pill__value">{translateValue(horse.performance.enduranceIndex)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="hp-profile__sections">
        {SECTION_IDS.map((sectionId) => {
          if (sectionId === 'mediaLibrary') {
            return (
              <HorseAccordion
                key={sectionId}
                sectionId={sectionId}
                title={ts(sectionId)}
                expanded={!!expandedSections[sectionId]}
                onToggle={() => onToggleSection(sectionId)}
                onEdit={onEditSection}
                editLabel={th('edit')}
              >
                <HorseMediaLibrary
                  media={horseMedia}
                  labels={mediaLabels}
                  onUpload={onMediaUpload}
                  onRemove={onMediaRemove}
                />
              </HorseAccordion>
            );
          }

          if (sectionId === 'documents') {
            const docs = horse.documents;
            return (
              <HorseAccordion
                key={sectionId}
                sectionId={sectionId}
                title={ts(sectionId)}
                expanded={!!expandedSections[sectionId]}
                onToggle={() => onToggleSection(sectionId)}
                onEdit={onEditSection}
                editLabel={th('edit')}
              >
                {DOCUMENT_KEYS.map((docKey) => {
                  const storedName = docs[docKey];
                  const uploaded = uploadedDocuments?.[docKey];
                  const displayName = uploaded?.fileName || storedName;
                  const canAccess = hasDocumentFile(storedName) || Boolean(uploaded);
                  return (
                    <DocumentRow
                      key={docKey}
                      label={td(docKey)}
                      fileName={displayName}
                      canView={canAccess}
                      canDownload={canAccess}
                      onView={() => onDocumentView(docKey)}
                      onReplace={(file) => onDocumentReplace(docKey, file)}
                      onDownload={() => onDocumentDownload(docKey)}
                      docView={th('docView')}
                      docReplace={th('docReplace')}
                      docDownload={th('docDownload')}
                    />
                  );
                })}
              </HorseAccordion>
            );
          }

          return (
            <HorseAccordion
              key={sectionId}
              sectionId={sectionId}
              title={ts(sectionId)}
              expanded={!!expandedSections[sectionId]}
              onToggle={() => onToggleSection(sectionId)}
              onEdit={onEditSection}
              editLabel={th('edit')}
            >
              <FieldGrid fields={buildSectionFields(horse, sectionId, i18n)} />
            </HorseAccordion>
          );
        })}
      </div>
    </div>
  );
}

function HorseFormSection({ title, children }) {
  return (
    <fieldset className="hp-form-section">
      <legend className="hp-form-section__title">{title}</legend>
      <div className="hp-form-grid">{children}</div>
    </fieldset>
  );
}

function buildEmptyAddForm(stableName) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    ...EMPTY_FORM,
    stableName: stableName || 'A1 Stable',
    lastVetInspectionDate: today,
  };
}

function AddHorseModal({ open, form, imagePreview, onChange, onClose, onSubmit, onImagePick, i18n }) {
  const fileRef = useRef(null);
  const { th, tf, ts, translateDiscipline, translateGender, translateVetStatus, translateRegStatus } = i18n;
  if (!open) return null;

  return (
    <div className="hp-modal" role="dialog" aria-modal="true" aria-labelledby="hp-add-title">
      <button type="button" className="hp-modal__backdrop" onClick={onClose} aria-label={th('close')} />
      <div className="hp-modal__panel">
        <header className="hp-modal__head">
          <h2 id="hp-add-title" className="hp-modal__title">
            {th('modalAddTitle')}
          </h2>
          <button type="button" className="hp-btn hp-btn--icon" onClick={onClose} aria-label={th('close')}>
            <X size={20} />
          </button>
        </header>
        <form
          className="hp-modal__form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <label className="hp-field hp-field--full hp-form-image">
            <span className="hp-field__label">{th('formHorseImage')}</span>
            <div className="hp-form-image__row">
              {imagePreview ? (
                <img src={imagePreview} alt="" className="hp-form-image__preview" />
              ) : (
                <span className="hp-form-image__icon" aria-hidden>
                  <Footprints size={36} strokeWidth={1.25} />
                </span>
              )}
              <button
                type="button"
                className="hp-btn hp-btn--outline"
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
              className="hp-sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImagePick(file);
                e.target.value = '';
              }}
            />
          </label>

          <HorseFormSection title={ts('identification')}>
            <label className="hp-field">
              <span className="hp-field__label">{th('formHorseName')} *</span>
              <input
                className="hp-input"
                value={form.horseName}
                onChange={(e) => onChange('horseName', e.target.value)}
                required
              />
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{th('formFeiHorseId')} *</span>
              <input
                className="hp-input"
                value={form.feiHorseId}
                onChange={(e) => onChange('feiHorseId', e.target.value)}
                required
              />
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{th('formFeiPassport')} *</span>
              <input
                className="hp-input"
                value={form.feiPassportNumber}
                onChange={(e) => onChange('feiPassportNumber', e.target.value)}
                required
              />
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{th('formUeln')}</span>
              <input
                className="hp-input"
                value={form.uelnNumber}
                onChange={(e) => onChange('uelnNumber', e.target.value)}
              />
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{th('formDob')}</span>
              <input
                type="date"
                className="hp-input"
                value={form.dateOfBirth}
                onChange={(e) => onChange('dateOfBirth', e.target.value)}
              />
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{th('formGender')}</span>
              <select
                className="hp-input"
                value={form.gender}
                onChange={(e) => onChange('gender', e.target.value)}
              >
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {translateGender(g.value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{th('formBreed')}</span>
              <input
                className="hp-input"
                value={form.breed}
                onChange={(e) => onChange('breed', e.target.value)}
              />
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{th('formColor')}</span>
              <input
                className="hp-input"
                value={form.color}
                onChange={(e) => onChange('color', e.target.value)}
              />
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{th('formCountry')}</span>
              <input
                className="hp-input"
                value={form.countryOfBirth}
                onChange={(e) => onChange('countryOfBirth', e.target.value)}
              />
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{th('formDiscipline')}</span>
              <select
                className="hp-input"
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
            <label className="hp-field">
              <span className="hp-field__label">{th('formStable')}</span>
              <input
                className="hp-input"
                value={form.stableName}
                onChange={(e) => onChange('stableName', e.target.value)}
              />
            </label>
          </HorseFormSection>

          <HorseFormSection title={ts('ownership')}>
            <label className="hp-field">
              <span className="hp-field__label">{th('formOwner')}</span>
              <input
                className="hp-input"
                value={form.ownerName}
                onChange={(e) => onChange('ownerName', e.target.value)}
              />
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{tf('ownerFeiId')}</span>
              <input
                className="hp-input"
                value={form.ownerFeiId}
                onChange={(e) => onChange('ownerFeiId', e.target.value)}
              />
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{tf('nationalFederation')}</span>
              <input
                className="hp-input"
                value={form.nationalFederation}
                onChange={(e) => onChange('nationalFederation', e.target.value)}
              />
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{th('formRegStatus')}</span>
              <select
                className="hp-input"
                value={form.registrationStatus}
                onChange={(e) => onChange('registrationStatus', e.target.value)}
              >
                {REG_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {translateRegStatus(s.value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{tf('registrationValidFrom')}</span>
              <input
                type="date"
                className="hp-input"
                value={form.registrationValidFrom}
                onChange={(e) => onChange('registrationValidFrom', e.target.value)}
              />
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{tf('registrationValidTo')}</span>
              <input
                type="date"
                className="hp-input"
                value={form.registrationValidTo}
                onChange={(e) => onChange('registrationValidTo', e.target.value)}
              />
            </label>
          </HorseFormSection>

          <HorseFormSection title={ts('veterinary')}>
            <label className="hp-field">
              <span className="hp-field__label">{th('formVetStatus')}</span>
              <select
                className="hp-input"
                value={form.veterinaryStatus}
                onChange={(e) => onChange('veterinaryStatus', e.target.value)}
              >
                {VET_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {translateVetStatus(s.value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="hp-field">
              <span className="hp-field__label">{tf('lastVetInspectionDate')}</span>
              <input
                type="date"
                className="hp-input"
                value={form.lastVetInspectionDate}
                onChange={(e) => onChange('lastVetInspectionDate', e.target.value)}
              />
            </label>
            <label className="hp-field hp-field--full">
              <span className="hp-field__label">{tf('medicalNotes')}</span>
              <input
                className="hp-input"
                value={form.medicalNotes}
                onChange={(e) => onChange('medicalNotes', e.target.value)}
              />
            </label>
          </HorseFormSection>

          <HorseFormSection title={ts('competition')}>
            <label className="hp-field">
              <span className="hp-field__label">{tf('ceiStarLevel')}</span>
              <input
                className="hp-input"
                value={form.ceiStarLevel}
                onChange={(e) => onChange('ceiStarLevel', e.target.value)}
                placeholder="2★"
              />
            </label>
          </HorseFormSection>

          <HorseFormSection title={ts('feedingTraining')}>
            <label className="hp-field">
              <span className="hp-field__label">{tf('trainerName')}</span>
              <input
                className="hp-input"
                value={form.trainerName}
                onChange={(e) => onChange('trainerName', e.target.value)}
              />
            </label>
          </HorseFormSection>

          <HorseFormSection title={ts('systemMetadata')}>
            <label className="hp-field hp-field--full">
              <span className="hp-field__label">{tf('notes')}</span>
              <input
                className="hp-input"
                value={form.notes}
                onChange={(e) => onChange('notes', e.target.value)}
              />
            </label>
          </HorseFormSection>
          <footer className="hp-modal__foot">
            <button type="button" className="hp-btn hp-btn--ghost" onClick={onClose}>
              {th('cancel')}
            </button>
            <button type="submit" className="hp-btn hp-btn--gold">
              <Plus size={16} aria-hidden />
              {th('addHorse')}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

const DEFAULT_FILTERS = {
  nameQuery: '',
  passportQuery: '',
  discipline: '',
  gender: '',
  veterinaryStatus: '',
  registrationStatus: '',
};

const DEFAULT_EXPANDED = {
  identification: true,
  ownership: false,
  veterinary: false,
  competition: false,
  performance: false,
  feedingTraining: false,
  documents: false,
  mediaLibrary: false,
  systemMetadata: false,
};

export default function Horses() {
  const { stableId, user } = useAuth();
  const i18n = useHorseI18n();
  const { t, th, translateDiscipline, translateGender, translateVetStatus, translateRegStatus } = i18n;
  const [horses, setHorses] = useState([]);
  const [imageOverrides, setImageOverrides] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(() => buildEmptyAddForm());
  const [addImagePreview, setAddImagePreview] = useState(null);
  const [expandedSections, setExpandedSections] = useState(DEFAULT_EXPANDED);
  const [documentFiles, setDocumentFiles] = useState({});
  const [mediaByHorse, setMediaByHorse] = useState(buildInitialMediaByHorse);
  const objectUrlsRef = useRef([]);
  const demoDocCacheRef = useRef({});

  const clearDemoDocCache = useCallback(() => {
    Object.values(demoDocCacheRef.current).forEach((entry) => {
      if (entry?.url) URL.revokeObjectURL(entry.url);
    });
    demoDocCacheRef.current = {};
  }, []);

  useEffect(() => {
    setHorses(INITIAL_HORSES.filter((h) => h.stableId === stableId));
    setSelectedId(null);
    setImageOverrides({});
    setDocumentFiles({});
    setMediaByHorse(buildInitialMediaByHorse());
    clearDemoDocCache();
    setFilters(DEFAULT_FILTERS);
  }, [stableId, clearDemoDocCache]);

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      clearDemoDocCache();
    },
    [clearDemoDocCache]
  );

  const registerObjectUrl = useCallback((url) => {
    objectUrlsRef.current.push(url);
    return url;
  }, []);

  const getDocumentAsset = useCallback(
    (horse, docKey) => {
      const uploaded = documentFiles[horse.id]?.[docKey];
      if (uploaded?.url) {
        return {
          url: uploaded.url,
          fileName: uploaded.fileName,
          mimeType: uploaded.mimeType || '',
        };
      }

      const fileName = horse.documents[docKey];
      if (!hasDocumentFile(fileName)) return null;

      const cacheKey = `${horse.id}:${docKey}`;
      let cached = demoDocCacheRef.current[cacheKey];
      if (!cached) {
        const label = t(`pages.horses.documents.${docKey}`);
        const blob = new Blob(
          [buildDemoDocumentText(horse.identification.horseName, label, fileName)],
          { type: 'text/plain;charset=utf-8' }
        );
        const url = registerObjectUrl(URL.createObjectURL(blob));
        cached = { url, fileName, mimeType: 'text/plain' };
        demoDocCacheRef.current[cacheKey] = cached;
      }
      return cached;
    },
    [documentFiles, registerObjectUrl, t]
  );

  const handleDocumentView = useCallback(
    (horse, docKey) => {
      const asset = getDocumentAsset(horse, docKey);
      if (!asset) {
        toast.error(th('toast.docUnavailable'));
        return;
      }
      window.open(asset.url, '_blank', 'noopener,noreferrer');
      toast.success(th('toast.docViewed'));
    },
    [getDocumentAsset, th]
  );

  const handleMediaUpload = useCallback(
    (horseId, category, file) => {
      const url = URL.createObjectURL(file);
      registerObjectUrl(url);
      const current = getHorseMedia(mediaByHorse, horseId);
      const entry = {
        id: nextMediaId(horseId, category, current[category]),
        horseId,
        category,
        type: isVideoFile(file) ? 'video' : 'image',
        fileName: file.name,
        url,
        caption: '',
        uploadedBy: category === MEDIA_CATEGORIES.owner
          ? th('mediaUploadedByOwner')
          : th('mediaUploadedByStaff'),
        sessionLabel: category === MEDIA_CATEGORIES.riderCoach
          ? th('mediaPostTrainingSession', { date: new Date().toISOString().slice(0, 10) })
          : '',
        createdAt: new Date().toISOString(),
      };
      setMediaByHorse((prev) => ({
        ...prev,
        [horseId]: {
          ...getHorseMedia(prev, horseId),
          [category]: [entry, ...current[category]],
        },
      }));
      toast.success(th('toast.mediaAdded'));
    },
    [mediaByHorse, registerObjectUrl, th],
  );

  const handleMediaRemove = useCallback((horseId, category, mediaId) => {
    setMediaByHorse((prev) => {
      const current = getHorseMedia(prev, horseId);
      const removed = current[category].find((m) => m.id === mediaId);
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return {
        ...prev,
        [horseId]: {
          ...current,
          [category]: current[category].filter((m) => m.id !== mediaId),
        },
      };
    });
    toast.success(th('toast.mediaRemoved'));
  }, [th]);

  const handleDocumentDownload = useCallback(
    (horse, docKey) => {
      const asset = getDocumentAsset(horse, docKey);
      if (!asset) {
        toast.error(th('toast.docUnavailable'));
        return;
      }
      triggerFileDownload(asset.url, asset.fileName);
      toast.success(th('toast.docDownloaded'));
    },
    [getDocumentAsset, th]
  );

  const handleDocumentReplace = useCallback(
    (horseId, docKey, file) => {
      const cacheKey = `${horseId}:${docKey}`;
      const previousUpload = documentFiles[horseId]?.[docKey];
      if (previousUpload?.url) {
        URL.revokeObjectURL(previousUpload.url);
      }
      if (demoDocCacheRef.current[cacheKey]?.url) {
        URL.revokeObjectURL(demoDocCacheRef.current[cacheKey].url);
        delete demoDocCacheRef.current[cacheKey];
      }

      const url = registerObjectUrl(URL.createObjectURL(file));
      setDocumentFiles((prev) => ({
        ...prev,
        [horseId]: {
          ...(prev[horseId] || {}),
          [docKey]: { fileName: file.name, url, mimeType: file.type },
        },
      }));
      setHorses((prev) =>
        prev.map((h) =>
          h.id !== horseId ? h : { ...h, documents: { ...h.documents, [docKey]: file.name } }
        )
      );
      toast.success(th('toast.docReplaced'));
    },
    [documentFiles, registerObjectUrl, th]
  );

  const filtered = useMemo(() => filterHorses(horses, filters), [horses, filters]);
  const selectedHorse = useMemo(
    () => horses.find((h) => h.id === selectedId) ?? null,
    [horses, selectedId]
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
    (horseId, file) => {
      const url = registerObjectUrl(URL.createObjectURL(file));
      setImageOverrides((prev) => ({ ...prev, [horseId]: url }));
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

  const openAddHorseModal = useCallback(() => {
    setAddForm(buildEmptyAddForm(user?.stableName));
    setAddOpen(true);
  }, [user?.stableName]);

  const handleAddSubmit = useCallback(() => {
    const id = nextHorseId(horses);
    const today = new Date().toISOString().slice(0, 10);
    const horseName = addForm.horseName.trim();
    const imageUrl = addImagePreview || '';
    const newHorse = createHorseFromAddForm(addForm, {
      id,
      stableId: stableId || 'stable-1',
      imageUrl,
      today,
      t,
    });

    setHorses((prev) => [...prev, newHorse]);
    setMediaByHorse((prev) => ({ ...prev, [id]: emptyMediaForHorse(id) }));
    if (addImagePreview) {
      setImageOverrides((prev) => ({ ...prev, [id]: addImagePreview }));
      setAddImagePreview(null);
    }
    setAddForm(buildEmptyAddForm(user?.stableName));
    setAddOpen(false);
    setExpandedSections(PROFILE_EXPANDED_AFTER_ADD);
    setSelectedId(id);
    toast.success(th('toast.horseAdded', { name: horseName }));
  }, [addForm, addImagePreview, horses, stableId, t, th, user?.stableName]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (selectedHorse) {
    return (
      <div className="hp-page">
        <HorseProfile
          horse={selectedHorse}
          imageSrc={getHorseImage(selectedHorse, imageOverrides)}
          expandedSections={expandedSections}
          onToggleSection={handleToggleSection}
          onEditSection={handleEditPlaceholder}
          onBack={() => setSelectedId(null)}
          onImageChange={(file) => handleProfileImage(selectedHorse.id, file)}
          onDocumentView={(docKey) => handleDocumentView(selectedHorse, docKey)}
          onDocumentReplace={(docKey, file) => handleDocumentReplace(selectedHorse.id, docKey, file)}
          onDocumentDownload={(docKey) => handleDocumentDownload(selectedHorse, docKey)}
          uploadedDocuments={documentFiles[selectedHorse.id]}
          horseMedia={getHorseMedia(mediaByHorse, selectedHorse.id)}
          onMediaUpload={(category, file) => handleMediaUpload(selectedHorse.id, category, file)}
          onMediaRemove={(category, mediaId) => handleMediaRemove(selectedHorse.id, category, mediaId)}
          i18n={i18n}
        />
      </div>
    );
  }

  return (
    <div className="hp-page">
      <header className="hp-page__header">
        <div>
          <h1 className="hp-page__title">{th('title')}</h1>
          <p className="hp-page__subtitle">{th('subtitle')}</p>
        </div>
        <button type="button" className="hp-btn hp-btn--gold" onClick={openAddHorseModal}>
          <Plus size={18} aria-hidden />
          {th('addHorse')}
        </button>
      </header>

      <section className="hp-filters" aria-label={th('filtersA11y')}>
        <div className="hp-filters__head">
          <Filter size={18} aria-hidden />
          <span>{th('filtersTitle')}</span>
          {hasActiveFilters ? (
            <button
              type="button"
              className="hp-btn hp-btn--ghost hp-btn--sm"
              onClick={() => setFilters(DEFAULT_FILTERS)}
            >
              <RotateCcw size={14} aria-hidden />
              {th('resetFilters')}
            </button>
          ) : null}
        </div>
        <div className="hp-filters__grid">
          <label className="hp-filter hp-filter--search">
            <Search size={16} aria-hidden />
            <input
              type="search"
              placeholder={th('searchName')}
              value={filters.nameQuery}
              onChange={(e) => updateFilter('nameQuery', e.target.value)}
            />
          </label>
          <label className="hp-filter hp-filter--search">
            <Search size={16} aria-hidden />
            <input
              type="search"
              placeholder={th('searchPassport')}
              value={filters.passportQuery}
              onChange={(e) => updateFilter('passportQuery', e.target.value)}
            />
          </label>
          <label className="hp-filter">
            <span className="hp-filter__label">{th('filterDiscipline')}</span>
            <select value={filters.discipline} onChange={(e) => updateFilter('discipline', e.target.value)}>
              <option value="">{th('allDisciplines')}</option>
              {DISCIPLINE_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {translateDiscipline(d.value)}
                </option>
              ))}
            </select>
          </label>
          <label className="hp-filter">
            <span className="hp-filter__label">{th('filterGender')}</span>
            <select value={filters.gender} onChange={(e) => updateFilter('gender', e.target.value)}>
              <option value="">{th('allGenders')}</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {translateGender(g.value)}
                </option>
              ))}
            </select>
          </label>
          <label className="hp-filter">
            <span className="hp-filter__label">{th('filterVetStatus')}</span>
            <select
              value={filters.veterinaryStatus}
              onChange={(e) => updateFilter('veterinaryStatus', e.target.value)}
            >
              <option value="">{th('allStatuses')}</option>
              {VET_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {translateVetStatus(s.value)}
                </option>
              ))}
            </select>
          </label>
          <label className="hp-filter">
            <span className="hp-filter__label">{th('filterRegStatus')}</span>
            <select
              value={filters.registrationStatus}
              onChange={(e) => updateFilter('registrationStatus', e.target.value)}
            >
              <option value="">{th('allStatuses')}</option>
              {REG_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {translateRegStatus(s.value)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="hp-empty">
          <Award size={40} strokeWidth={1.25} aria-hidden />
          <p>{th('emptyFiltered')}</p>
          {hasActiveFilters ? (
            <button type="button" className="hp-btn hp-btn--outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
              {th('resetFilters')}
            </button>
          ) : (
            <button type="button" className="hp-btn hp-btn--gold" onClick={openAddHorseModal}>
              <Plus size={16} aria-hidden />
              {th('addFirstHorse')}
            </button>
          )}
        </div>
      ) : (
        <div className="hp-grid">
          {filtered.map((horse) => (
            <HorseCard
              key={horse.id}
              horse={horse}
              imageSrc={getHorseImage(horse, imageOverrides)}
              i18n={i18n}
              onView={() => {
                setExpandedSections(DEFAULT_EXPANDED);
                setSelectedId(horse.id);
              }}
            />
          ))}
        </div>
      )}

      <AddHorseModal
        open={addOpen}
        form={addForm}
        imagePreview={addImagePreview}
        i18n={i18n}
        onChange={(key, value) => setAddForm((prev) => ({ ...prev, [key]: value }))}
        onClose={() => {
          setAddOpen(false);
          setAddForm(buildEmptyAddForm(user?.stableName));
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
