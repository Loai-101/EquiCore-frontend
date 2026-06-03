/**
 * Stable user permission pages & features — drives PermissionsPanel + role presets.
 */

const crud = () => ({ create: false, read: false, update: false, delete: false });

export const STABLE_USER_PERMISSION_PAGES = [
  {
    id: 'dashboard',
    labelKey: 'permPages.dashboard',
    features: [
      { id: 'overview', labelKey: 'permFeat.dashboard_overview' },
      { id: 'shortcuts', labelKey: 'permFeat.dashboard_shortcuts' },
    ],
  },
  {
    id: 'usersRoles',
    labelKey: 'permPages.usersRoles',
    features: [
      { id: 'userManagement', labelKey: 'permFeat.users_userManagement' },
      { id: 'roleTemplates', labelKey: 'permFeat.users_roleTemplates' },
      { id: 'permissionManagement', labelKey: 'permFeat.users_permissionManagement' },
      { id: 'activityLogs', labelKey: 'permFeat.users_activityLogs' },
    ],
  },
  {
    id: 'horses',
    labelKey: 'permPages.horses',
    features: [
      { id: 'profiles', labelKey: 'permFeat.horses_profiles' },
      { id: 'documents', labelKey: 'permFeat.horses_documents' },
      { id: 'ownership', labelKey: 'permFeat.horses_ownership' },
      { id: 'performance', labelKey: 'permFeat.horses_performance' },
      { id: 'notes', labelKey: 'permFeat.horses_notes' },
    ],
  },
  {
    id: 'riders',
    labelKey: 'permPages.riders',
    features: [
      { id: 'profiles', labelKey: 'permFeat.riders_profiles' },
      { id: 'assignments', labelKey: 'permFeat.riders_assignments' },
      { id: 'performance', labelKey: 'permFeat.riders_performance' },
      { id: 'garmin', labelKey: 'permFeat.riders_garmin' },
      { id: 'notes', labelKey: 'permFeat.riders_notes' },
    ],
  },
  {
    id: 'training',
    labelKey: 'permPages.training',
    features: [
      { id: 'sessions', labelKey: 'permFeat.training_sessions' },
      { id: 'plans', labelKey: 'permFeat.training_plans' },
      { id: 'dailyLogs', labelKey: 'permFeat.training_dailyLogs' },
      { id: 'garmin', labelKey: 'permFeat.training_garmin' },
      { id: 'notes', labelKey: 'permFeat.training_notes' },
    ],
  },
  {
    id: 'trainingSchedule',
    labelKey: 'permPages.trainingSchedule',
    features: [
      { id: 'calendar', labelKey: 'permFeat.ts_calendar' },
      { id: 'assignedSessions', labelKey: 'permFeat.ts_assignedSessions' },
      { id: 'tasks', labelKey: 'permFeat.ts_tasks' },
    ],
  },
  {
    id: 'health',
    labelKey: 'permPages.health',
    features: [
      { id: 'records', labelKey: 'permFeat.health_records' },
      { id: 'weightRecords', labelKey: 'permFeat.health_weightRecords' },
      { id: 'physicalExams', labelKey: 'permFeat.health_physicalExams' },
      { id: 'bloodTests', labelKey: 'permFeat.health_bloodTests' },
      { id: 'injuries', labelKey: 'permFeat.health_injuries' },
      { id: 'treatments', labelKey: 'permFeat.health_treatments' },
      { id: 'vaccinations', labelKey: 'permFeat.health_vaccinations' },
      { id: 'medications', labelKey: 'permFeat.health_medications' },
      { id: 'vetNotes', labelKey: 'permFeat.health_vetNotes' },
      { id: 'attachments', labelKey: 'permFeat.health_attachments' },
    ],
  },
  {
    id: 'inventory',
    labelKey: 'permPages.inventory',
    features: [
      { id: 'items', labelKey: 'permFeat.inventory_items' },
      { id: 'feedStock', labelKey: 'permFeat.inventory_feedStock' },
      { id: 'supplements', labelKey: 'permFeat.inventory_supplements' },
      { id: 'medicationStock', labelKey: 'permFeat.inventory_medicationStock' },
      { id: 'equipment', labelKey: 'permFeat.inventory_equipment' },
      { id: 'suppliers', labelKey: 'permFeat.inventory_suppliers' },
      { id: 'stockAlerts', labelKey: 'permFeat.inventory_stockAlerts' },
    ],
  },
  {
    id: 'expenses',
    labelKey: 'permPages.expenses',
    features: [
      { id: 'records', labelKey: 'permFeat.expenses_records' },
      { id: 'supplierPayments', labelKey: 'permFeat.expenses_supplierPayments' },
      { id: 'horseRelated', labelKey: 'permFeat.expenses_horseRelated' },
      { id: 'vet', labelKey: 'permFeat.expenses_vet' },
      { id: 'feed', labelKey: 'permFeat.expenses_feed' },
      { id: 'monthlySummaries', labelKey: 'permFeat.expenses_monthlySummaries' },
    ],
  },
  {
    id: 'reports',
    labelKey: 'permPages.reports',
    features: [
      { id: 'horseReports', labelKey: 'permFeat.reports_horse' },
      { id: 'riderReports', labelKey: 'permFeat.reports_rider' },
      { id: 'trainingReports', labelKey: 'permFeat.reports_training' },
      { id: 'healthReports', labelKey: 'permFeat.reports_health' },
      { id: 'inventoryReports', labelKey: 'permFeat.reports_inventory' },
      { id: 'expenseReports', labelKey: 'permFeat.reports_expense' },
      { id: 'aiReports', labelKey: 'permFeat.reports_ai' },
      { id: 'pdfExport', labelKey: 'permFeat.reports_pdf' },
    ],
  },
  {
    id: 'settings',
    labelKey: 'permPages.settings',
    features: [
      { id: 'stableProfile', labelKey: 'permFeat.settings_stableProfile' },
      { id: 'billing', labelKey: 'permFeat.settings_billing' },
      { id: 'notifications', labelKey: 'permFeat.settings_notifications' },
      { id: 'garmin', labelKey: 'permFeat.settings_garmin' },
    ],
  },
];

