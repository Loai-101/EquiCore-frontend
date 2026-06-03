/**
 * Stable Dashboard — executive operational overview (dummy data, tenant-scoped).
 */
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  Download,
  Footprints,
  HeartPulse,
  Package,
  RefreshCw,
  Trophy,
  Users,
  Wallet,
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
import { useAuth } from '../../../../context/AuthContext';
import {
  dummyDashboardAlerts,
  dummyExpenses,
  dummyHealthRecords,
  dummyHorses,
  dummyHorsesAttention,
  dummyInventory,
  dummyMedicalTasks,
  dummyMedicationCourses,
  dummyRecentReports,
  dummyRiders,
  dummyStableUsers,
  dummyTrainingSchedule,
  dummyTrainingSessions,
  dummyUpcomingEvents,
  dummyUserActivity,
} from '../../../../services/mock/dummyData';
import { REPORT_CATALOG } from '../../Reports/code/reportCatalog';
import { ROUTES } from '../../../../utils/constants';
import {
  stableDashboardChartAxisTick,
  stableDashboardChartTooltipContentStyle,
} from '../../../../utils/chartUiConfig';
import '../styles/StableDashboard.css';

const DEMO_TODAY = new Date('2026-05-17T12:00:00');
const DATE_RANGES = ['today', 'week', 'month', 'year'];
const CHART_GOLD = '#c9a227';
const CHART_NAVY = '#1c2f5c';
const CHART_PALETTE = ['#1c2f5c', '#c9a227', '#5c7cba', '#8a6d12', '#7a8499', '#2e8b57'];

const HORSE_STATUS_KEYS = ['active', 'rest', 'injured', 'recovery', 'retired'];
const DISCIPLINE_KEYS = ['endurance', 'flatRacing', 'jumping', 'mixed'];
const EXPENSE_CHART_KEYS = ['feed', 'medications', 'stableSupplies', 'horseSupplies', 'veterinary', 'transportation', 'staff', 'other'];
const PAYMENT_CHART_KEYS = ['cash', 'benefitPay', 'card', 'bankTransfer', 'cheque'];
const TRAINING_STATUS_KEYS = ['planned', 'sentToRider', 'completed', 'cancelled'];
const QUALIFICATION_KEYS = ['qualified', 'pendingReview', 'expired'];
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTH_SHORT_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const INV_SECTION_KEYS = ['medications', 'feed', 'horseSupplies'];

const EXPENSE_CATEGORY_I18N = {
  Feed: 'feed',
  Veterinary: 'veterinary',
  Equipment: 'equipment',
  Training: 'training',
  Transport: 'transport',
  Utilities: 'utilities',
  Staff: 'staff',
  Other: 'other',
};

function mapHorseStatusKey(status) {
  if (status === 'Competing' || status === 'Training') return 'active';
  if (status === 'Rest') return 'rest';
  if (status === 'Injured') return 'injured';
  if (status === 'Recovery') return 'recovery';
  if (status === 'Retired') return 'retired';
  return 'active';
}

function mapDisciplineKey(sportType) {
  const m = {
    Endurance: 'endurance',
    'Flat Racing': 'flatRacing',
    Jumping: 'jumping',
    Mixed: 'mixed',
  };
  return m[sportType] || 'endurance';
}

function mapExpenseChartKey(cat) {
  const m = {
    Feed: 'feed',
    Veterinary: 'veterinary',
    Equipment: 'horseSupplies',
    Training: 'other',
    Transport: 'transportation',
    Utilities: 'stableSupplies',
    Staff: 'staff',
    Other: 'other',
  };
  return m[cat] || 'other';
}

function mapPaymentKey(method) {
  const m = { Cash: 'cash', Card: 'card', Wire: 'bankTransfer', Cheque: 'cheque', BenefitPay: 'benefitPay' };
  return m[method] || 'bankTransfer';
}

function mapTrainingStatusKey(status) {
  const m = {
    Planned: 'planned',
    'Sent to Rider': 'sentToRider',
    Completed: 'completed',
    Cancelled: 'cancelled',
  };
  return m[status] || 'completed';
}

function mapQualificationKey(status) {
  const m = { Qualified: 'qualified', 'Pending Review': 'pendingReview', Expired: 'expired' };
  return m[status] || 'qualified';
}

function mapRoleKey(role) {
  const m = {
    'Stable Owner': 'stableAdmin',
    'Stable Admin': 'stableAdmin',
    Trainer: 'trainer',
    Rider: 'rider',
    Veterinarian: 'veterinarian',
    Accountant: 'accountant',
    Staff: 'staff',
  };
  return m[role] || 'staff';
}

function mapEventTypeKey(type) {
  const m = {
    Training: 'training',
    Competition: 'competition',
    'Vet Check': 'vetCheck',
    'Recovery Period': 'recoveryPeriod',
    Race: 'race',
    'Medication Dose': 'medicationDose',
    'Blood Test': 'bloodTest',
  };
  return m[type] || 'training';
}

function mapEventStatusKey(status) {
  const m = {
    Planned: 'planned',
    Confirmed: 'confirmed',
    Scheduled: 'scheduled',
    Due: 'due',
    Active: 'active',
    Entered: 'entered',
  };
  return m[status] || 'planned';
}

function mapTrainingTypeKey(type) {
  if (!type) return 'other';
  if (type.includes('Group')) return 'groupEndurance';
  const m = {
    Interval: 'interval',
    Recovery: 'recovery',
    Endurance: 'endurance',
    Hill: 'hill',
    Technical: 'technical',
    Tempo: 'tempo',
  };
  return m[type] || 'other';
}

