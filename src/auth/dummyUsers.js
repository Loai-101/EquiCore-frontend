/**
 * Frontend-only demo credentials. Replace `authenticateDummyUser` + session mapping
 * with API/JWT hydration when the backend is available.
 *
 * `stableId` in this catalog uses a stable API-style key (`stable_001`). It is
 * normalized to the mock tenant id (`stable-1`) when building the auth session
 * so existing mock data continues to resolve.
 */
import { getPermissionsForRole } from '../features/stable-users/stableUsersPermissionCatalog';
import { ROLES, STABLE_STATUS } from '../utils/constants';

/** Maps API-style tenant keys to the current mock-data tenant id. */
export function normalizeStableIdForMock(stableId) {
  if (stableId === 'stable_001') return 'stable-1';
  return stableId;
}

export const users = [
  {
    id: 'super_admin',
    username: 'admin',
    password: 'admin',
    role: 'Super Admin',
    stableId: null,
  },
  {
    id: 'stable_owner',
    username: 'stable',
    password: 'stable',
    role: 'Stable Owner',
    stableId: 'stable_001',
  },
  {
    id: 'trainer',
    username: 'trainer',
    password: 'trainer',
    role: 'Trainer',
    stableId: 'stable_001',
  },
  {
    id: 'doctor',
    username: 'doctor',
    password: 'doctor',
    role: 'Veterinarian',
    stableId: 'stable_001',
  },
  {
    id: 'accountant',
    username: 'accountant',
    password: 'accountant',
    role: 'Accountant',
    stableId: 'stable_001',
  },
];

/**
 * @param {string} username
 * @param {string} password
 * @returns {(typeof users)[number] | null}
 */
export function authenticateDummyUser(username, password) {
  const u = username.trim().toLowerCase();
  const p = password;
  return users.find((row) => row.username.toLowerCase() === u && row.password === p) ?? null;
}

/**
 * @param {(typeof users)[number]} row
 * @returns {object} Session user for `AuthProvider.login`
 */
export function dummyRowToSessionUser(row) {
  const roleLabel = row.role;
  const stableIdRaw = row.stableId;
  const stableId = stableIdRaw != null ? normalizeStableIdForMock(stableIdRaw) : null;

  if (roleLabel === 'Super Admin') {
    return {
      id: row.id,
      username: row.username,
      role: ROLES.SUPER_ADMIN,
      roleLabel,
      stableId: null,
      registrationStatus: null,
    };
  }

  if (roleLabel === 'Stable Owner') {
    return {
      id: row.id,
      username: row.username,
      role: ROLES.STABLE_ADMIN,
      roleLabel,
      stableId,
      tenantRef: stableIdRaw,
      stableName: 'Al Nayef Endurance',
      registrationStatus: STABLE_STATUS.APPROVED,
      permissions: getPermissionsForRole('Stable Owner'),
    };
  }

  const permissions = getPermissionsForRole(roleLabel);
  return {
    id: row.id,
    username: row.username,
    role: ROLES.STABLE_USER,
    roleLabel,
    stableId,
    tenantRef: stableIdRaw,
    stableName: 'Al Nayef Endurance',
    registrationStatus: STABLE_STATUS.APPROVED,
    permissions,
  };
}
