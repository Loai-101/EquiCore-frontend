/**
 * EquiCore Reports Center — catalog, generator, preview, PDF export (EN/AR).
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Brain,
  ClipboardList,
  Download,
  Eye,
  FileText,
  HeartPulse,
  CircleDot,
  Package,
  Printer,
  Search,
  Star,
  User,
  Wallet,
  Building2,
  Dumbbell,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { dummyHorses, dummyRiders } from '../../../../services/mock/dummyData';
import { generateReportPDF, generateReportPDFFromPreview, printReportPreview } from '../../../../utils/pdfGenerator';
import { REPORT_CATALOG, REPORT_CATEGORIES, countByCategory } from './reportCatalog';
import { buildReportPayload } from './reportData';
import ReportPreview from './ReportPreview';
import '../styles/Reports.css';

const CATEGORY_ICONS = {
  horse: CircleDot,
  rider: User,
  training: Dumbbell,
  medical: HeartPulse,
  inventory: Package,
  expense: Wallet,
  users: ClipboardList,
  stable: Building2,
  ai: Brain,
};

const EXPENSE_CATEGORIES = ['Feed', 'Veterinary', 'Equipment', 'Training', 'Transport', 'Utilities', 'Staff', 'Other'];

const DEFAULT_GEN = {
  language: 'en',
  dateFrom: '2026-01-01',
  dateTo: '2026-12-31',
  horseId: '',
  riderId: '',
  category: '',
  status: '',
  includeImages: false,
  includeCharts: true,
  includeSignatures: true,
};

function reportTitle(report, lang) {
  return lang === 'ar' ? report.titleAr : report.title;
}

function reportDescription(report, lang) {
  return lang === 'ar' ? report.descriptionAr : report.description;
}

function statusLabel(status, tr) {
  if (status === 'ready') return tr('status.ready');
  if (status === 'comingSoon') return tr('status.comingSoon');
  return tr('status.requiresData');
}

export default function Reports() {
  const { t, i18n } = useTranslation();
  const { stableId, user } = useAuth();
  const tr = useCallback((key, opts) => t(`pages.reports.center.${key}`, opts), [t]);
  const previewRef = useRef(null);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('horse');
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [generator, setGenerator] = useState(DEFAULT_GEN);
  const [preview, setPreview] = useState(null);
  const [recent, setRecent] = useState([]);

  const uiLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  const horses = useMemo(
    () => dummyHorses.filter((h) => h.stableId === stableId),
    [stableId]
  );
  const riders = useMemo(
    () => dummyRiders.filter((r) => r.stableId === stableId),
    [stableId]
  );

  const selectedReport = useMemo(
    () => REPORT_CATALOG.find((r) => r.id === selectedReportId),
    [selectedReportId]
  );

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return REPORT_CATALOG.filter((r) => {
      if (r.category !== activeCategory) return false;
      if (!q) return true;
      const hay = [r.title, r.titleAr, r.description, r.descriptionAr, r.id].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [activeCategory, search]);

  const dashboardStats = useMemo(
    () => ({
      total: REPORT_CATALOG.length,
      horse: countByCategory('horse'),
      rider: countByCategory('rider'),
      training: countByCategory('training'),
      medical: countByCategory('medical'),
      inventory: countByCategory('inventory'),
      expense: countByCategory('expense'),
      ai: countByCategory('ai'),
      pdfs: recent.length,
    }),
    [recent.length]
  );

  const previewLabels = useMemo(
    () => ({
      premiumReports: tr('preview.premium'),
      stable: tr('preview.stable'),
      generatedBy: tr('preview.generatedBy'),
      generatedAt: tr('preview.generatedAt'),
      dateRange: tr('preview.dateRange'),
      filtersUsed: tr('preview.filtersUsed'),
      summary: tr('preview.summary'),
      data: tr('preview.data'),
      notes: tr('preview.notes'),
      signature: tr('preview.signature'),
      footer: tr('preview.footer'),
    }),
    [tr]
  );

  const selectReport = (report) => {
    setSelectedReportId(report.id);
    setPreview(null);
    setGenerator((g) => ({ ...DEFAULT_GEN, language: g.language }));
  };

  const handlePreview = () => {
    if (!selectedReport) return;
    if (selectedReport.status === 'comingSoon') {
      toast(tr('toasts.comingSoon'));
      return;
    }
    const payload = buildReportPayload(selectedReport.id, {
      stableId,
      language: generator.language,
      dateFrom: generator.dateFrom,
      dateTo: generator.dateTo,
      horseId: generator.horseId,
      riderId: generator.riderId,
      category: generator.category,
      status: generator.status,
      generatedBy: user?.name || user?.email || 'EquiCore',
    });
    setPreview(payload);
    setRecent((prev) => [
      {
        id: `${selectedReport.id}-${Date.now()}`,
        reportId: selectedReport.id,
        title: reportTitle(selectedReport, generator.language),
        language: generator.language,
        at: new Date().toISOString(),
      },
      ...prev.slice(0, 7),
    ]);
    toast.success(tr('toasts.previewReady'));
  };

  const handleExportPdf = async () => {
    if (!preview) {
      toast.error(tr('toasts.previewFirst'));
      return;
    }
    try {
      const el = document.getElementById('equicore-report-preview');
      if (generator.language === 'ar' && el) {
        await generateReportPDFFromPreview(el, {
          reportTitle: preview.reportTitle,
          language: preview.language,
        });
      } else {
        generateReportPDF({
          reportTitle: preview.reportTitle,
          language: preview.language,
          stableName: preview.stableName,
          generatedBy: preview.generatedBy,
          generatedAt: preview.generatedAt,
          dateRange: preview.dateRange,
          summary: preview.summary,
          tableColumns: preview.tableColumns,
          tableRows: preview.tableRows,
          notes: preview.notes,
          includeSignature: generator.includeSignatures,
        });
      }
      toast.success(tr('toasts.pdfExported'));
    } catch {
      toast.error(tr('toasts.pdfFailed'));
    }
  };

  const handlePrint = () => {
    if (!preview) {
      toast.error(tr('toasts.previewFirst'));
      return;
    }
    printReportPreview();
  };

  const showHorseFilter = selectedReport?.filters?.includes('horse');
  const showRiderFilter = selectedReport?.filters?.includes('rider');
  const showCategoryFilter = selectedReport?.filters?.some((f) => f === 'category');
  const showStatusFilter = selectedReport?.filters?.includes('status');
  const showDateRange = selectedReport?.filters?.includes('dateRange') || !selectedReport?.filters?.length;

  return (
    <div className="rep-page">
      <header className="rep-page__header">
        <div>
          <h1 className="rep-page__title">{tr('title')}</h1>
          <p className="rep-page__subtitle">
            <Trans i18nKey="pages.reports.subtitle" values={{ id: stableId }} components={[<code key="c" />]} />
          </p>
        </div>
      </header>

      <section className="rep-dash" aria-label={tr('dashboard.title')}>
        <article className="rep-dash__card rep-dash__card--highlight">
          <FileText size={20} aria-hidden />
          <span>{tr('dashboard.totalReports')}</span>
          <strong>{dashboardStats.total}</strong>
        </article>
        {[
          ['horse', dashboardStats.horse],
          ['rider', dashboardStats.rider],
          ['training', dashboardStats.training],
          ['medical', dashboardStats.medical],
          ['inventory', dashboardStats.inventory],
          ['expense', dashboardStats.expense],
          ['ai', dashboardStats.ai],
        ].map(([key, val]) => (
          <article key={key} className="rep-dash__card">
            {CATEGORY_ICONS[key] ? (() => { const Icon = CATEGORY_ICONS[key]; return <Icon size={18} aria-hidden />; })() : null}
            <span>{tr(`categories.${key}`)}</span>
            <strong>{val}</strong>
          </article>
        ))}
        <article className="rep-dash__card">
          <Download size={18} aria-hidden />
          <span>{tr('dashboard.generatedPdfs')}</span>
          <strong>{dashboardStats.pdfs}</strong>
        </article>
      </section>

      <label className="rep-search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tr('searchPlaceholder')}
        />
      </label>

      <div className="rep-layout">
        <aside className="rep-sidebar">
          <nav className="rep-categories" aria-label={tr('categoriesNav')}>
            {REPORT_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] || FileText;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`rep-categories__btn${activeCategory === cat.id ? ' is-active' : ''}`}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedReportId(null);
                    setPreview(null);
                  }}
                >
                  <Icon size={16} aria-hidden />
                  <span>{tr(cat.labelKey)}</span>
                  <em>{countByCategory(cat.id)}</em>
                </button>
              );
            })}
          </nav>

          <div className="rep-list">
            <h3>{tr(`categories.${activeCategory}`)}</h3>
            {filteredReports.length === 0 ? (
              <p className="rep-empty">{tr('emptyCategory')}</p>
            ) : (
              <ul>
                {filteredReports.map((report) => (
                  <li key={report.id}>
                    <button
                      type="button"
                      className={`rep-list__item${selectedReportId === report.id ? ' is-active' : ''}`}
                      onClick={() => selectReport(report)}
                    >
                      <span className="rep-list__title">{reportTitle(report, uiLang)}</span>
                      <span className={`rep-status rep-status--${report.status}`}>
                        {statusLabel(report.status, tr)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <section className="rep-recent">
            <h3>{tr('recent.title')}</h3>
            {recent.length === 0 ? (
              <p className="rep-empty rep-empty--sm">{tr('recent.empty')}</p>
            ) : (
              <ul>
                {recent.map((r) => (
                  <li key={r.id}>
                    <span>{r.title}</span>
                    <small>{new Date(r.at).toLocaleString(uiLang === 'ar' ? 'ar-BH' : 'en-GB')}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="rep-favorites">
            <Star size={14} aria-hidden />
            {tr('favorites.placeholder')}
          </p>
        </aside>

        <main className="rep-main">
          {!selectedReport ? (
            <div className="rep-placeholder">
              <BarChart3 size={48} strokeWidth={1.2} aria-hidden />
              <h2>{tr('selectReport')}</h2>
              <p>{tr('selectReportLead')}</p>
            </div>
          ) : (
            <>
              <section className="rep-generator">
                <header className="rep-generator__head">
                  <div>
                    <h2>{reportTitle(selectedReport, uiLang)}</h2>
                    <p>{reportDescription(selectedReport, uiLang)}</p>
                  </div>
                  <span className={`rep-status rep-status--${selectedReport.status}`}>
                    {statusLabel(selectedReport.status, tr)}
                  </span>
                </header>

                <div className="rep-generator__grid">
                  <label className="rep-field">
                    <span>{tr('generator.language')}</span>
                    <select
                      value={generator.language}
                      onChange={(e) => setGenerator((g) => ({ ...g, language: e.target.value }))}
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                  </label>
                  {showDateRange ? (
                    <>
                      <label className="rep-field">
                        <span>{tr('generator.dateFrom')}</span>
                        <input
                          type="date"
                          value={generator.dateFrom}
                          onChange={(e) => setGenerator((g) => ({ ...g, dateFrom: e.target.value }))}
                        />
                      </label>
                      <label className="rep-field">
                        <span>{tr('generator.dateTo')}</span>
                        <input
                          type="date"
                          value={generator.dateTo}
                          onChange={(e) => setGenerator((g) => ({ ...g, dateTo: e.target.value }))}
                        />
                      </label>
                    </>
                  ) : null}
                  {showHorseFilter ? (
                    <label className="rep-field">
                      <span>{tr('generator.horse')}</span>
                      <select
                        value={generator.horseId}
                        onChange={(e) => setGenerator((g) => ({ ...g, horseId: e.target.value }))}
                      >
                        <option value="">{tr('generator.all')}</option>
                        {horses.map((h) => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {showRiderFilter ? (
                    <label className="rep-field">
                      <span>{tr('generator.rider')}</span>
                      <select
                        value={generator.riderId}
                        onChange={(e) => setGenerator((g) => ({ ...g, riderId: e.target.value }))}
                      >
                        <option value="">{tr('generator.all')}</option>
                        {riders.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {showCategoryFilter ? (
                    <label className="rep-field">
                      <span>{tr('generator.category')}</span>
                      <select
                        value={generator.category}
                        onChange={(e) => setGenerator((g) => ({ ...g, category: e.target.value }))}
                      >
                        <option value="">{tr('generator.all')}</option>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {showStatusFilter ? (
                    <label className="rep-field">
                      <span>{tr('generator.status')}</span>
                      <select
                        value={generator.status}
                        onChange={(e) => setGenerator((g) => ({ ...g, status: e.target.value }))}
                      >
                        <option value="">{tr('generator.all')}</option>
                        <option value="active">{tr('generator.active')}</option>
                        <option value="inactive">{tr('generator.inactive')}</option>
                      </select>
                    </label>
                  ) : null}
                  <label className="rep-field rep-field--check">
                    <input
                      type="checkbox"
                      checked={generator.includeImages}
                      onChange={(e) => setGenerator((g) => ({ ...g, includeImages: e.target.checked }))}
                    />
                    <span>{tr('generator.includeImages')}</span>
                  </label>
                  <label className="rep-field rep-field--check">
                    <input
                      type="checkbox"
                      checked={generator.includeCharts}
                      onChange={(e) => setGenerator((g) => ({ ...g, includeCharts: e.target.checked }))}
                    />
                    <span>{tr('generator.includeCharts')}</span>
                  </label>
                  <label className="rep-field rep-field--check">
                    <input
                      type="checkbox"
                      checked={generator.includeSignatures}
                      onChange={(e) => setGenerator((g) => ({ ...g, includeSignatures: e.target.checked }))}
                    />
                    <span>{tr('generator.includeSignatures')}</span>
                  </label>
                </div>

                <div className="rep-generator__actions">
                  <button type="button" className="rep-btn rep-btn--gold" onClick={handlePreview}>
                    <Eye size={16} aria-hidden />
                    {tr('generator.preview')}
                  </button>
                  <button type="button" className="rep-btn rep-btn--ghost" onClick={handleExportPdf} disabled={!preview}>
                    <Download size={16} aria-hidden />
                    {tr('generator.exportPdf')}
                  </button>
                  <button type="button" className="rep-btn rep-btn--ghost" onClick={handlePrint} disabled={!preview}>
                    <Printer size={16} aria-hidden />
                    {tr('generator.print')}
                  </button>
                </div>
              </section>

              <section className="rep-preview-wrap" ref={previewRef}>
                <h3>{tr('preview.title')}</h3>
                {!preview ? (
                  <p className="rep-empty">{tr('preview.empty')}</p>
                ) : (
                  <ReportPreview payload={preview} labels={previewLabels} />
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
