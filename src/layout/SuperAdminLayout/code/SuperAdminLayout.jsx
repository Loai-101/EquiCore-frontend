/**
 * Authenticated shell for Super Admin routes.
 * Uses shared dashboard chrome (layout/shared/ecDashboardShell.css).
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  BadgeCheck,
  Ban,
  CreditCard,
  BarChart3,
  Settings,
} from 'lucide-react';
import Navbar from '../../../components/Navbar/code/Navbar';
import Sidebar from '../../../components/Sidebar/code/Sidebar';
import { DashboardNavProvider } from '../../../context/DashboardNavContext';
import { ROUTES } from '../../../utils/constants';
import '../../shared/ecDashboardShell.css';
import '../styles/SuperAdminLayout.css';

export default function SuperAdminLayout() {
  const { t } = useTranslation();

  const navItems = useMemo(
    () => [
      { to: ROUTES.superAdmin.dashboard, label: t('sidebar.super.overview'), icon: LayoutDashboard },
      { to: ROUTES.superAdmin.stableRequests, label: t('sidebar.super.stableRequests'), icon: Inbox },
      {
        to: ROUTES.superAdmin.approvedStables,
        label: t('sidebar.super.approvedStables'),
        icon: BadgeCheck,
      },
      { to: ROUTES.superAdmin.rejectedStables, label: t('sidebar.super.rejectedStables'), icon: Ban },
      { to: ROUTES.superAdmin.subscriptions, label: t('sidebar.super.subscriptions'), icon: CreditCard },
      { to: ROUTES.superAdmin.reports, label: t('sidebar.super.reports'), icon: BarChart3 },
      { to: ROUTES.superAdmin.settings, label: t('sidebar.super.settings'), icon: Settings },
    ],
    [t]
  );

  return (
    <DashboardNavProvider>
      <div className="ec-dashboard-shell">
        <Sidebar
          title={t('sidebar.superTitle')}
          subtitle={t('sidebar.superSubtitle')}
          items={navItems}
          hint={t('sidebar.superHint')}
        />
        <div className="ec-dashboard-shell__content">
          <Navbar variant="super" tenantLabel={t('common.globalConsole')} />
          <div className="ec-dashboard-shell__scroll">
            <Outlet />
          </div>
        </div>
      </div>
    </DashboardNavProvider>
  );
}
