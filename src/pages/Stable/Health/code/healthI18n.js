/**
 * Medical Management i18n — slug maps + hook (keeps demo data values in English).
 */
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AUSCULTATION,
  CALENDAR_ASSIGNED,
  CALENDAR_EVENT_TYPES,
  CALENDAR_PRIORITY,
  CALENDAR_REPEAT,
  CALENDAR_STATUS,
  CARE_SUBTABS,
  MED_COURSE_STATUS,
  MED_FREQUENCY,
  RECORDED_BY,
  WEIGHT_METHODS,
} from './healthMedicalData';

export const PROFILE_TAB_DEFS = [
  { id: 'summary', labelKey: 'tabs.summary' },
  { id: 'weight', labelKey: 'tabs.weight' },
  { id: 'physical', labelKey: 'tabs.physical' },
  { id: 'blood', labelKey: 'tabs.blood' },
  { id: 'care', labelKey: 'tabs.care' },
  { id: 'calendar', labelKey: 'tabs.calendar' },
  { id: 'media', labelKey: 'tabs.media' },
  { id: 'medication', labelKey: 'tabs.medication' },
];

const VET_STATUS_I18N = {
  Fit: 'fit',
  'Under Observation': 'underObservation',
  Restricted: 'restricted',
  'Not Cleared': 'notCleared',
};

const CARE_SUBTAB_I18N = {
  Vaccinations: 'vaccinations',
  Deworming: 'deworming',
  Medications: 'medications',
  Allergies: 'allergies',
  'Injuries / Conditions': 'injuriesConditions',
  'Surgeries / Procedures': 'surgeriesProcedures',
  Dental: 'dental',
  'Farrier / Hoof Care': 'farrierHoofCare',
  'Imaging / Diagnostics': 'imagingDiagnostics',
};

const CAL_EVENT_I18N = {
  'Post-training quick check': 'postTrainingQuickCheck',
  'Weekly detailed examination': 'weeklyDetailedExamination',
  'Blood test': 'bloodTest',
  'Shockwave therapy': 'shockwaveTherapy',
  'Cooling session': 'coolingSession',
  Vaccination: 'vaccination',
  Deworming: 'deworming',
  'Medication dose': 'medicationDose',
  'Vet appointment': 'vetAppointment',
  'Imaging / diagnostics': 'imagingDiagnostics',
  'Farrier / hoof care': 'farrierHoofCare',
};

const CAL_STATUS_I18N = {
  Scheduled: 'scheduled',
  Completed: 'completed',
  Missed: 'missed',
  Cancelled: 'cancelled',
};

const CAL_PRIORITY_I18N = {
  Low: 'low',
  Normal: 'normal',
  High: 'high',
  Emergency: 'emergency',
};

const CAL_REPEAT_I18N = {
  'No repeat': 'noRepeat',
  Daily: 'daily',
  Weekly: 'weekly',
  Monthly: 'monthly',
  Custom: 'custom',
};

const RECORDED_BY_I18N = {
  Doctor: 'doctor',
  Trainer: 'trainer',
  'Stable Staff': 'stableStaff',
  Veterinarian: 'veterinarian',
};

const WEIGHT_METHOD_I18N = {
  Scale: 'scale',
  'Weight Tape': 'weightTape',
  Estimated: 'estimated',
};

const MED_FREQ_I18N = {
  'Once daily': 'onceDaily',
  'Twice daily': 'twiceDaily',
  'Every 8 hours': 'every8Hours',
  'Every 12 hours': 'every12Hours',
  Custom: 'custom',
};

const MED_STATUS_I18N = {
  Active: 'active',
  Completed: 'completed',
  Paused: 'paused',
  Cancelled: 'cancelled',
  'Requires Vet Review': 'requiresVetReview',
};

const OVERALL_STATUS_I18N = {
  Normal: 'normal',
  'Needs Review': 'needsReview',
};

function translateFromMap(t, ns, map, value) {
  const key = map[value];
  return key ? t(`${ns}.${key}`, { defaultValue: value }) : value;
}

