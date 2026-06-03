/**
 * Central route map for EquiCore.
 * - Public routes: marketing + auth + registration flow.
 * - Super Admin routes: tenant lifecycle (guarded by role).
 * - Stable routes: approved-tenant workspace (guarded by role + approval flag).
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute/code/ProtectedRoute';
import PublicLayout from '../layout/PublicLayout/code/PublicLayout';
import SuperAdminLayout from '../layout/SuperAdminLayout/code/SuperAdminLayout';
import StableLayout from '../layout/StableLayout/code/StableLayout';
import StableTenantRouteGuard from '../layout/StableLayout/code/StableTenantRouteGuard';
import LandingPage from '../pages/Public/LandingPage/code/LandingPage';
import StableRegister from '../pages/Public/StableRegister/code/StableRegister';
import Login from '../pages/Public/Login/code/Login';
import Unauthorized from '../pages/Public/Unauthorized/code/Unauthorized';
import PendingApproval from '../pages/Public/PendingApproval/code/PendingApproval';
import SuperAdminDashboard from '../pages/SuperAdmin/SuperAdminDashboard/code/SuperAdminDashboard';
import StableRequests from '../pages/SuperAdmin/StableRequests/code/StableRequests';
import StableReview from '../pages/SuperAdmin/StableReview/code/StableReview';
import ApprovedStables from '../pages/SuperAdmin/ApprovedStables/code/ApprovedStables';
import RejectedStables from '../pages/SuperAdmin/RejectedStables/code/RejectedStables';
import Subscriptions from '../pages/SuperAdmin/Subscriptions/code/Subscriptions';
import SuperAdminReports from '../pages/SuperAdmin/SuperAdminReports/code/SuperAdminReports';
import SuperAdminSettings from '../pages/SuperAdmin/SuperAdminSettings/code/SuperAdminSettings';
import StableDashboard from '../pages/Stable/StableDashboard/code/StableDashboard';
import StableUsers from '../pages/Stable/StableUsers/code/StableUsers';
import Horses from '../pages/Stable/Horses/code/Horses';
import Riders from '../pages/Stable/Riders/code/Riders';
import Training from '../pages/Stable/Training/code/Training';
import TrainingSchedulePage from '../pages/Stable/TrainingSchedule/code/TrainingSchedulePage';
import Health from '../pages/Stable/Health/code/Health';
import Inventory from '../pages/Stable/Inventory/code/Inventory';
import Expenses from '../pages/Stable/Expenses/code/Expenses';
import Reports from '../pages/Stable/Reports/code/Reports';
import StableSettings from '../pages/Stable/StableSettings/code/StableSettings';
import { ROUTES, ROLES } from '../utils/constants';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register-stable" element={<StableRegister />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
        <Route path="/super-admin" element={<SuperAdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="stable-requests" element={<StableRequests />} />
          <Route path="stable-requests/:id" element={<StableReview />} />
          <Route path="approved-stables" element={<ApprovedStables />} />
          <Route path="rejected-stables" element={<RejectedStables />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="reports" element={<SuperAdminReports />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Route>
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[ROLES.STABLE_ADMIN, ROLES.STABLE_USER]}
            requireApprovedStable
          />
        }
      >
        <Route path="/dashboard" element={<Navigate to={ROUTES.stable.dashboard} replace />} />
        <Route path="/stable" element={<StableLayout />}>
          <Route element={<StableTenantRouteGuard />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StableDashboard />} />
            <Route path="users" element={<StableUsers />} />
            <Route path="horses" element={<Horses />} />
            <Route path="riders" element={<Riders />} />
            <Route path="training" element={<Training />} />
            <Route path="training-schedule" element={<TrainingSchedulePage />} />
            <Route path="health" element={<Health />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<StableSettings />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
