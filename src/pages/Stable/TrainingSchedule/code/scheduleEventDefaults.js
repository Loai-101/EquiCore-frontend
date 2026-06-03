/** Default assignment block for single-mode events. */
export function singleAssignment(horseId, horseName, riderId = '', riderName = '') {
  return {
    assignmentType: 'single',
    horseId: horseId || null,
    horseName: horseName || '',
    riderId: riderId || null,
    riderName: riderName || '',
    horseIds: [],
    horses: [],
    riderIds: [],
    riders: [],
    groupName: '',
    groupNotes: '',
  };
}

export function groupAssignment({
  horseIds,
  horses,
  riderIds,
  riders,
  groupName,
  groupNotes = '',
}) {
  return {
    assignmentType: 'group',
    horseId: null,
    horseName: '',
    riderId: null,
    riderName: '',
    horseIds,
    horses,
    riderIds,
    riders,
    groupName,
    groupNotes,
  };
}
