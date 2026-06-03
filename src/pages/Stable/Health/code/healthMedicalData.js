/**
 * Medical management dummy data — backend-ready shapes (stableId, horseId).
 */

export const DEMO_NOW = '2026-05-17T08:08';
export const DEMO_DATE = '2026-05-17';

export const RECORDED_BY = ['Doctor', 'Trainer', 'Stable Staff'];
export const WEIGHT_METHODS = ['Scale', 'Weight Tape', 'Estimated'];
export const MUCOUS_OPTIONS = ['Normal', 'Pale', 'Red', 'Yellow', 'Blue/Purple'];
export const HYDRATION_OPTIONS = ['Normal', 'Mild Dehydration', 'Moderate Dehydration', 'Severe Dehydration'];
export const ATTITUDE_OPTIONS = ['Normal', 'Quiet', 'Depressed', 'Excited', 'Aggressive'];
export const APPETITE_OPTIONS = ['Normal', 'Reduced', 'None'];
export const LIMB_TAGS = ['Swelling', 'Heat', 'Pain', 'Wound', 'Tendon Concern', 'Joint Concern', 'Sensitive', 'Normal'];
export const SKIN_TAGS = ['Normal', 'Wound', 'Rash', 'Hair Loss', 'Swelling', 'Skin Irritation'];
export const HEAD_TAGS = ['Normal', 'Discharge', 'Redness', 'Ulcer Concern', 'Nasal Discharge', 'Mouth Injury'];
export const GUT_SOUNDS = ['Normal', 'Reduced', 'Absent', 'Increased'];
export const COLIC_OPTIONS = ['No', 'Suspected', 'Yes'];
export const COUGH_OPTIONS = ['No', 'Yes'];
export const NASAL_DISCHARGE = ['No', 'Clear', 'Yellow', 'Bloody'];
export const BREATHING_EFFORT = ['Normal', 'Mild', 'Moderate', 'Severe'];
export const AUSCULTATION = ['Normal', 'Murmur', 'Irregular Rhythm', 'Needs Review'];
export const CALENDAR_EVENT_TYPES = [
  'Post-training quick check',
  'Weekly detailed examination',
  'Blood test',
  'Shockwave therapy',
  'Cooling session',
  'Vaccination',
  'Deworming',
  'Medication dose',
  'Vet appointment',
  'Imaging / diagnostics',
  'Farrier / hoof care',
];
export const CALENDAR_STATUS = ['Scheduled', 'Completed', 'Missed', 'Cancelled'];
export const CALENDAR_PRIORITY = ['Low', 'Normal', 'High', 'Emergency'];
export const CALENDAR_REPEAT = ['No repeat', 'Daily', 'Weekly', 'Monthly', 'Custom'];
export const CALENDAR_ASSIGNED = ['Doctor', 'Trainer', 'Stable Staff', 'Veterinarian'];
export const MED_FREQUENCY = ['Once daily', 'Twice daily', 'Every 8 hours', 'Every 12 hours', 'Custom'];
export const MED_COURSE_STATUS = ['Active', 'Completed', 'Paused', 'Cancelled', 'Requires Vet Review'];
export const CARE_SUBTABS = [
  'Vaccinations',
  'Deworming',
  'Medications',
  'Allergies',
  'Injuries / Conditions',
  'Surgeries / Procedures',
  'Dental',
  'Farrier / Hoof Care',
  'Imaging / Diagnostics',
];

export const LIMBS = ['LF', 'RF', 'LH', 'RH'];