export function formatHealthDateTime(iso, language) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const loc = language === 'ar' ? 'ar' : 'en';
  return new Intl.DateTimeFormat(loc, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function formatHealthMonth(date, language) {
  const loc = language === 'ar' ? 'ar' : 'en';
  return new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(date);
}

export function getHealthWeekdays(language) {
  const loc = language === 'ar' ? 'ar' : 'en';
  const base = new Date(2026, 0, 4);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return new Intl.DateTimeFormat(loc, { weekday: 'short' }).format(d);
  });
}

export function useHealthI18n() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  const th = useCallback((key, opts) => t(`pages.health.${key}`, opts), [t]);

  const translateVetStatus = useCallback(
    (value) => translateFromMap(t, 'pages.health.enums.vetStatus', VET_STATUS_I18N, value),
    [t],
  );

  const translateCareSubTab = useCallback(
    (value) => translateFromMap(t, 'pages.health.enums.careSubTab', CARE_SUBTAB_I18N, value),
    [t],
  );

  const translateCalendarEventType = useCallback(
    (value) => translateFromMap(t, 'pages.health.enums.calendarEventType', CAL_EVENT_I18N, value),
    [t],
  );

  const translateCalendarStatus = useCallback(
    (value) => translateFromMap(t, 'pages.health.enums.calendarStatus', CAL_STATUS_I18N, value),
    [t],
  );

  const translateCalendarPriority = useCallback(
    (value) => translateFromMap(t, 'pages.health.enums.calendarPriority', CAL_PRIORITY_I18N, value),
    [t],
  );

  const translateCalendarRepeat = useCallback(
    (value) => translateFromMap(t, 'pages.health.enums.calendarRepeat', CAL_REPEAT_I18N, value),
    [t],
  );

  const translateRecordedBy = useCallback(
    (value) => translateFromMap(t, 'pages.health.enums.recordedBy', RECORDED_BY_I18N, value),
    [t],
  );

  const translateWeightMethod = useCallback(
    (value) => translateFromMap(t, 'pages.health.enums.weightMethod', WEIGHT_METHOD_I18N, value),
    [t],
  );

  const translateMedFrequency = useCallback(
    (value) => translateFromMap(t, 'pages.health.enums.medFrequency', MED_FREQ_I18N, value),
    [t],
  );

  const translateMedStatus = useCallback(
    (value) => translateFromMap(t, 'pages.health.enums.medCourseStatus', MED_STATUS_I18N, value),
    [t],
  );

  const translateOverallStatus = useCallback(
    (value) => translateFromMap(t, 'pages.health.enums.overallStatus', OVERALL_STATUS_I18N, value),
    [t],
  );

  const translateOptionList = useCallback(
    (values, translateFn) => values.map((v) => ({ value: v, label: translateFn(v) })),
    [],
  );

  const mediaLabels = useMemo(() => ({
    lead: t('pages.health.media.lead'),
    ownerTitle: t('pages.health.media.ownerTitle'),
    ownerHint: t('pages.health.media.ownerHint'),
    riderCoachTitle: t('pages.health.media.riderCoachTitle'),
    riderCoachHint: t('pages.health.media.riderCoachHint'),
    upload: t('pages.health.media.upload'),
    empty: t('pages.health.media.empty'),
    remove: t('pages.health.media.remove'),
    demoPlaceholder: t('pages.health.media.demoPlaceholder'),
    close: t('pages.health.close'),
  }), [t]);

  const weekdays = useMemo(() => getHealthWeekdays(language), [language]);

  return {
    t,
    i18n,
    language,
    th,
    translateVetStatus,
    translateCareSubTab,
    translateCalendarEventType,
    translateCalendarStatus,
    translateCalendarPriority,
    translateCalendarRepeat,
    translateRecordedBy,
    translateWeightMethod,
    translateMedFrequency,
    translateMedStatus,
    translateOverallStatus,
    translateOptionList,
    formatDate: (iso) => formatHealthDateTime(iso, language),
    formatMonth: (date) => formatHealthMonth(date, language),
    mediaLabels,
    weekdays,
    CARE_SUBTABS,
    CALENDAR_EVENT_TYPES,
    CALENDAR_STATUS,
    CALENDAR_PRIORITY,
    CALENDAR_REPEAT,
    CALENDAR_ASSIGNED,
    WEIGHT_METHODS,
    RECORDED_BY,
    MED_FREQUENCY,
    MED_COURSE_STATUS,
  };
}
