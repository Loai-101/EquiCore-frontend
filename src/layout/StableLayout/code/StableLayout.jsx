/**
 * Authenticated shell for approved stable tenants.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Footprints,
  PersonStanding,
  Activity,
  CalendarDays,
  HeartPulse,
  Package,
  Wallet,
  LineChart,
  Settings,
} from 'lucide-react';
import Navbar from '../../../components/Navbar/code/Navbar';
import Sidebar from '../../../components/Sidebar/code/Sidebar';
import { DashboardNavProvider } from '../../../context/DashboardNavContext';
import { useAuth } from '../../../context/AuthContext';
import {
  getStableSessionPermissions,
  stablePageIsAllowed,
} from '../../../features/stable-users/stableNavAccess';
import { ROUTES } from '../../../utils/constants';
import '../../shared/ecDashboardShell.css';
import '../styles/StableLayout.css';

export default function StableLayout() {
  const { t } = useTranslation();
  const auth = useAuth();
  const stableName = auth.user?.stableName || t('common.yourStable');
  const scope = auth.stableId
    ? t('common.stableIdChip', { id: auth.stableId })
    : t('common.stableScope');

  const navItems = useMemo(() => {
    const withPage = [
      { pageId: 'dashboard', to: ROUTES.stable.dashboard, label: t('sidebar.stable.dashboard'), icon: LayoutDashboard },
      { pageId: 'usersRoles', to: ROUTES.stable.users, label: t('sidebar.stable.usersRoles'), icon: Users },
      { pageId: 'horses', to: ROUTES.stable.horses, label: t('sidebar.stable.horses'), icon: Footprints },
      { pageId: 'riders', to: ROUTES.stable.riders, label: t('sidebar.stable.riders'), icon: PersonStanding },
      { pageId: 'training', to: ROUTES.stable.training, label: t('sidebar.stable.training'), icon: Activity },
      {
        pageId: 'trainingSchedule',
        to: ROUTES.stable.trainingSchedule,
        label: t('sidebar.stable.trainingSchedule'),
        icon: CalendarDays,
      },
      { pageId: 'health', to: ROUTES.stable.health, label: t('sidebar.stable.health'), icon: HeartPulse },
      { pageId: 'inventory', to: ROUTES.stable.inventory, label: t('sidebar.stable.inventory'), icon: Package },
      { pageId: 'expenses', to: ROUTES.stable.expenses, label: t('sidebar.stable.expenses'), icon: Wallet },
      { pageId: 'reports', to: ROUTES.stable.reports, label: t('sidebar.stable.reports'), icon: LineChart },
      { pageId: 'settings', to: ROUTES.stable.settings, label: t('sidebar.stable.stableSettings'), icon: Settings },
    ];

    const permissions = getStableSessionPermissions(auth.user, auth.isStableAdmin, auth.isStableUser);
    const visible = auth.isStableUser
      ? withPage.filter((row) => stablePageIsAllowed(permissions, row.pageId))
      : withPage;

    return visible.map(({ pageId: _p, ...item }) => item);
  }, [auth.user, auth.isStableAdmin, auth.isStableUser, t]);

  return (
    <DashboardNavProvider>
      <div className="ec-dashboard-shell ec-stable-layout">
        <Sidebar
          title={stableName}
          subtitle={
            <span
              className="ec-stable-layout__scope-badge"
              title={t('common.allListsFilterTitle')}
            >
              {scope}
            </span>
          }
          items={navItems}
          hint={t('sidebar.stableHint')}
        />
        <div className="ec-dashboard-shell__content">
          <Navbar variant="stable" tenantLabel={stableName} />
          <div className="ec-dashboard-shell__scroll">
            <Outlet />
          </div>
        </div>
      </div>
    </DashboardNavProvider>
  );
}