export const BLOOD_CBC_WBC = [
  { parameter: 'WBC', value: '7.5', unit: '×10³/µL', flag: 'N' },
  { parameter: 'LYM', value: '3.4', unit: '×10³/µL', flag: 'N' },
  { parameter: 'MON', value: '0.4', unit: '×10³/µL', flag: 'N' },
  { parameter: 'NEU', value: '3.8', unit: '×10³/µL', flag: 'N' },
  { parameter: 'EOS', value: '0.1', unit: '×10³/µL', flag: 'N' },
  { parameter: 'BAS', value: '0.0', unit: '×10³/µL', flag: 'N' },
];
export const BLOOD_CBC_DIFF = [
  { parameter: 'LYMp', value: '45', unit: '%', flag: 'N' },
  { parameter: 'MONp', value: '5', unit: '%', flag: 'N' },
  { parameter: 'NEUp', value: '50', unit: '%', flag: 'N' },
  { parameter: 'EOSp', value: '2', unit: '%', flag: 'N' },
  { parameter: 'BASp', value: '0', unit: '%', flag: 'N' },
];
export const BLOOD_CBC_RBC = [
  { parameter: 'RBC', value: '8.5', unit: '×10⁶/µL', flag: 'N' },
  { parameter: 'HGB', value: '14.5', unit: 'g/dL', flag: 'N' },
  { parameter: 'HCT', value: '48', unit: '%', flag: 'N' },
  { parameter: 'MCV', value: '45', unit: 'fL', flag: 'N' },
  { parameter: 'MCH', value: '17', unit: 'pg', flag: 'N' },
  { parameter: 'MCHC', value: '34', unit: 'g/dL', flag: 'N' },
  { parameter: 'RDWc', value: '15', unit: '%', flag: 'N' },
  { parameter: 'RDWs', value: '3.5', unit: 'fL', flag: 'N' },
];
export const BLOOD_PLATELETS = [
  { parameter: 'PLT', value: '200', unit: '×10³/µL', flag: 'N' },
  { parameter: 'MPV', value: '6.0', unit: 'fL', flag: 'N' },
  { parameter: 'PCT', value: '0.3', unit: '%', flag: 'N' },
  { parameter: 'PDWc', value: '12', unit: '%', flag: 'N' },
  { parameter: 'PDWs', value: '4.0', unit: 'fL', flag: 'N' },
];
export const BLOOD_CHEMISTRY = [
  { parameter: 'Na+', value: '138', unit: 'mEq/L', flag: 'N' },
  { parameter: 'K+', value: '3.8', unit: 'mEq/L', flag: 'N' },
  { parameter: 'tCO2', value: '25', unit: 'mEq/L', flag: 'N' },
  { parameter: 'CK', value: '150', unit: 'U/L', flag: 'N' },
  { parameter: 'GLU', value: '85', unit: 'mg/dL', flag: 'N' },
  { parameter: 'CA', value: '12.0', unit: 'mg/dL', flag: 'N' },
  { parameter: 'BUN', value: '15', unit: 'mg/dL', flag: 'N' },
  { parameter: 'CRE', value: '1.2', unit: 'mg/dL', flag: 'N' },
  { parameter: 'AST', value: '200', unit: 'U/L', flag: 'N' },
  { parameter: 'TBIL', value: '1.2', unit: 'mg/dL', flag: 'N' },
  { parameter: 'GGT', value: '12', unit: 'U/L', flag: 'N' },
  { parameter: 'ALB', value: '3.2', unit: 'g/dL', flag: 'N' },
  { parameter: 'TP', value: '6.5', unit: 'g/dL', flag: 'N' },
  { parameter: 'GLOB', value: '3.3', unit: 'g/dL', flag: 'N' },
];

export function cloneBloodPanels() {
  return {
    wbc: BLOOD_CBC_WBC.map((r) => ({ ...r })),
    diff: BLOOD_CBC_DIFF.map((r) => ({ ...r })),
    rbc: BLOOD_CBC_RBC.map((r) => ({ ...r })),
    platelets: BLOOD_PLATELETS.map((r) => ({ ...r })),
    chemistry: BLOOD_CHEMISTRY.map((r) => ({ ...r })),
  };
}

export function bloodHasAbnormalFlag(panels) {
  const rows = [...panels.wbc, ...panels.diff, ...panels.rbc, ...panels.platelets, ...panels.chemistry];
  return rows.some((r) => r.flag && r.flag !== 'N');
}

export function emptyLimb() {
  return { tags: [], lamenessGrade: '0', notes: '' };
}

