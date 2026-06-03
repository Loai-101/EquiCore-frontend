/**
 * Route guard: enforces authentication, allowed roles, and (optionally) approved stable status.
 * Renders <Outlet /> when checks pass; otherwise issues client-side redirects.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES, ROLES, STABLE_STATUS } from '../../../utils/constants';
import '../styles/ProtectedRoute.css';

export default function ProtectedRoute({
  allowedRoles = [],
  requireApprovedStable = false,
}) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.user) {
    return (
      <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
    );
  }

  if (!allowedRoles.includes(auth.user.role)) {
    if (auth.user.role === ROLES.STABLE_PENDING) {
      return <Navigate to={ROUTES.pendingApproval} replace />;
    }
    return <Navigate to={ROUTES.unauthorized} replace />;
  }

  if (requireApprovedStable) {
    const ok =
      (auth.user.role === ROLES.STABLE_ADMIN || auth.user.role === ROLES.STABLE_USER) &&
      auth.user.registrationStatus === STABLE_STATUS.APPROVED &&
      Boolean(auth.user.stableId);
    if (!ok) {
      return <Navigate to={ROUTES.pendingApproval} replace />;
    }
  }

  return <Outlet />;
}
