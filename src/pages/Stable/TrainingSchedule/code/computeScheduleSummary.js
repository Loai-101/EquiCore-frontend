import { TRAINING_LIBRARY_TEMPLATES } from './trainingScheduleData';
import { getEventHorseIds } from './scheduleAssignment';

const TRAINER_COLORS = ['#e53935', '#1976d2', '#7b1fa2', '#2e7d32', '#f9a825', '#c9a227', '#1c2f5c'];

const WEEK_DURATION_GOAL_MIN = 20 * 60;
const WEEK_DISTANCE_GOAL_KM = 80;

/** @param {string} iso YYYY-MM-DD */
function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function parseDurationMinutes(duration = '') {
  if (!duration || /day/i.test(duration)) return 0;
  let total = 0;
  const h = duration.match(/(\d+)\s*h/i);
  const m = duration.match(/(\d+)\s*m/i);
  if (h) total += Number(h[1]) * 60;
  if (m) total += Number(m[1]);
  if (!h && !m && /^\d+$/.test(duration.trim())) total += Number(duration.trim());
  return total;
}

function parseDistanceKm(value = '') {
  const n = parseFloat(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function getTemplate(templateId) {
  return TRAINING_LIBRARY_TEMPLATES.find((x) => x.id === templateId);
}

function formatDurationLabel(totalMinutes) {
  if (totalMinutes <= 0) return '0h 0m';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function pct(value, goal) {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

function isInRange(iso, startIso, endIso) {
  return iso >= startIso && iso <= endIso;
}

function addDaysFromIso(iso, days) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Derive sidebar summary + chart from live calendar events.
 * @param {object} params
 * @param {Array} params.events
 * @param {string} params.periodStartIso
 * @param {string} params.periodEndIso
 * @param {Array<{id:string,name:string}>} params.horses
 * @param {Array<{id:string,name:string}>} params.trainers
 * @param {string} params.todayIso
 */
export function computeScheduleSummary({
  events,
  periodStartIso,
  periodEndIso,
  horses,
  trainers,
  todayIso,
}) {
  const active = events.filter((e) => e.status !== 'Cancelled');
  const inPeriod = active.filter((e) => isInRange(e.date, periodStartIso, periodEndIso));

  const trainingInPeriod = inPeriod.filter((e) => e.eventType === 'Training');

  let totalMinutes = 0;
  let totalKm = 0;
  let canterMinutes = 0;

  trainingInPeriod.forEach((ev) => {
    const mins = parseDurationMinutes(ev.duration);
    totalMinutes += mins;

    const tpl = getTemplate(ev.trainingTemplateId);
    const km = tpl ? parseDistanceKm(tpl.estimatedDistance) : 0;
    totalKm += km;

    const discipline = tpl?.discipline || '';
    const canterRatio = discipline === 'Endurance' ? 0.4 : discipline === 'Show Jumping' ? 0.1 : 0.25;
    canterMinutes += Math.round(mins * canterRatio);
  });

  const periodDays = Math.max(
    1,
    Math.round((parseIso(periodEndIso) - parseIso(periodStartIso)) / (1000 * 60 * 60 * 24)) + 1,
  );
  const durationGoal = Math.round((WEEK_DURATION_GOAL_MIN * periodDays) / 7);
  const distanceGoal = Math.round((WEEK_DISTANCE_GOAL_KM * periodDays) / 7);

  const lookbackStart = addDaysFromIso(todayIso, -13);
  const horsesTrainedRecently = new Set(
    active
      .filter((e) => e.eventType === 'Training' && isInRange(e.date, lookbackStart, todayIso))
      .flatMap((e) => getEventHorseIds(e)),
  );

  const horsesInPeriod = new Set(
    trainingInPeriod.flatMap((e) => getEventHorseIds(e)),
  );

  const totalHorsesCap = horses.length;
  const totalHorsesTraining = horsesInPeriod.size;
  const horsesNotTraining = Math.max(0, totalHorsesCap - horsesTrainedRecently.size);

  const trainerCounts = new Map();
  inPeriod.forEach((ev) => {
    if (!ev.trainerId) return;
    trainerCounts.set(ev.trainerId, (trainerCounts.get(ev.trainerId) || 0) + 1);
  });

  const trainerLegend = trainers.map((tr, idx) => ({
    id: tr.id,
    name: tr.name,
    color: TRAINER_COLORS[idx % TRAINER_COLORS.length],
    eventCount: trainerCounts.get(tr.id) || 0,
  }));

  const chartEndIso = periodEndIso > todayIso ? todayIso : periodEndIso;
  const last7Days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const iso = addDaysFromIso(chartEndIso, -i);
    const sessions = active.filter((e) => e.date === iso).length;
    last7Days.push({ iso, sessions });
  }

  return {
    totalDurationLabel: formatDurationLabel(totalMinutes),
    totalDistanceKm: Math.round(totalKm * 10) / 10,
    canterDurationLabel: formatDurationLabel(canterMinutes),
    durationBarPct: pct(totalMinutes, durationGoal),
    distanceBarPct: pct(totalKm, distanceGoal),
    canterBarPct: totalMinutes > 0 ? pct(canterMinutes, totalMinutes) : 0,
    horsesNotTraining,
    totalHorsesTraining,
    totalHorsesCap,
    trainerLegend,
    last7Days,
    periodEventCount: inPeriod.length,
  };
}