export function emptyPhysicalExamForm() {
  return {
    visitDateTime: DEMO_NOW,
    doctor: 'Dr. Smith',
    location: 'Stable clinic',
    reason: '',
    temperature: '',
    pulse: '',
    respiration: '',
    mucousMembranes: 'Normal',
    crt: '',
    hydrationStatus: 'Normal',
    bodyConditionScore: '5',
    attitude: 'Normal',
    appetite: 'Normal',
    painScore: '0',
    limbs: { LF: emptyLimb(), RF: emptyLimb(), LH: emptyLimb(), RH: emptyLimb() },
    skinTags: [],
    skinNotes: '',
    headTags: ['Normal'],
    headNotes: '',
    dentalNotes: '',
    gutSounds: 'Normal',
    colic: 'No',
    giNotes: '',
    cough: 'No',
    nasalDischarge: 'No',
    breathingEffort: 'Normal',
    respiratoryNotes: '',
    auscultation: 'Normal',
    cardiovascularNotes: '',
  };
}

function baseHorse(overrides) {
  return {
    stableId: 'stable-1',
    image: '',
    ...overrides,
  };
}

function vaccinations() {
  return [
    { id: 'vac_1', date: '2025-08-08', name: 'Influenza', brand: 'Merial', nextDue: '2026-08-08', notes: 'Routine vaccination' },
    { id: 'vac_2', date: '2025-02-09', name: 'Tetanus', brand: 'Zoetis', nextDue: '2026-02-09', notes: 'Routine vaccination' },
  ];
}

