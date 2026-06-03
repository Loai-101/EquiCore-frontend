import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  KeyRound,
  LayoutDashboard,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { dummyStableRequestsWorkspaces } from '../../../../services/mock/dummyData';
import { isRtlLanguage } from '../../../../utils/i18nHelpers';
import '../styles/StableRequests.css';

const ALL = '__ALL__';

function nowStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function daysWaiting(submittedDate) {
  if (!submittedDate || submittedDate === '—') return 0;
  const t = new Date(submittedDate).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function deepCloneWorkspaces() {
  return JSON.parse(JSON.stringify(dummyStableRequestsWorkspaces));
}

function registrationStatusClass(s) {
  if (s === 'Pending') return 'sr-badge--pending';
  if (s === 'Approved') return 'sr-badge--approved';
  if (s === 'Rejected') return 'sr-badge--rejected';
  if (s === 'More Info Required') return 'sr-badge--moreinfo';
  return 'sr-badge--pending';
}

function priorityClass(p) {
  if (p === 'High') return 'sr-badge--pri-hi';
  if (p === 'Medium') return 'sr-badge--pri-med';
  return 'sr-badge--pri-lo';
}

/** @param {string} requestType */
function requestTypeKey(requestType) {
  const map = {
    'Stable Registration': 'stableRegistration',
    'Password Reset': 'passwordReset',
    'Forgotten Password': 'forgottenPassword',
    'Document Review': 'documentReview',
    'More Information': 'moreInformation',
    'Subscription Issue': 'subscriptionIssue',
    'Access Issue': 'accessIssue',
    'User Account Issue': 'userAccountIssue',
    'Data Correction': 'dataCorrection',
    'Support Request': 'supportRequest',
    'Suspension Appeal': 'suspensionAppeal',
  };
  return map[requestType] || 'other';
}

/** @param {string} status */
function ticketStatusKey(status) {
  const map = {
    Open: 'open',
    'Pending Review': 'pendingReview',
    Approved: 'approved',
    Rejected: 'rejected',
    'More Info Required': 'moreInfoRequired',
    'In Progress': 'inProgress',
    Resolved: 'resolved',
    Closed: 'closed',
  };
  return map[status] || 'open';
}

function resetReasonKey(reason) {
  const map = {
    'Forgot password': 'forgotPassword',
    'Account locked': 'accountLocked',
    'Temporary password requested': 'tempPasswordRequested',
    'Admin requested reset': 'adminRequested',
  };
  return map[reason] || 'other';
}

function resetStatusKey(status) {
  const map = { Pending: 'pending', Approved: 'approved', Rejected: 'rejected', Completed: 'completed' };
  return map[status] || 'pending';
}

/** Initials for list card when `stableLogo` is absent or fails to load. */
function stableCardInitials(name) {
  if (!name || !String(name).trim()) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase();
}

function activityKey(actionKey) {
  const map = {
    registered: 'registered',
    documentUploaded: 'documentUploaded',
    documentVerified: 'documentVerified',
    moreInfoRequested: 'moreInfoRequested',
    passwordResetRequested: 'passwordResetRequested',
    passwordResetApproved: 'passwordResetApproved',
    stableApproved: 'stableApproved',
    stableRejected: 'stableRejected',
    accessSuspended: 'accessSuspended',
    subscriptionUpdated: 'subscriptionUpdated',
    subscriptionIssue: 'subscriptionIssue',
  };
  return map[actionKey] || actionKey;
}

const OPEN_TICKET = new Set(['Open', 'Pending Review', 'In Progress', 'More Info Required']);

export default function StableRequests() {
  const { t } = useTranslation();
  const rtl = isRtlLanguage();

  const [workspaces, setWorkspaces] = useState(deepCloneWorkspaces);
  const [selectedStableId, setSelectedStableId] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');

  const [search, setSearch] = useState('');
  const [fReg, setFReg] = useState(ALL);
  const [fType, setFType] = useState(ALL);
  const [fCountry, setFCountry] = useState(ALL);
  const [fReqType, setFReqType] = useState(ALL);
  const [fPriority, setFPriority] = useState(ALL);
  const [fDateFrom, setFDateFrom] = useState('');
  const [fDateTo, setFDateTo] = useState('');

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [moreInfoModal, setMoreInfoModal] = useState(null);
  const [moreInfoFields, setMoreInfoFields] = useState({ missing: '', documents: '', message: '' });

  const [suspendModal, setSuspendModal] = useState(false);

  const [pwdApprove, setPwdApprove] = useState(null);
  const [pwdTemp, setPwdTemp] = useState('');
  const [pwdRequireChange, setPwdRequireChange] = useState(true);

  const trRequestType = useCallback((rt) => t(`pages.stableRequests.requestTypes.${requestTypeKey(rt)}`), [t]);
  const trTicketStatus = useCallback((s) => t(`pages.stableRequests.ticketStatus.${ticketStatusKey(s)}`), [t]);
  const trRegStatus = useCallback(
    (s) => t(`pages.stableRequests.registrationStatus.${String(s).replace(/\s+/g, '')}`),
    [t]
  );
  const trAccess = useCallback((s) => t(`pages.stableRequests.accessStatus.${String(s)}`), [t]);
  const trSub = useCallback((s) => t(`pages.stableRequests.subscriptionStatus.${String(s).replace(/\s+/g, '')}`), [t]);
  const trDocStatus = useCallback((s) => t(`pages.stableRequests.documentStatus.${String(s).replace(/\s+/g, '')}`), [t]);
  const trPay = useCallback((s) => t(`pages.stableRequests.paymentStatus.${String(s)}`), [t]);
  const trOwnerAcct = useCallback((s) => t(`pages.stableRequests.ownerAccountStatus.${String(s)}`), [t]);
  const trPwdOwnerStatus = useCallback((s) => t(`pages.stableRequests.ownerPasswordResetStatus.${String(s).replace(/\s+/g, '')}`), [t]);

  const updateWorkspace = useCallback((stableId, updater) => {
    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.stableId !== stableId) return w;
        const next = typeof updater === 'function' ? updater({ ...w }) : { ...w, ...updater };
        return { ...next, updatedAt: nowStr() };
      })
    );
  }, []);

  const pushActivity = useCallback((stableId, entry) => {
    updateWorkspace(stableId, (w) => ({
      ...w,
      activityTimeline: [
        { id: `TL-gen-${Date.now()}`, dateTime: nowStr(), ...entry },
        ...w.activityTimeline,
      ],
    }));
  }, [updateWorkspace]);

  const countries = useMemo(() => {
    const s = new Set(workspaces.map((w) => w.country));
    return [ALL, ...Array.from(s).sort()];
  }, [workspaces]);

  const stableTypes = useMemo(() => {
    const s = new Set(workspaces.map((w) => w.stableType));
    return [ALL, ...Array.from(s).sort()];
  }, [workspaces]);

  const requestTypes = useMemo(() => {
    const s = new Set();
    workspaces.forEach((w) => {
      s.add(w.latestRequestType);
      w.tickets.forEach((tk) => s.add(tk.requestType));
    });
    return [ALL, ...Array.from(s).sort()];
  }, [workspaces]);

  const registrationStatuses = useMemo(() => {
    const s = new Set(workspaces.map((w) => w.registrationStatus));
    return [ALL, ...Array.from(s)];
  }, [workspaces]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return workspaces.filter((w) => {
      if (q) {
        const blob = [
          w.stableName,
          w.ownerName,
          w.ownerEmail,
          w.ownerPhone,
          w.commercialRegistrationNumber,
        ]
          .join(' ')
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (fReg !== ALL && w.registrationStatus !== fReg) return false;
      if (fType !== ALL && w.stableType !== fType) return false;
      if (fCountry !== ALL && w.country !== fCountry) return false;
      if (fPriority !== ALL && w.priority !== fPriority) return false;
      if (fReqType !== ALL) {
        const matchLatest = w.latestRequestType === fReqType;
        const matchTicket = w.tickets.some((tk) => tk.requestType === fReqType);
        if (!matchLatest && !matchTicket) return false;
      }
      if (fDateFrom && w.submittedDate && w.submittedDate < fDateFrom) return false;
      if (fDateTo && w.submittedDate && w.submittedDate > fDateTo) return false;
      return true;
    });
  }, [workspaces, search, fReg, fType, fCountry, fPriority, fReqType, fDateFrom, fDateTo]);

  const selected = useMemo(
    () => workspaces.find((w) => w.stableId === selectedStableId) || null,
    [workspaces, selectedStableId]
  );

  const summary = useMemo(() => {
    const pwdPending = filtered.filter(
      (w) => w.passwordResets.some((r) => r.status === 'Pending') || w.ownerPasswordResetStatus === 'Pending'
    ).length;
    const docReview = filtered.filter(
      (w) =>
        w.documentStatus === 'Pending Review' ||
        w.tickets.some((tk) => tk.requestType === 'Document Review' && OPEN_TICKET.has(tk.status))
    ).length;
    return {
      total: filtered.length,
      pendingReg: filtered.filter((w) => w.registrationStatus === 'Pending').length,
      approved: filtered.filter((w) => w.registrationStatus === 'Approved').length,
      rejected: filtered.filter((w) => w.registrationStatus === 'Rejected').length,
      moreInfo: filtered.filter((w) => w.registrationStatus === 'More Info Required').length,
      pwdResets: pwdPending,
      docReview,
      suspended: filtered.filter((w) => w.accessStatus === 'Suspended').length,
      highPri: filtered.filter((w) => w.priority === 'High').length,
    };
  }, [filtered]);

  const resetFilters = () => {
    setSearch('');
    setFReg(ALL);
    setFType(ALL);
    setFCountry(ALL);
    setFReqType(ALL);
    setFPriority(ALL);
    setFDateFrom('');
    setFDateTo('');
  };

  const openStable = (id) => {
    setSelectedStableId(id);
    setDetailTab('overview');
  };

  const approveStable = (stableId) => {
    updateWorkspace(stableId, (w) => ({
      ...w,
      registrationStatus: 'Approved',
      accessStatus: 'Active',
    }));
    pushActivity(stableId, {
      actionKey: 'stableApproved',
      performedBy: t('pages.stableRequests.labels.superAdmin'),
      notes: '',
      status: 'Success',
    });
    toast.success(t('pages.stableRequests.toasts.approvedStable'));
  };

  const submitReject = () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      toast.error(t('pages.stableRequests.toasts.needReason'));
      return;
    }
    updateWorkspace(rejectModal, (w) => ({
      ...w,
      registrationStatus: 'Rejected',
      accessStatus: 'Inactive',
    }));
    pushActivity(rejectModal, {
      actionKey: 'stableRejected',
      performedBy: t('pages.stableRequests.labels.superAdmin'),
      notes: rejectReason.trim(),
      status: 'Rejected',
    });
    toast.success(t('pages.stableRequests.toasts.rejectedStable'));
    setRejectModal(null);
    setRejectReason('');
  };

  const submitMoreInfo = () => {
    if (!moreInfoModal) return;
    updateWorkspace(moreInfoModal, (w) => ({
      ...w,
      registrationStatus: 'More Info Required',
    }));
    const notes = [moreInfoFields.missing, moreInfoFields.documents, moreInfoFields.message]
      .filter(Boolean)
      .join(' | ');
    pushActivity(moreInfoModal, {
      actionKey: 'moreInfoRequested',
      performedBy: t('pages.stableRequests.labels.superAdmin'),
      notes,
      status: 'Pending',
    });
    toast.success(t('pages.stableRequests.toasts.moreInfoSent'));
    setMoreInfoModal(null);
    setMoreInfoFields({ missing: '', documents: '', message: '' });
  };

  const confirmSuspend = () => {
    if (!selected) return;
    updateWorkspace(selected.stableId, (w) => ({ ...w, accessStatus: 'Suspended' }));
    pushActivity(selected.stableId, {
      actionKey: 'accessSuspended',
      performedBy: t('pages.stableRequests.labels.superAdmin'),
      notes: '',
      status: 'Warning',
    });
    toast.success(t('pages.stableRequests.toasts.suspended'));
    setSuspendModal(false);
  };

  const reactivateStable = (stableId) => {
    updateWorkspace(stableId, (w) => ({ ...w, accessStatus: 'Active' }));
    pushActivity(stableId, {
      actionKey: 'subscriptionUpdated',
      performedBy: t('pages.stableRequests.labels.superAdmin'),
      notes: t('pages.stableRequests.labels.reactivatedNote'),
      status: 'Success',
    });
    toast.success(t('pages.stableRequests.toasts.reactivated'));
  };

  const patchTicket = (stableId, ticketId, patch) => {
    updateWorkspace(stableId, (w) => ({
      ...w,
      tickets: w.tickets.map((tk) =>
        tk.ticketId === ticketId ? { ...tk, ...patch, updatedAt: nowStr() } : tk
      ),
    }));
  };

  const ticketAction = (stableId, ticket, action) => {
    const base = { updatedAt: nowStr() };
    switch (action) {
      case 'approve':
        patchTicket(stableId, ticket.ticketId, { ...base, status: 'Approved', completedAt: nowStr() });
        toast.success(t('pages.stableRequests.toasts.ticketApproved'));
        break;
      case 'reject':
        patchTicket(stableId, ticket.ticketId, { ...base, status: 'Rejected', completedAt: nowStr() });
        toast.success(t('pages.stableRequests.toasts.ticketRejected'));
        break;
      case 'more':
        patchTicket(stableId, ticket.ticketId, { ...base, status: 'More Info Required' });
        toast.success(t('pages.stableRequests.toasts.ticketMoreInfo'));
        break;
      case 'progress':
        patchTicket(stableId, ticket.ticketId, { ...base, status: 'In Progress' });
        toast.success(t('pages.stableRequests.toasts.ticketProgress'));
        break;
      case 'resolved':
        patchTicket(stableId, ticket.ticketId, { ...base, status: 'Resolved', completedAt: nowStr() });
        toast.success(t('pages.stableRequests.toasts.ticketResolved'));
        break;
      case 'close':
        patchTicket(stableId, ticket.ticketId, { ...base, status: 'Closed', completedAt: nowStr() });
        toast.success(t('pages.stableRequests.toasts.ticketClosed'));
        break;
      case 'view':
        toast(t('pages.stableRequests.toasts.viewPlaceholder'));
        break;
      default:
        break;
    }
  };

  const patchPasswordReset = (stableId, resetId, patch) => {
    updateWorkspace(stableId, (w) => {
      const passwordResets = w.passwordResets.map((r) =>
        r.resetId === resetId ? { ...r, ...patch } : r
      );
      let ownerPasswordResetStatus = w.ownerPasswordResetStatus;
      if (patch.status === 'Approved' || patch.status === 'Completed') ownerPasswordResetStatus = 'Completed';
      if (patch.status === 'Rejected') ownerPasswordResetStatus = 'None';
      return { ...w, passwordResets, ownerPasswordResetStatus };
    });
  };

  const pwdResetAction = (stableId, row, action) => {
    if (action === 'approve') {
      setPwdApprove({ stableId, row });
      setPwdTemp('');
      setPwdRequireChange(true);
      return;
    }
    if (action === 'reject') {
      patchPasswordReset(stableId, row.resetId, { status: 'Rejected', completedAt: nowStr() });
      toast.success(t('pages.stableRequests.toasts.pwdRejected'));
      return;
    }
    if (action === 'temp') {
      toast(t('pages.stableRequests.toasts.placeholderTempPassword'));
      return;
    }
    if (action === 'complete') {
      patchPasswordReset(stableId, row.resetId, { status: 'Completed', completedAt: nowStr() });
      toast.success(t('pages.stableRequests.toasts.pwdCompleted'));
    }
  };

  const savePwdApprove = () => {
    if (!pwdApprove) return;
    if (!pwdTemp.trim()) {
      toast.error(t('pages.stableRequests.toasts.needTempPassword'));
      return;
    }
    const { stableId, row } = pwdApprove;
    patchPasswordReset(stableId, row.resetId, {
      status: 'Approved',
      temporaryPassword: pwdTemp.trim(),
      requirePasswordChange: pwdRequireChange,
      completedAt: nowStr(),
    });
    updateWorkspace(stableId, (w) => ({
      ...w,
      ownerPasswordResetStatus: 'Completed',
    }));
    pushActivity(stableId, {
      actionKey: 'passwordResetApproved',
      performedBy: t('pages.stableRequests.labels.superAdmin'),
      notes: '',
      status: 'Success',
    });
    toast.success(t('pages.stableRequests.toasts.pwdApproved'));
    setPwdApprove(null);
    setPwdTemp('');
  };

  const docAction = (stableId, doc, kind) => {
    const statusMap = {
      view: doc.status,
      approve: 'Verified',
      reject: 'Rejected',
      replace: 'Pending',
    };
    if (kind === 'view') {
      toast(t('pages.stableRequests.toasts.docView'));
      return;
    }
    updateWorkspace(stableId, (w) => ({
      ...w,
      documents: w.documents.map((d) =>
        d.docId === doc.docId ? { ...d, status: statusMap[kind], uploadedDate: d.uploadedDate || nowStr().slice(0, 10) } : d
      ),
    }));
    if (kind === 'approve') toast.success(t('pages.stableRequests.toasts.docApproved'));
    if (kind === 'reject') toast.success(t('pages.stableRequests.toasts.docRejected'));
    if (kind === 'replace') toast.success(t('pages.stableRequests.toasts.docReplace'));
  };

  const detailStats = useMemo(() => {
    if (!selected) return null;
    const tickets = selected.tickets;
    const open = tickets.filter((tk) => OPEN_TICKET.has(tk.status)).length;
    const closed = tickets.filter((tk) => tk.status === 'Closed' || tk.status === 'Resolved').length;
    const pendingDocs = selected.documents.filter((d) => d.status === 'Pending' || d.status === 'Missing').length;
    const pwdN = selected.passwordResets.filter((r) => r.status === 'Pending').length;
    const regDays = daysWaiting(selected.submittedDate);
    return {
      totalT: tickets.length,
      open,
      closed,
      pendingDocs,
      pwdN,
      regDays,
    };
  }, [selected]);

  const exportPdf = () => toast(t('pages.stableRequests.toasts.exportPdf'));

  /* ——— List view ——— */
  if (!selected) {
    return (
      <div className="sr-page" dir={rtl ? 'rtl' : 'ltr'}>
        <header className="sr-page__header">
          <div className="sr-page__titles">
            <h1 className="sr-page__title">{t('pages.stableRequests.title')}</h1>
            <p className="sr-page__subtitle">{t('pages.stableRequests.subtitle')}</p>
          </div>
        </header>

        <section className="sr-filters">
          <div className="sr-filters__grid">
            <div className="sr-field sr-filters__row-wide">
              <label className="sr-field__label" htmlFor="sr-search">
                {t('pages.stableRequests.filters.search')}
              </label>
              <div className="sr-search-wrap">
                <Search aria-hidden />
                <input
                  id="sr-search"
                  className="sr-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('pages.stableRequests.filters.searchPlaceholder')}
                />
              </div>
            </div>
            <div className="sr-field">
              <span className="sr-field__label">{t('pages.stableRequests.filters.registrationStatus')}</span>
              <select className="sr-select" value={fReg} onChange={(e) => setFReg(e.target.value)}>
                <option value={ALL}>{t('pages.stableRequests.filters.all')}</option>
                {registrationStatuses
                  .filter((x) => x !== ALL)
                  .map((x) => (
                    <option key={x} value={x}>
                      {trRegStatus(x)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="sr-field">
              <span className="sr-field__label">{t('pages.stableRequests.filters.stableType')}</span>
              <select className="sr-select" value={fType} onChange={(e) => setFType(e.target.value)}>
                <option value={ALL}>{t('pages.stableRequests.filters.all')}</option>
                {stableTypes
                  .filter((x) => x !== ALL)
                  .map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
              </select>
            </div>
            <div className="sr-field">
              <span className="sr-field__label">{t('pages.stableRequests.filters.country')}</span>
              <select className="sr-select" value={fCountry} onChange={(e) => setFCountry(e.target.value)}>
                <option value={ALL}>{t('pages.stableRequests.filters.all')}</option>
                {countries
                  .filter((x) => x !== ALL)
                  .map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
              </select>
            </div>
            <div className="sr-field">
              <span className="sr-field__label">{t('pages.stableRequests.filters.requestType')}</span>
              <select className="sr-select" value={fReqType} onChange={(e) => setFReqType(e.target.value)}>
                <option value={ALL}>{t('pages.stableRequests.filters.all')}</option>
                {requestTypes
                  .filter((x) => x !== ALL)
                  .map((x) => (
                    <option key={x} value={x}>
                      {trRequestType(x)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="sr-field">
              <span className="sr-field__label">{t('pages.stableRequests.filters.priority')}</span>
              <select className="sr-select" value={fPriority} onChange={(e) => setFPriority(e.target.value)}>
                <option value={ALL}>{t('pages.stableRequests.filters.all')}</option>
                {['High', 'Medium', 'Low'].map((p) => (
                  <option key={p} value={p}>
                    {t(`pages.stableRequests.priority.${p}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="sr-field">
              <span className="sr-field__label">{t('pages.stableRequests.filters.dateFrom')}</span>
              <input className="sr-input" type="date" value={fDateFrom} onChange={(e) => setFDateFrom(e.target.value)} />
            </div>
            <div className="sr-field">
              <span className="sr-field__label">{t('pages.stableRequests.filters.dateTo')}</span>
              <input className="sr-input" type="date" value={fDateTo} onChange={(e) => setFDateTo(e.target.value)} />
            </div>
            <div className="sr-field">
              <span className="sr-field__label" style={{ visibility: 'hidden' }}>
                .
              </span>
              <button type="button" className="sr-btn sr-btn--ghost" onClick={resetFilters}>
                <RefreshCw size={16} aria-hidden />
                {t('pages.stableRequests.filters.reset')}
              </button>
            </div>
          </div>
        </section>

        <div className="sr-summary-grid">
          {[
            ['total', summary.total],
            ['pendingReg', summary.pendingReg],
            ['approved', summary.approved],
            ['rejected', summary.rejected],
            ['moreInfo', summary.moreInfo],
            ['pwdResets', summary.pwdResets],
            ['docReview', summary.docReview],
            ['suspended', summary.suspended],
            ['highPri', summary.highPri],
          ].map(([key, val]) => (
            <div key={key} className="sr-kpi">
              <div className="sr-kpi__label">{t(`pages.stableRequests.summary.${key}`)}</div>
              <div className="sr-kpi__value">{val}</div>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="sr-empty">{t('pages.stableRequests.emptyList')}</div>
        ) : (
          <div className="sr-cards-grid">
            {filtered.map((w) => (
              <div
                key={w.stableId}
                className="sr-card sr-card--compact"
                role="button"
                tabIndex={0}
                onClick={() => openStable(w.stableId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openStable(w.stableId);
                  }
                }}
              >
                <div className="sr-card__logo-wrap">
                  {w.stableLogo ? (
                    <img
                      className="sr-card__logo"
                      src={w.stableLogo}
                      alt={w.stableName}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.classList.add('sr-card__logo--hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={`sr-card__logo-fallback${w.stableLogo ? ' sr-card__logo-fallback--stacked' : ''}`}
                    aria-hidden
                  >
                    {stableCardInitials(w.stableName)}
                  </div>
                </div>
                <div className="sr-card__body">
                  <h2 className="sr-card__name">{w.stableName}</h2>
                  <p className="sr-card__owner">{w.ownerName}</p>
                  <div className="sr-card__row">
                    <span className={`sr-badge ${registrationStatusClass(w.registrationStatus)}`}>
                      {trRegStatus(w.registrationStatus)}
                    </span>
                  </div>
                  <p className="sr-card__join">
                    <span className="sr-card__join-label">{t('pages.stableRequests.card.joinedPlatform')}</span>
                    <span className="sr-card__join-date">{w.submittedDate || w.createdAt?.slice(0, 10) || '—'}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {rejectModal ? (
          <div className="sr-modal-overlay" role="dialog" aria-modal="true">
            <div className="sr-modal">
              <div className="sr-modal__head">
                <h2 className="sr-modal__title">{t('pages.stableRequests.modals.rejectTitle')}</h2>
                <button type="button" className="sr-modal__close" onClick={() => setRejectModal(null)} aria-label={t('pages.stableRequests.actions.close')}>
                  <X size={18} />
                </button>
              </div>
              <div className="sr-modal__body">
                <label className="sr-field__label" htmlFor="sr-reject-reason">
                  {t('pages.stableRequests.modals.rejectReason')}
                </label>
                <textarea
                  id="sr-reject-reason"
                  className="sr-textarea"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="sr-modal__foot">
                <button type="button" className="sr-btn sr-btn--ghost" onClick={() => setRejectModal(null)}>
                  {t('pages.stableRequests.actions.cancel')}
                </button>
                <button type="button" className="sr-btn sr-btn--danger" onClick={submitReject}>
                  {t('pages.stableRequests.actions.confirmReject')}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {moreInfoModal ? (
          <div className="sr-modal-overlay" role="dialog" aria-modal="true">
            <div className="sr-modal sr-modal--wide">
              <div className="sr-modal__head">
                <h2 className="sr-modal__title">{t('pages.stableRequests.modals.moreInfoTitle')}</h2>
                <button type="button" className="sr-modal__close" onClick={() => setMoreInfoModal(null)} aria-label={t('pages.stableRequests.actions.close')}>
                  <X size={18} />
                </button>
              </div>
              <div className="sr-modal__body">
                <div className="sr-field">
                  <label className="sr-field__label" htmlFor="sr-mi-missing">
                    {t('pages.stableRequests.modals.missingInfo')}
                  </label>
                  <textarea
                    id="sr-mi-missing"
                    className="sr-textarea"
                    value={moreInfoFields.missing}
                    onChange={(e) => setMoreInfoFields((p) => ({ ...p, missing: e.target.value }))}
                  />
                </div>
                <div className="sr-field" style={{ marginTop: '0.75rem' }}>
                  <label className="sr-field__label" htmlFor="sr-mi-docs">
                    {t('pages.stableRequests.modals.requiredDocs')}
                  </label>
                  <textarea
                    id="sr-mi-docs"
                    className="sr-textarea"
                    value={moreInfoFields.documents}
                    onChange={(e) => setMoreInfoFields((p) => ({ ...p, documents: e.target.value }))}
                  />
                </div>
                <div className="sr-field" style={{ marginTop: '0.75rem' }}>
                  <label className="sr-field__label" htmlFor="sr-mi-msg">
                    {t('pages.stableRequests.modals.ownerMessage')}
                  </label>
                  <textarea
                    id="sr-mi-msg"
                    className="sr-textarea"
                    value={moreInfoFields.message}
                    onChange={(e) => setMoreInfoFields((p) => ({ ...p, message: e.target.value }))}
                  />
                </div>
              </div>
              <div className="sr-modal__foot">
                <button type="button" className="sr-btn sr-btn--ghost" onClick={() => setMoreInfoModal(null)}>
                  {t('pages.stableRequests.actions.cancel')}
                </button>
                <button type="button" className="sr-btn sr-btn--gold" onClick={submitMoreInfo}>
                  {t('pages.stableRequests.actions.sendMoreInfo')}
            </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  /* ——— Detail view ——— */
  const d = selected;
  const tabs = [
    { id: 'overview', label: t('pages.stableRequests.tabs.overview'), Icon: LayoutDashboard },
    { id: 'stable', label: t('pages.stableRequests.tabs.stableData'), Icon: Building2 },
    { id: 'requests', label: t('pages.stableRequests.tabs.requests'), Icon: FileText },
    { id: 'documents', label: t('pages.stableRequests.tabs.documents'), Icon: FileText },
    { id: 'passwords', label: t('pages.stableRequests.tabs.passwordResets'), Icon: KeyRound },
    { id: 'activity', label: t('pages.stableRequests.tabs.activity'), Icon: Calendar },
  ];

  return (
    <div className="sr-page" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="sr-detail__header">
        <button
          type="button"
          className="sr-btn sr-btn--ghost sr-detail__back"
          onClick={() => {
            setSelectedStableId(null);
            setDetailTab('overview');
          }}
        >
          <ArrowLeft size={18} style={{ transform: rtl ? 'scaleX(-1)' : undefined }} aria-hidden />
          {t('pages.stableRequests.back')}
        </button>
        <div className="sr-detail__head-main">
          <h1 className="sr-detail__title">{d.stableName}</h1>
          <p className="sr-detail__sub">
            {d.ownerName} · {d.requestId} · {d.stableId}
          </p>
          <div className="sr-badges" style={{ marginTop: '0.5rem' }}>
            <span className={`sr-badge ${registrationStatusClass(d.registrationStatus)}`}>{trRegStatus(d.registrationStatus)}</span>
            <span className="sr-badge sr-badge--moreinfo">{trAccess(d.accessStatus)}</span>
            <span className="sr-badge sr-badge--approved">{trSub(d.subscriptionStatus)}</span>
            <span className={`sr-badge ${priorityClass(d.priority)}`}>{t(`pages.stableRequests.priority.${d.priority}`)}</span>
          </div>
        </div>
        <div className="sr-detail__quick">
          <button type="button" className="sr-btn sr-btn--gold sr-btn--sm" onClick={() => approveStable(d.stableId)}>
            {t('pages.stableRequests.actions.approveStable')}
          </button>
          <button
            type="button"
            className="sr-btn sr-btn--danger sr-btn--sm"
            onClick={() => {
              setRejectModal(d.stableId);
              setRejectReason('');
            }}
          >
            {t('pages.stableRequests.actions.rejectStable')}
          </button>
            <button
              type="button"
            className="sr-btn sr-btn--ghost sr-btn--sm"
            onClick={() => {
              setMoreInfoModal(d.stableId);
              setMoreInfoFields({ missing: '', documents: '', message: '' });
            }}
          >
            {t('pages.stableRequests.actions.requestMoreInfo')}
          </button>
          <button type="button" className="sr-btn sr-btn--danger sr-btn--sm" onClick={() => setSuspendModal(true)}>
            {t('pages.stableRequests.actions.suspendAccess')}
          </button>
          <button type="button" className="sr-btn sr-btn--primary sr-btn--sm" onClick={() => reactivateStable(d.stableId)}>
            {t('pages.stableRequests.actions.reactivateAccess')}
          </button>
          <button type="button" className="sr-btn sr-btn--ghost sr-btn--sm" onClick={() => toast(t('pages.stableRequests.toasts.resetPasswordPlaceholder'))}>
            {t('pages.stableRequests.actions.resetOwnerPassword')}
          </button>
          <button type="button" className="sr-btn sr-btn--ghost sr-btn--sm" onClick={exportPdf}>
            {t('pages.stableRequests.actions.exportPdf')}
            </button>
        </div>
      </div>

      {detailStats ? (
        <div className="sr-detail-kpis">
          {[
            ['totalRequests', detailStats.totalT],
            ['openRequests', detailStats.open],
            ['closedRequests', detailStats.closed],
            ['pendingDocuments', detailStats.pendingDocs],
            ['pwdRequests', detailStats.pwdN],
            ['daysSinceReg', detailStats.regDays],
            ['usersCount', d.usersCount],
            ['horsesCount', d.horsesCount],
            ['subscription', trSub(d.subscriptionStatus)],
            ['access', trAccess(d.accessStatus)],
          ].map(([k, v]) => (
            <div key={k} className="sr-kpi">
              <div className="sr-kpi__label">{t(`pages.stableRequests.detailSummary.${k}`)}</div>
              <div className="sr-kpi__value" style={typeof v === 'string' ? { fontSize: '0.95rem' } : undefined}>
                {v}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="sr-tabs">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`sr-tab${detailTab === id ? ' sr-tab--active' : ''}`}
            onClick={() => setDetailTab(id)}
          >
            <Icon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginInlineEnd: 6 }} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {detailTab === 'overview' ? (
        <section className="sr-panel">
            <h2 className="sr-panel__title">{t('pages.stableRequests.sections.stableInfo')}</h2>
            <div className="sr-info-grid">
              {[
                ['stableId', d.stableId],
                ['stableName', d.stableName],
                ['stableType', d.stableType],
                ['country', d.country],
                ['city', d.city],
                ['address', d.address],
                ['horses', d.numberOfHorses],
                ['riders', d.numberOfRiders],
                ['cr', d.commercialRegistrationNumber || '—'],
                ['regStatus', trRegStatus(d.registrationStatus)],
                ['access', trAccess(d.accessStatus)],
                ['createdAt', d.createdAt],
                ['updatedAt', d.updatedAt],
              ].map(([key, val]) => (
                <div key={key} className="sr-info-row">
                  <span>{t(`pages.stableRequests.fields.stable.${key}`)}</span>
                  <strong>{val}</strong>
                </div>
              ))}
            </div>
          </section>
      ) : null}

      {detailTab === 'stable' ? (
        <>
          <section className="sr-panel">
            <h2 className="sr-panel__title">{t('pages.stableRequests.sections.stableInfo')}</h2>
            <div className="sr-info-grid">
              {[
                ['stableId', d.stableId],
                ['requestId', d.requestId],
                ['stableName', d.stableName],
                ['stableType', d.stableType],
                ['country', d.country],
                ['city', d.city],
                ['address', d.address],
                ['horses', d.numberOfHorses],
                ['riders', d.numberOfRiders],
                ['cr', d.commercialRegistrationNumber || '—'],
                ['regStatus', trRegStatus(d.registrationStatus)],
                ['access', trAccess(d.accessStatus)],
                ['createdAt', d.createdAt],
                ['updatedAt', d.updatedAt],
              ].map(([key, val]) => (
                <div key={key} className="sr-info-row">
                  <span>{t(`pages.stableRequests.fields.stable.${key}`)}</span>
                  <strong>{val}</strong>
                </div>
              ))}
            </div>
          </section>
          <section className="sr-panel">
            <h2 className="sr-panel__title">{t('pages.stableRequests.sections.ownerInfo')}</h2>
            <div className="sr-info-grid">
              {[
                ['ownerName', d.ownerName],
                ['ownerEmail', d.ownerEmail],
                ['ownerPhone', d.ownerPhone],
                ['ownerUsername', d.ownerUsername],
                ['ownerAccountStatus', trOwnerAcct(d.ownerAccountStatus)],
                ['lastLogin', d.lastLogin || '—'],
                ['ownerPasswordResetStatus', trPwdOwnerStatus(d.ownerPasswordResetStatus)],
              ].map(([key, val]) => (
                <div key={key} className="sr-info-row">
                  <span>{t(`pages.stableRequests.fields.owner.${key}`)}</span>
                  <strong>{val}</strong>
                </div>
              ))}
            </div>
          </section>
          <section className="sr-panel">
            <h2 className="sr-panel__title">{t('pages.stableRequests.sections.subscriptionInfo')}</h2>
            <div className="sr-info-grid">
              {[
                ['plan', d.plan],
                ['subscriptionStatus', trSub(d.subscriptionStatus)],
                ['billingCycle', d.billingCycle],
                ['monthlyFee', d.monthlyFee],
                ['renewalDate', d.renewalDate],
                ['outstandingBalance', d.outstandingBalance],
                ['paymentStatus', trPay(d.paymentStatus)],
              ].map(([key, val]) => (
                <div key={key} className="sr-info-row">
                  <span>{t(`pages.stableRequests.fields.subscription.${key}`)}</span>
                  <strong>{val}</strong>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {detailTab === 'requests' ? (
        <section className="sr-panel">
          <h2 className="sr-panel__title">{t('pages.stableRequests.sections.requestsTable')}</h2>
          {d.tickets.length === 0 ? (
            <div className="sr-empty">{t('pages.stableRequests.emptyTickets')}</div>
          ) : (
            <div className="sr-table-wrap">
              <table className="sr-table">
                <thead>
                  <tr>
                    {[
                      'ticketId',
                      'requestType',
                      'requestedBy',
                      'userRole',
                      'subject',
                      'description',
                      'status',
                      'priority',
                      'createdAt',
                      'updatedAt',
                      'assignedTo',
                      'actions',
                    ].map((col) => (
                      <th key={col}>{t(`pages.stableRequests.table.${col}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.tickets.map((tk) => (
                    <tr key={tk.ticketId}>
                      <td>{tk.ticketId}</td>
                      <td>{trRequestType(tk.requestType)}</td>
                      <td>{tk.requestedBy}</td>
                      <td>{tk.userRole}</td>
                      <td>{tk.subject}</td>
                      <td>{tk.description || '—'}</td>
                      <td>{trTicketStatus(tk.status)}</td>
                      <td>{t(`pages.stableRequests.priority.${tk.priority}`)}</td>
                      <td>{tk.createdAt}</td>
                      <td>{tk.updatedAt}</td>
                      <td>{tk.assignedTo}</td>
                      <td>
                        <div className="sr-table__actions">
                          <button type="button" className="sr-btn sr-btn--ghost sr-btn--sm" onClick={() => ticketAction(d.stableId, tk, 'view')}>
                            {t('pages.stableRequests.ticketActions.view')}
                          </button>
                          <button type="button" className="sr-btn sr-btn--primary sr-btn--sm" onClick={() => ticketAction(d.stableId, tk, 'approve')}>
                            {t('pages.stableRequests.ticketActions.approve')}
                          </button>
                          <button type="button" className="sr-btn sr-btn--danger sr-btn--sm" onClick={() => ticketAction(d.stableId, tk, 'reject')}>
                            {t('pages.stableRequests.ticketActions.reject')}
                          </button>
                          <button type="button" className="sr-btn sr-btn--ghost sr-btn--sm" onClick={() => ticketAction(d.stableId, tk, 'more')}>
                            {t('pages.stableRequests.ticketActions.moreInfo')}
                          </button>
                          <button type="button" className="sr-btn sr-btn--ghost sr-btn--sm" onClick={() => ticketAction(d.stableId, tk, 'progress')}>
                            {t('pages.stableRequests.ticketActions.inProgress')}
                          </button>
                          <button type="button" className="sr-btn sr-btn--ghost sr-btn--sm" onClick={() => ticketAction(d.stableId, tk, 'resolved')}>
                            {t('pages.stableRequests.ticketActions.resolved')}
                          </button>
                          <button type="button" className="sr-btn sr-btn--ghost sr-btn--sm" onClick={() => ticketAction(d.stableId, tk, 'close')}>
                            {t('pages.stableRequests.ticketActions.close')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {detailTab === 'documents' ? (
        <section className="sr-panel">
          <h2 className="sr-panel__title">{t('pages.stableRequests.sections.documents')}</h2>
          {d.documents.length === 0 ? (
            <div className="sr-empty">{t('pages.stableRequests.emptyDocuments')}</div>
          ) : (
            <div className="sr-table-wrap">
              <table className="sr-table">
                <thead>
                  <tr>
                    {['type', 'fileName', 'status', 'uploaded', 'actions'].map((col) => (
                      <th key={col}>{t(`pages.stableRequests.docTable.${col}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.documents.map((doc) => (
                    <tr key={doc.docId}>
                      <td>{doc.type}</td>
                      <td>{doc.fileName || t('pages.stableRequests.labels.missingFile')}</td>
                      <td>{trDocStatus(doc.status)}</td>
                      <td>{doc.uploadedDate || '—'}</td>
                      <td>
                        <div className="sr-table__actions">
                          <button type="button" className="sr-btn sr-btn--ghost sr-btn--sm" onClick={() => docAction(d.stableId, doc, 'view')}>
                            {t('pages.stableRequests.docActions.view')}
                          </button>
                          <button type="button" className="sr-btn sr-btn--primary sr-btn--sm" onClick={() => docAction(d.stableId, doc, 'approve')}>
                            {t('pages.stableRequests.docActions.approve')}
                          </button>
                          <button type="button" className="sr-btn sr-btn--danger sr-btn--sm" onClick={() => docAction(d.stableId, doc, 'reject')}>
                            {t('pages.stableRequests.docActions.reject')}
                          </button>
                          <button type="button" className="sr-btn sr-btn--ghost sr-btn--sm" onClick={() => docAction(d.stableId, doc, 'replace')}>
                            {t('pages.stableRequests.docActions.replace')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {detailTab === 'passwords' ? (
        <section className="sr-panel">
          <h2 className="sr-panel__title">{t('pages.stableRequests.sections.passwordResets')}</h2>
          {d.passwordResets.length === 0 ? (
            <div className="sr-empty">{t('pages.stableRequests.emptyPasswordResets')}</div>
          ) : (
            <div className="sr-table-wrap">
              <table className="sr-table">
                <thead>
                  <tr>
                    {[
                      'resetId',
                      'stableId',
                      'userName',
                      'username',
                      'email',
                      'phone',
                      'userRole',
                      'reason',
                      'status',
                      'requestedAt',
                      'completedAt',
                      'actions',
                    ].map((col) => (
                      <th key={col}>{t(`pages.stableRequests.pwdTable.${col}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.passwordResets.map((r) => (
                    <tr key={r.resetId}>
                      <td>{r.resetId}</td>
                      <td>{r.stableId}</td>
                      <td>{r.userName}</td>
                      <td>{r.username}</td>
                      <td>{r.email}</td>
                      <td>{r.phone}</td>
                      <td>{r.userRole}</td>
                      <td>{t(`pages.stableRequests.resetReason.${resetReasonKey(r.reason)}`)}</td>
                      <td>{t(`pages.stableRequests.resetStatus.${resetStatusKey(r.status)}`)}</td>
                      <td>{r.requestedAt}</td>
                      <td>{r.completedAt || '—'}</td>
                      <td>
                        <div className="sr-table__actions">
                          <button type="button" className="sr-btn sr-btn--gold sr-btn--sm" onClick={() => pwdResetAction(d.stableId, r, 'approve')}>
                            {t('pages.stableRequests.pwdActions.approve')}
                          </button>
                          <button type="button" className="sr-btn sr-btn--danger sr-btn--sm" onClick={() => pwdResetAction(d.stableId, r, 'reject')}>
                            {t('pages.stableRequests.pwdActions.reject')}
                          </button>
                          <button type="button" className="sr-btn sr-btn--ghost sr-btn--sm" onClick={() => pwdResetAction(d.stableId, r, 'temp')}>
                            {t('pages.stableRequests.pwdActions.temp')}
                          </button>
                          <button type="button" className="sr-btn sr-btn--ghost sr-btn--sm" onClick={() => pwdResetAction(d.stableId, r, 'complete')}>
                            {t('pages.stableRequests.pwdActions.complete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {detailTab === 'activity' ? (
        <section className="sr-panel">
          <h2 className="sr-panel__title">{t('pages.stableRequests.sections.activity')}</h2>
          {d.activityTimeline.length === 0 ? (
            <div className="sr-empty">{t('pages.stableRequests.emptyActivity')}</div>
          ) : (
            <div className="sr-timeline">
              {[...d.activityTimeline]
                .sort((a, b) => (a.dateTime < b.dateTime ? 1 : -1))
                .map((item) => (
                  <div key={item.id} className="sr-tl-item">
                    <div className="sr-tl-item__time">{item.dateTime}</div>
                    <div className="sr-tl-item__action">{t(`pages.stableRequests.activity.${activityKey(item.actionKey)}`)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--sr-muted)' }}>
                      {t('pages.stableRequests.labels.performedBy')}: {item.performedBy}
                    </div>
                    {item.notes ? (
                      <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {t('pages.stableRequests.labels.notes')}: {item.notes}
                      </div>
                    ) : null}
                    <div style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>{item.status}</div>
                  </div>
                ))}
            </div>
          )}
        </section>
      ) : null}

      {suspendModal ? (
        <div className="sr-modal-overlay" role="dialog" aria-modal="true">
          <div className="sr-modal">
            <div className="sr-modal__head">
              <h2 className="sr-modal__title">{t('pages.stableRequests.modals.suspendTitle')}</h2>
              <button type="button" className="sr-modal__close" onClick={() => setSuspendModal(false)} aria-label={t('pages.stableRequests.actions.close')}>
                <X size={18} />
              </button>
            </div>
            <div className="sr-modal__body">
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('pages.stableRequests.modals.suspendConfirm')}</p>
              <div className="sr-warning" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
                <span>{t('pages.stableRequests.modals.suspendWarning')}</span>
              </div>
            </div>
            <div className="sr-modal__foot">
              <button type="button" className="sr-btn sr-btn--ghost" onClick={() => setSuspendModal(false)}>
                {t('pages.stableRequests.actions.cancel')}
              </button>
              <button type="button" className="sr-btn sr-btn--danger" onClick={confirmSuspend}>
                {t('pages.stableRequests.actions.confirmSuspend')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectModal ? (
        <div className="sr-modal-overlay" role="dialog" aria-modal="true">
          <div className="sr-modal">
            <div className="sr-modal__head">
              <h2 className="sr-modal__title">{t('pages.stableRequests.modals.rejectTitle')}</h2>
              <button type="button" className="sr-modal__close" onClick={() => setRejectModal(null)} aria-label={t('pages.stableRequests.actions.close')}>
                <X size={18} />
              </button>
            </div>
            <div className="sr-modal__body">
              <label className="sr-field__label" htmlFor="sr-reject-reason-d">
                {t('pages.stableRequests.modals.rejectReason')}
              </label>
              <textarea
                id="sr-reject-reason-d"
                className="sr-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="sr-modal__foot">
              <button type="button" className="sr-btn sr-btn--ghost" onClick={() => setRejectModal(null)}>
                {t('pages.stableRequests.actions.cancel')}
              </button>
              <button type="button" className="sr-btn sr-btn--danger" onClick={submitReject}>
                {t('pages.stableRequests.actions.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {moreInfoModal ? (
        <div className="sr-modal-overlay" role="dialog" aria-modal="true">
          <div className="sr-modal sr-modal--wide">
            <div className="sr-modal__head">
              <h2 className="sr-modal__title">{t('pages.stableRequests.modals.moreInfoTitle')}</h2>
              <button type="button" className="sr-modal__close" onClick={() => setMoreInfoModal(null)} aria-label={t('pages.stableRequests.actions.close')}>
                <X size={18} />
              </button>
            </div>
            <div className="sr-modal__body">
              <div className="sr-field">
                <label className="sr-field__label" htmlFor="sr-mi-missing-d">
                  {t('pages.stableRequests.modals.missingInfo')}
                </label>
                <textarea
                  id="sr-mi-missing-d"
                  className="sr-textarea"
                  value={moreInfoFields.missing}
                  onChange={(e) => setMoreInfoFields((p) => ({ ...p, missing: e.target.value }))}
                />
              </div>
              <div className="sr-field" style={{ marginTop: '0.75rem' }}>
                <label className="sr-field__label" htmlFor="sr-mi-docs-d">
                  {t('pages.stableRequests.modals.requiredDocs')}
                </label>
                <textarea
                  id="sr-mi-docs-d"
                  className="sr-textarea"
                  value={moreInfoFields.documents}
                  onChange={(e) => setMoreInfoFields((p) => ({ ...p, documents: e.target.value }))}
                />
              </div>
              <div className="sr-field" style={{ marginTop: '0.75rem' }}>
                <label className="sr-field__label" htmlFor="sr-mi-msg-d">
                  {t('pages.stableRequests.modals.ownerMessage')}
                </label>
                <textarea
                  id="sr-mi-msg-d"
                  className="sr-textarea"
                  value={moreInfoFields.message}
                  onChange={(e) => setMoreInfoFields((p) => ({ ...p, message: e.target.value }))}
                />
              </div>
            </div>
            <div className="sr-modal__foot">
              <button type="button" className="sr-btn sr-btn--ghost" onClick={() => setMoreInfoModal(null)}>
                {t('pages.stableRequests.actions.cancel')}
              </button>
              <button type="button" className="sr-btn sr-btn--gold" onClick={submitMoreInfo}>
                {t('pages.stableRequests.actions.sendMoreInfo')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pwdApprove ? (
        <div className="sr-modal-overlay" role="dialog" aria-modal="true">
          <div className="sr-modal sr-modal--wide">
            <div className="sr-modal__head">
              <h2 className="sr-modal__title">{t('pages.stableRequests.modals.pwdApproveTitle')}</h2>
              <button type="button" className="sr-modal__close" onClick={() => setPwdApprove(null)} aria-label={t('pages.stableRequests.actions.close')}>
                <X size={18} />
              </button>
            </div>
            <div className="sr-modal__body">
              <div className="sr-info-grid">
                <div className="sr-info-row">
                  <span>{t('pages.stableRequests.pwdModal.userName')}</span>
                  <strong>{pwdApprove.row.userName}</strong>
                </div>
                <div className="sr-info-row">
                  <span>{t('pages.stableRequests.pwdModal.username')}</span>
                  <strong>{pwdApprove.row.username}</strong>
                </div>
              </div>
              <div className="sr-field" style={{ marginTop: '1rem' }}>
                <label className="sr-field__label" htmlFor="sr-pwd-temp">
                  {t('pages.stableRequests.pwdModal.tempPassword')}
                </label>
                <input id="sr-pwd-temp" className="sr-input" type="text" value={pwdTemp} onChange={(e) => setPwdTemp(e.target.value)} autoComplete="off" />
              </div>
              <label className="sr-checkbox-row">
                <input type="checkbox" checked={pwdRequireChange} onChange={(e) => setPwdRequireChange(e.target.checked)} />
                {t('pages.stableRequests.pwdModal.requireChange')}
              </label>
              <div className="sr-btn sr-btn--ghost" style={{ width: 'fit-content', marginTop: '0.35rem', cursor: 'default' }}>
                {t('pages.stableRequests.pwdModal.sendEmail')}
              </div>
              <div className="sr-btn sr-btn--ghost" style={{ width: 'fit-content', marginTop: '0.35rem', cursor: 'default' }}>
                {t('pages.stableRequests.pwdModal.sendSms')}
              </div>
              <div className="sr-security">
                <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginInlineEnd: 6 }} aria-hidden />
                {t('pages.stableRequests.pwdModal.securityNote')}
              </div>
            </div>
            <div className="sr-modal__foot">
              <button type="button" className="sr-btn sr-btn--ghost" onClick={() => setPwdApprove(null)}>
                {t('pages.stableRequests.actions.cancel')}
              </button>
              <button type="button" className="sr-btn sr-btn--gold" onClick={savePwdApprove}>
                {t('pages.stableRequests.pwdModal.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
