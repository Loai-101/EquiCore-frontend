import { SCHEDULE_HORSES, SCHEDULE_RIDERS } from './trainingScheduleData';

/** Ensure legacy events include assignment fields. */
export function normalizeScheduleEvent(event) {
  if (!event) return event;
  const hasGroupHorses = Array.isArray(event.horseIds) && event.horseIds.length > 0;
  const assignmentType = event.assignmentType
    || (hasGroupHorses || (event.groupName && !event.horseId) ? 'group' : 'single');

  if (assignmentType === 'group') {
    const horseIds = event.horseIds?.length ? event.horseIds : [];
    const riderIds = event.riderIds?.length ? event.riderIds : [];
    return {
      ...event,
      assignmentType: 'group',
      horseId: null,
      horseName: '',
      riderId: null,
      riderName: '',
      horseIds,
      horses: event.horses?.length
        ? event.horses
        : horseIds.map((id) => SCHEDULE_HORSES.find((h) => h.id === id)?.name).filter(Boolean),
      riderIds,
      riders: event.riders?.length
        ? event.riders
        : riderIds.map((id) => SCHEDULE_RIDERS.find((r) => r.id === id)?.name).filter(Boolean),
      groupName: event.groupName || '',
      groupNotes: event.groupNotes || '',
    };
  }

  return {
    ...event,
    assignmentType: 'single',
    horseId: event.horseId || null,
    horseName: event.horseName || '',
    riderId: event.riderId || null,
    riderName: event.riderName || '',
    horseIds: [],
    horses: [],
    riderIds: [],
    riders: [],
    groupNotes: event.groupNotes || '',
  };
}

export function getEventHorseIds(event) {
  const e = normalizeScheduleEvent(event);
  if (e.assignmentType === 'group') return e.horseIds || [];
  return e.horseId ? [e.horseId] : [];
}

export function getEventRiderIds(event) {
  const e = normalizeScheduleEvent(event);
  if (e.assignmentType === 'group') return e.riderIds || [];
  return e.riderId ? [e.riderId] : [];
}

export function eventMatchesHorseFilter(event, horseId) {
  if (!horseId) return true;
  return getEventHorseIds(event).includes(horseId);
}

export function eventMatchesRiderFilter(event, riderId) {
  if (!riderId) return true;
  return getEventRiderIds(event).includes(riderId);
}

/** Zip parallel horse/rider id arrays into paired rows for the group form. */
export function pairsFromIds(horseIds = [], riderIds = []) {
  const len = Math.max(horseIds.length, riderIds.length, 0);
  if (!len) return [{ horseId: '', riderId: '' }];
  return Array.from({ length: len }, (_, i) => ({
    horseId: horseIds[i] || '',
    riderId: riderIds[i] || '',
  }));
}

export function pairsFromForm(form) {
  if (form.groupPairs?.length) return form.groupPairs;
  return pairsFromIds(form.horseIds, form.riderIds);
}

/** Human-readable paired lines for detail views. */
export function getGroupPairLines(event) {
  const e = normalizeScheduleEvent(event);
  if (e.assignmentType !== 'group') return [];
  const count = Math.max(e.horseIds?.length || 0, e.riderIds?.length || 0);
  return Array.from({ length: count }, (_, i) => {
    const horse = e.horses?.[i]
      || SCHEDULE_HORSES.find((h) => h.id === e.horseIds?.[i])?.name
      || '';
    const rider = e.riders?.[i]
      || SCHEDULE_RIDERS.find((r) => r.id === e.riderIds?.[i])?.name
      || '';
    if (!horse && !rider) return '';
    return `${horse}${horse && rider ? ' · ' : ''}${rider}`;
  }).filter(Boolean);
}

export function buildAssignmentFields(form) {
  if (form.assignmentType === 'group') {
    const pairs = pairsFromForm(form).filter((p) => p.horseId || p.riderId);
    const horseIds = pairs.map((p) => p.horseId).filter(Boolean);
    const riderIds = pairs.map((p) => p.riderId).filter(Boolean);
    return {
      assignmentType: 'group',
      horseId: null,
      horseName: '',
      riderId: null,
      riderName: '',
      horseIds,
      horses: horseIds
        .map((id) => SCHEDULE_HORSES.find((h) => h.id === id)?.name)
        .filter(Boolean),
      riderIds,
      riders: riderIds
        .map((id) => SCHEDULE_RIDERS.find((r) => r.id === id)?.name)
        .filter(Boolean),
      groupName: form.groupName || '',
      groupNotes: form.groupNotes || '',
    };
  }

  const horse = SCHEDULE_HORSES.find((h) => h.id === form.horseId);
  const rider = SCHEDULE_RIDERS.find((r) => r.id === form.riderId);
  return {
    assignmentType: 'single',
    horseId: horse?.id || null,
    horseName: horse?.name || '',
    riderId: rider?.id || null,
    riderName: rider?.name || '',
    horseIds: [],
    horses: [],
    riderIds: [],
    riders: [],
    groupName: '',
    groupNotes: '',
  };
}

export function getEventCardDisplay(event, th) {
  const e = normalizeScheduleEvent(event);
  if (e.assignmentType === 'group') {
    const horseCount = (e.horseIds || []).length;
    const riderCount = (e.riderIds || []).length;
    return {
      meta: e.groupName || th('assignment.groupFallback'),
      sub: th('assignment.groupCounts', { horses: horseCount, riders: riderCount }),
    };
  }
  return {
    meta: e.horseName || '',
    sub: e.riderName || '',
  };
}

export const ASSIGNMENT_EVENT_TYPES = new Set(['Training', 'Competition', 'Race']);