export function buildInitialMedicalStore() {
  const horses = [
    baseHorse({
      horseId: 'horse_001',
      name: 'Thunder',
      age: '3 years',
      color: 'Grey',
      breed: 'Arabian',
      gender: 'Stallion',
      stableName: 'A1 Stable',
      veterinaryStatus: 'Fit',
      lastExamDate: '2026-05-14',
      nextScheduledCare: '2026-05-20',
      medicalAlert: false,
      badges: { fit: true, needsReview: false, medicationCourse: false, recovery: false, bloodTestDue: false },
      lastTrainingCheck: 'Normal — 2026-05-16',
      weeklyExamStatus: 'Completed — next due 2026-05-24',
      currentWeight: '412 kg',
      summary: {
        activeMedicationCourses: 0,
        upcomingEvents: 2,
        healthAlerts: 0,
      },
    }),
    baseHorse({
      horseId: 'horse_002',
      name: 'Desert Pearl',
      age: '5 years',
      color: 'Chestnut',
      breed: 'Arabian',
      gender: 'Mare',
      stableName: 'A1 Stable',
      veterinaryStatus: 'Fit',
      lastExamDate: '2026-05-10',
      nextScheduledCare: '2026-05-18',
      medicalAlert: false,
      badges: { fit: true, needsReview: false, medicationCourse: true, recovery: false, bloodTestDue: true },
      lastTrainingCheck: 'Normal — 2026-05-15',
      weeklyExamStatus: 'Due 2026-05-18',
      currentWeight: '428 kg',
      summary: {
        activeMedicationCourses: 1,
        upcomingEvents: 3,
        healthAlerts: 1,
      },
    }),
    baseHorse({
      horseId: 'horse_003',
      name: 'Royal Flame',
      age: '7 years',
      color: 'Bay',
      breed: 'Warmblood',
      gender: 'Gelding',
      stableName: 'Victorious Team Barn',
      veterinaryStatus: 'Under Observation',
      lastExamDate: '2026-05-14',
      nextScheduledCare: '2026-05-17',
      medicalAlert: true,
      badges: { fit: false, needsReview: true, medicationCourse: true, recovery: true, bloodTestDue: false },
      lastTrainingCheck: 'Needs Review — 2026-05-16',
      weeklyExamStatus: 'Completed — next due 2026-05-21',
      currentWeight: '545 kg',
      summary: {
        activeMedicationCourses: 1,
        upcomingEvents: 4,
        healthAlerts: 2,
      },
    }),
    baseHorse({
      horseId: 'horse_004',
      name: 'Silver Arrow',
      age: '4 years',
      color: 'Grey',
      breed: 'Thoroughbred',
      gender: 'Stallion',
      stableName: 'A1 Stable',
      veterinaryStatus: 'Restricted',
      lastExamDate: '2026-05-12',
      nextScheduledCare: '2026-05-19',
      medicalAlert: true,
      badges: { fit: false, needsReview: true, medicationCourse: false, recovery: false, bloodTestDue: true },
      lastTrainingCheck: 'Needs Review — 2026-05-15',
      weeklyExamStatus: 'Overdue — due 2026-05-16',
      currentWeight: '498 kg',
      summary: {
        activeMedicationCourses: 0,
        upcomingEvents: 2,
        healthAlerts: 2,
      },
    }),
  ];

  const recordsByHorse = {
    horse_001: {
      weightRecords: [
        { id: 'w_1', weight: '412', dateTime: '2026-05-14T07:30', method: 'Scale', recordedBy: 'Trainer', notes: 'Post-training' },
        { id: 'w_2', weight: '410', dateTime: '2026-05-07T08:00', method: 'Scale', recordedBy: 'Stable Staff', notes: '' },
      ],
      physicalExams: [
        {
          id: 'pe_1',
          visitDateTime: '2026-05-14T09:00',
          doctor: 'Dr. Smith',
          location: 'Stable clinic',
          reason: 'Routine weekly',
          overallStatus: 'Normal',
          painScore: '1',
          requiresVetReview: false,
          form: null,
        },
      ],
      bloodTests: [
        {
          id: 'bt_1',
          testDate: '2025-12-06T08:00',
          doctor: 'Dr. Smith',
          device: 'VetScan HM5',
          sampleId: 'SAMPLE-1-1',
          patientId: 'PAT-1',
          notes: 'Routine blood work',
          overallFlag: 'N',
          requiresVetReview: false,
          panels: cloneBloodPanels(),
          source: 'manual',
        },
      ],
      careHistory: {
        Vaccinations: vaccinations(),
        Deworming: [{ id: 'dw_1', date: '2026-03-01', name: 'Ivermectin', brand: 'Zoetis', nextDue: '2026-09-01', notes: '' }],
        Medications: [],
        Allergies: [],
        'Injuries / Conditions': [],
        'Surgeries / Procedures': [],
        Dental: [{ id: 'dn_1', date: '2026-01-10', name: 'Routine float', brand: '—', nextDue: '2027-01-10', notes: '' }],
        'Farrier / Hoof Care': [{ id: 'fh_1', date: '2026-05-01', name: 'Shoeing', brand: '—', nextDue: '2026-06-01', notes: '' }],
        'Imaging / Diagnostics': [],
      },
      calendarEvents: [
        { id: 'cal_horse_001_1', eventType: 'Weekly detailed examination', horseId: 'horse_001', horseName: 'Thunder', stableId: 'stable-1', date: '2026-05-24', time: '09:00', assignedTo: 'Doctor', priority: 'Normal', repeat: 'Weekly', notes: '', status: 'Scheduled' },
        { id: 'cal_horse_001_2', eventType: 'Post-training quick check', horseId: 'horse_001', horseName: 'Thunder', stableId: 'stable-1', date: '2026-05-17', time: '18:00', assignedTo: 'Trainer', priority: 'Normal', repeat: 'No repeat', notes: 'After endurance session', status: 'Scheduled' },
      ],
      medicationCourses: [],
      timeline: [
        { id: 'tl_1', type: 'weight', label: 'Weight record added', date: '2026-05-14' },
        { id: 'tl_2', type: 'exam', label: 'Physical examination completed', date: '2026-05-14' },
        { id: 'tl_3', type: 'blood', label: 'Blood test uploaded', date: '2025-12-06' },
        { id: 'tl_4', type: 'vaccine', label: 'Vaccination added', date: '2025-08-08' },
      ],
      postTrainingChecks: [
        { id: 'pt_1', session: 'Endurance base', checkedBy: 'Ali Hussein Salman', time: '2026-05-16T17:30', appetite: 'Normal', attitude: 'Normal', hydration: 'Normal', limbCondition: 'Normal', sweatingRecovery: 'Normal', swelling: 'No', notes: '', status: 'Normal' },
      ],
      weeklyExams: [
        { id: 'we_1', completedDate: '2026-05-14', completedBy: 'Dr. Smith', nextDue: '2026-05-24', status: 'Completed' },
      ],
    },
    horse_002: {
      weightRecords: [{ id: 'w_3', weight: '428', dateTime: '2026-05-10T08:00', method: 'Scale', recordedBy: 'Doctor', notes: '' }],
      physicalExams: [],
      bloodTests: [],
      careHistory: { Vaccinations: vaccinations(), Deworming: [], Medications: [{ id: 'med_1', date: '2026-05-01', name: 'Bute protocol', brand: '—', nextDue: '—', notes: 'Short course' }], Allergies: [], 'Injuries / Conditions': [], 'Surgeries / Procedures': [], Dental: [], 'Farrier / Hoof Care': [], 'Imaging / Diagnostics': [] },
      calendarEvents: [{ id: 'cal_horse_002_1', eventType: 'Blood test', horseId: 'horse_002', horseName: 'Desert Pearl', stableId: 'stable-1', date: '2026-05-18', time: '08:00', assignedTo: 'Veterinarian', priority: 'High', repeat: 'No repeat', notes: '', status: 'Scheduled' }],
      medicationCourses: [{
        id: 'mc_1', courseName: 'Anti-inflammatory support', medication: 'Phenylbutazone', reason: 'Mild inflammation', startDate: '2026-05-01', endDate: '2026-05-14', frequency: 'Twice daily', assignedBy: 'Dr. Smith', status: 'Active', nextDose: '2026-05-17 08:00', requiresVetApproval: true, withdrawalNotes: '72h before competition', notes: 'Vet approved', doses: ['2026-05-17 08:00', '2026-05-17 20:00'],
      }],
      timeline: [{ id: 'tl_5', type: 'med', label: 'Medication course started', date: '2026-05-01' }],
      postTrainingChecks: [],
      weeklyExams: [{ id: 'we_2', completedDate: '2026-05-10', completedBy: 'Dr. Smith', nextDue: '2026-05-18', status: 'Due soon' }],
    },
    horse_003: {
      weightRecords: [{ id: 'w_4', weight: '545', dateTime: '2026-05-14T10:00', method: 'Scale', recordedBy: 'Doctor', notes: 'Rehab monitoring' }],
      physicalExams: [{
        id: 'pe_2', visitDateTime: '2026-05-14T11:00', doctor: 'Dr. Smith', location: 'Indoor arena', reason: 'Tendon follow-up', overallStatus: 'Needs Review', painScore: '3', requiresVetReview: true, form: null,
      }],
      bloodTests: [],
      careHistory: { Vaccinations: vaccinations(), Deworming: [], Medications: [], Allergies: [], 'Injuries / Conditions': [{ id: 'inj_1', date: '2026-04-28', name: 'LF tendon strain', brand: '—', nextDue: '—', notes: 'Rehab' }], 'Surgeries / Procedures': [], Dental: [], 'Farrier / Hoof Care': [], 'Imaging / Diagnostics': [{ id: 'img_1', date: '2026-05-01', name: 'Ultrasound LF', brand: '—', nextDue: '—', notes: '' }] },
      calendarEvents: [
        { id: 'cal_horse_003_1', eventType: 'Shockwave therapy', horseId: 'horse_003', horseName: 'Royal Flame', stableId: 'stable-1', date: '2026-05-19', time: '10:00', assignedTo: 'Veterinarian', priority: 'Normal', repeat: 'Weekly', notes: '', status: 'Scheduled' },
        { id: 'cal_horse_003_2', eventType: 'Cooling session', horseId: 'horse_003', horseName: 'Royal Flame', stableId: 'stable-1', date: '2026-05-17', time: '16:00', assignedTo: 'Stable Staff', priority: 'Normal', repeat: 'No repeat', notes: '', status: 'Scheduled' },
      ],
      medicationCourses: [{
        id: 'mc_2', courseName: 'Tendon rehab', medication: 'Pentosan', reason: 'LF tendon support', startDate: '2026-05-01', endDate: '2026-06-01', frequency: 'Weekly', assignedBy: 'Dr. Smith', status: 'Active', nextDose: '2026-05-20', requiresVetApproval: true, withdrawalNotes: '', notes: '', doses: ['2026-05-20'],
      }],
      timeline: [
        { id: 'tl_6', type: 'shock', label: 'Shockwave session scheduled', date: '2026-05-19' },
        { id: 'tl_7', type: 'cool', label: 'Cooling session completed', date: '2026-05-15' },
      ],
      postTrainingChecks: [{ id: 'pt_2', session: 'Flat work', checkedBy: 'James Whitfield', time: '2026-05-16T11:00', appetite: 'Normal', attitude: 'Quiet', hydration: 'Normal', limbCondition: 'Sensitive LF', sweatingRecovery: 'Normal', swelling: 'Mild LF', notes: 'Monitor', status: 'Needs Review' }],
      weeklyExams: [{ id: 'we_3', completedDate: '2026-05-14', completedBy: 'Dr. Smith', nextDue: '2026-05-21', status: 'Completed' }],
    },
    horse_004: {
      weightRecords: [],
      physicalExams: [],
      bloodTests: [],
      careHistory: Object.fromEntries(CARE_SUBTABS.map((tab) => [tab, tab === 'Vaccinations' ? vaccinations() : []])),
      calendarEvents: [{ id: 'cal_horse_004_1', eventType: 'Vet appointment', horseId: 'horse_004', horseName: 'Silver Arrow', stableId: 'stable-1', date: '2026-05-19', time: '14:00', assignedTo: 'Veterinarian', priority: 'High', repeat: 'No repeat', notes: 'Cardiac screening', status: 'Scheduled' }],
      medicationCourses: [],
      timeline: [],
      postTrainingChecks: [{ id: 'pt_3', session: 'Gallop', checkedBy: 'Omar Khalid', time: '2026-05-15T06:30', appetite: 'Reduced', attitude: 'Quiet', hydration: 'Normal', limbCondition: 'Normal', sweatingRecovery: 'Slow', swelling: 'No', notes: 'Cardiac follow-up', status: 'Needs Review' }],
      weeklyExams: [{ id: 'we_4', completedDate: '2026-05-09', completedBy: 'Dr. Smith', nextDue: '2026-05-16', status: 'Overdue' }],
    },
  };

  return { horses, recordsByHorse };
}

export function nextId(prefix, list) {
  const nums = list.map((x) => x.id).filter((id) => id.startsWith(prefix));
  const n = nums.length + 1;
  return `${prefix}${n}`;
}

/** Keep only events belonging to this horse (per-horse medical calendar). */
export function filterCalendarEventsForHorse(events, horseId) {
  if (!horseId) return events || [];
  return (events || []).filter((ev) => ev.horseId === horseId);
}

export function createCalendarEventForm(horse, dateIso = '2026-05-17') {
  return {
    eventType: CALENDAR_EVENT_TYPES[0],
    horseId: horse.horseId,
    horseName: horse.name,
    stableId: horse.stableId,
    date: dateIso,
    time: '09:00',
    assignedTo: 'Doctor',
    priority: 'Normal',
    repeat: 'No repeat',
    notes: '',
    status: 'Scheduled',
  };
}

export function buildCalendarEventId(horseId, list) {
  return nextId(`cal_${horseId}_`, list);
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getWeekStartSunday(from) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function eventTypeSlug(eventType) {
  return String(eventType || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function formatDateTimeDisplay(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}