function inventorySectionKey(category) {
  if (category === 'Medication') return 'medications';
  if (category === 'Feed' || category === 'Supplements') return 'feed';
  if (category === 'Stable Supplies') return 'stableSupplies';
  return 'horseSupplies';
}

function parseYmd(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

function isInDateRange(dateStr, range, anchor = DEMO_TODAY) {
  const d = parseYmd(dateStr);
  if (!d) return false;
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  const end = new Date(anchor);
  end.setHours(23, 59, 59, 999);

  if (range === 'today') {
    return d >= start && d <= end;
  }
  if (range === 'week') {
    const wStart = new Date(anchor);
    wStart.setDate(wStart.getDate() - 6);
    wStart.setHours(0, 0, 0, 0);
    return d >= wStart && d <= end;
  }
  if (range === 'month') {
    return d.getMonth() === anchor.getMonth() && d.getFullYear() === anchor.getFullYear();
  }
  return d.getFullYear() === anchor.getFullYear();
}

function daysUntil(dateStr, anchor = DEMO_TODAY) {
  const d = parseYmd(dateStr);
  if (!d) return 999;
  return Math.ceil((d - anchor) / (1000 * 60 * 60 * 24));
}


function scoreStatus(score) {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'attention';
  return 'critical';
}

function Badge({ variant = 'muted', children }) {
  return <span className={`sd-badge sd-badge--${variant}`}>{children}</span>;
}

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`sd-card ${className}`.trim()}>
      <h3>{title}</h3>
      <div className="sd-chart">{children}</div>
    </div>
  );
}

