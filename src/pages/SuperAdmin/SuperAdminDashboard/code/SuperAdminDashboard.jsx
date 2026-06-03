/**
 * Super Admin Dashboard — platform overview (dummy data, tenant-scoped IDs).
 */
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Building2,
  CreditCard,
  Download,
  FileWarning,
  Inbox,
  LineChart,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  dummyComplianceDocuments,
  dummyPlatformActivityLog,
  dummyStableRegistrationRequests,
  dummySuperAdminAlerts,
  dummySuperAdminSubscriptions,
  dummyTenantStables,
  platformStats,
  superAdminActiveUsersByMonth,
  superAdminRequestsByMonth,
} from '../../../../services/mock/dummyData';
import { ROUTES } from '../../../../utils/constants';
import {
  stableDashboardChartAxisTick,
  stableDashboardChartTooltipContentStyle,
} from '../../../../utils/chartUiConfig';
import '../styles/SuperAdminDashboard.css';

const DEMO_TODAY = new Date('2026-05-17T12:00:00');
const DATE_RANGES = ['today', 'week', 'month', 'year'];
const CHART_GOLD = '#c9a227';
const CHART_NAVY = '#1c2f5c';
const CHART_PALETTE = ['#1c2f5c', '#c9a227', '#5c7cba', '#c0392b', '#7a8499', '#2e8b57'];

const REQUEST_STATUS_KEYS = ['pending', 'approved', 'rejected', 'moreInfoRequired', 'suspended'];
const DISCIPLINE_KEYS = ['endurance', 'flatRacing', 'jumping', 'mixed'];
const COUNTRY_KEYS = ['bahrain', 'uae', 'saudiArabia', 'qatar', 'kuwait', 'oman', 'other'];
const PLAN_KEYS = ['trial', 'basic', 'professional', 'enterprise'];
const SUB_STATUS_KEYS = ['active', 'trial', 'overdue', 'expired', 'cancelled'];

function parseYmd(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function daysSince(dateStr, anchor = DEMO_TODAY) {
  const d = parseYmd(dateStr);
  if (!d) return 0;
  return Math.floor((anchor - d) / (1000 * 60 * 60 * 24));
}

function isInDateRange(dateStr, range, anchor = DEMO_TODAY) {
  const d = parseYmd(dateStr);
  if (!d) return false;
  const end = new Date(anchor);
  end.setHours(23, 59, 59, 999);
  if (range === 'today') {
    const start = new Date(anchor);
    start.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
  }
  if (range === 'week') {
    const start = new Date(anchor);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
  }
  if (range === 'month') {
    return d.getMonth() === anchor.getMonth() && d.getFullYear() === anchor.getFullYear();
  }
  return d.getFullYear() === anchor.getFullYear();
}

function mapRequestStatusKey(status) {
  const m = {
    Pending: 'pending',
    Approved: 'approved',
    Rejected: 'rejected',
    'More Info Required': 'moreInfoRequired',
    Suspended: 'suspended',
  };
  return m[status] || 'pending';
}

function mapDisciplineKey(type) {
  const m = {
    Endurance: 'endurance',
    'Flat Racing': 'flatRacing',
    Jumping: 'jumping',
    Mixed: 'mixed',
  };
  return m[type] || 'endurance';
}

function mapCountryKey(country) {
  const c = (country || '').toLowerCase();
  if (c.includes('bahrain')) return 'bahrain';
  if (c.includes('emirates') || c === 'uae') return 'uae';
  if (c.includes('saudi')) return 'saudiArabia';
  if (c.includes('qatar')) return 'qatar';
  if (c.includes('kuwait')) return 'kuwait';
  if (c.includes('oman')) return 'oman';
  return 'other';
}

function mapPlanKey(plan) {
  const m = { Trial: 'trial', Basic: 'basic', Professional: 'professional', Enterprise: 'enterprise' };
  return m[plan] || 'basic';
}

function mapSubStatusKey(status) {
  const m = {
    Active: 'active',
    Trial: 'trial',
    Overdue: 'overdue',
    Expired: 'expired',
    Cancelled: 'cancelled',
    suspended: 'overdue',
  };
  return m[status] || 'active';
}

function queuePriority(days) {
  if (days > 5) return 'high';
  if (days >= 2) return 'medium';
  return 'low';
}

function statusBadgeClass(statusKey) {
  const map = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    moreInfoRequired: 'moreInfo',
    suspended: 'suspended',
    active: 'active',
    overdue: 'overdue',
    trial: 'trial',
    expired: 'expired',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };
  return map[statusKey] || 'muted';
}

