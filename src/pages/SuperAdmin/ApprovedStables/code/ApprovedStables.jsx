import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  CreditCard,
  FileDown,
  KeyRound,
  LayoutList,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  Users,
  X,
} from 'lucide-react';
import { dummyApprovedStablesList } from '../../../../services/mock/dummyData';
import { isRtlLanguage } from '../../../../utils/i18nHelpers';
import '../styles/ApprovedStables.css';

const ALL = '__ALL__';

function nowActivity() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function cloneRows() {
  return JSON.parse(JSON.stringify(dummyApprovedStablesList));
}

function badgeClassAccess(s) {
  if (s === 'Suspended') return 'as-badge as-badge--suspended';
  return 'as-badge as-badge--active';
}

function badgeClassSubscription(s) {
  if (s === 'Trial') return 'as-badge as-badge--trial';
  if (s === 'Overdue') return 'as-badge as-badge--overdue';
  if (s === 'Expired') return 'as-badge as-badge--expired';
  if (s === 'Cancelled') return 'as-badge as-badge--cancelled';
  return 'as-badge as-badge--sub-active';
}

function badgeClassPayment(s) {
  if (s === 'Paid') return 'as-badge as-badge--paid';
  if (s === 'Partially Paid') return 'as-badge as-badge--partial';
  if (s === 'Unpaid') return 'as-badge as-badge--unpaid';
  if (s === 'Overdue') return 'as-badge as-badge--pay-overdue';
  return 'as-badge';
}

