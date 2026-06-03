export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  STABLE_ADMIN: 'stable_admin',
  STABLE_USER: 'stable_user',
  STABLE_PENDING: 'stable_pending',
};

export const STABLE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const STABLE_TYPES = ['Endurance', 'Flat Racing', 'Jumping', 'Mixed'];

export const ROUTES = {
  home: '/',
  registerStable: '/register-stable',
  login: '/login',
  unauthorized: '/unauthorized',
  /** Post-login entry for stable personas (aliases to `/stable/dashboard`). */
  dashboard: '/dashboard',
  pendingApproval: '/pending-approval',
  superAdmin: {
    dashboard: '/super-admin/dashboard',
    stableRequests: '/super-admin/stable-requests',
    stableReview: (id) => `/super-admin/stable-requests/${id}`,
    approvedStables: '/super-admin/approved-stables',
    rejectedStables: '/super-admin/rejected-stables',
    subscriptions: '/super-admin/subscriptions',
    reports: '/super-admin/reports',
    settings: '/super-admin/settings',
  },
  stable: {
    dashboard: '/stable/dashboard',
    users: '/stable/users',
    horses: '/stable/horses',
    riders: '/stable/riders',
    training: '/stable/training',
    trainingSchedule: '/stable/training-schedule',
    health: '/stable/health',
    inventory: '/stable/inventory',
    expenses: '/stable/expenses',
    reports: '/stable/reports',
    settings: '/stable/settings',
  },
};

/** Default landing route after auth for the current session (used by Unauthorized, etc.). */
export function getRoleHomePath(user) {
  if (!user) return ROUTES.login;
  if (user.role === ROLES.SUPER_ADMIN) return ROUTES.superAdmin.dashboard;
  return ROUTES.stable.dashboard;
}

/** Primary mark: navbar + favicon (Cloudinary CDN). */
export const BRAND_LOGO_URL =
  'https://res.cloudinary.com/dvybb2xnc/image/upload/v1778659357/EQ_2_-_logo_biwpxk.png';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
