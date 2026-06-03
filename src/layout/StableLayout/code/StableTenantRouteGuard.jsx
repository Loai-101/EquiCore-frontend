/**
 * For invited stable members (demo: STABLE_USER), blocks direct URL access to pages
 * not granted in session permissions. Stable admins pass through unchanged.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES, ROLES } from '../../../utils/constants';
import {
  getStableSessionPermissions,
  pathnameToStablePageId,
  stablePageIsAllowed,
} from '../../../features/stable-users/stableNavAccess';

export default function StableTenantRouteGuard() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.user?.role !== ROLES.STABLE_USER) {
    return <Outlet />;
  }

  const pageId = pathnameToStablePageId(location.pathname);
  const permissions = getStableSessionPermissions(auth.user, auth.isStableAdmin, auth.isStableUser);

  if (pageId != null && !stablePageIsAllowed(permissions, pageId)) {
    return <Navigate to={ROUTES.unauthorized} replace />;
  }

  return <Outlet />;
}
