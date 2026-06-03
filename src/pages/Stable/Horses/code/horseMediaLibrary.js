/**
 * Per-horse media library — owner vs rider/coach uploads (frontend demo).
 */

/** Default card placeholder until the user uploads a photo (horses, riders, etc.). */
export const DEFAULT_HORSE_IMAGE_URL =
  'https://res.cloudinary.com/dvybb2xnc/image/upload/v1778659357/EQ_2_-_logo_biwpxk.png';

export const MEDIA_CATEGORIES = {
  owner: 'owner',
  riderCoach: 'riderCoach',
};

function item(horseId, category, partial) {
  return {
    horseId,
    category,
    id: partial.id,
    type: partial.type,
    fileName: partial.fileName,
    url: partial.url || '',
    caption: partial.caption || '',
    uploadedBy: partial.uploadedBy || '',
    sessionLabel: partial.sessionLabel || '',
    createdAt: partial.createdAt,
  };
}

export function buildInitialMediaByHorse() {
  return {
    horse_001: {
      owner: [
        item('horse_001', 'owner', {
          id: 'media_horse_001_o1',
          type: 'image',
          fileName: 'Thunder_stable_portrait.jpg',
          uploadedBy: 'Victorious Team (Owner)',
          caption: 'Official stable portrait',
          createdAt: '2026-05-01T10:00',
        }),
        item('horse_001', 'owner', {
          id: 'media_horse_001_o2',
          type: 'video',
          fileName: 'Thunder_walking_showreel.mp4',
          uploadedBy: 'Victorious Team (Owner)',
          caption: 'Marketing walk clip',
          createdAt: '2026-04-12T14:00',
        }),
      ],
      riderCoach: [
        item('horse_001', 'riderCoach', {
          id: 'media_horse_001_r1',
          type: 'image',
          fileName: 'Post_training_cooldown.jpg',
          uploadedBy: 'Ali Hussein Salman (Trainer)',
          sessionLabel: 'Endurance base — 2026-05-16',
          createdAt: '2026-05-16T17:45',
        }),
        item('horse_001', 'riderCoach', {
          id: 'media_horse_001_r2',
          type: 'video',
          fileName: 'Recovery_trot_lane.mp4',
          uploadedBy: 'Ahmed Al-Mansoori (Rider)',
          sessionLabel: 'Post-training check — 2026-05-16',
          createdAt: '2026-05-16T18:10',
        }),
      ],
    },
    horse_002: {
      owner: [
        item('horse_002', 'owner', {
          id: 'media_horse_002_o1',
          type: 'image',
          fileName: 'Desert_Pearl_owner_album.jpg',
          uploadedBy: 'Al Noor Endurance (Owner)',
          caption: 'Season registration photo',
          createdAt: '2026-04-20T09:00',
        }),
      ],
      riderCoach: [
        item('horse_002', 'riderCoach', {
          id: 'media_horse_002_r1',
          type: 'image',
          fileName: 'Arena_session_finish.jpg',
          uploadedBy: 'Sara Al Mansoori (Coach)',
          sessionLabel: 'Arena work — 2026-05-15',
          createdAt: '2026-05-15T11:30',
        }),
      ],
    },
    horse_003: {
      owner: [
        item('horse_003', 'owner', {
          id: 'media_horse_003_o1',
          type: 'image',
          fileName: 'Royal_Flame_profile.jpg',
          uploadedBy: 'Victorious Team (Owner)',
          createdAt: '2026-03-08T12:00',
        }),
      ],
      riderCoach: [
        item('horse_003', 'riderCoach', {
          id: 'media_horse_003_r1',
          type: 'video',
          fileName: 'LF_tendon_rehab_walk.mp4',
          uploadedBy: 'James Whitfield (Coach)',
          sessionLabel: 'Rehab flat work — 2026-05-16',
          createdAt: '2026-05-16T11:15',
        }),
        item('horse_003', 'riderCoach', {
          id: 'media_horse_003_r2',
          type: 'image',
          fileName: 'Cooling_session_stable.jpg',
          uploadedBy: 'Stable Staff',
          sessionLabel: 'Cooling after training — 2026-05-16',
          createdAt: '2026-05-16T16:05',
        }),
      ],
    },
    horse_004: {
      owner: [
        item('horse_004', 'owner', {
          id: 'media_horse_004_o1',
          type: 'image',
          fileName: 'Silver_Arrow_racing_card.jpg',
          uploadedBy: 'Silver Crest Racing (Owner)',
          createdAt: '2026-02-01T08:00',
        }),
      ],
      riderCoach: [
        item('horse_004', 'riderCoach', {
          id: 'media_horse_004_r1',
          type: 'video',
          fileName: 'Gallop_cooldown_monitoring.mp4',
          uploadedBy: 'Omar Khalid (Coach)',
          sessionLabel: 'Morning gallop — 2026-05-15',
          createdAt: '2026-05-15T06:45',
        }),
      ],
    },
  };
}

export function emptyMediaForHorse(horseId) {
  return { owner: [], riderCoach: [] };
}

export function getHorseMedia(mediaByHorse, horseId) {
  return mediaByHorse[horseId] || emptyMediaForHorse(horseId);
}

export function nextMediaId(horseId, category, list) {
  const prefix = `media_${horseId}_${category === 'owner' ? 'o' : 'r'}`;
  return `${prefix}_${list.length + 1}_${Date.now()}`;
}

export function isVideoFile(file) {
  return file.type.startsWith('video/');
}

export function formatMediaDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}