export default function ApprovedStables() {
  const { t } = useTranslation();
  const rtl = isRtlLanguage();

  const [rows, setRows] = useState(cloneRows);
  const [search, setSearch] = useState('');
  const [fAccess, setFAccess] = useState(ALL);
  const [fSub, setFSub] = useState(ALL);
  const [fPlan, setFPlan] = useState(ALL);
  const [fCountry, setFCountry] = useState(ALL);
  const [fType, setFType] = useState(ALL);
  const [fPayment, setFPayment] = useState(ALL);

  const [menuOpenId, setMenuOpenId] = useState(null);

  const [detailRow, setDetailRow] = useState(null);
  const [suspendRow, setSuspendRow] = useState(null);
  const [subscriptionRow, setSubscriptionRow] = useState(null);
  const [resetRow, setResetRow] = useState(null);
  const [activityRow, setActivityRow] = useState(null);

  const [subForm, setSubForm] = useState(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetRequire, setResetRequire] = useState(true);

  const patchRow = useCallback((stableId, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.stableId === stableId ? { ...r, ...patch, lastActivity: nowActivity() } : r))
    );
  }, []);

  const appendLog = useCallback((stableId, log) => {
    setRows((prev) =>
      prev.map((r) =>
        r.stableId === stableId
          ? {
              ...r,
              lastActivity: nowActivity(),
              activityLogs: [{ id: `log-${Date.now()}`, ...log }, ...r.activityLogs],
            }
          : r
      )
    );
  }, []);

  useEffect(() => {
    const onDoc = (e) => {
      if (!menuOpenId) return;
      if (e.target.closest('.as-menu-wrap')) return;
      setMenuOpenId(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpenId]);

  const countries = useMemo(() => [ALL, ...new Set(rows.map((r) => r.country))].sort(), [rows]);
  const plans = useMemo(() => [ALL, ...new Set(rows.map((r) => r.plan))].sort(), [rows]);
  const types = useMemo(() => [ALL, ...new Set(rows.map((r) => r.stableType))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const blob = [r.stableName, r.ownerName, r.ownerEmail, r.commercialRegistrationNumber].join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (fAccess !== ALL && r.accessStatus !== fAccess) return false;
      if (fSub !== ALL && r.subscriptionStatus !== fSub) return false;
      if (fPlan !== ALL && r.plan !== fPlan) return false;
      if (fCountry !== ALL && r.country !== fCountry) return false;
      if (fType !== ALL && r.stableType !== fType) return false;
      if (fPayment !== ALL && r.paymentStatus !== fPayment) return false;
      return true;
    });
  }, [rows, search, fAccess, fSub, fPlan, fCountry, fType, fPayment]);

  const summary = useMemo(() => {
    const monthlyRevenue = filtered
      .filter((r) => r.paymentStatus === 'Paid' || r.paymentStatus === 'Partially Paid')
      .reduce((s, r) => s + (Number(r.monthlyFee) || 0), 0);
    return {
      total: filtered.length,
      activeAccess: filtered.filter((r) => r.accessStatus === 'Active').length,
      suspended: filtered.filter((r) => r.accessStatus === 'Suspended').length,
      trial: filtered.filter((r) => r.subscriptionStatus === 'Trial').length,
      overduePay: filtered.filter((r) => r.paymentStatus === 'Overdue' || r.subscriptionStatus === 'Overdue').length,
      totalUsers: filtered.reduce((s, r) => s + (r.usersCount || 0), 0),
      totalHorses: filtered.reduce((s, r) => s + (r.horsesCount || 0), 0),
      monthlyRevenue,
    };
  }, [filtered]);

  const resetFilters = () => {
    setSearch('');
    setFAccess(ALL);
    setFSub(ALL);
    setFPlan(ALL);
    setFCountry(ALL);
    setFType(ALL);
    setFPayment(ALL);
  };

  const openSubscription = (r) => {
    setMenuOpenId(null);
    setSubscriptionRow(r);
    setSubForm({
      plan: r.plan,
      monthlyFee: r.monthlyFee,
      billingCycle: r.billingCycle,
      renewalDate: r.renewalDate,
      subscriptionStatus: r.subscriptionStatus,
      paymentStatus: r.paymentStatus,
      outstandingBalance: r.outstandingBalance,
      notes: '',
    });
  };

  const saveSubscription = () => {
    if (!subscriptionRow || !subForm) return;
    patchRow(subscriptionRow.stableId, {
      plan: subForm.plan,
      monthlyFee: Number(subForm.monthlyFee) || 0,
      billingCycle: subForm.billingCycle,
      renewalDate: subForm.renewalDate,
      subscriptionStatus: subForm.subscriptionStatus,
      paymentStatus: subForm.paymentStatus,
      outstandingBalance: Number(subForm.outstandingBalance) || 0,
    });
    setDetailRow((d) =>
      d?.stableId === subscriptionRow.stableId
        ? {
            ...d,
            plan: subForm.plan,
            monthlyFee: Number(subForm.monthlyFee) || 0,
            billingCycle: subForm.billingCycle,
            renewalDate: subForm.renewalDate,
            subscriptionStatus: subForm.subscriptionStatus,
            paymentStatus: subForm.paymentStatus,
            outstandingBalance: Number(subForm.outstandingBalance) || 0,
          }
        : d
    );
    appendLog(subscriptionRow.stableId, {
      date: nowActivity(),
      user: t('pages.approvedStables.labels.superAdmin'),
      role: 'Super Admin',
      activityKey: 'subscriptionUpdated',
      status: 'Success',
    });
    toast.success(t('pages.approvedStables.toasts.subscriptionSaved'));
    setSubscriptionRow(null);
    setSubForm(null);
  };

  const activateAccess = (r) => {
    setMenuOpenId(null);
    patchRow(r.stableId, { accessStatus: 'Active' });
    setDetailRow((d) => (d?.stableId === r.stableId ? { ...d, accessStatus: 'Active' } : d));
    appendLog(r.stableId, {
      date: nowActivity(),
      user: t('pages.approvedStables.labels.superAdmin'),
      role: 'Super Admin',
      activityKey: 'accessActivated',
      status: 'Success',
    });
    toast.success(t('pages.approvedStables.toasts.activated'));
  };

  const confirmSuspend = () => {
    if (!suspendRow) return;
    patchRow(suspendRow.stableId, { accessStatus: 'Suspended' });
    setDetailRow((d) => (d?.stableId === suspendRow.stableId ? { ...d, accessStatus: 'Suspended' } : d));
    appendLog(suspendRow.stableId, {
      date: nowActivity(),
      user: t('pages.approvedStables.labels.superAdmin'),
      role: 'Super Admin',
      activityKey: 'accessSuspended',
      status: 'Warning',
    });
    toast.success(t('pages.approvedStables.toasts.suspended'));
    setSuspendRow(null);
  };

  const openReset = (r) => {
    setMenuOpenId(null);
    setResetRow(r);
    setResetPwd('');
    setResetRequire(true);
  };

  const saveReset = () => {
    if (!resetRow) return;
    if (!resetPwd.trim()) {
      toast.error(t('pages.approvedStables.toasts.needPassword'));
      return;
    }
    appendLog(resetRow.stableId, {
      date: nowActivity(),
      user: t('pages.approvedStables.labels.superAdmin'),
      role: 'Super Admin',
      activityKey: 'passwordReset',
      status: 'Success',
    });
    toast.success(t('pages.approvedStables.toasts.passwordReset'));
    setResetRow(null);
    setResetPwd('');
  };

  const trSub = (s) => t(`pages.approvedStables.subscriptionStatus.${String(s).replace(/\s+/g, '')}`);
  const trPay = (s) => t(`pages.approvedStables.paymentStatus.${String(s).replace(/\s+/g, '')}`);
  const trAccess = (s) => t(`pages.approvedStables.accessStatus.${s}`);
  const trActivity = (k) => t(`pages.approvedStables.activityLog.${k}`);

  return (
    <div className="as-page" dir={rtl ? 'rtl' : 'ltr'}>
      <header className="as-page__header">
        <div>
          <h1 className="as-page__title">{t('pages.approvedStables.title')}</h1>
          <p className="as-page__subtitle">{t('pages.approvedStables.subtitle')}</p>
        </div>
      </header>

      <section className="as-summary">
        {[
          ['total', summary.total],
          ['activeAccess', summary.activeAccess],
          ['suspended', summary.suspended],
          ['trial', summary.trial],
          ['overduePay', summary.overduePay],
          ['totalUsers', summary.totalUsers],
          ['totalHorses', summary.totalHorses],
          ['monthlyRevenue', summary.monthlyRevenue],
        ].map(([key, val]) => (
          <div key={key} className="as-kpi">
            <div className="as-kpi__label">{t(`pages.approvedStables.summary.${key}`)}</div>
            <div className="as-kpi__value">{key === 'monthlyRevenue' ? `${val}` : val}</div>
          </div>
        ))}
      </section>

      <section className="as-filters">
        <div className="as-filters__grid">
          <div className="as-field as-field--wide">
            <label className="as-field__label" htmlFor="as-search">
              {t('pages.approvedStables.filters.search')}
            </label>
            <div className="as-search">
              <Search size={18} aria-hidden />
              <input
                id="as-search"
                className="as-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('pages.approvedStables.filters.searchPlaceholder')}
              />
            </div>
          </div>
          <div className="as-field">
            <span className="as-field__label">{t('pages.approvedStables.filters.access')}</span>
            <select className="as-select" value={fAccess} onChange={(e) => setFAccess(e.target.value)}>
              <option value={ALL}>{t('pages.approvedStables.filters.all')}</option>
              <option value="Active">{trAccess('Active')}</option>
              <option value="Suspended">{trAccess('Suspended')}</option>
            </select>
          </div>
          <div className="as-field">
            <span className="as-field__label">{t('pages.approvedStables.filters.subscription')}</span>
            <select className="as-select" value={fSub} onChange={(e) => setFSub(e.target.value)}>
              <option value={ALL}>{t('pages.approvedStables.filters.all')}</option>
              {['Active', 'Trial', 'Overdue', 'Expired', 'Cancelled'].map((s) => (
                <option key={s} value={s}>
                  {trSub(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="as-field">
            <span className="as-field__label">{t('pages.approvedStables.filters.plan')}</span>
            <select className="as-select" value={fPlan} onChange={(e) => setFPlan(e.target.value)}>
              <option value={ALL}>{t('pages.approvedStables.filters.all')}</option>
              {plans.filter((p) => p !== ALL).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="as-field">
            <span className="as-field__label">{t('pages.approvedStables.filters.country')}</span>
            <select className="as-select" value={fCountry} onChange={(e) => setFCountry(e.target.value)}>
              <option value={ALL}>{t('pages.approvedStables.filters.all')}</option>
              {countries.filter((c) => c !== ALL).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="as-field">
            <span className="as-field__label">{t('pages.approvedStables.filters.stableType')}</span>
            <select className="as-select" value={fType} onChange={(e) => setFType(e.target.value)}>
              <option value={ALL}>{t('pages.approvedStables.filters.all')}</option>
              {types.filter((x) => x !== ALL).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
          <div className="as-field">
            <span className="as-field__label">{t('pages.approvedStables.filters.payment')}</span>
            <select className="as-select" value={fPayment} onChange={(e) => setFPayment(e.target.value)}>
              <option value={ALL}>{t('pages.approvedStables.filters.all')}</option>
              {['Paid', 'Unpaid', 'Partially Paid', 'Overdue'].map((s) => (
                <option key={s} value={s}>
                  {trPay(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="as-field">
            <span className="as-field__label" style={{ visibility: 'hidden' }}>
              .
            </span>
            <button type="button" className="as-btn as-btn--ghost" onClick={resetFilters}>
              <RefreshCw size={16} aria-hidden />
              {t('pages.approvedStables.filters.reset')}
            </button>
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="as-empty">{t('pages.approvedStables.empty')}</div>
      ) : (
        <div className="as-table-wrap">
          <table className="as-table">
            <thead>
              <tr>
                {[
                  'stableId',
                  'stableName',
                  'ownerName',
                  'ownerEmail',
                  'phone',
                  'countryCity',
                  'stableType',
                  'horses',
                  'riders',
                  'users',
                  'plan',
                  'monthlyFee',
                  'subscriptionStatus',
                  'paymentStatus',
                  'accessStatus',
                  'lastLogin',
                  'approvedDate',
                  'actions',
                ].map((col) => (
                  <th key={col}>{t(`pages.approvedStables.table.${col}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.stableId}>
                  <td>{r.stableId}</td>
                  <td>
                    <strong>{r.stableName}</strong>
                  </td>
                  <td>{r.ownerName}</td>
                  <td>{r.ownerEmail}</td>
                  <td>{r.phone}</td>
                  <td>
                    {r.country} / {r.city}
                  </td>
                  <td>{r.stableType}</td>
                  <td>{r.horsesCount}</td>
                  <td>{r.ridersCount}</td>
                  <td>{r.usersCount}</td>
                  <td>{r.plan}</td>
                  <td>{r.monthlyFee}</td>
                  <td>
                    <span className={badgeClassSubscription(r.subscriptionStatus)}>{trSub(r.subscriptionStatus)}</span>
                  </td>
                  <td>
                    <span className={badgeClassPayment(r.paymentStatus)}>{trPay(r.paymentStatus)}</span>
                  </td>
                  <td>
                    <span className={badgeClassAccess(r.accessStatus)}>{trAccess(r.accessStatus)}</span>
                  </td>
                  <td>{r.lastLogin || '—'}</td>
                  <td>{r.approvedDate}</td>
                  <td className="as-table__actions">
                    <div className="as-menu-wrap">
                      <button
                        type="button"
                        className="as-btn as-btn--ghost as-btn--icon"
                        aria-expanded={menuOpenId === r.stableId}
                        aria-haspopup="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId((id) => (id === r.stableId ? null : r.stableId));
                        }}
                      >
                        <MoreHorizontal size={18} />
                        <ChevronDown size={14} aria-hidden />
                      </button>
                      {menuOpenId === r.stableId ? (
                        <div className="as-menu" role="menu">
                          <button
                            type="button"
                            className="as-menu__item"
                            role="menuitem"
                            onClick={() => {
                              setMenuOpenId(null);
                              setDetailRow(r);
                            }}
                          >
                            <LayoutList size={16} aria-hidden /> {t('pages.approvedStables.actions.viewDetails')}
                          </button>
                          <button
                            type="button"
                            className="as-menu__item"
                            role="menuitem"
                            onClick={() => activateAccess(r)}
                            disabled={r.accessStatus === 'Active'}
                          >
                            <Shield size={16} aria-hidden /> {t('pages.approvedStables.actions.activate')}
                          </button>
                          <button type="button" className="as-menu__item" role="menuitem" onClick={() => setSuspendRow(r)}>
                            <ShieldOff size={16} aria-hidden /> {t('pages.approvedStables.actions.suspend')}
                          </button>
                          <button type="button" className="as-menu__item" role="menuitem" onClick={() => openSubscription(r)}>
                            <CreditCard size={16} aria-hidden /> {t('pages.approvedStables.actions.manageSubscription')}
                          </button>
                          <button type="button" className="as-menu__item" role="menuitem" onClick={() => openReset(r)}>
                            <KeyRound size={16} aria-hidden /> {t('pages.approvedStables.actions.resetPassword')}
                          </button>
                          <button
                            type="button"
                            className="as-menu__item"
                            role="menuitem"
                            onClick={() => {
                              setMenuOpenId(null);
                              toast(t('pages.approvedStables.toasts.viewUsers'));
                            }}
                          >
                            <Users size={16} aria-hidden /> {t('pages.approvedStables.actions.viewUsers')}
                          </button>
                          <button
                            type="button"
                            className="as-menu__item"
                            role="menuitem"
                            onClick={() => {
                              setMenuOpenId(null);
                              setActivityRow(r);
                            }}
                          >
                            <Building2 size={16} aria-hidden /> {t('pages.approvedStables.actions.viewActivity')}
                          </button>
                          <button
                            type="button"
                            className="as-menu__item"
                            role="menuitem"
                            onClick={() => {
                              setMenuOpenId(null);
                              toast(t('pages.approvedStables.toasts.export'));
                            }}
                          >
                            <FileDown size={16} aria-hidden /> {t('pages.approvedStables.actions.export')}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailRow ? (
        <div className="as-drawer-backdrop" role="presentation" onClick={() => setDetailRow(null)}>
          <aside className="as-drawer" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="as-drawer__head">
              <h2 className="as-drawer__title">{detailRow.stableName}</h2>
              <button type="button" className="as-icon-btn" onClick={() => setDetailRow(null)} aria-label={t('pages.approvedStables.actions.close')}>
                <X size={20} />
              </button>
            </div>
            <div className="as-drawer__body">
              <section className="as-panel">
                <h3 className="as-panel__title">{t('pages.approvedStables.detail.stableInfo')}</h3>
                <div className="as-info-grid">
                  {[
                    ['stableId', detailRow.stableId],
                    ['stableName', detailRow.stableName],
                    ['stableType', detailRow.stableType],
                    ['country', detailRow.country],
                    ['city', detailRow.city],
                    ['address', detailRow.address],
                    ['cr', detailRow.commercialRegistrationNumber],
                    ['approvedDate', detailRow.approvedDate],
                    ['accessStatus', trAccess(detailRow.accessStatus)],
                  ].map(([k, v]) => (
                    <div key={k} className="as-info">
                      <span>{t(`pages.approvedStables.fields.stable.${k}`)}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </section>
              <section className="as-panel">
                <h3 className="as-panel__title">{t('pages.approvedStables.detail.ownerInfo')}</h3>
                <div className="as-info-grid">
                  {[
                    ['ownerName', detailRow.ownerName],
                    ['ownerEmail', detailRow.ownerEmail],
                    ['phone', detailRow.phone],
                    ['username', detailRow.username],
                    ['ownerAccountStatus', detailRow.ownerAccountStatus],
                    ['lastLogin', detailRow.lastLogin || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="as-info">
                      <span>{t(`pages.approvedStables.fields.owner.${k}`)}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </section>
              <section className="as-panel">
                <h3 className="as-panel__title">{t('pages.approvedStables.detail.subscription')}</h3>
                <div className="as-info-grid">
                  {[
                    ['plan', detailRow.plan],
                    ['billingCycle', detailRow.billingCycle],
                    ['monthlyFee', detailRow.monthlyFee],
                    ['renewalDate', detailRow.renewalDate],
                    ['outstandingBalance', detailRow.outstandingBalance],
                    ['paymentStatus', trPay(detailRow.paymentStatus)],
                    ['subscriptionStatus', trSub(detailRow.subscriptionStatus)],
                  ].map(([k, v]) => (
                    <div key={k} className="as-info">
                      <span>{t(`pages.approvedStables.fields.subscription.${k}`)}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </section>
              <section className="as-panel">
                <h3 className="as-panel__title">{t('pages.approvedStables.detail.usage')}</h3>
                <div className="as-info-grid">
                  {[
                    ['usersCount', detailRow.usersCount],
                    ['horsesCount', detailRow.horsesCount],
                    ['ridersCount', detailRow.ridersCount],
                    ['trainingSessionsThisMonth', detailRow.trainingSessionsThisMonth],
                    ['reportsGenerated', detailRow.reportsGenerated],
                    ['lastActivity', detailRow.lastActivity],
                  ].map(([k, v]) => (
                    <div key={k} className="as-info">
                      <span>{t(`pages.approvedStables.fields.usage.${k}`)}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </section>
              <div className="as-drawer__foot">
                <button type="button" className="as-btn as-btn--gold" onClick={() => activateAccess(detailRow)} disabled={detailRow.accessStatus === 'Active'}>
                  {t('pages.approvedStables.actions.activate')}
                </button>
                <button type="button" className="as-btn as-btn--danger" onClick={() => setSuspendRow(detailRow)}>
                  {t('pages.approvedStables.actions.suspend')}
                </button>
                <button type="button" className="as-btn as-btn--ghost" onClick={() => openReset(detailRow)}>
                  {t('pages.approvedStables.actions.resetPassword')}
                </button>
                <button
                  type="button"
                  className="as-btn as-btn--ghost"
                  onClick={() => toast(t('pages.approvedStables.toasts.managePlan'))}
                >
                  {t('pages.approvedStables.actions.managePlan')}
                </button>
                <button type="button" className="as-btn as-btn--primary" onClick={() => setDetailRow(null)}>
                  {t('pages.approvedStables.actions.close')}
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {suspendRow ? (
        <div className="as-modal-overlay" role="dialog" aria-modal="true">
          <div className="as-modal">
            <div className="as-modal__head">
              <h2 className="as-modal__title">{t('pages.approvedStables.suspendModal.title')}</h2>
              <button type="button" className="as-icon-btn" onClick={() => setSuspendRow(null)} aria-label={t('pages.approvedStables.actions.close')}>
                <X size={20} />
              </button>
            </div>
            <div className="as-modal__body">
              <p>{t('pages.approvedStables.suspendModal.body', { name: suspendRow.stableName })}</p>
              <div className="as-warning">
                <AlertTriangle size={18} aria-hidden />
                <span>{t('pages.approvedStables.suspendModal.warning')}</span>
              </div>
            </div>
            <div className="as-modal__foot">
              <button type="button" className="as-btn as-btn--ghost" onClick={() => setSuspendRow(null)}>
                {t('pages.approvedStables.actions.cancel')}
              </button>
              <button type="button" className="as-btn as-btn--danger" onClick={confirmSuspend}>
                {t('pages.approvedStables.suspendModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {subscriptionRow && subForm ? (
        <div className="as-modal-overlay" role="dialog" aria-modal="true">
          <div className="as-modal as-modal--wide">
            <div className="as-modal__head">
              <h2 className="as-modal__title">{t('pages.approvedStables.subscriptionModal.title')}</h2>
              <button
                type="button"
                className="as-icon-btn"
                onClick={() => {
                  setSubscriptionRow(null);
                  setSubForm(null);
                }}
                aria-label={t('pages.approvedStables.actions.close')}
              >
                <X size={20} />
              </button>
            </div>
            <div className="as-modal__body">
              <div className="as-form-grid">
                <div className="as-field">
                  <span className="as-field__label">{t('pages.approvedStables.fields.subscription.plan')}</span>
                  <select className="as-select" value={subForm.plan} onChange={(e) => setSubForm((s) => ({ ...s, plan: e.target.value }))}>
                    {['Trial', 'Basic', 'Professional', 'Enterprise'].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="as-field">
                  <span className="as-field__label">{t('pages.approvedStables.fields.subscription.monthlyFee')}</span>
                  <input
                    type="number"
                    className="as-input"
                    value={subForm.monthlyFee}
                    onChange={(e) => setSubForm((s) => ({ ...s, monthlyFee: e.target.value }))}
                  />
                </div>
                <div className="as-field">
                  <span className="as-field__label">{t('pages.approvedStables.fields.subscription.billingCycle')}</span>
                  <select className="as-select" value={subForm.billingCycle} onChange={(e) => setSubForm((s) => ({ ...s, billingCycle: e.target.value }))}>
                    <option value="Monthly">Monthly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div className="as-field">
                  <span className="as-field__label">{t('pages.approvedStables.fields.subscription.renewalDate')}</span>
                  <input
                    type="date"
                    className="as-input"
                    value={/^\d{4}-\d{2}-\d{2}/.test(String(subForm.renewalDate)) ? String(subForm.renewalDate).slice(0, 10) : ''}
                    onChange={(e) => setSubForm((s) => ({ ...s, renewalDate: e.target.value }))}
                  />
                </div>
                <div className="as-field">
                  <span className="as-field__label">{t('pages.approvedStables.fields.subscription.subscriptionStatus')}</span>
                  <select
                    className="as-select"
                    value={subForm.subscriptionStatus}
                    onChange={(e) => setSubForm((s) => ({ ...s, subscriptionStatus: e.target.value }))}
                  >
                    {['Active', 'Trial', 'Overdue', 'Expired', 'Cancelled'].map((p) => (
                      <option key={p} value={p}>
                        {trSub(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="as-field">
                  <span className="as-field__label">{t('pages.approvedStables.fields.subscription.paymentStatus')}</span>
                  <select className="as-select" value={subForm.paymentStatus} onChange={(e) => setSubForm((s) => ({ ...s, paymentStatus: e.target.value }))}>
                    {['Paid', 'Unpaid', 'Partially Paid', 'Overdue'].map((p) => (
                      <option key={p} value={p}>
                        {trPay(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="as-field">
                  <span className="as-field__label">{t('pages.approvedStables.fields.subscription.outstandingBalance')}</span>
                  <input
                    type="number"
                    className="as-input"
                    value={subForm.outstandingBalance}
                    onChange={(e) => setSubForm((s) => ({ ...s, outstandingBalance: e.target.value }))}
                  />
                </div>
                <div className="as-field as-field--full">
                  <span className="as-field__label">{t('pages.approvedStables.subscriptionModal.notes')}</span>
                  <textarea className="as-textarea" rows={3} value={subForm.notes} onChange={(e) => setSubForm((s) => ({ ...s, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="as-modal__foot">
              <button
                type="button"
                className="as-btn as-btn--ghost"
                onClick={() => {
                  setSubscriptionRow(null);
                  setSubForm(null);
                }}
              >
                {t('pages.approvedStables.actions.cancel')}
              </button>
              <button type="button" className="as-btn as-btn--gold" onClick={saveSubscription}>
                {t('pages.approvedStables.subscriptionModal.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resetRow ? (
        <div className="as-modal-overlay" role="dialog" aria-modal="true">
          <div className="as-modal">
            <div className="as-modal__head">
              <h2 className="as-modal__title">{t('pages.approvedStables.resetModal.title')}</h2>
              <button type="button" className="as-icon-btn" onClick={() => setResetRow(null)} aria-label={t('pages.approvedStables.actions.close')}>
                <X size={20} />
              </button>
            </div>
            <div className="as-modal__body">
              <div className="as-info-grid">
                <div className="as-info">
                  <span>{t('pages.approvedStables.fields.owner.ownerName')}</span>
                  <strong>{resetRow.ownerName}</strong>
                </div>
                <div className="as-info">
                  <span>{t('pages.approvedStables.fields.owner.username')}</span>
                  <strong>{resetRow.username}</strong>
                </div>
              </div>
              <div className="as-field" style={{ marginTop: '1rem' }}>
                <span className="as-field__label">{t('pages.approvedStables.resetModal.tempPassword')}</span>
                <input type="text" className="as-input" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} autoComplete="off" />
              </div>
              <label className="as-check">
                <input type="checkbox" checked={resetRequire} onChange={(e) => setResetRequire(e.target.checked)} />
                {t('pages.approvedStables.resetModal.requireChange')}
              </label>
              <p className="as-placeholder-line">{t('pages.approvedStables.resetModal.sendEmail')}</p>
              <p className="as-placeholder-line">{t('pages.approvedStables.resetModal.sendSms')}</p>
            </div>
            <div className="as-modal__foot">
              <button type="button" className="as-btn as-btn--ghost" onClick={() => setResetRow(null)}>
                {t('pages.approvedStables.actions.cancel')}
              </button>
              <button type="button" className="as-btn as-btn--gold" onClick={saveReset}>
                {t('pages.approvedStables.resetModal.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activityRow ? (
        <div className="as-modal-overlay" role="dialog" aria-modal="true">
          <div className="as-modal as-modal--wide">
            <div className="as-modal__head">
              <h2 className="as-modal__title">{t('pages.approvedStables.activityModal.title')}</h2>
              <button type="button" className="as-icon-btn" onClick={() => setActivityRow(null)} aria-label={t('pages.approvedStables.actions.close')}>
                <X size={20} />
              </button>
            </div>
            <div className="as-modal__body">
              <p className="as-muted">{activityRow.stableName}</p>
              <div className="as-mini-table-wrap">
                <table className="as-mini-table">
                  <thead>
                    <tr>
                      {['date', 'user', 'role', 'activity', 'status'].map((c) => (
                        <th key={c}>{t(`pages.approvedStables.activityTable.${c}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(activityRow.activityLogs || []).map((log) => (
                      <tr key={log.id}>
                        <td>{log.date}</td>
                        <td>{log.user}</td>
                        <td>{log.role}</td>
                        <td>{trActivity(log.activityKey)}</td>
                        <td>{log.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="as-modal__foot">
              <button type="button" className="as-btn as-btn--primary" onClick={() => setActivityRow(null)}>
                {t('pages.approvedStables.actions.close')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