/** @typedef {{ create: boolean, read: boolean, update: boolean, delete: boolean }} Crud */

/**
 * @returns {Record<string, { access: boolean, features: Record<string, Crud> }>}
 */
export function createEmptyPermissions() {
  const out = {};
  for (const page of STABLE_USER_PERMISSION_PAGES) {
    out[page.id] = { access: false, features: {} };
    for (const f of page.features) {
      out[page.id].features[f.id] = crud();
    }
  }
  return out;
}

export function clonePermissions(permissions) {
  return JSON.parse(JSON.stringify(permissions));
}

/**
 * Merges stored permissions into the current catalog shape (fills new pages/features).
 */
export function mergePermissionsWithCatalog(perms) {
  const fresh = createEmptyPermissions();
  if (!perms || typeof perms !== 'object') return fresh;
  for (const page of STABLE_USER_PERMISSION_PAGES) {
    const src = perms[page.id];
    if (!src) continue;
    fresh[page.id].access = Boolean(src.access);
    for (const f of page.features) {
      const s = src.features?.[f.id];
      if (s && typeof s === 'object') {
        fresh[page.id].features[f.id] = {
          create: Boolean(s.create),
          read: Boolean(s.read),
          update: Boolean(s.update),
          delete: Boolean(s.delete),
        };
      }
    }
  }
  return fresh;
}

export function roleToPresetKey(role) {
  switch (role) {
    case 'Stable Owner':
      return 'stableOwner';
    case 'Stable Admin':
      return 'stableAdmin';
    case 'Trainer':
      return 'trainer';
    case 'Rider':
      return 'rider';
    case 'Veterinarian':
      return 'veterinarian';
    case 'Accountant':
      return 'accountant';
    case 'Staff':
      return 'staff';
    default:
      return 'readOnly';
  }
}

