/**
 * Maps stable app URL segments to permission catalog page ids (sidebar + route guard).
 */
import {
  createEmptyPermissions,
  getPermissionsForRole,
  mergePermissionsWithCatalog,
} from './stableUsersPermissionCatalog';
import { ROUTES } from '../../utils/constants';

/** Prefer “work” modules over the executive dashboard for invited-session landing. */
const STABLE_LANDING_SEGMENT_ORDER = [
  'training-schedule',
  'training',
  'horses',
  'riders',
  'health',
  'inventory',
  'expenses',
  'reports',
  'settings',
  'users',
  'dashboard',
];

/** Path segment after `/stable/` → STABLE_USER_PERMISSION_PAGES id */
export const STABLE_ROUTE_SEGMENT_TO_PAGE = {
  dashboard: 'dashboard',
  users: 'usersRoles',
  horses: 'horses',
  riders: 'riders',
  training: 'training',
  'training-schedule': 'trainingSchedule',
  health: 'health',
  inventory: 'inventory',
  expenses: 'expenses',
  reports: 'reports',
  settings: 'settings',
};

/**
 * @param {string} pathname e.g. /stable/horses
 * @returns {string|null} page id or null if not under /stable
 */
export function pathnameToStablePageId(pathname) {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parts[0] !== 'stable') return null;
  const seg = parts[1] || 'dashboard';
  return STABLE_ROUTE_SEGMENT_TO_PAGE[seg] ?? null;
}

/**
 * Resolved permission map for nav + guards (demo: invited users carry `permissions` on auth user).
 * @param {{ permissions?: object, role?: string } | null} user
 * @param {boolean} isStableAdmin
 * @param {boolean} isStableUser
 */
export function getStableSessionPermissions(user, isStableAdmin, isStableUser) {
  if (isStableAdmin) {
    return mergePermissionsWithCatalog(user?.permissions ?? getPermissionsForRole('Stable Owner'));
  }
  if (isStableUser) {
    const raw = user?.permissions ?? getPermissionsForRole('Trainer');
    return mergePermissionsWithCatalog(raw);
  }
  return createEmptyPermissions();
}

export function stablePageIsAllowed(permissions, pageId) {
  if (!pageId) return false;
  return Boolean(permissions[pageId]?.access);
}

/**
 * First allowed stable URL for a permission map (used after invited-member demo login).
 * @param {Record<string, { access: boolean, features: object }>} permissions
 */
export function getFirstAllowedStableLandingPath(permissions) {
  for (const segment of STABLE_LANDING_SEGMENT_ORDER) {
    const pageId = STABLE_ROUTE_SEGMENT_TO_PAGE[segment];
    if (pageId && stablePageIsAllowed(permissions, pageId)) {
      return `/stable/${segment}`;
    }
  }
  return ROUTES.stable.dashboard;
}