function SadBadge({ statusKey, children }) {
  return <span className={`sad-badge sad-badge--${statusBadgeClass(statusKey)}`}>{children}</span>;
}

function ChartCard({ title, children }) {
  return (
    <div className="sad-card">
      <h3>{title}</h3>
      <div className="sad-chart">{children}</div>
    </div>
  );
}

function DataTable({ columns, rows, emptyLabel }) {
  if (!rows.length) {
    return (
      <div className="sad-table-wrap">
        <table className="sad-table">
          <thead>
            <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="sad-table__empty">{emptyLabel}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="sad-table-wrap">
      <table className="sad-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id || row.requestId || row.stableId || row.subscriptionId}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { t, i18n } = useTranslation();
  const td = useCallback((key, opts) => t(`pages.superDashboard.${key}`, opts), [t]);
  const lbl = useCallback((path) => t(`pages.superDashboard.labels.${path}`), [t]);
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('month');
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState(() => [...dummyStableRegistrationRequests]);
  const [tenants, setTenants] = useState(() => [...dummyTenantStables]);
  const [subscriptions, setSubscriptions] = useState(() => [...dummySuperAdminSubscriptions]);

  const numberLocale = i18n.language === 'ar' ? 'ar-BH' : 'en-US';
  const isRtl = i18n.language === 'ar';
  const formatMoney = (n) => `${td('currency')} ${Number(n).toLocaleString(numberLocale)}`;

  const scope = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matchSearch = (row) => !q || [
      row.stableName,
      row.ownerName,
      row.requestId,
      row.country,
      row.stableId,
    ].some((v) => String(v || '').toLowerCase().includes(q));

    const filteredRequests = requests.filter((r) => matchSearch(r));
    const filteredByDate = (dateStr) => isInDateRange(dateStr, dateRange);

    const pending = requests.filter((r) => r.status === 'Pending').length;
    const approved = requests.filter((r) => r.status === 'Approved').length;
    const rejected = requests.filter((r) => r.status === 'Rejected').length;
    const suspended = requests.filter((r) => r.status === 'Suspended').length;
    const moreInfo = requests.filter((r) => r.status === 'More Info Required').length;
    const totalRequests = requests.length;
    const newThisMonth = requests.filter((r) => isInDateRange(r.submittedDate, 'month')).length;
    const conversionRate = totalRequests ? Math.round((approved / totalRequests) * 100) : 0;

    const activeSubs = subscriptions.filter((s) => mapSubStatusKey(s.status) === 'active').length;
    const expiredSubs = subscriptions.filter((s) => mapSubStatusKey(s.status) === 'expired').length;
    const expectedMrr = subscriptions.reduce((sum, s) => sum + (s.monthlyFee || 0), 0);
    const outstanding = subscriptions.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);
    const paidThisMonth = subscriptions
      .filter((s) => s.paymentStatus === 'Paid')
      .reduce((sum, s) => sum + s.monthlyFee, 0);
    const overdueStables = subscriptions.filter((s) => s.paymentStatus === 'Overdue').length;

    const requestsByStatus = REQUEST_STATUS_KEYS.map((key) => ({
      key,
      name: lbl(`requestStatus.${key}`),
      value: requests.filter((r) => mapRequestStatusKey(r.status) === key).length,
    })).filter((x) => x.value > 0);

    const requestsByType = DISCIPLINE_KEYS.map((key) => ({
      key,
      name: lbl(`discipline.${key}`),
      value: requests.filter((r) => mapDisciplineKey(r.stableType) === key).length,
    })).filter((x) => x.value > 0);

    const requestsByCountry = COUNTRY_KEYS.map((key) => ({
      key,
      name: lbl(`country.${key}`),
      value: requests.filter((r) => mapCountryKey(r.country) === key).length,
    })).filter((x) => x.value > 0);

    const subsByPlan = PLAN_KEYS.map((key) => ({
      key,
      name: lbl(`plan.${key}`),
      value: subscriptions.filter((s) => mapPlanKey(s.plan) === key).length,
    })).filter((x) => x.value > 0);

    const subsByStatus = SUB_STATUS_KEYS.map((key) => ({
      key,
      name: lbl(`subscriptionStatus.${key}`),
      value: subscriptions.filter((s) => mapSubStatusKey(s.status) === key).length,
    })).filter((x) => x.value > 0);

    const requestsByMonth = superAdminRequestsByMonth.map((row) => ({
      month: lbl(`monthsShort.${row.monthKey}`),
      count: row.count,
    }));

    const usersByMonth = superAdminActiveUsersByMonth.map((row) => ({
      month: lbl(`monthsShort.${row.monthKey}`),
      count: row.count,
    }));

    const recentRequests = [...filteredRequests]
      .sort((a, b) => (b.submittedDate || '').localeCompare(a.submittedDate || ''))
      .slice(0, 8)
      .map((r) => ({
        ...r,
        id: r.requestId,
        statusKey: mapRequestStatusKey(r.status),
        statusLabel: lbl(`requestStatus.${mapRequestStatusKey(r.status)}`),
        disciplineLabel: lbl(`discipline.${mapDisciplineKey(r.stableType)}`),
        priorityKey: (r.reviewPriority || 'Medium').toLowerCase(),
        priorityLabel: lbl(`priority.${(r.reviewPriority || 'medium').toLowerCase()}`),
        daysWaiting: daysSince(r.submittedDate),
        queuePriority: queuePriority(daysSince(r.submittedDate)),
      }));

    const approvalQueue = requests
      .filter((r) => ['Pending', 'More Info Required'].includes(r.status))
      .map((r) => {
        const days = daysSince(r.submittedDate);
        const p = queuePriority(days);
        return {
          id: r.requestId,
          stableName: r.stableName,
          ownerName: r.ownerName,
          submittedDate: r.submittedDate,
          daysWaiting: days,
          missingDocuments: (r.missingDocuments || []).join(', ') || '—',
          riskLevel: r.riskLevel,
          riskLabel: lbl(`risk.${(r.riskLevel || 'low').toLowerCase()}`),
          priorityKey: p,
          priorityLabel: lbl(`priority.${p}`),
          stableId: r.stableId,
        };
      })
      .sort((a, b) => b.daysWaiting - a.daysWaiting);

    const tenantRows = tenants.map((tnt) => ({
      ...tnt,
      id: tnt.stableId,
      accessKey: tnt.accessStatus === 'Suspended' ? 'suspended' : 'active',
      accessLabel: lbl(`accessStatus.${tnt.accessStatus === 'Suspended' ? 'suspended' : 'active'}`),
      subKey: mapSubStatusKey(tnt.subscriptionStatus),
      subLabel: lbl(`subscriptionStatus.${mapSubStatusKey(tnt.subscriptionStatus)}`),
      planLabel: lbl(`plan.${mapPlanKey(tnt.plan)}`),
    }));

    const tenantHealth = {
      active: tenants.filter((t) => t.accessStatus === 'Active').length,
      suspended: tenants.filter((t) => t.accessStatus === 'Suspended').length,
      paymentIssue: tenants.filter((t) => t.paymentIssue).length,
      incomplete: tenants.filter((t) => !t.profileComplete).length,
      lowActivity: tenants.filter((t) => t.activityLevel === 'Low').length,
    };

    const subRows = subscriptions.map((s) => ({
      ...s,
      id: s.subscriptionId,
      statusKey: mapSubStatusKey(s.status),
      statusLabel: lbl(`subscriptionStatus.${mapSubStatusKey(s.status)}`),
      planLabel: lbl(`plan.${mapPlanKey(s.plan)}`),
      paymentLabel: lbl(`paymentStatus.${{ Paid: 'paid', Overdue: 'overdue', Trial: 'trial', Unpaid: 'unpaid' }[s.paymentStatus] || 'paid'}`),
    }));

    const activityRows = dummyPlatformActivityLog.map((a) => ({
      ...a,
      id: a.id,
      activityLabel: t(`pages.superDashboard.activity.${a.id}`, { defaultValue: a.activity }),
    }));

    const docRows = dummyComplianceDocuments.map((d) => ({
      ...d,
      statusKey: (d.status || 'pending').toLowerCase(),
      statusLabel: lbl(`docStatus.${(d.status || 'pending').toLowerCase()}`),
    }));

    const compliance = {
      pendingReview: docRows.filter((d) => d.status === 'Pending').length,
      missingCr: requests.filter((r) => !(r.commercialRegistrationNumber || '').trim()).length,
      pendingAgreement: docRows.filter((d) => d.documentType.includes('Agreement') && d.status === 'Pending').length,
      verified: docRows.filter((d) => d.status === 'Verified').length,
      incomplete: tenantHealth.incomplete,
    };

    const alertRows = dummySuperAdminAlerts.map((a) => ({
      ...a,
      title: lbl(`alertTitles.${a.titleKey}`),
      priorityKey: a.priority.toLowerCase(),
      priorityLabel: lbl(`priority.${a.priority.toLowerCase()}`),
    }));

    const alertsByPriority = {
      high: alertRows.filter((a) => a.priorityKey === 'high'),
      medium: alertRows.filter((a) => a.priorityKey === 'medium'),
      low: alertRows.filter((a) => a.priorityKey === 'low'),
    };

    return {
      kpis: {
        totalRequests,
        pending,
        approved,
        rejected,
        suspended,
        moreInfo,
        activeSubs,
        expiredSubs,
        mrr: expectedMrr,
        users: platformStats.totalUsersAcrossStables,
        newThisMonth,
        conversionRate,
      },
      billing: { expectedMrr, paidThisMonth, outstanding, overdueStables },
      requestsByStatus,
      requestsByType,
      requestsByCountry,
      subsByPlan,
      subsByStatus,
      requestsByMonth,
      usersByMonth,
      recentRequests,
      approvalQueue,
      tenantRows,
      tenantHealth,
      subRows,
      activityRows,
      docRows,
      compliance,
      alertRows,
      alertsByPriority,
    };
  }, [requests, tenants, subscriptions, search, dateRange, lbl, td, t]);

  const patchRequest = (requestId, patch) => {
    setRequests((list) => list.map((r) => (r.requestId === requestId ? { ...r, ...patch } : r)));
  };

  const patchTenant = (stableId, patch) => {
    setTenants((list) => list.map((tnt) => (tnt.stableId === stableId ? { ...tnt, ...patch } : tnt)));
    if (patch.accessStatus === 'Suspended') {
      const req = requests.find((r) => r.stableId === stableId);
      if (req) patchRequest(req.requestId, { status: 'Suspended', accessStatus: 'Suspended' });
    }
  };

  const handleApprove = (row) => {
    patchRequest(row.requestId, { status: 'Approved', accessStatus: 'Active' });
    toast.success(td('toasts.approved', { name: row.stableName }));
  };

  const handleReject = (row) => {
    patchRequest(row.requestId, { status: 'Rejected', accessStatus: 'Inactive' });
    toast.error(td('toasts.rejected', { name: row.stableName }));
  };

  const handleMoreInfo = (row) => {
    patchRequest(row.requestId, { status: 'More Info Required' });
    toast(td('toasts.moreInfo', { name: row.stableName }));
  };

  const handleReview = (row) => {
    if (row.stableId && !row.stableId.includes('pending')) {
      navigate(ROUTES.superAdmin.stableReview(row.stableId));
    } else {
      toast(td('toasts.reviewPlaceholder'));
    }
  };

  const kpiCards = [
    { key: 'totalRequests', value: scope.kpis.totalRequests, icon: Building2, trend: 'neutral', iconClass: 'navy' },
    { key: 'pending', value: scope.kpis.pending, icon: Inbox, trend: 'warn', iconClass: 'gold' },
    { key: 'approved', value: scope.kpis.approved, icon: BadgeCheck, trend: 'up', iconClass: 'gold' },
    { key: 'rejected', value: scope.kpis.rejected, icon: Ban, trend: 'down', iconClass: 'danger' },
    { key: 'suspended', value: scope.kpis.suspended, icon: ShieldAlert, trend: 'down', iconClass: 'danger' },
    { key: 'activeSubs', value: scope.kpis.activeSubs, icon: CreditCard, trend: 'up', iconClass: 'navy' },
    { key: 'expiredSubs', value: scope.kpis.expiredSubs, icon: CreditCard, trend: 'down', iconClass: 'danger' },
    { key: 'mrr', value: formatMoney(scope.kpis.mrr), icon: LineChart, trend: 'up', iconClass: 'gold' },
    { key: 'users', value: scope.kpis.users, icon: Users, trend: 'up', iconClass: 'navy' },
    { key: 'newThisMonth', value: scope.kpis.newThisMonth, icon: Zap, trend: 'up', iconClass: 'gold' },
    { key: 'moreInfo', value: scope.kpis.moreInfo, icon: FileWarning, trend: 'warn', iconClass: 'gold' },
    { key: 'conversion', value: `${scope.kpis.conversionRate}%`, icon: LineChart, trend: 'neutral', iconClass: 'navy' },
  ];

  return (
    <div className="sad-page">
      <header className="sad-page__header">
        <h1 className="sad-page__title">{td('pageTitle')}</h1>
        <p className="sad-page__subtitle">{td('pageSubtitle')}</p>
        <div className="sad-toolbar">
          <div className="sad-toolbar__range" role="group" aria-label={td('dateRange.label')}>
            {DATE_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                className={`sad-toolbar__btn${dateRange === r ? ' is-active' : ''}`}
                onClick={() => setDateRange(r)}
              >
                {td(`dateRange.${r}`)}
              </button>
            ))}
          </div>
          <label className="sad-search">
            <Search size={16} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={td('searchPlaceholder')}
            />
          </label>
          <div className="sad-toolbar__actions">
            <button type="button" className="sad-btn" onClick={() => toast(td('toasts.refresh'))}>
              <RefreshCw size={16} aria-hidden />
              {td('actions.refresh')}
            </button>
            <button type="button" className="sad-btn sad-btn--gold" onClick={() => toast(td('toasts.export'))}>
              <Download size={16} aria-hidden />
              {td('actions.export')}
            </button>
          </div>
        </div>
      </header>

      <div className="sad-kpi-grid">
        {kpiCards.map((k) => (
          <article key={k.key} className="sad-kpi">
            <div className="sad-kpi__row">
              <div>
                <p className="sad-kpi__label">{td(`kpi.${k.key}`)}</p>
                <p className="sad-kpi__value">{k.value}</p>
                <p className={`sad-kpi__trend sad-kpi__trend--${k.trend}`}>{td(`kpiTrend.${k.key}`)}</p>
              </div>
              <div className={`sad-kpi__icon sad-kpi__icon--${k.iconClass}`}>
                <k.icon size={20} aria-hidden />
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Requests overview */}
      <section className="sad-section">
        <div className="sad-section__head">
          <div>
            <h2 className="sad-section__title">{td('sections.requests.title')}</h2>
            <p className="sad-section__lead">{td('sections.requests.lead')}</p>
          </div>
          <button type="button" className="sad-btn" onClick={() => navigate(ROUTES.superAdmin.stableRequests)}>
            {td('actions.goToRequests')}
          </button>
        </div>
        <div className="sad-grid-3">
          <ChartCard title={td('charts.byStatus')}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={scope.requestsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={76}>
                  {scope.requestsByStatus.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={td('charts.byType')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scope.requestsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                <XAxis dataKey="name" tick={stableDashboardChartAxisTick} />
                <YAxis tick={stableDashboardChartAxisTick} allowDecimals={false} />
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Bar dataKey="value" fill={CHART_NAVY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={td('charts.byCountry')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scope.requestsByCountry} layout="vertical" margin={{ left: 4, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                <XAxis type="number" tick={stableDashboardChartAxisTick} />
                <YAxis type="category" dataKey="name" width={isRtl ? 100 : 88} tick={stableDashboardChartAxisTick} />
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Bar dataKey="value" fill={CHART_GOLD} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="sad-card" style={{ marginTop: '1rem' }}>
          <h3>{td('tables.recentRequests')}</h3>
          <DataTable
            emptyLabel={td('empty.noData')}
            columns={[
              { key: 'requestId', label: td('col.requestId') },
              { key: 'stableName', label: td('col.stableName') },
              { key: 'ownerName', label: td('col.ownerName') },
              { key: 'country', label: td('col.country') },
              { key: 'city', label: td('col.city') },
              { key: 'disciplineLabel', label: td('col.stableType') },
              { key: 'numberOfHorses', label: td('col.horses') },
              { key: 'numberOfRiders', label: td('col.riders') },
              { key: 'submittedDate', label: td('col.submitted') },
              { key: 'status', label: td('col.status'), render: (r) => <SadBadge statusKey={r.statusKey}>{r.statusLabel}</SadBadge> },
              { key: 'priority', label: td('col.priority'), render: (r) => <SadBadge statusKey={r.priorityKey}>{r.priorityLabel}</SadBadge> },
              {
                key: 'actions',
                label: td('col.actions'),
                render: (r) => (
                  <div className="sad-actions-cell">
                    <button type="button" className="sad-btn sad-btn--sm" onClick={() => handleReview(r)}>{td('actions.review')}</button>
                    <button type="button" className="sad-btn sad-btn--sm sad-btn--gold" onClick={() => handleApprove(r)}>{td('actions.approve')}</button>
                    <button type="button" className="sad-btn sad-btn--sm" onClick={() => handleReject(r)}>{td('actions.reject')}</button>
                    <button type="button" className="sad-btn sad-btn--sm sad-btn--ghost" onClick={() => handleMoreInfo(r)}>{td('actions.moreInfo')}</button>
                  </div>
                ),
              },
            ]}
            rows={scope.recentRequests}
          />
        </div>
      </section>

      {/* Approval queue */}
      <section className="sad-section">
        <div className="sad-section__head">
          <div>
            <h2 className="sad-section__title">{td('sections.queue.title')}</h2>
            <p className="sad-section__lead">{td('sections.queue.lead')}</p>
          </div>
        </div>
        <div className="sad-card sad-card--warn">
          <div className="sad-queue">
            {scope.approvalQueue.length ? scope.approvalQueue.map((item) => (
              <div key={item.id} className={`sad-queue-item${item.priorityKey === 'high' ? ' sad-queue-item--high' : ''}`}>
                <div>
                  <strong>{item.stableName}</strong>
                  <p style={{ margin: '0.25rem 0', color: '#5c657a', fontSize: '0.84rem' }}>
                    {item.ownerName} · {td('queue.daysWaiting', { count: item.daysWaiting })}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#7a8499' }}>
                    {td('queue.missing')}: {item.missingDocuments} · {td('queue.risk')}: {item.riskLabel}
                  </p>
                  <SadBadge statusKey={item.priorityKey}>{item.priorityLabel}</SadBadge>
                </div>
                <button type="button" className="sad-btn sad-btn--gold" onClick={() => handleReview({ stableId: item.stableId, requestId: item.id })}>
                  {td('actions.reviewNow')}
                </button>
              </div>
            )) : <p className="sad-table__empty">{td('empty.queue')}</p>}
          </div>
        </div>
      </section>

      {/* Tenants */}
      <section className="sad-section">
        <div className="sad-section__head">
          <div>
            <h2 className="sad-section__title">{td('sections.tenants.title')}</h2>
            <p className="sad-section__lead">{td('sections.tenants.lead')}</p>
          </div>
          <button type="button" className="sad-btn" onClick={() => navigate(ROUTES.superAdmin.approvedStables)}>
            {td('actions.goToApproved')}
          </button>
        </div>
        <div className="sad-banner">
          <AlertTriangle size={18} aria-hidden />
          <p>{td('tenants.suspendNote')}</p>
        </div>
        <div className="sad-tenant-cards">
          {[
            ['active', scope.tenantHealth.active],
            ['suspended', scope.tenantHealth.suspended],
            ['paymentIssue', scope.tenantHealth.paymentIssue],
            ['incomplete', scope.tenantHealth.incomplete],
            ['lowActivity', scope.tenantHealth.lowActivity],
          ].map(([key, val]) => (
            <div key={key} className="sad-tenant-stat">
              <strong>{val}</strong>
              <span>{td(`tenantHealth.${key}`)}</span>
            </div>
          ))}
        </div>
        <div className="sad-card">
          <h3>{td('tables.tenantStatus')}</h3>
          <DataTable
            emptyLabel={td('empty.noData')}
            columns={[
              { key: 'stableId', label: td('col.stableId') },
              { key: 'stableName', label: td('col.stableName') },
              { key: 'ownerName', label: td('col.ownerName') },
              { key: 'planLabel', label: td('col.plan') },
              { key: 'subLabel', label: td('col.subscription') },
              { key: 'access', label: td('col.access'), render: (r) => <SadBadge statusKey={r.accessKey}>{r.accessLabel}</SadBadge> },
              { key: 'usersCount', label: td('col.users') },
              { key: 'horsesCount', label: td('col.horses') },
              { key: 'lastLogin', label: td('col.lastLogin') },
              { key: 'healthScore', label: td('col.healthScore') },
              {
                key: 'actions',
                label: td('col.actions'),
                render: (r) => (
                  <div className="sad-actions-cell">
                    <button type="button" className="sad-btn sad-btn--sm" onClick={() => toast(td('toasts.placeholder'))}>{td('actions.viewTenant')}</button>
                    {r.accessStatus === 'Active' ? (
                      <button type="button" className="sad-btn sad-btn--sm" onClick={() => { patchTenant(r.stableId, { accessStatus: 'Suspended', subscriptionStatus: 'Overdue' }); toast.error(td('toasts.suspended', { name: r.stableName })); }}>
                        {td('actions.suspend')}
                      </button>
                    ) : (
                      <button type="button" className="sad-btn sad-btn--sm sad-btn--gold" onClick={() => { patchTenant(r.stableId, { accessStatus: 'Active', subscriptionStatus: 'Active' }); toast.success(td('toasts.reactivated', { name: r.stableName })); }}>
                        {td('actions.reactivate')}
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            rows={scope.tenantRows}
          />
        </div>
      </section>

      {/* Subscriptions */}
      <section className="sad-section">
        <div className="sad-section__head">
          <div>
            <h2 className="sad-section__title">{td('sections.billing.title')}</h2>
            <p className="sad-section__lead">{td('sections.billing.lead')}</p>
          </div>
          <button type="button" className="sad-btn" onClick={() => navigate(ROUTES.superAdmin.subscriptions)}>
            {td('actions.manageSubs')}
          </button>
        </div>
        <div className="sad-summary-row">
          {[
            ['expected', formatMoney(scope.billing.expectedMrr)],
            ['paid', formatMoney(scope.billing.paidThisMonth)],
            ['outstanding', formatMoney(scope.billing.outstanding)],
            ['overdue', scope.billing.overdueStables],
          ].map(([key, val]) => (
            <div key={key} className="sad-summary-pill">
              <strong>{val}</strong>
              <span>{td(`billingSummary.${key}`)}</span>
            </div>
          ))}
        </div>
        <div className="sad-grid-2">
          <ChartCard title={td('charts.byPlan')}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={scope.subsByPlan} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {scope.subsByPlan.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={td('charts.subStatus')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scope.subsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                <XAxis dataKey="name" tick={stableDashboardChartAxisTick} interval={0} angle={-10} textAnchor="end" height={55} />
                <YAxis tick={stableDashboardChartAxisTick} allowDecimals={false} />
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Bar dataKey="value" fill={CHART_GOLD} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="sad-card" style={{ marginTop: '1rem' }}>
          <h3>{td('tables.subscriptionWatch')}</h3>
          <DataTable
            emptyLabel={td('empty.noData')}
            columns={[
              { key: 'stableName', label: td('col.stableName') },
              { key: 'planLabel', label: td('col.plan') },
              { key: 'status', label: td('col.status'), render: (r) => <SadBadge statusKey={r.statusKey}>{r.statusLabel}</SadBadge> },
              { key: 'monthlyFee', label: td('col.monthlyFee'), render: (r) => formatMoney(r.monthlyFee) },
              { key: 'renewalDate', label: td('col.renewal') },
              { key: 'outstandingBalance', label: td('col.outstanding'), render: (r) => formatMoney(r.outstandingBalance) },
              { key: 'payment', label: td('col.payment'), render: (r) => <SadBadge statusKey={r.paymentStatus === 'Overdue' ? 'overdue' : 'active'}>{r.paymentLabel}</SadBadge> },
              {
                key: 'actions',
                label: td('col.actions'),
                render: (r) => (
                  <div className="sad-actions-cell">
                    <button type="button" className="sad-btn sad-btn--sm" onClick={() => toast(td('toasts.placeholder'))}>{td('actions.invoices')}</button>
                    <button type="button" className="sad-btn sad-btn--sm" onClick={() => toast.success(td('toasts.markPaid'))}>{td('actions.markPaid')}</button>
                  </div>
                ),
              },
            ]}
            rows={scope.subRows}
          />
        </div>
      </section>

      {/* Platform activity */}
      <section className="sad-section">
        <div className="sad-section__head">
          <div>
            <h2 className="sad-section__title">{td('sections.activity.title')}</h2>
            <p className="sad-section__lead">{td('sections.activity.lead')}</p>
          </div>
        </div>
        <div className="sad-grid-2">
          <ChartCard title={td('charts.requestsMonth')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scope.requestsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                <XAxis dataKey="month" tick={stableDashboardChartAxisTick} />
                <YAxis tick={stableDashboardChartAxisTick} />
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Bar dataKey="count" fill={CHART_NAVY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={td('charts.usersMonth')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scope.usersByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                <XAxis dataKey="month" tick={stableDashboardChartAxisTick} />
                <YAxis tick={stableDashboardChartAxisTick} />
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Bar dataKey="count" fill={CHART_GOLD} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="sad-card" style={{ marginTop: '1rem' }}>
          <h3>{td('tables.platformActivity')}</h3>
          <DataTable
            emptyLabel={td('empty.noData')}
            columns={[
              { key: 'time', label: td('col.time') },
              { key: 'stableName', label: td('col.stableName') },
              { key: 'user', label: td('col.user') },
              { key: 'role', label: td('col.role') },
              { key: 'activityLabel', label: td('col.activity') },
              { key: 'status', label: td('col.status'), render: (r) => <SadBadge statusKey={r.status === 'Warning' ? 'overdue' : 'active'}>{r.status}</SadBadge> },
            ]}
            rows={scope.activityRows}
          />
        </div>
      </section>

      <div className="sad-grid-2">
        {/* Compliance */}
        <section className="sad-section">
          <div className="sad-section__head">
            <h2 className="sad-section__title">{td('sections.compliance.title')}</h2>
            <p className="sad-section__lead">{td('sections.compliance.lead')}</p>
          </div>
          <div className="sad-grid-2" style={{ marginBottom: '1rem' }}>
            {[
              ['pendingReview', scope.compliance.pendingReview],
              ['missingCr', scope.compliance.missingCr],
              ['pendingAgreement', scope.compliance.pendingAgreement],
              ['verified', scope.compliance.verified],
            ].map(([key, val]) => (
              <div key={key} className="sad-tenant-stat">
                <strong>{val}</strong>
                <span>{td(`compliance.${key}`)}</span>
              </div>
            ))}
          </div>
          <div className="sad-card">
            <h3>{td('tables.documentQueue')}</h3>
            <DataTable
              emptyLabel={td('empty.noData')}
              columns={[
                { key: 'stableName', label: td('col.stableName') },
                { key: 'documentType', label: td('col.documentType') },
                { key: 'uploadedDate', label: td('col.uploaded') },
                { key: 'status', label: td('col.status'), render: (r) => <SadBadge statusKey={r.statusKey === 'verified' ? 'approved' : r.statusKey === 'missing' ? 'rejected' : 'pending'}>{r.statusLabel}</SadBadge> },
                { key: 'notes', label: td('col.notes') },
                {
                  key: 'actions',
                  label: td('col.actions'),
                  render: () => (
                    <button type="button" className="sad-btn sad-btn--sm" onClick={() => toast(td('toasts.placeholder'))}>
                      {td('actions.verify')}
                    </button>
                  ),
                },
              ]}
              rows={scope.docRows}
            />
          </div>
        </section>

        {/* Alerts */}
        <section className="sad-section">
          <div className="sad-section__head">
            <h2 className="sad-section__title">{td('sections.alerts.title')}</h2>
            <p className="sad-section__lead">{td('sections.alerts.lead')}</p>
          </div>
          {['high', 'medium', 'low'].map((level) => (
            <div key={level} style={{ marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '0.85rem', margin: '0 0 0.5rem', color: '#5c657a' }}>{td(`alertLevel.${level}`)}</h3>
              <div className="sad-alerts">
                {scope.alertsByPriority[level].map((a) => (
                  <div key={a.id} className={`sad-alert sad-alert--${level}`}>
                    <AlertTriangle size={16} aria-hidden />
                    <div style={{ flex: 1 }}>
                      <SadBadge statusKey={a.priorityKey}>{a.priorityLabel}</SadBadge>
                      <strong style={{ display: 'block', marginTop: '0.25rem' }}>{a.title}</strong>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#5c657a' }}>{a.stableName} · {a.date}</p>
                    </div>
                    <button type="button" className="sad-btn sad-btn--sm" onClick={() => toast(td('toasts.placeholder'))}>{td('actions.view')}</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Quick actions */}
      <section className="sad-section">
        <h2 className="sad-section__title">{td('sections.quickActions.title')}</h2>
        <div className="sad-quick-actions">
          <button type="button" className="sad-btn sad-btn--gold" onClick={() => navigate(ROUTES.superAdmin.stableRequests)}>{td('quick.reviewRequests')}</button>
          <button type="button" className="sad-btn" onClick={() => navigate(ROUTES.superAdmin.approvedStables)}>{td('quick.approved')}</button>
          <button type="button" className="sad-btn" onClick={() => navigate(ROUTES.superAdmin.rejectedStables)}>{td('quick.rejected')}</button>
          <button type="button" className="sad-btn" onClick={() => navigate(ROUTES.superAdmin.subscriptions)}>{td('quick.subscriptions')}</button>
          <button type="button" className="sad-btn sad-btn--ghost" onClick={() => toast(td('toasts.placeholder'))}>{td('quick.announcement')}</button>
          <button type="button" className="sad-btn sad-btn--ghost" onClick={() => toast(td('toasts.placeholder'))}>{td('quick.exportTenants')}</button>
          <button type="button" className="sad-btn sad-btn--ghost" onClick={() => navigate(ROUTES.superAdmin.settings)}>{td('quick.settings')}</button>
        </div>
      </section>
    </div>
  );
}
