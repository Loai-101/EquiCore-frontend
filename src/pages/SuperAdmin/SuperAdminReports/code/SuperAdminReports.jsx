/**
 * Super Admin Reports — layout aligned with Stable Reports (rep-* + Reports.css).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  FileCheck,
  FileText,
  Landmark,
  LifeBuoy,
  Printer,
  Search,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { generateReportPDF, generateReportPDFFromPreview, printReportPreview } from '../../../../utils/pdfGenerator';
import {
  buildDummyPreviewRows,
  DUMMY_ACTIVITY_SNIPPETS,
  DUMMY_SUPPORT_TICKETS,
  REPORT_DASHBOARD_STATS,
  SUPER_ADMIN_REPORT_DEFINITIONS,
} from '../../../../services/mock/superAdminReportsData';
import ReportPreview from '../../../Stable/Reports/code/ReportPreview';
import '../../../Stable/Reports/styles/Reports.css';
import '../styles/SuperAdminReports.css';
import { isRtlLanguage } from '../../../../utils/i18nHelpers';

const ALL = '__ALL__';

const CATEGORY_ICONS = {
  'Stable Registration Reports': Building2,
  'Subscription Reports': CreditCard,
  'Financial Reports': Wallet,
  'Tenant / Stable Management Reports': Landmark,
  'User & Access Reports': Users,
  'Document & Compliance Reports': FileCheck,
  'Platform Activity Reports': Activity,
  'Support & Requests Reports': LifeBuoy,
};

function todayIso() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function firstOfMonthIso() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-01`;
}

function categoryLabel(category, lang) {
  const row = SUPER_ADMIN_REPORT_DEFINITIONS.find((r) => r.category === category);
  if (!row) return category;
  return lang === 'ar' ? row.categoryAr : row.category;
}

function countByCategory(category) {
  return SUPER_ADMIN_REPORT_DEFINITIONS.filter((r) => r.category === category).length;
}

function statusRepClass(status) {
  if (status === 'Ready') return 'ready';
  if (status === 'Requires Data') return 'requiresData';
  return 'comingSoon';
}

function statusI18nKey(status) {
  if (status === 'Ready') return 'ready';
  if (status === 'Requires Data') return 'data';
  return 'soon';
}

function reportTitle(report, lang) {
  return lang === 'ar' ? report.titleAr : report.title;
}

function reportDescription(report, lang) {
  return lang === 'ar' ? report.descriptionAr : report.description;
}

function buildFiltersUsed(filters, t) {
  const parts = [];
  if (filters.stable !== ALL) parts.push(`${t('pages.superAdminReports.filters.stable')}: ${filters.stable}`);
  if (filters.country !== ALL) parts.push(`${t('pages.superAdminReports.filters.country')}: ${filters.country}`);
  if (filters.stableType !== ALL) parts.push(`${t('pages.superAdminReports.filters.stableType')}: ${filters.stableType}`);
  if (filters.status !== ALL) parts.push(`${t('pages.superAdminReports.filters.status')}: ${filters.status}`);
  if (filters.subscriptionPlan !== ALL)
    parts.push(`${t('pages.superAdminReports.filters.subscriptionPlan')}: ${filters.subscriptionPlan}`);
  if (filters.paymentStatus !== ALL)
    parts.push(`${t('pages.superAdminReports.filters.paymentStatus')}: ${filters.paymentStatus}`);
  return parts.length ? parts : [t('pages.superAdminReports.preview.filtersDefault')];
}

export default function SuperAdminReports() {
  const { t, i18n } = useTranslation();
  const siteRtl = isRtlLanguage();

  const categories = useMemo(
    () => [...new Set(SUPER_ADMIN_REPORT_DEFINITIONS.map((r) => r.category))],
    []
  );

  const [reportLang, setReportLang] = useState(() => (i18n.language?.startsWith('ar') ? 'ar' : 'en'));

  useEffect(() => {
    setReportLang(i18n.language?.startsWith('ar') ? 'ar' : 'en');
  }, [i18n.language]);

  const [activeCategory, setActiveCategory] = useState(() => categories[0] || '');
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [previewPayload, setPreviewPayload] = useState(null);

  const [filters, setFilters] = useState({
    dateFrom: firstOfMonthIso(),
    dateTo: todayIso(),
    stable: ALL,
    country: ALL,
    stableType: ALL,
    status: ALL,
    subscriptionPlan: ALL,
    paymentStatus: ALL,
    reportFormat: 'PDF',
    includeLogo: true,
    includeSummary: true,
    includeCharts: false,
    includeSignature: true,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [favorites, setFavorites] = useState(() => new Set());
  const [recent, setRecent] = useState([]);

  const selectedReport = useMemo(
    () => SUPER_ADMIN_REPORT_DEFINITIONS.find((r) => r.id === selectedReportId) || null,
    [selectedReportId]
  );

  const filteredReports = useMemo(() => {
    const raw = search.trim();
    const qLower = raw.toLowerCase();
    return SUPER_ADMIN_REPORT_DEFINITIONS.filter((r) => {
      if (r.category !== activeCategory) return false;
      if (statusFilter !== ALL && r.status !== statusFilter) return false;
      if (!raw) return true;
      const blob = `${r.title} ${r.titleAr} ${r.description} ${r.descriptionAr}`;
      return blob.toLowerCase().includes(qLower) || blob.includes(raw);
    });
  }, [activeCategory, statusFilter, search]);

  const pushRecent = useCallback(
    (r) => {
      const label = reportLang === 'ar' ? r.titleAr : r.title;
      setRecent((prev) => [{ id: `${r.id}-${Date.now()}`, reportId: r.id, label, at: new Date().toISOString() }, ...prev].slice(0, 8));
    },
    [reportLang]
  );

  const previewLabels = useMemo(
    () => ({
      premiumReports: t('pages.superAdminReports.preview.tagline'),
      stable: t('pages.superAdminReports.preview.platform'),
      generatedBy: t('pages.superAdminReports.preview.generatedBy'),
      generatedAt: t('pages.superAdminReports.preview.generatedAt'),
      dateRange: t('pages.superAdminReports.preview.dateRange'),
      filtersUsed: t('pages.superAdminReports.preview.filtersUsed'),
      summary: t('pages.superAdminReports.preview.summary'),
      data: t('pages.superAdminReports.preview.data'),
      notes: t('pages.superAdminReports.preview.notes'),
      signature: t('pages.superAdminReports.preview.signature'),
      footer: t('pages.superAdminReports.preview.footer'),
    }),
    [t, i18n.language]
  );

  const pdfMetaLabels = useMemo(
    () => ({
      stable: t('pages.superAdminReports.preview.platform'),
      generatedBy: t('pages.superAdminReports.preview.generatedBy'),
      generatedAt: t('pages.superAdminReports.preview.generatedAt'),
      dateRange: t('pages.superAdminReports.preview.dateRange'),
      summary: t('pages.superAdminReports.preview.summary'),
      notes: t('pages.superAdminReports.preview.notes'),
      signature: t('pages.superAdminReports.preview.signature'),
      footer: t('pages.superAdminReports.preview.footer'),
    }),
    [t, i18n.language]
  );

  const favoriteTitles = useMemo(() => {
    const out = [];
    favorites.forEach((id) => {
      const r = SUPER_ADMIN_REPORT_DEFINITIONS.find((x) => x.id === id);
      if (r) out.push({ id, title: reportTitle(r, reportLang) });
    });
    return out;
  }, [favorites, reportLang]);

  const selectReport = (report) => {
    setSelectedReportId(report.id);
    setPreviewPayload(null);
  };

  const handlePreview = () => {
    if (!selectedReport) return;
    if (selectedReport.status === 'Coming Soon') {
      toast.error(t('pages.superAdminReports.toasts.comingSoon'));
      return;
    }
    const rows = buildDummyPreviewRows(reportLang);
    const keys = Object.keys(rows[0] || { col1: '—', col2: '—', col3: '—' });
    const tableRows = rows.map((row) => keys.map((k) => String(row[k] ?? '—')));
    const filtersUsed = buildFiltersUsed(filters, t);
    const summary = filters.includeSummary
      ? [
          { label: t('pages.superAdminReports.preview.summary'), value: t('pages.superAdminReports.preview.summaryBody') },
          { label: t('pages.superAdminReports.filters.reportFormat'), value: filters.reportFormat },
        ]
      : [];

    setPreviewPayload({
      language: reportLang,
      stableName: 'EquiCore',
      generatedBy: t('pages.superAdminReports.preview.superAdmin'),
      generatedAt: new Date().toLocaleString(reportLang === 'ar' ? 'ar-BH' : 'en-GB'),
      dateRange: `${filters.dateFrom} – ${filters.dateTo}`,
      reportTitle: reportTitle(selectedReport, reportLang),
      filtersUsed,
      summary,
      tableColumns: keys,
      tableRows,
      notes: t('pages.superAdminReports.preview.notes'),
    });
    pushRecent(selectedReport);
    toast.success(t('pages.superAdminReports.toasts.previewReady'));
  };

  const handleExportPdf = async () => {
    if (!previewPayload || !selectedReport) {
      toast.error(t('pages.superAdminReports.toasts.previewFirst'));
      return;
    }
    if (selectedReport.status !== 'Ready') {
      toast.error(t('pages.superAdminReports.toasts.notReady'));
      return;
    }
    try {
      const el = document.getElementById('equicore-report-preview');
      if (reportLang === 'ar' && el) {
        await generateReportPDFFromPreview(el, {
          reportTitle: previewPayload.reportTitle,
          language: 'ar',
        });
      } else {
        generateReportPDF({
          reportTitle: previewPayload.reportTitle,
          language: reportLang,
          stableName: previewPayload.stableName,
          generatedBy: previewPayload.generatedBy,
          generatedAt: previewPayload.generatedAt,
          dateRange: previewPayload.dateRange,
          summary: previewPayload.summary,
          tableColumns: previewPayload.tableColumns,
          tableRows: previewPayload.tableRows,
          notes: previewPayload.notes,
          includeSignature: filters.includeSignature,
          labels: pdfMetaLabels,
        });
      }
      toast.success(t('pages.superAdminReports.toasts.pdfGenerated'));
    } catch {
      toast.error(t('pages.superAdminReports.toasts.pdfError'));
    }
  };

  const handlePrint = () => {
    if (!previewPayload) {
      toast.error(t('pages.superAdminReports.toasts.previewFirst'));
      return;
    }
    if (selectedReport && !selectedReport.formats.includes('Print')) {
      toast.error(t('pages.superAdminReports.toasts.printUnavailable'));
      return;
    }
    printReportPreview();
    toast.success(t('pages.superAdminReports.toasts.printOpened'));
  };

  const toggleFavorite = () => {
    if (!selectedReport) return;
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(selectedReport.id)) next.delete(selectedReport.id);
      else next.add(selectedReport.id);
      return next;
    });
    toast.success(t('pages.superAdminReports.toasts.favoriteUpdated'));
  };

  const stableOptions = [ALL, 'Al Najm Stables', 'Oasis Equestrian', 'Desert Wind', 'Royal Bahrain'];
  const countryOptions = [ALL, 'Bahrain', 'United Arab Emirates', 'Saudi Arabia', 'Qatar'];
  const typeOptions = [ALL, 'Endurance', 'Jumping', 'Mixed', 'Flat Racing'];
  const statusOptions = [ALL, 'Pending', 'Approved', 'Rejected', 'Suspended'];
  const planOptions = [ALL, '3 Months', '6 Months', 'Yearly'];
  const payStatusOptions = [ALL, 'Paid', 'Unpaid', 'Partially Paid', 'Overdue'];

  return (
    <div className="rep-page rep-page--super-admin" dir={siteRtl ? 'rtl' : 'ltr'}>
      <header className="rep-page__header">
        <div>
          <h1 className="rep-page__title">{t('pages.superAdminReports.title')}</h1>
          <p className="rep-page__subtitle">{t('pages.superAdminReports.subtitle')}</p>
        </div>
      </header>

      <section className="rep-dash" aria-label={t('pages.superAdminReports.dashboard.aria')}>
        <article className="rep-dash__card rep-dash__card--highlight">
          <FileText size={20} aria-hidden />
          <span>{t('pages.superAdminReports.dashboard.totalReports')}</span>
          <strong>{REPORT_DASHBOARD_STATS.totalReports}</strong>
        </article>
        <article className="rep-dash__card">
          <CheckCircle2 size={18} aria-hidden />
          <span>{t('pages.superAdminReports.dashboard.readyReports')}</span>
          <strong>{REPORT_DASHBOARD_STATS.readyReports}</strong>
        </article>
        <article className="rep-dash__card">
          <Download size={18} aria-hidden />
          <span>{t('pages.superAdminReports.dashboard.generatedPdfs')}</span>
          <strong>{recent.length}</strong>
        </article>
        <article className="rep-dash__card">
          <Building2 size={18} aria-hidden />
          <span>{t('pages.superAdminReports.dashboard.registrationReports')}</span>
          <strong>{REPORT_DASHBOARD_STATS.registrationReports}</strong>
        </article>
        <article className="rep-dash__card">
          <CreditCard size={18} aria-hidden />
          <span>{t('pages.superAdminReports.dashboard.subscriptionReports')}</span>
          <strong>{REPORT_DASHBOARD_STATS.subscriptionReports}</strong>
        </article>
        <article className="rep-dash__card">
          <Wallet size={18} aria-hidden />
          <span>{t('pages.superAdminReports.dashboard.financialReports')}</span>
          <strong>{REPORT_DASHBOARD_STATS.financialReports}</strong>
        </article>
        <article className="rep-dash__card">
          <Users size={18} aria-hidden />
          <span>{t('pages.superAdminReports.dashboard.userReports')}</span>
          <strong>{REPORT_DASHBOARD_STATS.userReports}</strong>
        </article>
        <article className="rep-dash__card">
          <Activity size={18} aria-hidden />
          <span>{t('pages.superAdminReports.dashboard.activityReports')}</span>
          <strong>{REPORT_DASHBOARD_STATS.activityReports}</strong>
        </article>
      </section>

      <label className="rep-search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('pages.superAdminReports.search.placeholder')}
        />
      </label>

      <div className="rep-layout">
        <aside className="rep-sidebar">
          <nav className="rep-categories" aria-label={t('pages.superAdminReports.layout.categoriesNav')}>
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || FileText;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`rep-categories__btn${activeCategory === cat ? ' is-active' : ''}`}
                  onClick={() => {
                    setActiveCategory(cat);
                    setSelectedReportId(null);
                    setPreviewPayload(null);
                  }}
                >
                  <Icon size={16} aria-hidden />
                  <span>{categoryLabel(cat, reportLang)}</span>
                  <em>{countByCategory(cat)}</em>
                </button>
              );
            })}
          </nav>

          <label className="rep-field">
            <span>{t('pages.superAdminReports.search.status')}</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value={ALL}>{t('pages.superAdminReports.filters.allStatuses')}</option>
              <option value="Ready">{t('pages.superAdminReports.status.ready')}</option>
              <option value="Coming Soon">{t('pages.superAdminReports.status.soon')}</option>
              <option value="Requires Data">{t('pages.superAdminReports.status.data')}</option>
            </select>
          </label>

          <div className="rep-list">
            <h3>{categoryLabel(activeCategory, reportLang)}</h3>
            {filteredReports.length === 0 ? (
              <p className="rep-empty">{t('pages.superAdminReports.layout.emptyCategory')}</p>
            ) : (
              <ul>
                {filteredReports.map((report) => (
                  <li key={report.id}>
                    <button
                      type="button"
                      className={`rep-list__item${selectedReportId === report.id ? ' is-active' : ''}`}
                      onClick={() => selectReport(report)}
                    >
                      <span className="rep-list__title">{reportTitle(report, reportLang)}</span>
                      <span className={`rep-status rep-status--${statusRepClass(report.status)}`}>
                        {t(`pages.superAdminReports.status.${statusI18nKey(report.status)}`)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <section className="rep-recent">
            <h3>{t('pages.superAdminReports.recent.title')}</h3>
            {recent.length === 0 ? (
              <p className="rep-empty rep-empty--sm">{t('pages.superAdminReports.recent.empty')}</p>
            ) : (
              <ul>
                {recent.map((r) => (
                  <li key={r.id}>
                    <span>{r.label}</span>
                    <small>{new Date(r.at).toLocaleString(siteRtl ? 'ar-BH' : 'en-GB')}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rep-recent">
            <h3>{t('pages.superAdminReports.favorites.title')}</h3>
            {favoriteTitles.length === 0 ? (
              <p className="rep-empty rep-empty--sm">{t('pages.superAdminReports.favorites.placeholder')}</p>
            ) : (
              <ul>
                {favoriteTitles.map((f) => (
                  <li key={f.id}>
                    <span>{f.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="rep-favorites">
            <Star size={14} aria-hidden />
            {t('pages.superAdminReports.dummy.activity')}
          </p>
          <ul className="rep-super-dummy-list">
            {DUMMY_ACTIVITY_SNIPPETS.map((a) => (
              <li key={a.id}>
                {a.at} — {a.actor} · {a.action}
              </li>
            ))}
          </ul>
          <p className="rep-favorites" style={{ marginTop: '0.75rem' }}>
            <LifeBuoy size={14} aria-hidden />
            {t('pages.superAdminReports.dummy.support')}
          </p>
          <ul className="rep-super-dummy-list">
            {DUMMY_SUPPORT_TICKETS.map((x) => (
              <li key={x.id}>
                {x.id}: {x.subject} ({x.stable})
              </li>
            ))}
          </ul>
        </aside>

        <main className="rep-main">
          {!selectedReport ? (
            <div className="rep-placeholder">
              <BarChart3 size={48} strokeWidth={1.2} aria-hidden />
              <h2>{t('pages.superAdminReports.layout.selectReport')}</h2>
              <p>{t('pages.superAdminReports.layout.selectReportLead')}</p>
            </div>
          ) : (
            <>
              <section className="rep-generator">
                <header className="rep-generator__head">
                  <div>
                    <h2>{reportTitle(selectedReport, reportLang)}</h2>
                    <p>{reportDescription(selectedReport, reportLang)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`rep-status rep-status--${statusRepClass(selectedReport.status)}`}>
                      {t(`pages.superAdminReports.status.${statusI18nKey(selectedReport.status)}`)}
                    </span>
                    <button
                      type="button"
                      className="rep-btn rep-btn--ghost"
                      aria-label={t('pages.superAdminReports.actions.favorite')}
                      onClick={toggleFavorite}
                    >
                      <Star size={16} fill={favorites.has(selectedReport.id) ? 'currentColor' : 'none'} aria-hidden />
                    </button>
                  </div>
                </header>

                <div className="rep-generator__grid">
                  <label className="rep-field">
                    <span>{t('pages.superAdminReports.filters.reportLanguage')}</span>
                    <select value={reportLang} onChange={(e) => setReportLang(e.target.value)}>
                      <option value="en">{t('pages.superAdminReports.filters.langEn')}</option>
                      <option value="ar">{t('pages.superAdminReports.filters.langAr')}</option>
                    </select>
                  </label>
                  <label className="rep-field">
                    <span>{t('pages.superAdminReports.filters.dateFrom')}</span>
                    <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
                  </label>
                  <label className="rep-field">
                    <span>{t('pages.superAdminReports.filters.dateTo')}</span>
                    <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
                  </label>
                  <label className="rep-field">
                    <span>{t('pages.superAdminReports.filters.stable')}</span>
                    <select value={filters.stable} onChange={(e) => setFilters((f) => ({ ...f, stable: e.target.value }))}>
                      {stableOptions.map((o) => (
                        <option key={o} value={o}>
                          {o === ALL ? t('pages.superAdminReports.filters.all') : o}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="rep-field">
                    <span>{t('pages.superAdminReports.filters.country')}</span>
                    <select value={filters.country} onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}>
                      {countryOptions.map((o) => (
                        <option key={o} value={o}>
                          {o === ALL ? t('pages.superAdminReports.filters.all') : o}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="rep-field">
                    <span>{t('pages.superAdminReports.filters.stableType')}</span>
                    <select value={filters.stableType} onChange={(e) => setFilters((f) => ({ ...f, stableType: e.target.value }))}>
                      {typeOptions.map((o) => (
                        <option key={o} value={o}>
                          {o === ALL ? t('pages.superAdminReports.filters.all') : o}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="rep-field">
                    <span>{t('pages.superAdminReports.filters.status')}</span>
                    <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                      {statusOptions.map((o) => (
                        <option key={o} value={o}>
                          {o === ALL ? t('pages.superAdminReports.filters.all') : o}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="rep-field">
                    <span>{t('pages.superAdminReports.filters.subscriptionPlan')}</span>
                    <select value={filters.subscriptionPlan} onChange={(e) => setFilters((f) => ({ ...f, subscriptionPlan: e.target.value }))}>
                      {planOptions.map((o) => (
                        <option key={o} value={o}>
                          {o === ALL ? t('pages.superAdminReports.filters.all') : o}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="rep-field">
                    <span>{t('pages.superAdminReports.filters.paymentStatus')}</span>
                    <select value={filters.paymentStatus} onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}>
                      {payStatusOptions.map((o) => (
                        <option key={o} value={o}>
                          {o === ALL ? t('pages.superAdminReports.filters.all') : o}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="rep-field">
                    <span>{t('pages.superAdminReports.filters.reportFormat')}</span>
                    <select value={filters.reportFormat} onChange={(e) => setFilters((f) => ({ ...f, reportFormat: e.target.value }))}>
                      <option value="PDF">{t('pages.superAdminReports.filters.formatPdf')}</option>
                      <option value="Print">{t('pages.superAdminReports.filters.formatPrint')}</option>
                    </select>
                  </label>
                  <label className="rep-field rep-field--check">
                    <input type="checkbox" checked={filters.includeLogo} onChange={(e) => setFilters((f) => ({ ...f, includeLogo: e.target.checked }))} />
                    <span>{t('pages.superAdminReports.filters.includeLogo')}</span>
                  </label>
                  <label className="rep-field rep-field--check">
                    <input type="checkbox" checked={filters.includeSummary} onChange={(e) => setFilters((f) => ({ ...f, includeSummary: e.target.checked }))} />
                    <span>{t('pages.superAdminReports.filters.includeSummary')}</span>
                  </label>
                  <label className="rep-field rep-field--check">
                    <input type="checkbox" checked={filters.includeCharts} onChange={(e) => setFilters((f) => ({ ...f, includeCharts: e.target.checked }))} />
                    <span>{t('pages.superAdminReports.filters.includeCharts')}</span>
                  </label>
                  <label className="rep-field rep-field--check">
                    <input type="checkbox" checked={filters.includeSignature} onChange={(e) => setFilters((f) => ({ ...f, includeSignature: e.target.checked }))} />
                    <span>{t('pages.superAdminReports.filters.includeSignature')}</span>
                  </label>
                </div>

                <div className="rep-generator__actions">
                  <button type="button" className="rep-btn rep-btn--gold" onClick={handlePreview}>
                    <Eye size={16} aria-hidden />
                    {t('pages.superAdminReports.generator.preview')}
                  </button>
                  <button
                    type="button"
                    className="rep-btn rep-btn--ghost"
                    onClick={handleExportPdf}
                    disabled={!previewPayload || selectedReport.status !== 'Ready'}
                  >
                    <Download size={16} aria-hidden />
                    {t('pages.superAdminReports.generator.exportPdf')}
                  </button>
                  <button
                    type="button"
                    className="rep-btn rep-btn--ghost"
                    onClick={handlePrint}
                    disabled={!previewPayload || !selectedReport.formats.includes('Print')}
                  >
                    <Printer size={16} aria-hidden />
                    {t('pages.superAdminReports.generator.print')}
                  </button>
                </div>
              </section>

              <section className="rep-preview-wrap">
                <h3>{t('pages.superAdminReports.generator.previewTitle')}</h3>
                {!previewPayload ? (
                  <p className="rep-empty">{t('pages.superAdminReports.generator.previewEmpty')}</p>
                ) : (
                  <ReportPreview payload={previewPayload} labels={previewLabels} />
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
