/**
 * Stable Settings — profile, access control, security, billing, integrations (demo).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Bell,
  Building2,
  CreditCard,
  Database,
  Globe,
  HeartPulse,
  Lock,
  Palette,
  Plug,
  Shield,
  Sliders,
  Upload,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  dummyStableUsers,
  dummySubscriptions,
  initialStables,
} from '../../../../services/mock/dummyData';
import '../styles/StableSettings.css';

const STABLE_TYPES = ['Endurance', 'Flat Racing', 'Jumping', 'Mixed'];
const SUSPENSION_REASONS = ['Payment issue', 'Internal review', 'Security concern', 'Temporary closure', 'Other'];
const SESSION_TIMEOUTS = ['15 minutes', '30 minutes', '1 hour', '4 hours', '1 day'];
const NOTIFICATION_TYPES = [
  'trainingReminders',
  'medicalReminders',
  'vaccinationReminders',
  'inventoryLowStock',
  'expenseAlerts',
  'deferredPayment',
  'userLogin',
  'reportGeneration',
  'competitionReminders',
];
const CHANNELS = ['email', 'sms', 'whatsapp', 'push'];

const SECTIONS = [
  { id: 'profile', icon: Building2, labelKey: 'nav.profile' },
  { id: 'access', icon: Shield, labelKey: 'nav.access' },
  { id: 'users', icon: Users, labelKey: 'nav.users' },
  { id: 'security', icon: Lock, labelKey: 'nav.security' },
  { id: 'notifications', icon: Bell, labelKey: 'nav.notifications' },
  { id: 'billing', icon: CreditCard, labelKey: 'nav.billing' },
  { id: 'integrations', icon: Plug, labelKey: 'nav.integrations' },
  { id: 'data', icon: Database, labelKey: 'nav.data' },
  { id: 'appearance', icon: Palette, labelKey: 'nav.appearance' },
  { id: 'compliance', icon: HeartPulse, labelKey: 'nav.compliance' },
  { id: 'operations', icon: Sliders, labelKey: 'nav.operations' },
  { id: 'danger', icon: AlertTriangle, labelKey: 'nav.danger', danger: true },
];

function defaultNotificationMatrix() {
  const types = {};
  NOTIFICATION_TYPES.forEach((key) => {
    types[key] = { email: key !== 'competitionReminders', sms: false, whatsapp: false, push: false };
  });
  return types;
}

function buildInitialSettings(stableId) {
  const stable = initialStables.find((s) => s.id === stableId);
  const sub = dummySubscriptions.find((s) => s.stableId === stableId);
  return {
    stableId,
    stableProfile: {
      stableName: stable?.stableName || '',
      ownerName: stable?.ownerName || '',
      email: stable?.email || '',
      phone: stable?.phone || '',
      country: stable?.country || '',
      city: stable?.city || '',
      address: stable?.city ? `${stable.city}, ${stable.country}` : '',
      stableType: stable?.stableType || 'Endurance',
      horseCount: stable?.horseCount ?? 0,
      riderCount: stable?.riderCount ?? 0,
      commercialReg: stable?.commercialReg || '',
      notes: stable?.notes || '',
      logoPreview: null,
      imagePreview: null,
    },
    accessControl: {
      status: 'Active',
      suspensionReason: '',
      suspensionNote: '',
      suspendedBy: '',
      suspendedAt: '',
    },
    security: {
      requireStrongPassword: true,
      requirePasswordChangeFirstLogin: true,
      twoFactorPlaceholder: false,
      sessionTimeout: '30 minutes',
      loginAlerts: true,
      failedLoginLockout: true,
      allowedDevicesPlaceholder: false,
    },
    notifications: {
      channelsEnabled: { email: true, sms: false, whatsapp: false, push: false },
      types: defaultNotificationMatrix(),
    },
    billing: {
      plan: sub?.plan || 'Enterprise',
      status: sub?.status || 'active',
      billingCycle: 'Annual',
      renewalDate: sub?.renewalDate || '2026-10-01',
      monthlyFee: sub?.amount ? Math.round(sub.amount / 12) : 400,
      paymentMethod: 'Wire transfer (placeholder)',
      outstandingBalance: 0,
      lastPaymentDate: '2026-04-01',
    },
    integrations: {
      garminConnected: true,
      garminLastSync: '2026-05-12 14:30',
      garminSyncFrequency: 'Every 6 hours',
      calendarConnected: false,
      whatsappPlaceholder: false,
      emailPlaceholder: true,
      pdfReporting: true,
      aiAssistantPlaceholder: false,
    },
    dataBackup: {
      lastBackup: '2026-05-10 02:00',
      backupFrequency: 'Weekly (placeholder)',
      retentionPeriod: '24 months',
    },
    localization: {
      language: 'en',
      direction: 'ltr',
      theme: 'light',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24-hour',
      currency: 'BHD',
    },
    compliance: {
      requirePostTrainingCheck: true,
      requireWeeklyExam: true,
      requireVetApprovalMeds: true,
      antiDopingPlaceholder: false,
      vaccinationReminders: true,
      withdrawalReminders: true,
      requireMedicalDocuments: false,
    },
    operations: {
      defaultDiscipline: stable?.stableType || 'Endurance',
      defaultCalendarView: 'Month',
      defaultAssignmentMode: 'Single Horse & Rider',
      lowStockThreshold: 5,
      defaultExpensePayment: 'Wire',
      autoMonthlyReports: true,
    },
  };
}

function ConfirmModal({ open, title, message, confirmLabel, cancelLabel, danger, onConfirm, onClose }) {
  if (!open) return null;
  return (
    <div className="ss-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="ss-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="ss-modal__head">
          <h3>{title}</h3>
        </header>
        <div className="ss-modal__body">{message}</div>
        <footer className="ss-modal__foot">
          <button type="button" className="ss-btn ss-btn--ghost" onClick={onClose}>{cancelLabel}</button>
          <button type="button" className={`ss-btn${danger ? ' ss-btn--danger' : ' ss-btn--gold'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function StableSettings() {
  const { t } = useTranslation();
  const ts = useCallback((key, opts) => t(`pages.stableSettings.${key}`, opts), [t]);
  const { stableId, user } = useAuth();
  const { changeLanguage } = useLanguage();

  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState(() => buildInitialSettings(stableId || 'stable-1'));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(buildInitialSettings(stableId || 'stable-1')));
  const [modal, setModal] = useState(null);
  const urlRefs = useRef([]);

  useEffect(() => () => {
    urlRefs.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const stableUsers = useMemo(
    () => dummyStableUsers.filter((u) => u.stableId === stableId),
    [stableId]
  );

  const userStats = useMemo(() => ({
    total: stableUsers.length,
    active: stableUsers.filter((u) => u.status === 'active').length,
    inactive: stableUsers.filter((u) => u.status !== 'active').length,
    admin: stableUsers.filter((u) => ['Stable Owner', 'Stable Admin'].includes(u.role)).length,
  }), [stableUsers]);

  const registerUrl = (url) => {
    urlRefs.current.push(url);
    return url;
  };

  const patchProfile = (patch) => setSettings((s) => ({ ...s, stableProfile: { ...s.stableProfile, ...patch } }));
  const patchAccess = (patch) => setSettings((s) => ({ ...s, accessControl: { ...s.accessControl, ...patch } }));
  const patchSecurity = (patch) => setSettings((s) => ({ ...s, security: { ...s.security, ...patch } }));
  const patchBilling = (patch) => setSettings((s) => ({ ...s, billing: { ...s.billing, ...patch } }));
  const patchIntegrations = (patch) => setSettings((s) => ({ ...s, integrations: { ...s.integrations, ...patch } }));
  const patchLocalization = (patch) => setSettings((s) => ({ ...s, localization: { ...s.localization, ...patch } }));
  const patchCompliance = (patch) => setSettings((s) => ({ ...s, compliance: { ...s.compliance, ...patch } }));
  const patchOperations = (patch) => setSettings((s) => ({ ...s, operations: { ...s.operations, ...patch } }));

  const toggleNotify = (typeKey, channel) => {
    setSettings((s) => ({
      ...s,
      notifications: {
        ...s.notifications,
        types: {
          ...s.notifications.types,
          [typeKey]: { ...s.notifications.types[typeKey], [channel]: !s.notifications.types[typeKey][channel] },
        },
      },
    }));
  };

  const confirmSuspend = () => {
    patchAccess({
      status: 'Suspended',
      suspendedBy: user?.name || user?.email || 'Stable Owner',
      suspendedAt: new Date().toISOString(),
    });
    setModal(null);
    toast.error(ts('toasts.suspended'));
  };

  const confirmReactivate = () => {
    patchAccess({
      status: 'Active',
      suspensionReason: '',
      suspensionNote: '',
      suspendedBy: '',
      suspendedAt: '',
    });
    setModal(null);
    toast.success(ts('toasts.reactivated'));
  };

  const resetProfile = () => {
    const fresh = buildInitialSettings(stableId);
    setSettings((s) => ({ ...s, stableProfile: fresh.stableProfile }));
    toast(ts('toasts.profileReset'));
  };

  const saveProfile = () => {
    setSavedSnapshot(JSON.stringify(settings));
    toast.success(ts('toasts.saved'));
  };

  const savePreferences = () => {
    if (settings.localization.language) changeLanguage(settings.localization.language);
    setSavedSnapshot(JSON.stringify(settings));
    toast.success(ts('toasts.preferencesSaved'));
  };

  const resetAllDummy = () => {
    const fresh = buildInitialSettings(stableId);
    setSettings(fresh);
    setSavedSnapshot(JSON.stringify(fresh));
    setModal(null);
    toast.success(ts('toasts.dummyReset'));
  };

  const isSuspended = settings.accessControl.status === 'Suspended';

  const renderProfile = () => {
    const p = settings.stableProfile;
    return (
      <section className="ss-card">
        <h2>{ts('sections.profile.title')}</h2>
        <p className="ss-card__lead">{ts('sections.profile.lead')}</p>
        <div className="ss-grid ss-grid--2">
          <label className="ss-field">
            <span>{ts('fields.stableName')}</span>
            <input value={p.stableName} onChange={(e) => patchProfile({ stableName: e.target.value })} />
          </label>
          <label className="ss-field">
            <span>{ts('fields.ownerName')}</span>
            <input value={p.ownerName} onChange={(e) => patchProfile({ ownerName: e.target.value })} />
          </label>
          <label className="ss-field">
            <span>{ts('fields.email')}</span>
            <input type="email" value={p.email} onChange={(e) => patchProfile({ email: e.target.value })} />
          </label>
          <label className="ss-field">
            <span>{ts('fields.phone')}</span>
            <input value={p.phone} onChange={(e) => patchProfile({ phone: e.target.value })} />
          </label>
          <label className="ss-field">
            <span>{ts('fields.country')}</span>
            <input value={p.country} onChange={(e) => patchProfile({ country: e.target.value })} />
          </label>
          <label className="ss-field">
            <span>{ts('fields.city')}</span>
            <input value={p.city} onChange={(e) => patchProfile({ city: e.target.value })} />
          </label>
          <label className="ss-field ss-field--full">
            <span>{ts('fields.address')}</span>
            <input value={p.address} onChange={(e) => patchProfile({ address: e.target.value })} />
          </label>
          <label className="ss-field">
            <span>{ts('fields.stableType')}</span>
            <select value={p.stableType} onChange={(e) => patchProfile({ stableType: e.target.value })}>
              {STABLE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="ss-field">
            <span>{ts('fields.horseCount')}</span>
            <input type="number" min="0" value={p.horseCount} onChange={(e) => patchProfile({ horseCount: Number(e.target.value) })} />
          </label>
          <label className="ss-field">
            <span>{ts('fields.riderCount')}</span>
            <input type="number" min="0" value={p.riderCount} onChange={(e) => patchProfile({ riderCount: Number(e.target.value) })} />
          </label>
          <label className="ss-field">
            <span>{ts('fields.commercialReg')}</span>
            <input value={p.commercialReg} onChange={(e) => patchProfile({ commercialReg: e.target.value })} />
          </label>
          <label className="ss-field ss-field--full">
            <span>{ts('fields.notes')}</span>
            <textarea rows={3} value={p.notes} onChange={(e) => patchProfile({ notes: e.target.value })} />
          </label>
          <label className="ss-field">
            <span>{ts('fields.logo')}</span>
            <label className="ss-upload">
              <Upload size={20} aria-hidden />
              {ts('fields.upload')}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) patchProfile({ logoPreview: registerUrl(URL.createObjectURL(f)) });
                  e.target.value = '';
                }}
              />
              {p.logoPreview ? <img src={p.logoPreview} alt="" className="ss-upload__preview" /> : null}
            </label>
          </label>
          <label className="ss-field">
            <span>{ts('fields.stableImage')}</span>
            <label className="ss-upload">
              <Upload size={20} aria-hidden />
              {ts('fields.upload')}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) patchProfile({ imagePreview: registerUrl(URL.createObjectURL(f)) });
                  e.target.value = '';
                }}
              />
              {p.imagePreview ? <img src={p.imagePreview} alt="" className="ss-upload__preview" /> : null}
            </label>
          </label>
        </div>
        <div className="ss-actions">
          <button type="button" className="ss-btn ss-btn--gold" onClick={saveProfile}>{ts('actions.save')}</button>
          <button type="button" className="ss-btn ss-btn--ghost" onClick={resetProfile}>{ts('actions.reset')}</button>
        </div>
      </section>
    );
  };

  const renderAccess = () => {
    const a = settings.accessControl;
    return (
      <section className="ss-card">
        <h2>{ts('sections.access.title')}</h2>
        <p className="ss-card__lead">{ts('sections.access.lead')}</p>

        {isSuspended ? (
          <div className="ss-banner ss-banner--danger" role="alert">
            <AlertTriangle size={20} aria-hidden />
            <div>
              <strong>{ts('access.suspendedBannerTitle')}</strong>
              <p>{ts('access.suspendedBanner')}</p>
            </div>
          </div>
        ) : null}

        <div className="ss-access-card">
          <h3>{ts('access.statusTitle')}</h3>
          <div className="ss-radio-row">
            {['Active', 'Suspended'].map((status) => (
              <label key={status}>
                <input
                  type="radio"
                  name="accessStatus"
                  checked={a.status === status}
                  onChange={() => patchAccess({ status })}
                />
                {status === 'Active' ? ts('access.active') : ts('access.suspended')}
              </label>
            ))}
          </div>
        </div>

        <div className="ss-grid">
          <label className="ss-field">
            <span>{ts('access.reason')}</span>
            <select
              value={a.suspensionReason}
              disabled={!isSuspended}
              onChange={(e) => patchAccess({ suspensionReason: e.target.value })}
            >
              <option value="">{ts('access.selectReason')}</option>
              {SUSPENSION_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="ss-field ss-field--full">
            <span>{ts('access.note')}</span>
            <textarea
              rows={2}
              disabled={!isSuspended}
              value={a.suspensionNote}
              onChange={(e) => patchAccess({ suspensionNote: e.target.value })}
            />
          </label>
          <label className="ss-field">
            <span>{ts('access.suspendedBy')}</span>
            <input readOnly value={a.suspendedBy || '—'} className="ss-field--readonly" />
          </label>
          <label className="ss-field">
            <span>{ts('access.suspendedAt')}</span>
            <input
              readOnly
              value={a.suspendedAt ? new Date(a.suspendedAt).toLocaleString() : '—'}
            />
          </label>
        </div>

        <p className="ss-field__hint">{ts('access.affectedCount', { count: userStats.total })}</p>
        <ul className="ss-user-list">
          {stableUsers.map((u) => (
            <li key={u.id}>
              <span>{u.name} · {u.role}</span>
              <span className={`ss-badge${u.status === 'active' ? ' ss-badge--ok' : ' ss-badge--off'}`}>{u.status}</span>
            </li>
          ))}
        </ul>

        <div className="ss-actions">
          {!isSuspended ? (
            <button type="button" className="ss-btn ss-btn--warn" onClick={() => setModal('suspend')}>
              {ts('access.suspendAll')}
            </button>
          ) : (
            <button type="button" className="ss-btn ss-btn--gold" onClick={() => setModal('reactivate')}>
              {ts('access.reactivate')}
            </button>
          )}
        </div>
      </section>
    );
  };

  const renderUsers = () => (
    <section className="ss-card">
      <h2>{ts('sections.users.title')}</h2>
      <p className="ss-card__lead">{ts('sections.users.lead')}</p>
      <div className="ss-stat-row">
        <div className="ss-stat"><span>{ts('users.total')}</span><strong>{userStats.total}</strong></div>
        <div className="ss-stat"><span>{ts('users.active')}</span><strong>{userStats.active}</strong></div>
        <div className="ss-stat"><span>{ts('users.inactive')}</span><strong>{userStats.inactive}</strong></div>
        <div className="ss-stat"><span>{ts('users.admin')}</span><strong>{userStats.admin}</strong></div>
      </div>
      <div className="ss-shortcuts">
        {['manageUsers', 'manageRoles', 'permissionMatrix', 'activityLogs'].map((key) => (
          <button key={key} type="button" className="ss-shortcut" onClick={() => toast(ts('toasts.placeholder'))}>
            <strong>{ts(`users.shortcuts.${key}`)}</strong>
            <span>{ts('users.placeholder')}</span>
          </button>
        ))}
      </div>
      <div className="ss-actions">
        <button type="button" className="ss-btn ss-btn--ghost" onClick={() => toast(ts('toasts.placeholder'))}>
          {ts('users.goToUsers')}
        </button>
        <button type="button" className="ss-btn ss-btn--ghost" onClick={() => toast(ts('toasts.placeholder'))}>
          {ts('users.export')}
        </button>
      </div>
    </section>
  );

  const renderSecurity = () => {
    const sec = settings.security;
    return (
      <section className="ss-card">
        <h2>{ts('sections.security.title')}</h2>
        <p className="ss-card__lead">{ts('sections.security.lead')}</p>
        <div className="ss-grid">
          {[
            ['requireStrongPassword', ts('security.strongPassword')],
            ['requirePasswordChangeFirstLogin', ts('security.passwordChangeFirst')],
            ['twoFactorPlaceholder', ts('security.twoFactor')],
            ['loginAlerts', ts('security.loginAlerts')],
            ['failedLoginLockout', ts('security.lockout')],
            ['allowedDevicesPlaceholder', ts('security.devices')],
          ].map(([key, label]) => (
            <label key={key} className="ss-field ss-field--check">
              <input
                type="checkbox"
                checked={sec[key]}
                onChange={(e) => patchSecurity({ [key]: e.target.checked })}
              />
              <span>{label}</span>
            </label>
          ))}
          <label className="ss-field">
            <span>{ts('security.sessionTimeout')}</span>
            <select value={sec.sessionTimeout} onChange={(e) => patchSecurity({ sessionTimeout: e.target.value })}>
              {SESSION_TIMEOUTS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="ss-actions">
          <button type="button" className="ss-btn ss-btn--gold" onClick={() => toast.success(ts('toasts.securitySaved'))}>
            {ts('security.save')}
          </button>
        </div>
      </section>
    );
  };

  const renderNotifications = () => (
    <section className="ss-card">
      <h2>{ts('sections.notifications.title')}</h2>
      <p className="ss-card__lead">{ts('sections.notifications.lead')}</p>
      <div className="ss-grid" style={{ marginBottom: '1rem' }}>
        {CHANNELS.map((ch) => (
          <label key={ch} className="ss-field ss-field--check">
            <input
              type="checkbox"
              checked={settings.notifications.channelsEnabled[ch]}
              onChange={() => setSettings((s) => ({
                ...s,
                notifications: {
                  ...s.notifications,
                  channelsEnabled: { ...s.notifications.channelsEnabled, [ch]: !s.notifications.channelsEnabled[ch] },
                },
              }))}
            />
            <span>{ts(`notifications.channels.${ch}`)}</span>
          </label>
        ))}
      </div>
      <div className="ss-table-wrap" style={{ overflowX: 'auto' }}>
        <table className="ss-notify-table">
          <thead>
            <tr>
              <th>{ts('notifications.type')}</th>
              {CHANNELS.map((ch) => (
                <th key={ch}>{ts(`notifications.channels.${ch}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_TYPES.map((typeKey) => (
              <tr key={typeKey}>
                <td>{ts(`notifications.types.${typeKey}`)}</td>
                {CHANNELS.map((ch) => (
                  <td key={ch}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.types[typeKey][ch]}
                      onChange={() => toggleNotify(typeKey, ch)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ss-actions">
        <button type="button" className="ss-btn ss-btn--gold" onClick={() => toast.success(ts('toasts.saved'))}>
          {ts('actions.save')}
        </button>
      </div>
    </section>
  );

  const renderBilling = () => {
    const b = settings.billing;
    return (
      <section className="ss-card">
        <h2>{ts('sections.billing.title')}</h2>
        <p className="ss-card__lead">{ts('sections.billing.lead')}</p>
        <div className="ss-grid">
          <label className="ss-field"><span>{ts('billing.plan')}</span><input readOnly value={b.plan} /></label>
          <label className="ss-field"><span>{ts('billing.status')}</span><input readOnly value={b.status} /></label>
          <label className="ss-field"><span>{ts('billing.cycle')}</span><input readOnly value={b.billingCycle} /></label>
          <label className="ss-field"><span>{ts('billing.renewal')}</span><input readOnly value={b.renewalDate} /></label>
          <label className="ss-field"><span>{ts('billing.monthlyFee')}</span><input readOnly value={`BHD ${b.monthlyFee}`} /></label>
          <label className="ss-field"><span>{ts('billing.paymentMethod')}</span><input readOnly value={b.paymentMethod} /></label>
          <label className="ss-field"><span>{ts('billing.outstanding')}</span><input readOnly value={`BHD ${b.outstandingBalance}`} /></label>
          <label className="ss-field"><span>{ts('billing.lastPayment')}</span><input readOnly value={b.lastPaymentDate} /></label>
        </div>
        <div className="ss-actions">
          <button type="button" className="ss-btn ss-btn--ghost" onClick={() => toast(ts('toasts.placeholder'))}>{ts('billing.invoices')}</button>
          <button type="button" className="ss-btn ss-btn--ghost" onClick={() => toast(ts('toasts.placeholder'))}>{ts('billing.updatePayment')}</button>
          <button type="button" className="ss-btn ss-btn--ghost" onClick={() => toast(ts('toasts.placeholder'))}>{ts('billing.upgrade')}</button>
        </div>
      </section>
    );
  };

  const renderIntegrations = () => {
    const intg = settings.integrations;
    return (
      <section className="ss-card">
        <h2>{ts('sections.integrations.title')}</h2>
        <p className="ss-card__lead">{ts('sections.integrations.lead')}</p>
        <div className="ss-integration-row">
          <div>
            <strong>Garmin</strong>
            <p className="ss-field__hint">{ts('integrations.garminLead')}</p>
            <p className="ss-field__hint">{ts('integrations.lastSync')}: {intg.garminLastSync}</p>
          </div>
          <span className={`ss-badge${intg.garminConnected ? ' ss-badge--ok' : ' ss-badge--off'}`}>
            {intg.garminConnected ? ts('integrations.connected') : ts('integrations.notConnected')}
          </span>
        </div>
        <div className="ss-actions" style={{ marginTop: 0, paddingTop: 0, border: 'none' }}>
          <button type="button" className="ss-btn ss-btn--ghost" onClick={() => toast(ts('toasts.placeholder'))}>{ts('integrations.connectGarmin')}</button>
          <button type="button" className="ss-btn ss-btn--ghost" onClick={() => { patchIntegrations({ garminConnected: false }); toast.success(ts('toasts.disconnected')); }}>
            {ts('integrations.disconnect')}
          </button>
        </div>
        {[
          ['calendarConnected', 'Calendar'],
          ['whatsappPlaceholder', 'WhatsApp'],
          ['emailPlaceholder', 'Email'],
          ['pdfReporting', 'PDF / Reports'],
          ['aiAssistantPlaceholder', 'AI Assistant'],
        ].map(([key, label]) => (
          <div key={key} className="ss-integration-row">
            <strong>{label}</strong>
            <label className="ss-field ss-field--check">
              <input type="checkbox" checked={intg[key]} onChange={(e) => patchIntegrations({ [key]: e.target.checked })} />
              <span>{intg[key] ? ts('integrations.enabled') : ts('integrations.disabled')}</span>
            </label>
          </div>
        ))}
      </section>
    );
  };

  const renderData = () => {
    const d = settings.dataBackup;
    return (
      <section className="ss-card">
        <h2>{ts('sections.data.title')}</h2>
        <p className="ss-card__lead">{ts('sections.data.lead')}</p>
        <div className="ss-grid">
          <label className="ss-field"><span>{ts('data.lastBackup')}</span><input readOnly value={d.lastBackup} /></label>
          <label className="ss-field"><span>{ts('data.frequency')}</span><input readOnly value={d.backupFrequency} /></label>
          <label className="ss-field"><span>{ts('data.retention')}</span><input readOnly value={d.retentionPeriod} /></label>
        </div>
        <div className="ss-actions">
          {['exportStable', 'exportHorses', 'exportRiders', 'exportFinancial'].map((key) => (
            <button key={key} type="button" className="ss-btn ss-btn--ghost" onClick={() => toast(ts('toasts.placeholder'))}>
              {ts(`data.${key}`)}
            </button>
          ))}
          <button type="button" className="ss-btn ss-btn--gold" onClick={() => toast(ts('toasts.placeholder'))}>{ts('data.downloadBackup')}</button>
        </div>
      </section>
    );
  };

  const renderAppearance = () => {
    const loc = settings.localization;
    return (
      <section className="ss-card">
        <h2>{ts('sections.appearance.title')}</h2>
        <p className="ss-card__lead">{ts('sections.appearance.lead')}</p>
        <div className="ss-grid">
          <label className="ss-field">
            <span>{ts('appearance.language')}</span>
            <select value={loc.language} onChange={(e) => patchLocalization({ language: e.target.value })}>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </label>
          <label className="ss-field">
            <span>{ts('appearance.direction')}</span>
            <select value={loc.direction} onChange={(e) => patchLocalization({ direction: e.target.value })}>
              <option value="ltr">LTR</option>
              <option value="rtl">RTL</option>
            </select>
          </label>
          <label className="ss-field">
            <span>{ts('appearance.theme')}</span>
            <select value={loc.theme} onChange={(e) => patchLocalization({ theme: e.target.value })}>
              <option value="light">{ts('appearance.light')}</option>
              <option value="dark">{ts('appearance.dark')}</option>
              <option value="system">{ts('appearance.system')}</option>
            </select>
          </label>
          <label className="ss-field">
            <span>{ts('appearance.dateFormat')}</span>
            <select value={loc.dateFormat} onChange={(e) => patchLocalization({ dateFormat: e.target.value })}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </label>
          <label className="ss-field">
            <span>{ts('appearance.timeFormat')}</span>
            <select value={loc.timeFormat} onChange={(e) => patchLocalization({ timeFormat: e.target.value })}>
              <option value="24-hour">24-hour</option>
              <option value="12-hour">12-hour</option>
            </select>
          </label>
          <label className="ss-field">
            <span>{ts('appearance.currency')}</span>
            <select value={loc.currency} onChange={(e) => patchLocalization({ currency: e.target.value })}>
              {['BHD', 'USD', 'SAR', 'AED'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="ss-actions">
          <button type="button" className="ss-btn ss-btn--gold" onClick={savePreferences}>
            <Globe size={16} aria-hidden />
            {ts('appearance.save')}
          </button>
        </div>
      </section>
    );
  };

  const renderCompliance = () => (
    <section className="ss-card">
      <h2>{ts('sections.compliance.title')}</h2>
      <p className="ss-card__lead">{ts('sections.compliance.lead')}</p>
      <div className="ss-grid">
        {Object.entries(settings.compliance).map(([key, val]) => (
          <label key={key} className="ss-field ss-field--check">
            <input type="checkbox" checked={val} onChange={(e) => patchCompliance({ [key]: e.target.checked })} />
            <span>{ts(`compliance.${key}`)}</span>
          </label>
        ))}
      </div>
      <div className="ss-actions">
        <button type="button" className="ss-btn ss-btn--gold" onClick={() => toast.success(ts('toasts.saved'))}>{ts('actions.save')}</button>
      </div>
    </section>
  );

  const renderOperations = () => (
    <section className="ss-card">
      <h2>{ts('sections.operations.title')}</h2>
      <p className="ss-card__lead">{ts('sections.operations.lead')}</p>
      <div className="ss-grid">
        <label className="ss-field">
          <span>{ts('operations.discipline')}</span>
          <select value={settings.operations.defaultDiscipline} onChange={(e) => patchOperations({ defaultDiscipline: e.target.value })}>
            {STABLE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="ss-field">
          <span>{ts('operations.calendarView')}</span>
          <select value={settings.operations.defaultCalendarView} onChange={(e) => patchOperations({ defaultCalendarView: e.target.value })}>
            {['Month', 'Week', 'Day'].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="ss-field">
          <span>{ts('operations.assignmentMode')}</span>
          <select value={settings.operations.defaultAssignmentMode} onChange={(e) => patchOperations({ defaultAssignmentMode: e.target.value })}>
            <option value="Single Horse & Rider">{ts('operations.single')}</option>
            <option value="Group Training">{ts('operations.group')}</option>
          </select>
        </label>
        <label className="ss-field">
          <span>{ts('operations.lowStock')}</span>
          <input type="number" min="1" value={settings.operations.lowStockThreshold} onChange={(e) => patchOperations({ lowStockThreshold: Number(e.target.value) })} />
        </label>
        <label className="ss-field">
          <span>{ts('operations.expensePayment')}</span>
          <select value={settings.operations.defaultExpensePayment} onChange={(e) => patchOperations({ defaultExpensePayment: e.target.value })}>
            {['Wire', 'Card', 'Cash', 'Cheque'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="ss-field ss-field--check">
          <input type="checkbox" checked={settings.operations.autoMonthlyReports} onChange={(e) => patchOperations({ autoMonthlyReports: e.target.checked })} />
          <span>{ts('operations.autoReports')}</span>
        </label>
      </div>
      <div className="ss-actions">
        <button type="button" className="ss-btn ss-btn--gold" onClick={() => toast.success(ts('toasts.saved'))}>{ts('actions.save')}</button>
      </div>
    </section>
  );

  const renderDanger = () => (
    <section className="ss-card ss-card--danger">
      <h2>{ts('sections.danger.title')}</h2>
      <p className="ss-card__lead">{ts('sections.danger.lead')}</p>
      <div className="ss-banner ss-banner--danger">
        <AlertTriangle size={20} aria-hidden />
        <p>{ts('danger.warning')}</p>
      </div>
      <div className="ss-actions">
        <button type="button" className="ss-btn ss-btn--danger" onClick={() => toast(ts('toasts.placeholder'))}>
          {ts('danger.deactivate')}
        </button>
        <button type="button" className="ss-btn ss-btn--danger" onClick={() => toast(ts('toasts.placeholder'))}>
          {ts('danger.deleteData')}
        </button>
        <button type="button" className="ss-btn ss-btn--ghost" onClick={() => setModal('resetDummy')}>
          {ts('danger.resetDummy')}
        </button>
      </div>
    </section>
  );

  const sectionRenderers = {
    profile: renderProfile,
    access: renderAccess,
    users: renderUsers,
    security: renderSecurity,
    notifications: renderNotifications,
    billing: renderBilling,
    integrations: renderIntegrations,
    data: renderData,
    appearance: renderAppearance,
    compliance: renderCompliance,
    operations: renderOperations,
    danger: renderDanger,
  };

  return (
    <div className="ss-page">
      <header className="ss-page__header">
        <h1 className="ss-page__title">{ts('pageTitle')}</h1>
        <p className="ss-page__subtitle">{ts('pageSubtitle')}</p>
        <p className="ss-field__hint">{ts('stableIdHint', { id: stableId })}</p>
      </header>

      <div className="ss-layout">
        <nav className="ss-nav" aria-label={ts('nav.label')}>
          {SECTIONS.map(({ id, icon: Icon, labelKey, danger }) => (
            <button
              key={id}
              type="button"
              className={`ss-nav__btn${activeSection === id ? ' is-active' : ''}${danger ? ' ss-nav__btn--danger' : ''}`}
              onClick={() => setActiveSection(id)}
            >
              <Icon size={16} aria-hidden />
              {ts(labelKey)}
            </button>
          ))}
        </nav>

        <main className="ss-main">{sectionRenderers[activeSection]?.()}</main>
      </div>

      <ConfirmModal
        open={modal === 'suspend'}
        title={ts('modals.suspendTitle')}
        message={ts('modals.suspendMessage', { count: userStats.total })}
        confirmLabel={ts('modals.confirmSuspend')}
        cancelLabel={ts('modals.cancel')}
        danger
        onConfirm={confirmSuspend}
        onClose={() => setModal(null)}
      />
      <ConfirmModal
        open={modal === 'reactivate'}
        title={ts('modals.reactivateTitle')}
        message={ts('modals.reactivateMessage')}
        confirmLabel={ts('modals.confirmReactivate')}
        cancelLabel={ts('modals.cancel')}
        onConfirm={confirmReactivate}
        onClose={() => setModal(null)}
      />
      <ConfirmModal
        open={modal === 'resetDummy'}
        title={ts('modals.resetTitle')}
        message={ts('modals.resetMessage')}
        confirmLabel={ts('modals.confirmReset')}
        cancelLabel={ts('modals.cancel')}
        danger
        onConfirm={resetAllDummy}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