function DataTable({ columns, rows, emptyLabel }) {
  if (!rows.length) {
    return (
      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="sd-table__empty">
                {emptyLabel}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="sd-table-wrap">
      <table className="sd-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
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

export default function StableDashboard() {
  const { t, i18n } = useTranslation();
  const td = useCallback((key, opts) => t(`pages.stableDashboard.${key}`, opts), [t]);
  const lbl = useCallback((path) => t(`pages.stableDashboard.labels.${path}`), [t]);
  const { stableId } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('month');
  const numberLocale = i18n.language === 'ar' ? 'ar-BH' : 'en-US';
  const isRtl = i18n.language === 'ar';

  const scope = useMemo(() => {
    const sid = stableId || 'stable-1';
    const horses = dummyHorses.filter((h) => h.stableId === sid);
    const riders = dummyRiders.filter((r) => r.stableId === sid);
    const sessions = dummyTrainingSessions.filter((s) => s.stableId === sid);
    const schedule = dummyTrainingSchedule.filter((s) => s.stableId === sid);
    const health = dummyHealthRecords.filter((h) => h.stableId === sid);
    const inventory = dummyInventory.filter((i) => i.stableId === sid);
    const expenses = dummyExpenses.filter((e) => e.stableId === sid);
    const users = dummyStableUsers.filter((u) => u.stableId === sid);
    const medicalTasks = dummyMedicalTasks.filter((m) => m.stableId === sid);
    const medications = dummyMedicationCourses.filter((m) => m.stableId === sid);
    const events = dummyUpcomingEvents.filter((e) => e.stableId === sid);
    const alerts = dummyDashboardAlerts.filter((a) => a.stableId === sid);
    const reports = dummyRecentReports.filter((r) => r.stableId === sid);
    const activity = dummyUserActivity.filter((a) => a.stableId === sid);
    const attention = dummyHorsesAttention.filter((a) => a.stableId === sid);

    const filteredExpenses = expenses.filter((e) => isInDateRange(e.date, dateRange));
    const filteredSessions = sessions.filter((s) => isInDateRange(s.date, dateRange));
    const filteredSchedule = schedule.filter((s) => isInDateRange(s.date, dateRange));

    const horseStatusCounts = HORSE_STATUS_KEYS.map((key) => ({
      key,
      name: lbl(`horseStatus.${key}`),
      value: horses.filter((h) => mapHorseStatusKey(h.status) === key).length,
    })).filter((x) => x.value > 0);

    const disciplineCounts = DISCIPLINE_KEYS.map((key) => ({
      key,
      name: lbl(`discipline.${key}`),
      value: horses.filter((h) => mapDisciplineKey(h.sportType || 'Endurance') === key).length,
    })).filter((x) => x.value > 0);

    const qualCounts = QUALIFICATION_KEYS.map((key) => ({
      key,
      name: lbl(`qualification.${key}`),
      value: riders.filter((r) => mapQualificationKey(r.qualificationStatus || 'Qualified') === key).length,
    })).filter((x) => x.value > 0);

    const weeklyTraining = WEEKDAY_KEYS.map((key, dayIndex) => {
      const count = [...filteredSessions, ...filteredSchedule].filter((row) => {
        const d = parseYmd(row.date);
        return d && d.getDay() === dayIndex;
      }).length;
      return { key, day: lbl(`weekdays.${key}`), sessions: count };
    });

    const trainingTypes = {};
    [...filteredSessions, ...filteredSchedule].forEach((row) => {
      const typeKey = mapTrainingTypeKey(row.trainingType);
      trainingTypes[typeKey] = (trainingTypes[typeKey] || 0) + 1;
    });
    const trainingTypeChart = Object.entries(trainingTypes).map(([key, value]) => ({
      key,
      name: lbl(`trainingType.${key}`),
      value,
    }));

    const trainingStatusCounts = TRAINING_STATUS_KEYS.map((key) => ({
      key,
      name: lbl(`trainingStatus.${key}`),
      value: [...filteredSchedule, ...filteredSessions].filter(
        (r) => mapTrainingStatusKey(r.status || 'Completed') === key
      ).length,
    })).filter((x) => x.value > 0);

    const todaySchedule = schedule
      .filter((s) => isInDateRange(s.date, 'today'))
      .map((s) => ({
        ...s,
        statusLabel: lbl(`trainingStatus.${mapTrainingStatusKey(s.status)}`),
        riderDisplay: s.rider === 'Group' ? lbl('group') : s.rider,
      }));

    const medicalAlertTypes = [
      { key: 'postTraining', count: medicalTasks.filter((m) => m.task.toLowerCase().includes('quick check')).length },
      { key: 'weeklyExam', count: medicalTasks.filter((m) => m.task.toLowerCase().includes('weekly')).length },
      { key: 'bloodTest', count: medicalTasks.filter((m) => m.task.toLowerCase().includes('blood')).length },
      { key: 'vaccination', count: medicalTasks.filter((m) => m.task.toLowerCase().includes('vaccination')).length },
      { key: 'medication', count: medications.filter((m) => m.status === 'Active').length },
    ];

    const invSections = INV_SECTION_KEYS.map((key) => {
      const items = inventory.filter((i) => inventorySectionKey(i.category) === key);
      const value = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.price || 0), 0);
      return { key, name: lbl(`inventorySection.${key}`), value: Math.round(value) };
    });

    const lowStockChart = inventory
      .filter((i) => i.quantity <= i.minStock)
      .map((i) => ({ name: i.itemName.length > 18 ? `${i.itemName.slice(0, 16)}…` : i.itemName, qty: i.quantity }));

    const expiringChart = inventory
      .filter((i) => i.expiryDate && daysUntil(i.expiryDate) <= 90)
      .map((i) => ({ name: i.itemName.length > 16 ? `${i.itemName.slice(0, 14)}…` : i.itemName, days: daysUntil(i.expiryDate) }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 6);

    const criticalInventory = inventory
      .filter((i) => i.quantity <= i.minStock || (i.expiryDate && daysUntil(i.expiryDate) <= 30))
      .map((i) => {
        const statusKey = i.quantity <= i.minStock ? 'lowStock' : 'expiringSoon';
        const sectionKey = inventorySectionKey(i.category);
        return {
          id: i.id,
          item: i.itemName,
          section: lbl(`inventorySection.${sectionKey}`),
          quantity: i.quantity,
          statusKey,
          status: lbl(`inventoryStatus.${statusKey}`),
          expiryDate: i.expiryDate || '—',
          assignedTo: i.assignedTo || '—',
        };
      });

    const monthlyTrend = MONTH_SHORT_KEYS.map((key, idx) => {
      const amount = expenses
        .filter((e) => {
          const d = parseYmd(e.date);
          return d && d.getMonth() === idx && d.getFullYear() === DEMO_TODAY.getFullYear();
        })
        .reduce((sum, e) => sum + e.amount, 0);
      return { key, month: lbl(`monthsShort.${key}`), amount };
    }).filter((row, idx) => idx <= DEMO_TODAY.getMonth() || row.amount > 0);

    const expenseByCategory = EXPENSE_CHART_KEYS.map((key) => ({
      key,
      name: lbl(`expenseChart.${key}`),
      value: filteredExpenses
        .filter((e) => mapExpenseChartKey(e.category) === key)
        .reduce((sum, e) => sum + e.amount, 0),
    })).filter((x) => x.value > 0);

    const paymentByMethod = PAYMENT_CHART_KEYS.map((key) => ({
      key,
      name: lbl(`payment.${key}`),
      value: filteredExpenses
        .filter((e) => mapPaymentKey(e.paymentMethod) === key)
        .reduce((sum, e) => sum + e.amount, 0),
    })).filter((x) => x.value > 0);

    const deferredRows = expenses
      .filter((e) => e.paymentStatus === 'Deferred' || e.paymentStatus === 'Pending')
      .map((e) => {
        const paid = e.paymentStatus === 'Paid' ? e.amount : 0;
        const remaining = e.amount - paid;
        const statusKey = e.paymentStatus === 'Deferred' ? 'deferred' : 'pending';
        const catKey = EXPENSE_CATEGORY_I18N[e.category] || 'other';
        return {
          id: e.id,
          date: e.date,
          supplier: e.supplier,
          category: t(`pages.expenses.categories.${catKey}`),
          amount: e.amount,
          paid,
          remaining,
          dueDate: e.dueDate || '—',
          statusKey,
          status: t(`pages.expenses.paymentStatus.${statusKey}`),
        };
      });

    const roleCounts = {};
    users.forEach((u) => {
      const roleKey = mapRoleKey(u.role);
      roleCounts[roleKey] = (roleCounts[roleKey] || 0) + 1;
    });
    const usersByRole = Object.entries(roleCounts).map(([key, value]) => ({
      key,
      name: lbl(`roles.${key}`),
      value,
    }));

    const userActiveChart = [
      { name: td('users.active'), value: users.filter((u) => u.status === 'active').length },
      { name: td('users.inactive'), value: users.filter((u) => u.status !== 'active').length },
    ].filter((x) => x.value > 0);

    const readyReports = REPORT_CATALOG.filter((r) => r.status === 'ready').length;
    const pendingReports = REPORT_CATALOG.filter((r) => r.status === 'comingSoon' || r.status === 'requiresData').length;

    const totalHorses = horses.length;
    const activeHorses = horses.filter((h) => mapHorseStatusKey(h.status) === 'active').length;
    const recoveryHorses = horses.filter((h) => mapHorseStatusKey(h.status) === 'recovery').length;
    const activeRiders = riders.filter((r) => r.status === 'active').length;
    const todayTraining = todaySchedule.length;
    const pendingMedical = medicalTasks.filter((m) => ['Due', 'Pending'].includes(m.status)).length;
    const lowStock = inventory.filter((i) => i.quantity <= i.minStock).length;
    const monthlyExpenses = expenses
      .filter((e) => isInDateRange(e.date, 'month'))
      .reduce((sum, e) => sum + e.amount, 0);
    const deferredTotal = deferredRows.reduce((sum, r) => sum + r.remaining, 0);
    const upcomingCompetitions = events.filter((e) => e.eventType === 'Competition' && daysUntil(e.date) >= 0).length;

    const completedTraining = filteredSchedule.filter((s) => s.status === 'Completed').length
      + filteredSessions.filter((s) => s.status === 'Completed').length;
    const totalTraining = filteredSchedule.length + filteredSessions.length;
    const trainingRate = totalTraining ? Math.round((completedTraining / totalTraining) * 100) : 0;

    const medicalDone = medicalTasks.filter((m) => m.status === 'Completed').length;
    const medicalRate = medicalTasks.length
      ? Math.round((medicalDone / medicalTasks.length) * 100)
      : Math.max(0, 100 - pendingMedical * 15);

    const invHealthy = inventory.length
      ? Math.round((inventory.filter((i) => i.quantity > i.minStock).length / inventory.length) * 100)
      : 100;

    const paidExpenses = expenses.filter((e) => e.paymentStatus === 'Paid').length;
    const expenseControl = expenses.length ? Math.round((paidExpenses / expenses.length) * 100) : 100;

    const userActivityRate = users.length
      ? Math.round((users.filter((u) => u.status === 'active').length / users.length) * 100)
      : 0;

    const horseReadiness = totalHorses
      ? Math.round((activeHorses / totalHorses) * 100)
      : 0;

    const overallScore = Math.round(
      (trainingRate * 0.2
        + medicalRate * 0.2
        + invHealthy * 0.15
        + expenseControl * 0.15
        + userActivityRate * 0.15
        + horseReadiness * 0.15)
    );

    const riderPerformance = riders.map((r) => {
      const horseList = r.assignedHorses ? r.assignedHorses.split(',').map((s) => s.trim()) : [];
      const sessionsMonth = sessions.filter(
        (s) => s.rider === r.name && isInDateRange(s.date, 'month')
      ).length;
      const firstHorse = horseList.length ? horses.find((h) => h.name === horseList[0]) : null;
      const disciplineKey = firstHorse ? mapDisciplineKey(firstHorse.sportType) : null;
      return {
        id: r.id,
        rider: r.name,
        discipline: disciplineKey ? lbl(`discipline.${disciplineKey}`) : '—',
        assignedHorses: horseList.length || '—',
        sessionsMonth,
        garmin: r.garminConnected ? td('status.connected') : td('status.disconnected'),
        status: r.status === 'active' ? td('status.active') : td('status.inactive'),
      };
    });

    const attentionRows = attention.map((row) => ({
      ...row,
      issue: t(`pages.stableDashboard.attentionIssues.${row.id}`, { defaultValue: row.issue }),
      priorityLabel: lbl(`priority.${row.priority.toLowerCase()}`),
    }));

    const alertRows = alerts.map((a) => ({
      ...a,
      message: t(`pages.stableDashboard.alertMessages.${a.id}`, { defaultValue: a.message }),
      priorityLabel: lbl(`priority.${a.priority.toLowerCase()}`),
    }));

    const medicalTaskRows = medicalTasks.map((m) => ({
      ...m,
      task: t(`pages.stableDashboard.medicalTasks.${m.id}`, { defaultValue: m.task }),
      priorityLabel: lbl(`priority.${m.priority.toLowerCase()}`),
      statusLabel: lbl(`medicalStatus.${m.status.toLowerCase()}`),
    }));

    const medicationRows = medications.map((m) => ({
      ...m,
      statusLabel: lbl(`medicationStatus.${m.status.toLowerCase()}`),
      vetApprovalLabel: lbl(`vetApproval.${m.vetApproval.toLowerCase()}`),
    }));

    const eventRows = events.map((e) => ({
      ...e,
      eventTypeLabel: lbl(`eventType.${mapEventTypeKey(e.eventType)}`),
      statusLabel: lbl(`eventStatus.${mapEventStatusKey(e.status)}`),
    }));

    const reportRows = reports.map((r) => ({
      ...r,
      typeLabel: lbl(`reportType.${r.type.toLowerCase()}`),
      statusLabel: lbl(`reportStatus.${r.status.toLowerCase()}`),
    }));

    return {
      horses,
      riders,
      users,
      attention: attentionRows,
      alerts: alertRows,
      horseStatusCounts,
      disciplineCounts,
      qualCounts,
      weeklyTraining,
      trainingTypeChart,
      trainingStatusCounts,
      todaySchedule,
      medicalTasks: medicalTaskRows,
      medications: medicationRows,
      medicalAlertTypes,
      invSections,
      lowStockChart,
      expiringChart,
      criticalInventory,
      monthlyTrend,
      expenseByCategory,
      paymentByMethod,
      deferredRows,
      events: eventRows,
      reports: reportRows,
      activity,
      usersByRole,
      userActiveChart,
      readyReports,
      pendingReports,
      kpis: {
        totalHorses,
        activeHorses,
        recoveryHorses,
        totalRiders: riders.length,
        activeRiders,
        todayTraining,
        pendingMedical,
        lowStock,
        monthlyExpenses,
        deferredTotal,
        upcomingCompetitions,
        healthScore: overallScore,
      },
      performance: {
        overallScore,
        status: scoreStatus(overallScore),
        trainingRate,
        medicalRate,
        invHealthy,
        expenseControl,
        userActivityRate,
        horseReadiness,
      },
      riderPerformance,
    };
  }, [stableId, dateRange, td, lbl, t]);

  const formatMoney = (n) => `BHD ${Number(n).toLocaleString(numberLocale)}`;

  const priorityVariant = (p) => {
    const v = (p || '').toLowerCase();
    if (v === 'high') return 'danger';
    if (v === 'medium') return 'warn';
    return 'muted';
  };

  const goTo = (path) => () => navigate(path);

  return (
    <div className="sd-page">
      <header className="sd-page__header">
        <h1 className="sd-page__title">{td('pageTitle')}</h1>
        <p className="sd-page__subtitle">{td('pageSubtitle')}</p>
        <div className="sd-toolbar">
          <div className="sd-toolbar__range" role="group" aria-label={td('dateRange.label')}>
            {DATE_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                className={`sd-toolbar__btn${dateRange === r ? ' is-active' : ''}`}
                onClick={() => setDateRange(r)}
              >
                {td(`dateRange.${r}`)}
              </button>
            ))}
          </div>
          <div className="sd-toolbar__actions">
            <button type="button" className="sd-btn" onClick={() => toast(td('toasts.refresh'))}>
              <RefreshCw size={16} aria-hidden />
              {td('actions.refresh')}
            </button>
            <button type="button" className="sd-btn sd-btn--gold" onClick={() => toast(td('toasts.exportPdf'))}>
              <Download size={16} aria-hidden />
              {td('actions.exportPdf')}
            </button>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="sd-kpi-grid">
        {[
          { label: td('kpi.totalHorses'), value: scope.kpis.totalHorses, icon: Footprints },
          { label: td('kpi.activeHorses'), value: scope.kpis.activeHorses, icon: Footprints },
          { label: td('kpi.recoveryHorses'), value: scope.kpis.recoveryHorses, icon: HeartPulse },
          { label: td('kpi.totalRiders'), value: scope.kpis.totalRiders, icon: Users },
          { label: td('kpi.activeRiders'), value: scope.kpis.activeRiders, icon: Users },
          { label: td('kpi.todayTraining'), value: scope.kpis.todayTraining, icon: Activity },
          { label: td('kpi.pendingMedical'), value: scope.kpis.pendingMedical, icon: HeartPulse },
          { label: td('kpi.lowStock'), value: scope.kpis.lowStock, icon: Package },
          { label: td('kpi.monthlyExpenses'), value: formatMoney(scope.kpis.monthlyExpenses), icon: Wallet },
          { label: td('kpi.deferredPayments'), value: formatMoney(scope.kpis.deferredTotal), icon: Wallet },
          { label: td('kpi.upcomingCompetitions'), value: scope.kpis.upcomingCompetitions, icon: Trophy },
          {
            label: td('kpi.healthScore'),
            value: scope.kpis.healthScore,
            hint: td(`performance.status.${scope.performance.status}`),
            icon: BarChart3,
            score: true,
          },
        ].map((k) => (
          <article key={k.label} className={`sd-kpi${k.score ? ' sd-kpi--score' : ''}`}>
            <div className="sd-kpi__row">
              <div>
                <p className="sd-kpi__label">{k.label}</p>
                <p className="sd-kpi__value">{k.value}</p>
                {k.hint ? <p className="sd-kpi__hint">{k.hint}</p> : null}
              </div>
              <div className="sd-kpi__icon">
                <k.icon size={20} aria-hidden />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="sd-grid-2">
        {/* Alerts */}
        <section className="sd-section">
          <div className="sd-section__head">
            <div>
              <h2 className="sd-section__title">{td('sections.alerts.title')}</h2>
              <p className="sd-section__lead">{td('sections.alerts.lead')}</p>
            </div>
          </div>
          <div className="sd-card sd-card--alerts">
            <div className="sd-alerts">
              {scope.alerts.map((a) => (
                <div key={a.id} className={`sd-alert sd-alert--${a.priority.toLowerCase()}`}>
                  <AlertTriangle size={16} aria-hidden />
                  <div>
                    <Badge variant={priorityVariant(a.priority)}>{a.priorityLabel}</Badge>
                    <p style={{ margin: '0.35rem 0 0' }}>{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Performance score */}
        <section className="sd-section">
          <div className="sd-section__head">
            <div>
              <h2 className="sd-section__title">{td('sections.performance.title')}</h2>
              <p className="sd-section__lead">{td('sections.performance.lead')}</p>
            </div>
            <button type="button" className="sd-btn sd-btn--ghost" onClick={goTo(ROUTES.stable.reports)}>
              {td('actions.viewReports')}
            </button>
          </div>
          <div className="sd-card sd-performance-card">
            <div className="sd-score-panel">
              <div
                className="sd-score-ring"
                style={{ '--score': scope.performance.overallScore }}
                aria-label={td('performance.scoreLabel', { score: scope.performance.overallScore })}
              >
                <strong>{scope.performance.overallScore}</strong>
                <span>/ {lbl('scoreOutOf')}</span>
              </div>
              <div>
                <Badge variant="warn">{td(`performance.status.${scope.performance.status}`)}</Badge>
                <div className="sd-score-factors" style={{ marginTop: '0.85rem' }}>
                  {[
                    ['training', scope.performance.trainingRate],
                    ['medical', scope.performance.medicalRate],
                    ['inventory', scope.performance.invHealthy],
                    ['expenses', scope.performance.expenseControl],
                    ['users', scope.performance.userActivityRate],
                    ['horses', scope.performance.horseReadiness],
                  ].map(([key, val]) => (
                    <div key={key} className="sd-score-factor">
                      <span>{td(`performance.factors.${key}`)}</span>
                      <strong>{val}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Horses */}
      <section className="sd-section">
        <div className="sd-section__head">
          <div>
            <h2 className="sd-section__title">{td('sections.horses.title')}</h2>
            <p className="sd-section__lead">{td('sections.horses.lead')}</p>
          </div>
          <button type="button" className="sd-btn" onClick={goTo(ROUTES.stable.horses)}>
            {td('actions.goToModule')}
          </button>
        </div>
        <div className="sd-grid-3">
          <ChartCard title={td('charts.horseStatus')}>
            {scope.horseStatusCounts.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={scope.horseStatusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={2}>
                    {scope.horseStatusCounts.map((_, i) => (
                      <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="sd-table__empty">{td('empty.noData')}</p>
            )}
          </ChartCard>
          <ChartCard title={td('charts.discipline')}>
            {scope.disciplineCounts.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scope.disciplineCounts} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                  <XAxis type="number" tick={stableDashboardChartAxisTick} />
                  <YAxis type="category" dataKey="name" width={isRtl ? 110 : 90} tick={stableDashboardChartAxisTick} />
                  <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                  <Bar dataKey="value" fill={CHART_NAVY} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="sd-table__empty">{td('empty.noData')}</p>
            )}
          </ChartCard>
          <div className="sd-card">
            <h3>{td('tables.horsesAttention')}</h3>
            <DataTable
              emptyLabel={td('empty.noData')}
              columns={[
                { key: 'horse', label: td('col.horse') },
                { key: 'issue', label: td('col.issue') },
                { key: 'priority', label: td('col.priority'), render: (r) => <Badge variant={priorityVariant(r.priority)}>{r.priorityLabel}</Badge> },
                { key: 'lastUpdate', label: td('col.lastUpdate') },
                { key: 'action', label: td('col.action'), render: () => <button type="button" className="sd-link-btn" onClick={() => toast(td('toasts.placeholder'))}>{td('actions.viewDetails')}</button> },
              ]}
              rows={scope.attention}
            />
          </div>
        </div>
      </section>

      {/* Riders */}
      <section className="sd-section">
        <div className="sd-section__head">
          <div>
            <h2 className="sd-section__title">{td('sections.riders.title')}</h2>
            <p className="sd-section__lead">{td('sections.riders.lead')}</p>
          </div>
          <button type="button" className="sd-btn" onClick={goTo(ROUTES.stable.riders)}>
            {td('actions.goToModule')}
          </button>
        </div>
        <div className="sd-grid-2">
          <ChartCard title={td('charts.riderQualification')}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={scope.qualCounts.length ? scope.qualCounts : [{ name: td('empty.noData'), value: 1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {(scope.qualCounts.length ? scope.qualCounts : [{ name: '—', value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <div className="sd-card">
            <h3>{td('tables.riderPerformance')}</h3>
            <DataTable
              emptyLabel={td('empty.noData')}
              columns={[
                { key: 'rider', label: td('col.rider') },
                { key: 'discipline', label: td('col.discipline') },
                { key: 'assignedHorses', label: td('col.assignedHorses') },
                { key: 'sessionsMonth', label: td('col.sessionsMonth') },
                { key: 'garmin', label: td('col.garmin') },
                { key: 'status', label: td('col.status'), render: (r) => <Badge variant="ok">{r.status}</Badge> },
              ]}
              rows={scope.riderPerformance}
            />
          </div>
        </div>
      </section>

      {/* Training */}
      <section className="sd-section">
        <div className="sd-section__head">
          <div>
            <h2 className="sd-section__title">{td('sections.training.title')}</h2>
            <p className="sd-section__lead">{td('sections.training.lead')}</p>
          </div>
          <button type="button" className="sd-btn" onClick={goTo(ROUTES.stable.trainingSchedule)}>
            {td('actions.goToModule')}
          </button>
        </div>
        <div className="sd-grid-3">
          <ChartCard title={td('charts.weeklyTraining')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scope.weeklyTraining}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                <XAxis dataKey="day" tick={stableDashboardChartAxisTick} />
                <YAxis tick={stableDashboardChartAxisTick} allowDecimals={false} />
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Bar dataKey="sessions" fill={CHART_GOLD} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={td('charts.trainingType')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scope.trainingTypeChart.length ? scope.trainingTypeChart : [{ name: '—', value: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                <XAxis dataKey="name" tick={stableDashboardChartAxisTick} />
                <YAxis tick={stableDashboardChartAxisTick} />
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Bar dataKey="value" fill={CHART_NAVY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={td('charts.trainingStatus')}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={scope.trainingStatusCounts.length ? scope.trainingStatusCounts : [{ name: '—', value: 1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}>
                  {(scope.trainingStatusCounts.length ? scope.trainingStatusCounts : [{ name: '—', value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="sd-card" style={{ marginTop: '1rem' }}>
          <h3>{td('tables.todayTraining')}</h3>
          <DataTable
            emptyLabel={td('empty.noData')}
            columns={[
              { key: 'time', label: td('col.time') },
              { key: 'horse', label: td('col.horseGroup') },
              { key: 'rider', label: td('col.riderGroup'), render: (r) => r.riderDisplay ?? r.rider },
              { key: 'trainingType', label: td('col.trainingType'), render: (r) => lbl(`trainingType.${mapTrainingTypeKey(r.trainingType)}`) },
              { key: 'status', label: td('col.status'), render: (r) => <Badge variant={mapTrainingStatusKey(r.status) === 'completed' ? 'ok' : mapTrainingStatusKey(r.status) === 'cancelled' ? 'danger' : 'info'}>{r.statusLabel}</Badge> },
              { key: 'action', label: td('col.action'), render: () => <button type="button" className="sd-link-btn" onClick={() => toast(td('toasts.placeholder'))}>{td('actions.viewDetails')}</button> },
            ]}
            rows={scope.todaySchedule}
          />
        </div>
      </section>

      {/* Medical */}
      <section className="sd-section">
        <div className="sd-section__head">
          <div>
            <h2 className="sd-section__title">{td('sections.medical.title')}</h2>
            <p className="sd-section__lead">{td('sections.medical.lead')}</p>
          </div>
          <button type="button" className="sd-btn" onClick={goTo(ROUTES.stable.health)}>
            {td('actions.goToModule')}
          </button>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <ChartCard title={td('charts.medicalAlerts')}>
            <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={scope.medicalAlertTypes.map((a) => ({
                name: td(`medicalAlerts.${a.key}`),
                count: a.count,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
              <XAxis dataKey="name" tick={stableDashboardChartAxisTick} interval={0} angle={-12} textAnchor="end" height={60} />
              <YAxis tick={stableDashboardChartAxisTick} allowDecimals={false} />
              <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
              <Bar dataKey="count" fill={CHART_GOLD} radius={[6, 6, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="sd-grid-2">
          <div className="sd-card">
            <h3>{td('tables.medicalTasks')}</h3>
            <DataTable
              emptyLabel={td('empty.noData')}
              columns={[
                { key: 'horse', label: td('col.horse') },
                { key: 'task', label: td('col.task') },
                { key: 'dueDate', label: td('col.dueDate') },
                { key: 'priority', label: td('col.priority'), render: (r) => <Badge variant={priorityVariant(r.priority)}>{r.priorityLabel}</Badge> },
                { key: 'assignedTo', label: td('col.assignedTo') },
                { key: 'status', label: td('col.status'), render: (r) => <Badge variant={r.status === 'Due' ? 'danger' : 'warn'}>{r.statusLabel}</Badge> },
              ]}
              rows={scope.medicalTasks}
            />
          </div>
          <div className="sd-card">
            <h3>{td('tables.medications')}</h3>
            <DataTable
              emptyLabel={td('empty.noData')}
              columns={[
                { key: 'horse', label: td('col.horse') },
                { key: 'medication', label: td('col.medication') },
                { key: 'startDate', label: td('col.startDate') },
                { key: 'endDate', label: td('col.endDate') },
                { key: 'status', label: td('col.status'), render: (r) => <Badge variant="info">{r.statusLabel}</Badge> },
                { key: 'vetApproval', label: td('col.vetApproval'), render: (r) => <Badge variant={r.vetApproval === 'Approved' ? 'ok' : 'warn'}>{r.vetApprovalLabel}</Badge> },
              ]}
              rows={scope.medications}
            />
          </div>
        </div>
      </section>

      {/* Inventory */}
      <section className="sd-section">
        <div className="sd-section__head">
          <div>
            <h2 className="sd-section__title">{td('sections.inventory.title')}</h2>
            <p className="sd-section__lead">{td('sections.inventory.lead')}</p>
          </div>
          <button type="button" className="sd-btn" onClick={goTo(ROUTES.stable.inventory)}>
            {td('actions.goToModule')}
          </button>
        </div>
        <div className="sd-grid-3">
          <ChartCard title={td('charts.inventoryValue')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scope.invSections}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                <XAxis dataKey="name" tick={stableDashboardChartAxisTick} />
                <YAxis tick={stableDashboardChartAxisTick} />
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Bar dataKey="value" fill={CHART_NAVY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={td('charts.lowStock')}>
            {scope.lowStockChart.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scope.lowStockChart} layout="vertical" margin={{ left: 4, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                  <XAxis type="number" tick={stableDashboardChartAxisTick} />
                  <YAxis type="category" dataKey="name" width={100} tick={stableDashboardChartAxisTick} />
                  <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                  <Bar dataKey="qty" fill="#c0392b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="sd-table__empty">{td('empty.noData')}</p>
            )}
          </ChartCard>
          <ChartCard title={td('charts.expiring')}>
            {scope.expiringChart.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scope.expiringChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                  <XAxis dataKey="name" tick={stableDashboardChartAxisTick} />
                  <YAxis tick={stableDashboardChartAxisTick} />
                  <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                  <Bar dataKey="days" fill={CHART_GOLD} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="sd-table__empty">{td('empty.noData')}</p>
            )}
          </ChartCard>
        </div>
        <div className="sd-card" style={{ marginTop: '1rem' }}>
          <h3>{td('tables.criticalInventory')}</h3>
          <DataTable
            emptyLabel={td('empty.noData')}
            columns={[
              { key: 'item', label: td('col.item') },
              { key: 'section', label: td('col.section') },
              { key: 'quantity', label: td('col.quantity') },
              { key: 'status', label: td('col.status'), render: (r) => <Badge variant={r.statusKey === 'lowStock' ? 'danger' : 'warn'}>{r.status}</Badge> },
              { key: 'expiryDate', label: td('col.expiryDate') },
              { key: 'assignedTo', label: td('col.assignedTo') },
            ]}
            rows={scope.criticalInventory}
          />
        </div>
      </section>

      {/* Expenses */}
      <section className="sd-section">
        <div className="sd-section__head">
          <div>
            <h2 className="sd-section__title">{td('sections.expenses.title')}</h2>
            <p className="sd-section__lead">{td('sections.expenses.lead')}</p>
          </div>
          <button type="button" className="sd-btn" onClick={goTo(ROUTES.stable.expenses)}>
            {td('actions.goToModule')}
          </button>
        </div>
        <div className="sd-grid-3">
          <ChartCard title={td('charts.monthlyTrend')}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scope.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                <XAxis dataKey="month" tick={stableDashboardChartAxisTick} />
                <YAxis tick={stableDashboardChartAxisTick} />
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Bar dataKey="amount" fill={CHART_NAVY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={td('charts.expenseCategory')}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={scope.expenseByCategory.length ? scope.expenseByCategory : [{ name: '—', value: 1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}>
                  {(scope.expenseByCategory.length ? scope.expenseByCategory : [{ name: '—', value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={td('charts.paymentMethod')}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={scope.paymentByMethod.length ? scope.paymentByMethod : [{ name: '—', value: 1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}>
                  {(scope.paymentByMethod.length ? scope.paymentByMethod : [{ name: '—', value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="sd-card" style={{ marginTop: '1rem' }}>
          <h3>{td('tables.deferred')}</h3>
          <DataTable
            emptyLabel={td('empty.noData')}
            columns={[
              { key: 'date', label: td('col.date') },
              { key: 'supplier', label: td('col.supplier') },
              { key: 'category', label: td('col.category') },
              { key: 'amount', label: td('col.amount'), render: (r) => formatMoney(r.amount) },
              { key: 'paid', label: td('col.paid'), render: (r) => formatMoney(r.paid) },
              { key: 'remaining', label: td('col.remaining'), render: (r) => formatMoney(r.remaining) },
              { key: 'dueDate', label: td('col.dueDate') },
              { key: 'status', label: td('col.status'), render: (r) => <Badge variant={r.statusKey === 'deferred' ? 'warn' : 'danger'}>{r.status}</Badge> },
            ]}
            rows={scope.deferredRows}
          />
        </div>
      </section>

      {/* Calendar */}
      <section className="sd-section">
        <div className="sd-section__head">
          <div>
            <h2 className="sd-section__title">{td('sections.calendar.title')}</h2>
            <p className="sd-section__lead">{td('sections.calendar.lead')}</p>
          </div>
          <button type="button" className="sd-btn" onClick={() => toast(td('toasts.placeholder'))}>
            <Calendar size={16} aria-hidden />
            {td('actions.viewCalendar')}
          </button>
        </div>
        <div className="sd-card">
          <DataTable
            emptyLabel={td('empty.noData')}
            columns={[
              { key: 'date', label: td('col.date') },
              { key: 'time', label: td('col.time') },
              { key: 'eventType', label: td('col.eventType'), render: (r) => r.eventTypeLabel },
              { key: 'horse', label: td('col.horseGroup') },
              { key: 'assignedTo', label: td('col.assignedTo') },
              { key: 'status', label: td('col.status'), render: (r) => <Badge variant="info">{r.statusLabel}</Badge> },
            ]}
            rows={scope.events}
          />
        </div>
      </section>

      <div className="sd-grid-2">
        {/* Users */}
        <section className="sd-section">
          <div className="sd-section__head">
            <div>
              <h2 className="sd-section__title">{td('sections.users.title')}</h2>
              <p className="sd-section__lead">{td('sections.users.lead')}</p>
            </div>
            <button type="button" className="sd-btn" onClick={goTo(ROUTES.stable.users)}>
              {td('actions.goToModule')}
            </button>
          </div>
          <div className="sd-grid-2">
            <ChartCard title={td('charts.usersByRole')}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scope.usersByRole}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
                  <XAxis dataKey="name" tick={stableDashboardChartAxisTick} interval={0} angle={-15} textAnchor="end" height={70} />
                  <YAxis tick={stableDashboardChartAxisTick} allowDecimals={false} />
                  <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                  <Bar dataKey="value" fill={CHART_NAVY} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={td('charts.userActivity')}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={scope.userActiveChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}>
                    {scope.userActiveChart.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? CHART_GOLD : '#7a8499'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <div className="sd-card" style={{ marginTop: '1rem' }}>
            <h3>{td('tables.userActivity')}</h3>
            <DataTable
              emptyLabel={td('empty.noData')}
              columns={[
                { key: 'user', label: td('col.user') },
                { key: 'role', label: td('col.role'), render: (r) => lbl(`roles.${mapRoleKey(r.role)}`) },
                { key: 'activity', label: td('col.activity') },
                { key: 'time', label: td('col.time') },
                { key: 'status', label: td('col.status'), render: (r) => <Badge variant="ok">{r.status === 'Success' ? td('status.active') : r.status}</Badge> },
              ]}
              rows={scope.activity}
            />
          </div>
        </section>

        {/* Reports */}
        <section className="sd-section">
          <div className="sd-section__head">
            <div>
              <h2 className="sd-section__title">{td('sections.reports.title')}</h2>
              <p className="sd-section__lead">{td('sections.reports.lead')}</p>
            </div>
            <button type="button" className="sd-btn" onClick={goTo(ROUTES.stable.reports)}>
              {td('actions.goToModule')}
            </button>
          </div>
          <div className="sd-report-cards">
            {[
              ['ready', scope.readyReports],
              ['recent', scope.reports.length],
              ['pending', scope.pendingReports],
              ['ai', REPORT_CATALOG.filter((r) => r.category === 'ai').length],
              ['exported', scope.reports.filter((r) => r.status === 'Exported').length],
            ].map(([key, val]) => (
              <div key={key} className="sd-report-stat">
                <strong>{val}</strong>
                <span>{td(`reports.${key}`)}</span>
              </div>
            ))}
          </div>
          <div className="sd-card">
            <h3>{td('tables.recentReports')}</h3>
            <DataTable
              emptyLabel={td('empty.noData')}
              columns={[
                { key: 'name', label: td('col.reportName') },
                { key: 'type', label: td('col.type'), render: (r) => r.typeLabel },
                { key: 'generatedBy', label: td('col.generatedBy') },
                { key: 'date', label: td('col.date') },
                { key: 'language', label: td('col.language') },
                { key: 'status', label: td('col.status'), render: (r) => <Badge variant={r.status === 'Ready' ? 'ok' : r.status === 'Pending' ? 'warn' : 'info'}>{r.statusLabel}</Badge> },
              ]}
              rows={scope.reports}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
