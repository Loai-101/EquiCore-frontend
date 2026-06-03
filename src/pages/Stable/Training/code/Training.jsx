/**
 * Stable Training Management — schedule sessions + training library (frontend demo).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Copy,
  Eye,
  Filter,
  Library,
  MessageSquare,
  Plus,
  Printer,
  RotateCcw,
  Search,
  StickyNote,
  X,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import '../styles/Training.css';

const TAB_CONFIG = [
  { id: 'schedule', icon: Calendar },
  { id: 'library', icon: Library },
];

const SESSION_STATUS_OPTIONS = [
  { value: 'Planned', key: 'planned' },
  { value: 'In Progress', key: 'inProgress' },
  { value: 'Completed', key: 'completed' },
  { value: 'Cancelled', key: 'cancelled' },
];

const DISCIPLINE_OPTIONS = [
  { value: 'Endurance', key: 'endurance' },
  { value: 'Flat Racing', key: 'flatRacing' },
  { value: 'Jumping', key: 'jumping' },
  { value: 'Mixed', key: 'mixed' },
];

const CATEGORY_OPTIONS = [
  { value: 'Endurance Conditioning', key: 'enduranceConditioning' },
  { value: 'Recovery', key: 'recovery' },
  { value: 'Speed Work', key: 'speedWork' },
  { value: 'Hill Training', key: 'hillTraining' },
  { value: 'Flat Work', key: 'flatWork' },
  { value: 'Jumping Grid', key: 'jumpingGrid' },
  { value: 'Warm Up', key: 'warmUp' },
  { value: 'Cool Down', key: 'coolDown' },
];

const TRAINING_TYPE_EXTRA = {
  'Recovery Walk': 'recoveryWalk',
};

const DIFFICULTY_OPTIONS = [
  { value: 'Beginner', key: 'beginner' },
  { value: 'Intermediate', key: 'intermediate' },
  { value: 'Advanced', key: 'advanced' },
  { value: 'Competition Prep', key: 'competitionPrep' },
];

const TEMPLATE_STATUS_OPTIONS = [
  { value: 'Active', key: 'active' },
  { value: 'Inactive', key: 'inactive' },
];

const DAY_OPTIONS = [
  { value: 'Sunday', key: 'sunday' },
  { value: 'Monday', key: 'monday' },
  { value: 'Tuesday', key: 'tuesday' },
  { value: 'Wednesday', key: 'wednesday' },
  { value: 'Thursday', key: 'thursday' },
  { value: 'Friday', key: 'friday' },
  { value: 'Saturday', key: 'saturday' },
];

const GARMIN_OPTIONS = [
  { value: 'Synced', key: 'synced' },
  { value: 'Pending', key: 'pending' },
  { value: 'In progress', key: 'inProgress' },
  { value: 'Not started', key: 'notStarted' },
  { value: 'N/A', key: 'na' },
];

const VALUE_I18N_KEYS = {
  Normal: 'normal',
  'Good recovery': 'goodRecovery',
  'Slightly tired': 'slightlyTired',
  Fresh: 'fresh',
  Excellent: 'excellent',
  Good: 'good',
  Ready: 'ready',
  'Improve aerobic base and recovery': 'goalImproveAerobic',
  'Active recovery after competition block': 'goalActiveRecovery',
  'Sharpen pace control on flat sections': 'goalSharpenPace',
  'Build strength on inclines': 'goalBuildStrength',
  'Rhythm and straightness on track': 'goalRhythmTrack',
  'Gymnastic grid confidence': 'goalGridConfidence',
  'Post-competition recovery ride': 'goalPostCompetition',
  'Long slow distance — aerobic block': 'goalLsd',
  'Preparation for weekend event': 'goalWeekendPrep',
  'Heart rate dropped within expected range': 'recoveryHr',
  'Maintain same load next week': 'trainerMaintainLoad',
  'Horse felt forward and comfortable': 'riderForward',
  'Avg 128 bpm, peak 156 bpm during intervals': 'hrAvg128',
  'Keep walk pace only': 'trainerWalkPace',
  'Quick cool-down, normal hydration': 'recoveryQuick',
  'Increase interval length next session': 'trainerInterval',
  'Responsive to leg aids': 'riderResponsive',
  'Controlled peaks under 160 bpm': 'hrControlled',
  'Monitor stride on final climb': 'trainerMonitorClimb',
  'Standard cool-down protocol': 'recoveryStandard',
  'Good engagement': 'trainerEngagement',
  'Balanced contact': 'riderBalanced',
  'Stable throughout': 'hrStable',
  'Use grid template #3': 'trainerGridTemplate',
  'Cancelled due to weather': 'trainerWeather',
  'Hydration stop at 12 km': 'trainerHydration',
  'Light stretch after': 'recoveryStretch',
  'Proceed to main session': 'trainerProceed',
  'Calm and focused': 'riderCalm',
  'Low intensity': 'hrLow',
  'Endurance Base Conditioning': 'tplEnduranceBase',
  'Recovery Walk Protocol': 'tplRecoveryWalk',
  'Speed Interval Block': 'tplSpeedInterval',
  'Hill Strength Builder': 'tplHillStrength',
  'Jumping Grid — Foundation': 'tplJumpingGrid',
  'Competition Prep — LSD': 'tplCompetitionLsd',
  'Build aerobic endurance and improve recovery': 'tplGoalEndurance',
  'Active recovery without cardiac strain': 'tplGoalRecovery',
  'Develop speed endurance and pace discipline': 'tplGoalSpeed',
  'Strengthen hindquarters and cardiovascular system': 'tplGoalHill',
  'Rhythm, balance, and confidence over fences': 'tplGoalJumping',
  'Peak aerobic volume before taper': 'tplGoalCompetition',
};

function useTrainingI18n() {
  const { t } = useTranslation();

  const th = useCallback((key, opts) => t(`pages.training.${key}`, opts), [t]);
  const tc = useCallback((key) => t(`pages.training.columns.${key}`), [t]);
  const tf = useCallback((key) => t(`pages.training.fields.${key}`), [t]);
  const tsl = useCallback((key) => t(`pages.training.filters.${key}`), [t]);
  const tsm = useCallback((key) => t(`pages.training.sessionModal.sections.${key}`), [t]);
  const ttm = useCallback((key) => t(`pages.training.templateModal.sections.${key}`), [t]);
  const tsum = useCallback((key) => t(`pages.training.summary.${key}`), [t]);

  const translateSessionStatus = useCallback(
    (value) => {
      const opt = SESSION_STATUS_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.training.enums.sessionStatus.${opt.key}`) : value;
    },
    [t]
  );

  const translateTemplateStatus = useCallback(
    (value) => {
      const opt = TEMPLATE_STATUS_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.training.enums.templateStatus.${opt.key}`) : value;
    },
    [t]
  );

  const translateDiscipline = useCallback(
    (value) => {
      const opt = DISCIPLINE_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.training.enums.discipline.${opt.key}`) : value;
    },
    [t]
  );

  const translateCategory = useCallback(
    (value) => {
      const opt = CATEGORY_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.training.enums.category.${opt.key}`) : value;
    },
    [t]
  );

  const translateTrainingType = useCallback(
    (value) => {
      const cat = CATEGORY_OPTIONS.find((o) => o.value === value);
      if (cat) return t(`pages.training.enums.category.${cat.key}`);
      const extra = TRAINING_TYPE_EXTRA[value];
      if (extra) return t(`pages.training.enums.trainingType.${extra}`);
      return value;
    },
    [t]
  );

  const translateDifficulty = useCallback(
    (value) => {
      const opt = DIFFICULTY_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.training.enums.difficulty.${opt.key}`) : value;
    },
    [t]
  );

  const translateDay = useCallback(
    (value) => {
      const opt = DAY_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.training.enums.day.${opt.key}`) : value;
    },
    [t]
  );

  const translateGarmin = useCallback(
    (value) => {
      const opt = GARMIN_OPTIONS.find((o) => o.value === value);
      return opt ? t(`pages.training.enums.garmin.${opt.key}`) : value;
    },
    [t]
  );

  const translateValue = useCallback(
    (value) => {
      if (value == null || value === '' || value === '—') {
        return value === '—' ? t('common.emptyCell') : value;
      }
      const key = VALUE_I18N_KEYS[value];
      if (key) return t(`pages.training.values.${key}`, { defaultValue: value });
      return value;
    },
    [t]
  );

  return {
    t,
    th,
    tc,
    tf,
    tsl,
    tsm,
    ttm,
    tsum,
    translateSessionStatus,
    translateTemplateStatus,
    translateDiscipline,
    translateCategory,
    translateTrainingType,
    translateDifficulty,
    translateDay,
    translateGarmin,
    translateValue,
  };
}

const DEFAULT_SESSION_FILTERS = {
  horse: '',
  rider: '',
  trainer: '',
  trainingType: '',
  date: '',
  day: '',
  status: '',
};

const DEFAULT_LIBRARY_FILTERS = {
  query: '',
  discipline: '',
  difficulty: '',
  status: '',
};

const EMPTY_TEMPLATE_FORM = {
  templateName: '',
  discipline: 'Endurance',
  category: 'Endurance Conditioning',
  difficultyLevel: 'Intermediate',
  estimatedDistance: '',
  estimatedDuration: '',
  targetAverageSpeed: '',
  targetMaxSpeed: '',
  goal: '',
  warmupInstructions: '',
  mainExerciseInstructions: '',
  cooldownInstructions: '',
  requiredEquipment: '',
  recommendedRestPeriod: '',
  healthPrecautions: '',
  notes: '',
  status: 'Active',
};

function buildInitialSessions(stableId) {
  return [
    {
      id: 'session_001',
      stableId,
      calendarEventId: 'cal_001',
      horseId: 'horse_001',
      horseName: 'Thunder',
      riderId: 'rider_001',
      riderName: 'Ahmed Al-Mansoori',
      trainerId: 'user_003',
      trainerName: 'Ali Hussein Salman',
      date: '2026-05-17',
      day: 'Sunday',
      time: '06:00',
      trainingType: 'Endurance Conditioning',
      goal: 'Improve aerobic base and recovery',
      distance: '20 km',
      duration: '1h 30m',
      averageSpeed: '13.5 km/h',
      maxSpeed: '22 km/h',
      status: 'Completed',
      conditionBefore: 'Normal',
      conditionAfter: 'Good recovery',
      recoveryNotes: 'Heart rate dropped within expected range',
      trainerNotes: 'Maintain same load next week',
      riderFeedback: 'Horse felt forward and comfortable',
      heartRateNotes: 'Avg 128 bpm, peak 156 bpm during intervals',
      garminSyncStatus: 'Synced',
      createdBy: 'Ali Hussein Salman',
      createdAt: '2026-05-16 18:30',
      completedAt: '2026-05-17 07:45',
    },
    {
      id: 'session_002',
      stableId,
      calendarEventId: 'cal_002',
      horseId: 'horse_002',
      horseName: 'Desert Pearl',
      riderId: 'rider_003',
      riderName: 'Sara Al-Khalifa',
      trainerId: 'user_004',
      trainerName: 'Fatima Al-Rashid',
      date: '2026-05-18',
      day: 'Monday',
      time: '07:30',
      trainingType: 'Recovery Walk',
      goal: 'Active recovery after competition block',
      distance: '8 km',
      duration: '45m',
      averageSpeed: '10.5 km/h',
      maxSpeed: '14 km/h',
      status: 'Planned',
      conditionBefore: 'Slightly tired',
      conditionAfter: '—',
      recoveryNotes: '',
      trainerNotes: 'Keep walk pace only',
      riderFeedback: '',
      heartRateNotes: '',
      garminSyncStatus: 'Pending',
      createdBy: 'Fatima Al-Rashid',
      createdAt: '2026-05-17 09:00',
      completedAt: '',
    },
    {
      id: 'session_003',
      stableId,
      calendarEventId: 'cal_003',
      horseId: 'horse_003',
      horseName: 'Royal Flame',
      riderId: 'rider_002',
      riderName: 'Khalid Hassan',
      trainerId: 'user_003',
      trainerName: 'Ali Hussein Salman',
      date: '2026-05-16',
      day: 'Saturday',
      time: '05:45',
      trainingType: 'Speed Work',
      goal: 'Sharpen pace control on flat sections',
      distance: '15 km',
      duration: '1h 05m',
      averageSpeed: '14.2 km/h',
      maxSpeed: '26 km/h',
      status: 'Completed',
      conditionBefore: 'Fresh',
      conditionAfter: 'Excellent',
      recoveryNotes: 'Quick cool-down, normal hydration',
      trainerNotes: 'Increase interval length next session',
      riderFeedback: 'Responsive to leg aids',
      heartRateNotes: 'Controlled peaks under 160 bpm',
      garminSyncStatus: 'Synced',
      createdBy: 'Ali Hussein Salman',
      createdAt: '2026-05-15 14:20',
      completedAt: '2026-05-16 07:10',
    },
    {
      id: 'session_004',
      stableId,
      calendarEventId: 'cal_004',
      horseId: 'horse_004',
      horseName: 'Silver Arrow',
      riderId: 'rider_004',
      riderName: 'Mohammed Al-Salem',
      trainerId: 'user_005',
      trainerName: 'Omar Al-Dosari',
      date: '2026-05-17',
      day: 'Sunday',
      time: '16:00',
      trainingType: 'Hill Training',
      goal: 'Build strength on inclines',
      distance: '12 km',
      duration: '1h 15m',
      averageSpeed: '11.8 km/h',
      maxSpeed: '18 km/h',
      status: 'In Progress',
      conditionBefore: 'Normal',
      conditionAfter: '—',
      recoveryNotes: '',
      trainerNotes: 'Monitor stride on final climb',
      riderFeedback: '',
      heartRateNotes: '',
      garminSyncStatus: 'In progress',
      createdBy: 'Omar Al-Dosari',
      createdAt: '2026-05-17 08:00',
      completedAt: '',
    },
    {
      id: 'session_005',
      stableId,
      calendarEventId: 'cal_005',
      horseId: 'horse_005',
      horseName: 'Midnight Star',
      riderId: 'rider_001',
      riderName: 'Ahmed Al-Mansoori',
      trainerId: 'user_004',
      trainerName: 'Fatima Al-Rashid',
      date: '2026-05-14',
      day: 'Thursday',
      time: '06:15',
      trainingType: 'Flat Work',
      goal: 'Rhythm and straightness on track',
      distance: '10 km',
      duration: '50m',
      averageSpeed: '12 km/h',
      maxSpeed: '16 km/h',
      status: 'Completed',
      conditionBefore: 'Normal',
      conditionAfter: 'Good',
      recoveryNotes: 'Standard cool-down protocol',
      trainerNotes: 'Good engagement',
      riderFeedback: 'Balanced contact',
      heartRateNotes: 'Stable throughout',
      garminSyncStatus: 'Synced',
      createdBy: 'Fatima Al-Rashid',
      createdAt: '2026-05-13 11:00',
      completedAt: '2026-05-14 07:05',
    },
    {
      id: 'session_006',
      stableId,
      calendarEventId: 'cal_006',
      horseId: 'horse_002',
      horseName: 'Desert Pearl',
      riderId: 'rider_002',
      riderName: 'Khalid Hassan',
      trainerId: 'user_003',
      trainerName: 'Ali Hussein Salman',
      date: '2026-05-19',
      day: 'Tuesday',
      time: '06:00',
      trainingType: 'Jumping Grid',
      goal: 'Gymnastic grid confidence',
      distance: '—',
      duration: '40m',
      averageSpeed: '—',
      maxSpeed: '—',
      status: 'Planned',
      conditionBefore: '—',
      conditionAfter: '—',
      recoveryNotes: '',
      trainerNotes: 'Use grid template #3',
      riderFeedback: '',
      heartRateNotes: '',
      garminSyncStatus: 'Not started',
      createdBy: 'Ali Hussein Salman',
      createdAt: '2026-05-17 10:30',
      completedAt: '',
    },
    {
      id: 'session_007',
      stableId,
      calendarEventId: 'cal_007',
      horseId: 'horse_001',
      horseName: 'Thunder',
      riderId: 'rider_004',
      riderName: 'Mohammed Al-Salem',
      trainerId: 'user_005',
      trainerName: 'Omar Al-Dosari',
      date: '2026-05-12',
      day: 'Tuesday',
      time: '17:00',
      trainingType: 'Cool Down',
      goal: 'Post-competition recovery ride',
      distance: '6 km',
      duration: '35m',
      averageSpeed: '10 km/h',
      maxSpeed: '12 km/h',
      status: 'Cancelled',
      conditionBefore: '—',
      conditionAfter: '—',
      recoveryNotes: '',
      trainerNotes: 'Cancelled due to weather',
      riderFeedback: '',
      heartRateNotes: '',
      garminSyncStatus: 'N/A',
      createdBy: 'Omar Al-Dosari',
      createdAt: '2026-05-11 16:00',
      completedAt: '',
    },
    {
      id: 'session_008',
      stableId,
      calendarEventId: 'cal_008',
      horseId: 'horse_003',
      horseName: 'Royal Flame',
      riderId: 'rider_001',
      riderName: 'Ahmed Al-Mansoori',
      trainerId: 'user_003',
      trainerName: 'Ali Hussein Salman',
      date: '2026-05-20',
      day: 'Wednesday',
      time: '05:30',
      trainingType: 'Endurance Conditioning',
      goal: 'Long slow distance — aerobic block',
      distance: '25 km',
      duration: '2h',
      averageSpeed: '12.5 km/h',
      maxSpeed: '20 km/h',
      status: 'Planned',
      conditionBefore: '—',
      conditionAfter: '—',
      recoveryNotes: '',
      trainerNotes: 'Hydration stop at 12 km',
      riderFeedback: '',
      heartRateNotes: '',
      garminSyncStatus: 'Pending',
      createdBy: 'Ali Hussein Salman',
      createdAt: '2026-05-17 12:00',
      completedAt: '',
    },
    {
      id: 'session_009',
      stableId,
      calendarEventId: 'cal_009',
      horseId: 'horse_004',
      horseName: 'Silver Arrow',
      riderId: 'rider_003',
      riderName: 'Sara Al-Khalifa',
      trainerId: 'user_004',
      trainerName: 'Fatima Al-Rashid',
      date: '2026-05-15',
      day: 'Friday',
      time: '06:30',
      trainingType: 'Warm Up',
      goal: 'Preparation for weekend event',
      distance: '5 km',
      duration: '25m',
      averageSpeed: '12 km/h',
      maxSpeed: '15 km/h',
      status: 'Completed',
      conditionBefore: 'Fresh',
      conditionAfter: 'Ready',
      recoveryNotes: 'Light stretch after',
      trainerNotes: 'Proceed to main session',
      riderFeedback: 'Calm and focused',
      heartRateNotes: 'Low intensity',
      garminSyncStatus: 'Synced',
      createdBy: 'Fatima Al-Rashid',
      createdAt: '2026-05-14 18:00',
      completedAt: '2026-05-15 07:00',
    },
  ];
}

function buildInitialTemplates(stableId) {
  return [
    {
      id: 'template_001',
      stableId,
      templateName: 'Endurance Base Conditioning',
      discipline: 'Endurance',
      category: 'Endurance Conditioning',
      difficultyLevel: 'Intermediate',
      estimatedDistance: '20 km',
      estimatedDuration: '1h 30m',
      targetAverageSpeed: '13 km/h',
      targetMaxSpeed: '22 km/h',
      goal: 'Build aerobic endurance and improve recovery',
      warmupInstructions: '10 minutes walk, then light trot',
      mainExerciseInstructions: 'Maintain steady pace across mixed terrain',
      cooldownInstructions: '15 minutes walk and hydration check',
      requiredEquipment: 'GPS watch, saddle, hydration kit',
      recommendedRestPeriod: '1 day',
      healthPrecautions: 'Check legs and hydration before and after session',
      notes: 'Best used early in the training cycle',
      createdBy: 'Ali Hussein Salman',
      createdAt: '2026-05-10',
      status: 'Active',
    },
    {
      id: 'template_002',
      stableId,
      templateName: 'Recovery Walk Protocol',
      discipline: 'Endurance',
      category: 'Recovery',
      difficultyLevel: 'Beginner',
      estimatedDistance: '8 km',
      estimatedDuration: '45m',
      targetAverageSpeed: '10 km/h',
      targetMaxSpeed: '12 km/h',
      goal: 'Active recovery without cardiac strain',
      warmupInstructions: '5 minutes loose rein walk',
      mainExerciseInstructions: 'Continuous walk on soft footing',
      cooldownInstructions: '5 minutes walk, leg check',
      requiredEquipment: 'Basic tack, leg wraps optional',
      recommendedRestPeriod: '0 days',
      healthPrecautions: 'Avoid hard ground if legs are sensitive',
      notes: 'Use after competition or heavy workload',
      createdBy: 'Fatima Al-Rashid',
      createdAt: '2026-05-08',
      status: 'Active',
    },
    {
      id: 'template_003',
      stableId,
      templateName: 'Speed Interval Block',
      discipline: 'Flat Racing',
      category: 'Speed Work',
      difficultyLevel: 'Advanced',
      estimatedDistance: '15 km',
      estimatedDuration: '1h',
      targetAverageSpeed: '14 km/h',
      targetMaxSpeed: '28 km/h',
      goal: 'Develop speed endurance and pace discipline',
      warmupInstructions: '15 minutes progressive trot',
      mainExerciseInstructions: '4 x 1 km at target pace with 400m walk recovery',
      cooldownInstructions: '10 minutes walk, pulse check',
      requiredEquipment: 'GPS watch, heart rate monitor',
      recommendedRestPeriod: '2 days',
      healthPrecautions: 'Vet clearance required for max-effort work',
      notes: 'Not for horses returning from injury',
      createdBy: 'Ali Hussein Salman',
      createdAt: '2026-05-12',
      status: 'Active',
    },
    {
      id: 'template_004',
      stableId,
      templateName: 'Hill Strength Builder',
      discipline: 'Endurance',
      category: 'Hill Training',
      difficultyLevel: 'Intermediate',
      estimatedDistance: '12 km',
      estimatedDuration: '1h 15m',
      targetAverageSpeed: '11 km/h',
      targetMaxSpeed: '18 km/h',
      goal: 'Strengthen hindquarters and cardiovascular system',
      warmupInstructions: 'Flat warm-up 10 minutes',
      mainExerciseInstructions: 'Repeated hill climbs at controlled pace',
      cooldownInstructions: 'Extended walk on flat',
      requiredEquipment: 'Boots, hydration',
      recommendedRestPeriod: '1 day',
      healthPrecautions: 'Monitor tendon heat post-session',
      notes: 'Alternate direction on slopes when possible',
      createdBy: 'Omar Al-Dosari',
      createdAt: '2026-05-14',
      status: 'Active',
    },
    {
      id: 'template_005',
      stableId,
      templateName: 'Jumping Grid — Foundation',
      discipline: 'Jumping',
      category: 'Jumping Grid',
      difficultyLevel: 'Beginner',
      estimatedDistance: '—',
      estimatedDuration: '40m',
      targetAverageSpeed: '—',
      targetMaxSpeed: '—',
      goal: 'Rhythm, balance, and confidence over fences',
      warmupInstructions: 'Flat work 15 minutes, poles on ground',
      mainExerciseInstructions: 'Gymnastic grid 4–5 elements, repeat 3 times',
      cooldownInstructions: 'Walk, stretch, inspect legs',
      requiredEquipment: 'Jumping boots, standard poles and cups',
      recommendedRestPeriod: '1 day',
      healthPrecautions: 'Check footing and fence height for experience level',
      notes: 'Pair with flat work days',
      createdBy: 'Fatima Al-Rashid',
      createdAt: '2026-05-15',
      status: 'Active',
    },
    {
      id: 'template_006',
      stableId,
      templateName: 'Competition Prep — LSD',
      discipline: 'Endurance',
      category: 'Endurance Conditioning',
      difficultyLevel: 'Competition Prep',
      estimatedDistance: '30 km',
      estimatedDuration: '2h 30m',
      targetAverageSpeed: '12 km/h',
      targetMaxSpeed: '20 km/h',
      goal: 'Peak aerobic volume before taper',
      warmupInstructions: 'Standard endurance warm-up protocol',
      mainExerciseInstructions: 'Long slow distance with timed hydration stops',
      cooldownInstructions: '20 minute walk, full leg inspection',
      requiredEquipment: 'Full endurance kit, crew support recommended',
      recommendedRestPeriod: '2 days',
      healthPrecautions: 'Mandatory vet check within 48h before use',
      notes: 'Legacy template — review before 2026 season',
      createdBy: 'Ali Hussein Salman',
      createdAt: '2026-04-01',
      status: 'Inactive',
    },
  ];
}

function sessionStatusTone(status) {
  const map = {
    Planned: 'planned',
    'In Progress': 'progress',
    Completed: 'completed',
    Cancelled: 'cancelled',
  };
  return map[status] || 'neutral';
}

function templateStatusTone(status) {
  return status === 'Active' ? 'active' : 'inactive';
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
}

function filterSessions(sessions, filters) {
  return sessions.filter((s) => {
    if (filters.horse && s.horseName !== filters.horse) return false;
    if (filters.rider && s.riderName !== filters.rider) return false;
    if (filters.trainer && s.trainerName !== filters.trainer) return false;
    if (filters.trainingType && s.trainingType !== filters.trainingType) return false;
    if (filters.date && s.date !== filters.date) return false;
    if (filters.day && s.day !== filters.day) return false;
    if (filters.status && s.status !== filters.status) return false;
    return true;
  });
}

function filterTemplates(templates, filters) {
  const q = filters.query.trim().toLowerCase();
  return templates.filter((t) => {
    if (q) {
      const hay = `${t.templateName} ${t.category} ${t.goal} ${t.createdBy}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.discipline && t.discipline !== filters.discipline) return false;
    if (filters.difficulty && t.difficultyLevel !== filters.difficulty) return false;
    if (filters.status && t.status !== filters.status) return false;
    return true;
  });
}

function isThisWeek(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

function computeSummary(sessions, templates) {
  return {
    totalSessions: sessions.length,
    completedSessions: sessions.filter((s) => s.status === 'Completed').length,
    plannedSessions: sessions.filter((s) => s.status === 'Planned').length,
    activeTemplates: templates.filter((t) => t.status === 'Active').length,
    trainingThisWeek: sessions.filter((s) => isThisWeek(s.date)).length,
  };
}

function nextTemplateId(templates) {
  const nums = templates
    .map((t) => t.id)
    .filter((id) => /^template_\d+$/.test(id))
    .map((id) => Number(id.replace('template_', ''), 10));
  const max = nums.length ? Math.max(...nums) : 0;
  return `template_${String(max + 1).padStart(3, '0')}`;
}

function StatusBadge({ label, tone }) {
  return <span className={`tp-badge tp-badge--${tone}`}>{label}</span>;
}

function SummaryCards({ summary, i18n }) {
  const { tsum } = i18n;
  const items = [
    { label: tsum('totalSessions'), value: summary.totalSessions, icon: ClipboardList },
    { label: tsum('completedSessions'), value: summary.completedSessions, icon: CheckCircle2 },
    { label: tsum('plannedSessions'), value: summary.plannedSessions, icon: Calendar },
    { label: tsum('activeTemplates'), value: summary.activeTemplates, icon: BookOpen },
    { label: tsum('trainingThisWeek'), value: summary.trainingThisWeek, icon: Calendar },
  ];

  return (
    <div className="tp-summary">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="tp-summary__card">
          <span className="tp-summary__icon" aria-hidden>
            <Icon size={20} />
          </span>
          <div>
            <p className="tp-summary__label">{label}</p>
            <p className="tp-summary__value">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailSection({ title, fields }) {
  return (
    <section className="tp-detail-section">
      <h3 className="tp-detail-section__title">{title}</h3>
      <div className="tp-field-grid">
        {fields.map(({ label, value }) => (
          <div key={label} className="tp-field--card">
            <span className="tp-field__label">{label}</span>
            <span className="tp-field__value">{value || '—'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SessionDetailModal({ session, onClose, i18n }) {
  if (!session) return null;

  const {
    th,
    tc,
    tf,
    tsm,
    translateSessionStatus,
    translateTrainingType,
    translateDay,
    translateGarmin,
    translateValue,
  } = i18n;

  const fields = {
    basic: [
      { label: tc('horse'), value: session.horseName },
      { label: tc('rider'), value: session.riderName },
      { label: tc('trainer'), value: session.trainerName },
      { label: tc('date'), value: session.date },
      { label: tc('day'), value: translateDay(session.day) },
      { label: tc('time'), value: session.time },
      { label: tc('trainingType'), value: translateTrainingType(session.trainingType) },
      { label: tf('trainingGoal'), value: translateValue(session.goal) },
    ],
    metrics: [
      { label: tc('distance'), value: session.distance },
      { label: tc('duration'), value: session.duration },
      { label: tf('averageSpeed'), value: session.averageSpeed },
      { label: tf('maxSpeed'), value: session.maxSpeed },
      { label: tf('heartRateNotes'), value: translateValue(session.heartRateNotes) },
    ],
    condition: [
      { label: tf('conditionBefore'), value: translateValue(session.conditionBefore) },
      { label: tf('conditionAfter'), value: translateValue(session.conditionAfter) },
      { label: tf('recoveryNotes'), value: translateValue(session.recoveryNotes) },
      { label: tf('trainerNotes'), value: translateValue(session.trainerNotes) },
      { label: tf('riderFeedback'), value: translateValue(session.riderFeedback) },
    ],
    system: [
      { label: tf('garminSync'), value: translateGarmin(session.garminSyncStatus) },
      { label: tf('calendarEventId'), value: session.calendarEventId },
      { label: tc('createdBy'), value: session.createdBy },
      { label: tf('createdAt'), value: session.createdAt },
      { label: tf('completedAt'), value: session.completedAt },
    ],
  };

  return (
    <div className="tp-modal" role="dialog" aria-modal="true" aria-labelledby="tp-session-detail-title">
      <button type="button" className="tp-modal__backdrop" onClick={onClose} aria-label={th('close')} />
      <div className="tp-modal__panel tp-modal__panel--wide">
        <header className="tp-modal__head">
          <div>
            <h2 id="tp-session-detail-title" className="tp-modal__title">
              {th('sessionModal.title')}
            </h2>
            <p className="tp-modal__subtitle">
              {session.horseName} · {session.date} · {session.time}
            </p>
          </div>
          <StatusBadge
            label={translateSessionStatus(session.status)}
            tone={sessionStatusTone(session.status)}
          />
          <button type="button" className="tp-btn tp-btn--icon" onClick={onClose} aria-label={th('close')}>
            <X size={20} />
            </button>
        </header>
        <div className="tp-modal__body">
          <DetailSection title={tsm('overview')} fields={fields.basic} />
          <DetailSection title={tsm('metrics')} fields={fields.metrics} />
          <DetailSection title={tsm('condition')} fields={fields.condition} />
          <DetailSection title={tsm('system')} fields={fields.system} />
        </div>
      </div>
    </div>
  );
}

function TemplateDetailModal({ template, onClose, i18n }) {
  if (!template) return null;

  const {
    th,
    tc,
    tf,
    ttm,
    translateTemplateStatus,
    translateDiscipline,
    translateCategory,
    translateDifficulty,
    translateValue,
  } = i18n;

  return (
    <div className="tp-modal" role="dialog" aria-modal="true" aria-labelledby="tp-template-detail-title">
      <button type="button" className="tp-modal__backdrop" onClick={onClose} aria-label={th('close')} />
      <div className="tp-modal__panel tp-modal__panel--wide">
        <header className="tp-modal__head">
          <div>
            <h2 id="tp-template-detail-title" className="tp-modal__title">
              {translateValue(template.templateName)}
            </h2>
            <p className="tp-modal__subtitle">
              {translateDiscipline(template.discipline)} · {translateCategory(template.category)}
            </p>
          </div>
          <StatusBadge
            label={translateTemplateStatus(template.status)}
            tone={templateStatusTone(template.status)}
          />
          <button type="button" className="tp-btn tp-btn--icon" onClick={onClose} aria-label={th('close')}>
            <X size={20} />
          </button>
        </header>
        <div className="tp-modal__body">
          <DetailSection
            title={ttm('basic')}
            fields={[
              { label: tf('templateName'), value: translateValue(template.templateName) },
              { label: tc('discipline'), value: translateDiscipline(template.discipline) },
              { label: tf('trainingCategory'), value: translateCategory(template.category) },
              { label: tf('difficultyLevel'), value: translateDifficulty(template.difficultyLevel) },
              { label: tc('status'), value: translateTemplateStatus(template.status) },
            ]}
          />
          <DetailSection
            title={ttm('targets')}
            fields={[
              { label: tf('estimatedDistance'), value: template.estimatedDistance },
              { label: tf('estimatedDuration'), value: template.estimatedDuration },
              { label: tf('targetAverageSpeed'), value: template.targetAverageSpeed },
              { label: tf('targetMaxSpeed'), value: template.targetMaxSpeed },
              { label: tf('trainingGoal'), value: translateValue(template.goal) },
            ]}
          />
          <DetailSection
            title={ttm('instructions')}
            fields={[
              { label: tf('warmupInstructions'), value: template.warmupInstructions },
              { label: tf('mainExerciseInstructions'), value: template.mainExerciseInstructions },
              { label: tf('cooldownInstructions'), value: template.cooldownInstructions },
            ]}
          />
          <DetailSection
            title={ttm('equipment')}
            fields={[
              { label: tf('requiredEquipment'), value: template.requiredEquipment },
              { label: tf('recommendedRestPeriod'), value: template.recommendedRestPeriod },
              { label: tf('healthPrecautions'), value: template.healthPrecautions },
              { label: tf('notes'), value: template.notes },
            ]}
          />
          <DetailSection
            title={ttm('metadata')}
            fields={[
              { label: tc('createdBy'), value: template.createdBy },
              { label: tf('createdAt'), value: template.createdAt },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function AddTemplateModal({ open, form, onChange, onClose, onSubmit, createdBy, i18n }) {
  const {
    th,
    tc,
    tf,
    ttm,
    translateDiscipline,
    translateCategory,
    translateDifficulty,
    translateTemplateStatus,
  } = i18n;
  if (!open) return null;

  return (
    <div className="tp-modal" role="dialog" aria-modal="true" aria-labelledby="tp-add-template-title">
      <button type="button" className="tp-modal__backdrop" onClick={onClose} aria-label={th('close')} />
      <div className="tp-modal__panel tp-modal__panel--wide">
        <header className="tp-modal__head">
          <h2 id="tp-add-template-title" className="tp-modal__title">
            {th('templateModal.addTitle')}
          </h2>
          <button type="button" className="tp-btn tp-btn--icon" onClick={onClose} aria-label={th('close')}>
            <X size={20} />
          </button>
        </header>
        <form
          className="tp-modal__form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <fieldset className="tp-form-section">
            <legend className="tp-form-section__title">{ttm('basic')}</legend>
            <div className="tp-form-grid">
              <label className="tp-field">
                <span className="tp-field__label">{tf('templateName')} *</span>
                <input
                  className="tp-input"
                  value={form.templateName}
                  onChange={(e) => onChange('templateName', e.target.value)}
                  required
                />
              </label>
              <label className="tp-field">
                <span className="tp-field__label">{tc('discipline')}</span>
                <select
                  className="tp-input"
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
              <label className="tp-field">
                <span className="tp-field__label">{tf('trainingCategory')}</span>
                <select
                  className="tp-input"
                  value={form.category}
                  onChange={(e) => onChange('category', e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {translateCategory(c.value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tp-field">
                <span className="tp-field__label">{tf('difficultyLevel')}</span>
                <select
                  className="tp-input"
                  value={form.difficultyLevel}
                  onChange={(e) => onChange('difficultyLevel', e.target.value)}
                >
                  {DIFFICULTY_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {translateDifficulty(l.value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tp-field">
                <span className="tp-field__label">{th('columns.status')}</span>
                <select
                  className="tp-input"
                  value={form.status}
                  onChange={(e) => onChange('status', e.target.value)}
                >
                  {TEMPLATE_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {translateTemplateStatus(s.value)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset className="tp-form-section">
            <legend className="tp-form-section__title">{ttm('targets')}</legend>
            <div className="tp-form-grid">
              <label className="tp-field">
                <span className="tp-field__label">{tf('estimatedDistance')}</span>
                <input
                  className="tp-input"
                  value={form.estimatedDistance}
                  onChange={(e) => onChange('estimatedDistance', e.target.value)}
                  placeholder="20 km"
                />
              </label>
              <label className="tp-field">
                <span className="tp-field__label">{tf('estimatedDuration')}</span>
                <input
                  className="tp-input"
                  value={form.estimatedDuration}
                  onChange={(e) => onChange('estimatedDuration', e.target.value)}
                  placeholder="1h 30m"
                />
              </label>
              <label className="tp-field">
                <span className="tp-field__label">{tf('targetAverageSpeed')}</span>
                <input
                  className="tp-input"
                  value={form.targetAverageSpeed}
                  onChange={(e) => onChange('targetAverageSpeed', e.target.value)}
                />
              </label>
              <label className="tp-field">
                <span className="tp-field__label">{tf('targetMaxSpeed')}</span>
                <input
                  className="tp-input"
                  value={form.targetMaxSpeed}
                  onChange={(e) => onChange('targetMaxSpeed', e.target.value)}
                />
              </label>
              <label className="tp-field tp-field--full">
                <span className="tp-field__label">{tf('trainingGoal')}</span>
                <textarea
                  className="tp-input tp-input--area"
                  rows={2}
                  value={form.goal}
                  onChange={(e) => onChange('goal', e.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="tp-form-section">
            <legend className="tp-form-section__title">{ttm('instructions')}</legend>
            <div className="tp-form-grid tp-form-grid--stack">
              <label className="tp-field tp-field--full">
                <span className="tp-field__label">{tf('warmupInstructions')}</span>
                <textarea
                  className="tp-input tp-input--area"
                  rows={2}
                  value={form.warmupInstructions}
                  onChange={(e) => onChange('warmupInstructions', e.target.value)}
                />
              </label>
              <label className="tp-field tp-field--full">
                <span className="tp-field__label">{tf('mainExerciseInstructions')}</span>
                <textarea
                  className="tp-input tp-input--area"
                  rows={3}
                  value={form.mainExerciseInstructions}
                  onChange={(e) => onChange('mainExerciseInstructions', e.target.value)}
                />
              </label>
              <label className="tp-field tp-field--full">
                <span className="tp-field__label">{tf('cooldownInstructions')}</span>
                <textarea
                  className="tp-input tp-input--area"
                  rows={2}
                  value={form.cooldownInstructions}
                  onChange={(e) => onChange('cooldownInstructions', e.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="tp-form-section">
            <legend className="tp-form-section__title">{ttm('equipment')}</legend>
            <div className="tp-form-grid tp-form-grid--stack">
              <label className="tp-field tp-field--full">
                <span className="tp-field__label">{tf('requiredEquipment')}</span>
                <input
                  className="tp-input"
                  value={form.requiredEquipment}
                  onChange={(e) => onChange('requiredEquipment', e.target.value)}
                />
              </label>
              <label className="tp-field">
                <span className="tp-field__label">{tf('recommendedRestPeriod')}</span>
                <input
                  className="tp-input"
                  value={form.recommendedRestPeriod}
                  onChange={(e) => onChange('recommendedRestPeriod', e.target.value)}
                />
              </label>
              <label className="tp-field tp-field--full">
                <span className="tp-field__label">{tf('healthPrecautions')}</span>
                <textarea
                  className="tp-input tp-input--area"
                  rows={2}
                  value={form.healthPrecautions}
                  onChange={(e) => onChange('healthPrecautions', e.target.value)}
                />
              </label>
              <label className="tp-field tp-field--full">
                <span className="tp-field__label">{tf('notes')}</span>
                <textarea
                  className="tp-input tp-input--area"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => onChange('notes', e.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <p className="tp-form-meta">
            {th('createdBy')}: {createdBy}
          </p>

          <footer className="tp-modal__foot">
            <button type="button" className="tp-btn tp-btn--ghost" onClick={onClose}>
              {th('cancel')}
            </button>
            <button type="submit" className="tp-btn tp-btn--gold">
              <Plus size={16} aria-hidden />
              {th('addTemplate')}
            </button>
          </footer>
        </form>
          </div>
    </div>
  );
}

function PrintableSession({ session, i18n }) {
  if (!session) return null;
  const {
    th,
    tc,
    tf,
    translateSessionStatus,
    translateTrainingType,
    translateDay,
    translateGarmin,
    translateValue,
    t,
  } = i18n;
  const empty = t('common.emptyCell');
  const rows = [
    [tc('horse'), session.horseName],
    [tc('rider'), session.riderName],
    [tc('trainer'), session.trainerName],
    [tc('date'), session.date],
    [tc('day'), translateDay(session.day)],
    [tc('time'), session.time],
    [tc('trainingType'), translateTrainingType(session.trainingType)],
    [tf('trainingGoal'), translateValue(session.goal)],
    [tc('distance'), session.distance],
    [tc('duration'), session.duration],
    [tf('averageSpeed'), session.averageSpeed],
    [tf('maxSpeed'), session.maxSpeed],
    [tc('status'), translateSessionStatus(session.status)],
    [tf('conditionBefore'), translateValue(session.conditionBefore)],
    [tf('conditionAfter'), translateValue(session.conditionAfter)],
    [tf('recoveryNotes'), translateValue(session.recoveryNotes)],
    [tf('trainerNotes'), translateValue(session.trainerNotes)],
    [tf('riderFeedback'), translateValue(session.riderFeedback)],
    [th('print.garmin'), translateGarmin(session.garminSyncStatus)],
    [th('print.calendarEvent'), session.calendarEventId],
    [tc('createdBy'), session.createdBy],
    [tf('createdAt'), session.createdAt],
    [tf('completedAt'), session.completedAt],
  ];
  return (
    <div className="tp-print-root" aria-hidden>
      <header className="tp-print-header">
        <h1>{th('print.title')}</h1>
        <p>
          {session.horseName} · {session.date} · {session.time}
        </p>
      </header>
      <table className="tp-print-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{value || empty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Training() {
  const i18n = useTrainingI18n();
  const {
    th,
    tc,
    tsl,
    translateSessionStatus,
    translateTrainingType,
    translateTemplateStatus,
    translateDiscipline,
    translateCategory,
    translateDifficulty,
    translateDay,
    translateValue,
  } = i18n;
  const { stableId, user } = useAuth();
  const sid = stableId || 'stable-1';
  const trainerName = user?.name || th('trainerDefault');

  const [activeTab, setActiveTab] = useState('schedule');
  const [sessions, setSessions] = useState(() => buildInitialSessions(sid));
  const [templates, setTemplates] = useState(() => buildInitialTemplates(sid));
  const [sessionFilters, setSessionFilters] = useState(DEFAULT_SESSION_FILTERS);
  const [libraryFilters, setLibraryFilters] = useState(DEFAULT_LIBRARY_FILTERS);
  const [viewSession, setViewSession] = useState(null);
  const [viewTemplate, setViewTemplate] = useState(null);
  const [printSession, setPrintSession] = useState(null);
  const [addTemplateOpen, setAddTemplateOpen] = useState(false);
  const [addTemplateForm, setAddTemplateForm] = useState(EMPTY_TEMPLATE_FORM);

  useEffect(() => {
    setSessions(buildInitialSessions(sid));
    setTemplates(buildInitialTemplates(sid));
    setSessionFilters(DEFAULT_SESSION_FILTERS);
    setLibraryFilters(DEFAULT_LIBRARY_FILTERS);
    setViewSession(null);
    setViewTemplate(null);
  }, [sid]);

  useEffect(() => {
    if (!printSession) return undefined;
    const timer = window.setTimeout(() => {
      window.print();
      setPrintSession(null);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [printSession]);

  const filteredSessions = useMemo(
    () => filterSessions(sessions, sessionFilters),
    [sessions, sessionFilters]
  );
  const filteredTemplates = useMemo(
    () => filterTemplates(templates, libraryFilters),
    [templates, libraryFilters]
  );
  const summary = useMemo(() => computeSummary(sessions, templates), [sessions, templates]);

  const sessionFilterOptions = useMemo(
    () => ({
      horses: uniqueValues(sessions, 'horseName'),
      riders: uniqueValues(sessions, 'riderName'),
      trainers: uniqueValues(sessions, 'trainerName'),
      types: uniqueValues(sessions, 'trainingType'),
      days: uniqueValues(sessions, 'day'),
    }),
    [sessions]
  );

  const hasSessionFilters = useMemo(
    () => Object.values(sessionFilters).some((v) => String(v).trim() !== ''),
    [sessionFilters]
  );
  const hasLibraryFilters = useMemo(
    () => Object.values(libraryFilters).some((v) => String(v).trim() !== ''),
    [libraryFilters]
  );

  const handlePrintSession = useCallback(
    (session) => {
      toast(th('print.preparing'));
      setPrintSession(session);
    },
    [th]
  );

  const handleMarkComplete = useCallback((sessionId) => {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, status: 'Completed', completedAt: stamp, garminSyncStatus: s.garminSyncStatus || 'Pending' }
          : s
      )
    );
    toast.success(th('toast.markedComplete'));
  }, [th]);

  const handleAddNotes = useCallback(() => {
    toast(th('toast.notesPlaceholder'));
  }, [th]);

  const handleEditTemplate = useCallback(() => {
    toast(th('toast.editPlaceholder'));
  }, [th]);

  const handleDuplicateTemplate = useCallback(
    (template) => {
      const copy = {
        ...template,
        id: nextTemplateId(templates),
        templateName: `${template.templateName}${th('toast.copySuffix')}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setTemplates((prev) => [...prev, copy]);
      toast.success(th('toast.duplicated', { name: copy.templateName }));
    },
    [templates, th]
  );

  const handleDeactivateTemplate = useCallback(
    (templateId) => {
      setTemplates((prev) =>
        prev.map((t) => (t.id === templateId ? { ...t, status: 'Inactive' } : t))
      );
      toast.success(th('toast.deactivated'));
    },
    [th]
  );

  const handleAddTemplateSubmit = useCallback(() => {
    const name = addTemplateForm.templateName.trim();
    if (!name) return;
    const newTemplate = {
      id: nextTemplateId(templates),
      stableId: sid,
      templateName: name,
      discipline: addTemplateForm.discipline,
      category: addTemplateForm.category,
      difficultyLevel: addTemplateForm.difficultyLevel,
      estimatedDistance: addTemplateForm.estimatedDistance.trim() || '—',
      estimatedDuration: addTemplateForm.estimatedDuration.trim() || '—',
      targetAverageSpeed: addTemplateForm.targetAverageSpeed.trim() || '—',
      targetMaxSpeed: addTemplateForm.targetMaxSpeed.trim() || '—',
      goal: addTemplateForm.goal.trim() || '—',
      warmupInstructions: addTemplateForm.warmupInstructions.trim() || '—',
      mainExerciseInstructions: addTemplateForm.mainExerciseInstructions.trim() || '—',
      cooldownInstructions: addTemplateForm.cooldownInstructions.trim() || '—',
      requiredEquipment: addTemplateForm.requiredEquipment.trim() || '—',
      recommendedRestPeriod: addTemplateForm.recommendedRestPeriod.trim() || '—',
      healthPrecautions: addTemplateForm.healthPrecautions.trim() || '—',
      notes: addTemplateForm.notes.trim() || '—',
      createdBy: trainerName,
      createdAt: new Date().toISOString().slice(0, 10),
      status: addTemplateForm.status,
    };
    setTemplates((prev) => [...prev, newTemplate]);
    setAddTemplateForm(EMPTY_TEMPLATE_FORM);
    setAddTemplateOpen(false);
    setActiveTab('library');
    toast.success(th('toast.templateAdded', { name }));
  }, [addTemplateForm, sid, templates, trainerName, th]);

  const updateSessionFilter = useCallback((key, value) => {
    setSessionFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateLibraryFilter = useCallback((key, value) => {
    setLibraryFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="tp-page">
      <header className="tp-page__header">
    <div>
          <h1 className="tp-page__title">{th('title')}</h1>
          <p className="tp-page__subtitle">{th('subtitle')}</p>
        </div>
        {activeTab === 'library' ? (
          <button type="button" className="tp-btn tp-btn--gold" onClick={() => setAddTemplateOpen(true)}>
            <Plus size={18} aria-hidden />
            {th('addTemplate')}
          </button>
        ) : null}
      </header>

      <SummaryCards summary={summary} i18n={i18n} />

      <nav className="tp-tabs" aria-label={th('tabsA11y')}>
        {TAB_CONFIG.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`tp-tabs__btn${activeTab === id ? ' tp-tabs__btn--active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} aria-hidden />
            {th(`tabs.${id}`)}
          </button>
        ))}
      </nav>

      {activeTab === 'schedule' ? (
        <>
          <section className="tp-filters" aria-label={th('sessionFiltersTitle')}>
            <div className="tp-filters__head">
              <Filter size={18} aria-hidden />
              <span>{th('sessionFiltersTitle')}</span>
              {hasSessionFilters ? (
                <button
                  type="button"
                  className="tp-btn tp-btn--ghost tp-btn--sm"
                  onClick={() => setSessionFilters(DEFAULT_SESSION_FILTERS)}
                >
                  <RotateCcw size={14} aria-hidden />
                  {th('resetFilters')}
                </button>
              ) : null}
            </div>
            <div className="tp-filters__grid">
              <label className="tp-filter">
                <span className="tp-filter__label">{tsl('horse')}</span>
                <select
                  value={sessionFilters.horse}
                  onChange={(e) => updateSessionFilter('horse', e.target.value)}
                >
                  <option value="">{th('allHorses')}</option>
                  {sessionFilterOptions.horses.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tp-filter">
                <span className="tp-filter__label">{tsl('rider')}</span>
                <select
                  value={sessionFilters.rider}
                  onChange={(e) => updateSessionFilter('rider', e.target.value)}
                >
                  <option value="">{th('allRiders')}</option>
                  {sessionFilterOptions.riders.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tp-filter">
                <span className="tp-filter__label">{tsl('trainer')}</span>
                <select
                  value={sessionFilters.trainer}
                  onChange={(e) => updateSessionFilter('trainer', e.target.value)}
                >
                  <option value="">{th('allTrainers')}</option>
                  {sessionFilterOptions.trainers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tp-filter">
                <span className="tp-filter__label">{tsl('trainingType')}</span>
                <select
                  value={sessionFilters.trainingType}
                  onChange={(e) => updateSessionFilter('trainingType', e.target.value)}
                >
                  <option value="">{th('allTypes')}</option>
                  {sessionFilterOptions.types.map((t) => (
                    <option key={t} value={t}>
                      {translateTrainingType(t)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tp-filter">
                <span className="tp-filter__label">{tsl('date')}</span>
                <input
                  type="date"
                  value={sessionFilters.date}
                  onChange={(e) => updateSessionFilter('date', e.target.value)}
                />
              </label>
              <label className="tp-filter">
                <span className="tp-filter__label">{tsl('day')}</span>
                <select value={sessionFilters.day} onChange={(e) => updateSessionFilter('day', e.target.value)}>
                  <option value="">{th('allDays')}</option>
                  {sessionFilterOptions.days.map((d) => (
                    <option key={d} value={d}>
                      {translateDay(d)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tp-filter">
                <span className="tp-filter__label">{tsl('status')}</span>
                <select
                  value={sessionFilters.status}
                  onChange={(e) => updateSessionFilter('status', e.target.value)}
                >
                  <option value="">{th('allStatuses')}</option>
                  {SESSION_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {translateSessionStatus(s.value)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {filteredSessions.length === 0 ? (
            <div className="tp-empty">
              <Calendar size={40} strokeWidth={1.25} aria-hidden />
              <p>{hasSessionFilters ? th('emptyFiltered') : th('empty')}</p>
              {hasSessionFilters ? (
                <button
                  type="button"
                  className="tp-btn tp-btn--outline"
                  onClick={() => setSessionFilters(DEFAULT_SESSION_FILTERS)}
                >
                  {th('resetFilters')}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="tp-table-wrap">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>{tc('date')}</th>
                    <th>{tc('day')}</th>
                    <th>{tc('time')}</th>
                    <th>{tc('horse')}</th>
                    <th>{tc('rider')}</th>
                    <th>{tc('trainer')}</th>
                    <th>{tc('trainingType')}</th>
                    <th>{tc('distance')}</th>
                    <th>{tc('duration')}</th>
                    <th>{tc('avgSpeed')}</th>
                    <th>{tc('status')}</th>
                    <th>{tc('conditionAfter')}</th>
                    <th>{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.date}</td>
                      <td>{translateDay(session.day)}</td>
                      <td>{session.time}</td>
                      <td className="tp-table__primary">{session.horseName}</td>
                      <td>{session.riderName}</td>
                      <td>{session.trainerName}</td>
                      <td>{translateTrainingType(session.trainingType)}</td>
                      <td>{session.distance}</td>
                      <td>{session.duration}</td>
                      <td>{session.averageSpeed}</td>
                      <td>
                        <StatusBadge
                          label={translateSessionStatus(session.status)}
                          tone={sessionStatusTone(session.status)}
                        />
                      </td>
                      <td>{translateValue(session.conditionAfter)}</td>
                      <td>
                        <div className="tp-row-actions">
                          <button
                            type="button"
                            className="tp-btn tp-btn--xs tp-btn--outline"
                            onClick={() => setViewSession(session)}
                            title={th('view')}
                          >
                            <Eye size={13} aria-hidden />
                            {th('view')}
                          </button>
                          <button
                            type="button"
                            className="tp-btn tp-btn--xs tp-btn--ghost"
                            onClick={() => handlePrintSession(session)}
                            title="Print"
                          >
                            <Printer size={13} aria-hidden />
                          </button>
                          {session.status !== 'Completed' && session.status !== 'Cancelled' ? (
                            <button
                              type="button"
                              className="tp-btn tp-btn--xs tp-btn--gold"
                              onClick={() => handleMarkComplete(session.id)}
                              title="Mark complete"
                            >
                              <CheckCircle2 size={13} aria-hidden />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="tp-btn tp-btn--xs tp-btn--ghost"
                            onClick={handleAddNotes}
                            title="Add notes"
                          >
                            <StickyNote size={13} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <section className="tp-filters" aria-label={th('libraryFiltersTitle')}>
            <div className="tp-filters__head">
              <Filter size={18} aria-hidden />
              <span>{th('libraryFiltersTitle')}</span>
              {hasLibraryFilters ? (
                <button
                  type="button"
                  className="tp-btn tp-btn--ghost tp-btn--sm"
                  onClick={() => setLibraryFilters(DEFAULT_LIBRARY_FILTERS)}
                >
                  <RotateCcw size={14} aria-hidden />
                  {th('resetFilters')}
                </button>
              ) : null}
            </div>
            <div className="tp-filters__grid">
              <label className="tp-filter tp-filter--search tp-filter--wide">
                <Search size={16} aria-hidden />
                <input
                  type="search"
                  placeholder={th('searchTemplates')}
                  value={libraryFilters.query}
                  onChange={(e) => updateLibraryFilter('query', e.target.value)}
                />
              </label>
              <label className="tp-filter">
                <span className="tp-filter__label">{tsl('discipline')}</span>
                <select
                  value={libraryFilters.discipline}
                  onChange={(e) => updateLibraryFilter('discipline', e.target.value)}
                >
                  <option value="">{th('allDisciplines')}</option>
                  {DISCIPLINE_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {translateDiscipline(d.value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tp-filter">
                <span className="tp-filter__label">{tsl('difficulty')}</span>
                <select
                  value={libraryFilters.difficulty}
                  onChange={(e) => updateLibraryFilter('difficulty', e.target.value)}
                >
                  <option value="">{th('allLevels')}</option>
                  {DIFFICULTY_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {translateDifficulty(l.value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tp-filter">
                <span className="tp-filter__label">{tsl('status')}</span>
                <select
                  value={libraryFilters.status}
                  onChange={(e) => updateLibraryFilter('status', e.target.value)}
                >
                  <option value="">{th('allStatuses')}</option>
                  {TEMPLATE_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {translateTemplateStatus(s.value)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {filteredTemplates.length === 0 ? (
            <div className="tp-empty">
              <Library size={40} strokeWidth={1.25} aria-hidden />
              <p>{hasLibraryFilters ? th('libraryEmptyFiltered') : th('libraryEmpty')}</p>
              {hasLibraryFilters ? (
                <button
                  type="button"
                  className="tp-btn tp-btn--outline"
                  onClick={() => setLibraryFilters(DEFAULT_LIBRARY_FILTERS)}
                >
                  {th('resetFilters')}
                </button>
              ) : (
                <button type="button" className="tp-btn tp-btn--gold" onClick={() => setAddTemplateOpen(true)}>
                  <Plus size={16} aria-hidden />
                  {th('addTemplate')}
                </button>
              )}
            </div>
          ) : (
            <div className="tp-table-wrap">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>{tc('templateName')}</th>
                    <th>{tc('discipline')}</th>
                    <th>{tc('category')}</th>
                    <th>{tc('difficulty')}</th>
                    <th>{tc('estDistance')}</th>
                    <th>{tc('estDuration')}</th>
                    <th>{tc('targetSpeed')}</th>
                    <th>{tc('goal')}</th>
                    <th>{tc('createdBy')}</th>
                    <th>{tc('status')}</th>
                    <th>{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map((template) => (
                    <tr key={template.id}>
                      <td className="tp-table__primary">{translateValue(template.templateName)}</td>
                      <td>{translateDiscipline(template.discipline)}</td>
                      <td>{translateCategory(template.category)}</td>
                      <td>{translateDifficulty(template.difficultyLevel)}</td>
                      <td>{template.estimatedDistance}</td>
                      <td>{template.estimatedDuration}</td>
                      <td>{template.targetAverageSpeed}</td>
                      <td className="tp-table__truncate" title={translateValue(template.goal)}>
                        {translateValue(template.goal)}
                      </td>
                      <td>{template.createdBy}</td>
                      <td>
                        <StatusBadge
                          label={translateTemplateStatus(template.status)}
                          tone={templateStatusTone(template.status)}
                        />
                      </td>
                      <td>
                        <div className="tp-row-actions">
                          <button
                            type="button"
                            className="tp-btn tp-btn--xs tp-btn--outline"
                            onClick={() => setViewTemplate(template)}
                          >
                            <Eye size={13} aria-hidden />
                            {th('view')}
                          </button>
                          <button
                            type="button"
                            className="tp-btn tp-btn--xs tp-btn--ghost"
                            onClick={handleEditTemplate}
                          >
                            <MessageSquare size={13} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="tp-btn tp-btn--xs tp-btn--ghost"
                            onClick={() => handleDuplicateTemplate(template)}
                          >
                            <Copy size={13} aria-hidden />
                          </button>
                          {template.status === 'Active' ? (
                            <button
                              type="button"
                              className="tp-btn tp-btn--xs tp-btn--ghost"
                              onClick={() => handleDeactivateTemplate(template.id)}
                            >
                              {th('deactivate')}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <SessionDetailModal
        session={viewSession}
        onClose={() => setViewSession(null)}
        i18n={i18n}
      />
      <TemplateDetailModal
        template={viewTemplate}
        onClose={() => setViewTemplate(null)}
        i18n={i18n}
      />
      <AddTemplateModal
        open={addTemplateOpen}
        form={addTemplateForm}
        createdBy={trainerName}
        i18n={i18n}
        onChange={(key, value) => setAddTemplateForm((prev) => ({ ...prev, [key]: value }))}
        onClose={() => {
          setAddTemplateOpen(false);
          setAddTemplateForm(EMPTY_TEMPLATE_FORM);
        }}
        onSubmit={handleAddTemplateSubmit}
      />
      <PrintableSession session={printSession} i18n={i18n} />
    </div>
  );
}