export function getPermissionsForRole(role) {
  return clonePermissions(buildPermissionPreset(roleToPresetKey(role)));
}

function setPageAccess(target, pageId, access) {
  if (target[pageId]) target[pageId].access = access;
}

function setFeatureCrud(target, pageId, featureId, patch) {
  if (!target[pageId]?.features[featureId]) return;
  Object.assign(target[pageId].features[featureId], patch);
}

function setPageReadOnly(target, pageId) {
  if (!target[pageId]) return;
  target[pageId].access = true;
  for (const f of Object.keys(target[pageId].features)) {
    setFeatureCrud(target, pageId, f, { create: false, read: true, update: false, delete: false });
  }
}

function setPageFullCrudNoDelete(target, pageId) {
  if (!target[pageId]) return;
  target[pageId].access = true;
  for (const f of Object.keys(target[pageId].features)) {
    setFeatureCrud(target, pageId, f, { create: true, read: true, update: true, delete: false });
  }
}

/**
 * @param {'stableOwner'|'stableAdmin'|'trainer'|'rider'|'veterinarian'|'accountant'|'staff'|'selectAll'|'readOnly'|'clear'} preset
 */
export function buildPermissionPreset(preset) {
  const base = createEmptyPermissions();
  if (preset === 'clear') return base;

  if (preset === 'stableOwner' || preset === 'selectAll') {
    for (const page of STABLE_USER_PERMISSION_PAGES) {
      base[page.id].access = true;
      for (const f of page.features) {
        base[page.id].features[f.id] = { create: true, read: true, update: true, delete: true };
      }
    }
    return base;
  }

  if (preset === 'readOnly') {
    for (const page of STABLE_USER_PERMISSION_PAGES) {
      setPageReadOnly(base, page.id);
    }
    return base;
  }

  if (preset === 'stableAdmin') {
    for (const page of STABLE_USER_PERMISSION_PAGES) {
      setPageFullCrudNoDelete(base, page.id);
    }
    return base;
  }

  if (preset === 'trainer') {
    setPageReadOnly(base, 'dashboard');
    setPageAccess(base, 'usersRoles', false);
    setPageAccess(base, 'horses', true);
    setFeatureCrud(base, 'horses', 'profiles', { create: false, read: true, update: true, delete: false });
    setFeatureCrud(base, 'horses', 'notes', { create: true, read: true, update: true, delete: false });
    ['documents', 'ownership', 'performance'].forEach((id) => {
      setFeatureCrud(base, 'horses', id, { create: false, read: true, update: false, delete: false });
    });
    setPageAccess(base, 'riders', false);
    base.training.access = true;
    setFeatureCrud(base, 'training', 'sessions', { create: true, read: true, update: true, delete: false });
    setFeatureCrud(base, 'training', 'plans', { create: true, read: true, update: true, delete: false });
    setFeatureCrud(base, 'training', 'dailyLogs', { create: true, read: true, update: true, delete: false });
    setFeatureCrud(base, 'training', 'garmin', { create: false, read: true, update: false, delete: false });
    setFeatureCrud(base, 'training', 'notes', { create: true, read: true, update: true, delete: false });
    base.trainingSchedule.access = true;
    setFeatureCrud(base, 'trainingSchedule', 'calendar', { create: true, read: true, update: true, delete: false });
    setFeatureCrud(base, 'trainingSchedule', 'assignedSessions', { create: true, read: true, update: true, delete: false });
    setFeatureCrud(base, 'trainingSchedule', 'tasks', { create: true, read: true, update: true, delete: false });
    setPageAccess(base, 'health', false);
    setPageAccess(base, 'inventory', false);
    setPageAccess(base, 'expenses', false);
    base.reports.access = true;
    setFeatureCrud(base, 'reports', 'trainingReports', { create: false, read: true, update: false, delete: false });
    setFeatureCrud(base, 'reports', 'pdfExport', { create: false, read: true, update: false, delete: false });
    ['horseReports', 'riderReports', 'healthReports', 'inventoryReports', 'expenseReports', 'aiReports'].forEach((id) => {
      setFeatureCrud(base, 'reports', id, { create: false, read: false, update: false, delete: false });
    });
    setPageAccess(base, 'settings', false);
    return base;
  }

  if (preset === 'veterinarian') {
    setPageReadOnly(base, 'dashboard');
    setPageAccess(base, 'usersRoles', false);
    setPageReadOnly(base, 'horses');
    setFeatureCrud(base, 'horses', 'notes', { create: false, read: true, update: true, delete: false });
    setPageAccess(base, 'riders', false);
    setPageAccess(base, 'training', false);
    base.trainingSchedule.access = true;
    setFeatureCrud(base, 'trainingSchedule', 'calendar', { create: false, read: true, update: false, delete: false });
    setFeatureCrud(base, 'trainingSchedule', 'assignedSessions', { create: false, read: true, update: false, delete: false });
    setFeatureCrud(base, 'trainingSchedule', 'tasks', { create: false, read: true, update: false, delete: false });
    base.health.access = true;
    const fullMedical = ['records', 'weightRecords', 'physicalExams', 'bloodTests', 'injuries', 'treatments', 'vaccinations', 'attachments'];
    fullMedical.forEach((id) => {
      setFeatureCrud(base, 'health', id, { create: true, read: true, update: true, delete: false });
    });
    setFeatureCrud(base, 'health', 'medications', { create: true, read: true, update: true, delete: false });
    setFeatureCrud(base, 'health', 'vetNotes', { create: true, read: true, update: true, delete: false });
    setPageAccess(base, 'expenses', false);
    setPageAccess(base, 'inventory', false);
    base.reports.access = true;
    setFeatureCrud(base, 'reports', 'healthReports', { create: false, read: true, update: true, delete: false });
    setFeatureCrud(base, 'reports', 'pdfExport', { create: false, read: true, update: false, delete: false });
    setFeatureCrud(base, 'reports', 'horseReports', { create: false, read: false, update: false, delete: false });
    setPageAccess(base, 'settings', false);
    return base;
  }

  if (preset === 'accountant') {
    setPageReadOnly(base, 'dashboard');
    setPageAccess(base, 'usersRoles', false);
    setPageReadOnly(base, 'horses');
    setPageReadOnly(base, 'riders');
    setPageAccess(base, 'training', false);
    setPageAccess(base, 'trainingSchedule', false);
    setPageAccess(base, 'health', false);
    setPageReadOnly(base, 'inventory');
    base.expenses.access = true;
    for (const f of STABLE_USER_PERMISSION_PAGES.find((p) => p.id === 'expenses').features) {
      setFeatureCrud(base, 'expenses', f.id, { create: true, read: true, update: true, delete: false });
    }
    base.reports.access = true;
    setFeatureCrud(base, 'reports', 'expenseReports', { create: false, read: true, update: true, delete: false });
    setFeatureCrud(base, 'reports', 'inventoryReports', { create: false, read: true, update: false, delete: false });
    setFeatureCrud(base, 'reports', 'pdfExport', { create: false, read: true, update: false, delete: false });
    setPageReadOnly(base, 'settings');
    setFeatureCrud(base, 'settings', 'billing', { create: false, read: true, update: false, delete: false });
    return base;
  }

  if (preset === 'rider') {
    setPageReadOnly(base, 'dashboard');
    setPageAccess(base, 'usersRoles', false);
    setPageAccess(base, 'horses', true);
    setFeatureCrud(base, 'horses', 'profiles', { create: false, read: true, update: false, delete: false });
    ['documents', 'ownership', 'performance', 'notes'].forEach((id) => {
      setFeatureCrud(base, 'horses', id, { create: false, read: false, update: false, delete: false });
    });
    setPageReadOnly(base, 'riders');
    setPageAccess(base, 'training', true);
    setFeatureCrud(base, 'training', 'sessions', { create: false, read: true, update: false, delete: false });
    ['plans', 'dailyLogs', 'garmin'].forEach((id) => {
      setFeatureCrud(base, 'training', id, { create: false, read: false, update: false, delete: false });
    });
    setFeatureCrud(base, 'training', 'notes', { create: true, read: true, update: true, delete: false });
    base.trainingSchedule.access = true;
    setFeatureCrud(base, 'trainingSchedule', 'calendar', { create: false, read: true, update: false, delete: false });
    setFeatureCrud(base, 'trainingSchedule', 'assignedSessions', { create: false, read: true, update: false, delete: false });
    setFeatureCrud(base, 'trainingSchedule', 'tasks', { create: false, read: true, update: false, delete: false });
    setPageAccess(base, 'health', false);
    setPageAccess(base, 'inventory', false);
    setPageAccess(base, 'expenses', false);
    base.reports.access = true;
    setFeatureCrud(base, 'reports', 'riderReports', { create: false, read: true, update: false, delete: false });
    ['horseReports', 'trainingReports', 'healthReports', 'inventoryReports', 'expenseReports', 'aiReports', 'pdfExport'].forEach((id) => {
      setFeatureCrud(base, 'reports', id, { create: false, read: false, update: false, delete: false });
    });
    setPageAccess(base, 'settings', false);
    return base;
  }

  if (preset === 'staff') {
    setPageReadOnly(base, 'dashboard');
    setPageAccess(base, 'usersRoles', false);
    setPageAccess(base, 'horses', true);
    setFeatureCrud(base, 'horses', 'profiles', { create: false, read: true, update: false, delete: false });
    ['documents', 'ownership', 'performance'].forEach((id) => {
      setFeatureCrud(base, 'horses', id, { create: false, read: false, update: false, delete: false });
    });
    setFeatureCrud(base, 'horses', 'notes', { create: true, read: true, update: true, delete: false });
    setPageAccess(base, 'riders', false);
    setPageAccess(base, 'training', false);
    base.trainingSchedule.access = true;
    setFeatureCrud(base, 'trainingSchedule', 'calendar', { create: false, read: true, update: false, delete: false });
    setFeatureCrud(base, 'trainingSchedule', 'assignedSessions', { create: false, read: true, update: false, delete: false });
    setFeatureCrud(base, 'trainingSchedule', 'tasks', { create: false, read: true, update: false, delete: false });
    base.inventory.access = true;
    ['items', 'feedStock', 'supplements', 'medicationStock', 'equipment', 'stockAlerts'].forEach((id) => {
      setFeatureCrud(base, 'inventory', id, { create: true, read: true, update: true, delete: false });
    });
    setFeatureCrud(base, 'inventory', 'suppliers', { create: false, read: true, update: false, delete: false });
    base.health.access = true;
    setFeatureCrud(base, 'health', 'records', { create: true, read: true, update: true, delete: false });
    ['weightRecords', 'physicalExams', 'bloodTests', 'injuries', 'treatments', 'vaccinations', 'medications', 'vetNotes', 'attachments'].forEach((id) => {
      setFeatureCrud(base, 'health', id, { create: false, read: true, update: false, delete: false });
    });
    setPageAccess(base, 'expenses', false);
    setPageAccess(base, 'reports', false);
    setPageAccess(base, 'settings', false);
    return base;
  }

  return base;
}

export function countPermissionStats(permissions) {
  let pageOn = 0;
  let crudOn = 0;
  for (const page of STABLE_USER_PERMISSION_PAGES) {
    const p = permissions[page.id];
    if (!p) continue;
    if (p.access) pageOn += 1;
    if (!p.access) continue;
    for (const f of page.features) {
      const c = p.features[f.id];
      if (!c) continue;
      crudOn += [c.create, c.read, c.update, c.delete].filter(Boolean).length;
    }
  }
  return { pageOn, crudOn };
}
