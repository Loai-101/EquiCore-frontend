import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  FileDown,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { dummyRejectedStablesList } from '../../../../services/mock/dummyData';
import { isRtlLanguage } from '../../../../utils/i18nHelpers';
import '../styles/RejectedStables.css';

const ALL = '__ALL__';

function cloneRows() {
  return JSON.parse(JSON.stringify(dummyRejectedStablesList));
}

function nowStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function RejectedStables() {
  const { t } = useTranslation();
  const rtl = isRtlLanguage();

  const [rows, setRows] = useState(cloneRows);
  const [searchStable, setSearchStable] = useState('');
  const [searchOwner, setSearchOwner] = useState('');
  const [fCountry, setFCountry] = useState(ALL);
  const [fType, setFType] = useState(ALL);
  const [fReason, setFReason] = useState(ALL);
  const [fDateFrom, setFDateFrom] = useState('');
  const [fDateTo, setFDateTo] = useState('');

  const [detailRow, setDetailRow] = useState(null);
  const [reopenRow, setReopenRow] = useState(null);

  const patchRow = useCallback((requestId, patch) => {
    setRows((prev) => prev.map((r) => (r.requestId === requestId ? { ...r, ...patch } : r)));
  }, []);

  const appendTimeline = useCallback((requestId, entry) => {
    setRows((prev) =>
      prev.map((r) =>
        r.requestId === requestId
          ? {
              ...r,
              activityTimeline: [{ id: `tl-${Date.now()}`, ...entry }, ...(r.activityTimeline || [])],
            }
          : r
      )
    );
  }, []);

  const countries = useMemo(() => [ALL, ...new Set(rows.map((r) => r.country))].sort(), [rows]);
  const types = useMemo(() => [ALL, ...new Set(rows.map((r) => r.stableType))].sort(), [rows]);
  const reasons = useMemo(() => [ALL, ...new Set(rows.map((r) => r.rejectionReason))].sort(), [rows]);

  const filtered = useMemo(() => {
    const qs = searchStable.trim().toLowerCase();
    const qo = searchOwner.trim().toLowerCase();
    return rows.filter((r) => {
      if (qs && !r.stableName.toLowerCase().includes(qs)) return false;
      if (qo && !r.ownerName.toLowerCase().includes(qo)) return false;
      if (fCountry !== ALL && r.country !== fCountry) return false;
      if (fType !== ALL && r.stableType !== fType) return false;
      if (fReason !== ALL && r.rejectionReason !== fReason) return false;
      if (fDateFrom && r.rejectedDate < fDateFrom) return false;
      if (fDateTo && r.rejectedDate > fDateTo) return false;
      return true;
    });
  }, [rows, searchStable, searchOwner, fCountry, fType, fReason, fDateFrom, fDateTo]);

  const ym = currentYearMonth();

  const summary = useMemo(() => {
    return {
      total: filtered.length,
      thisMonth: filtered.filter((r) => r.rejectedDate && r.rejectedDate.startsWith(ym)).length,
      missingDocs: filtered.filter((r) => r.rejectionCategory === 'missingDocuments').length,
      invalidInfo: filtered.filter((r) => r.rejectionCategory === 'invalidInformation').length,
      duplicate: filtered.filter((r) => r.rejectionCategory === 'duplicate').length,
    };
  }, [filtered, ym]);

  const resetFilters = () => {
    setSearchStable('');
    setSearchOwner('');
    setFCountry(ALL);
    setFType(ALL);
    setFReason(ALL);
    setFDateFrom('');
    setFDateTo('');
  };

  const confirmReopen = () => {
    if (!reopenRow) return;
    patchRow(reopenRow.requestId, { status: 'Pending Review' });
    appendTimeline(reopenRow.requestId, {
      dateTime: nowStr(),
      actionKey: 'reopened',
      performedBy: t('pages.rejectedStables.labels.superAdmin'),
      status: 'Pending',
    });
    toast.success(t('pages.rejectedStables.toasts.reopened'));
    setReopenRow(null);
    setDetailRow((d) => (d?.requestId === reopenRow.requestId ? { ...d, status: 'Pending Review' } : d));
  };

  const trTimeline = (key) => t(`pages.rejectedStables.timeline.${key}`);
  const trDoc = (s) => t(`pages.rejectedStables.documentStatus.${String(s).replace(/\s+/g, '')}`);
  const trStatus = (s) => t(`pages.rejectedStables.rowStatus.${String(s).replace(/\s+/g, '')}`);

  return (
    <div className="rs-page" dir={rtl ? 'rtl' : 'ltr'}>
      <header className="rs-page__header">
        <h1 className="rs-page__title">{t('pages.rejectedStables.title')}</h1>
        <p className="rs-page__subtitle">{t('pages.rejectedStables.subtitle')}</p>
      </header>

      <section className="rs-summary">
        {[
          ['total', summary.total],
          ['thisMonth', summary.thisMonth],
          ['missingDocs', summary.missingDocs],
          ['invalidInfo', summary.invalidInfo],
          ['duplicate', summary.duplicate],
        ].map(([key, val]) => (
          <div key={key} className="rs-kpi">
            <div className="rs-kpi__label">{t(`pages.rejectedStables.summary.${key}`)}</div>
            <div className="rs-kpi__value">{val}</div>
          </div>
        ))}
      </section>

      <section className="rs-filters">
        <div className="rs-filters__grid">
          <div className="rs-field">
            <label className="rs-field__label" htmlFor="rs-sname">
              {t('pages.rejectedStables.filters.stableName')}
            </label>
            <div className="rs-search">
              <Search size={17} aria-hidden />
              <input
                id="rs-sname"
                className="rs-input"
                value={searchStable}
                onChange={(e) => setSearchStable(e.target.value)}
                placeholder={t('pages.rejectedStables.filters.stablePlaceholder')}
              />
            </div>
          </div>
          <div className="rs-field">
            <label className="rs-field__label" htmlFor="rs-oname">
              {t('pages.rejectedStables.filters.ownerName')}
            </label>
            <input
              id="rs-oname"
              className="rs-input"
              value={searchOwner}
              onChange={(e) => setSearchOwner(e.target.value)}
              placeholder={t('pages.rejectedStables.filters.ownerPlaceholder')}
            />
          </div>
          <div className="rs-field">
            <span className="rs-field__label">{t('pages.rejectedStables.filters.country')}</span>
            <select className="rs-select" value={fCountry} onChange={(e) => setFCountry(e.target.value)}>
              <option value={ALL}>{t('pages.rejectedStables.filters.all')}</option>
              {countries.filter((c) => c !== ALL).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="rs-field">
            <span className="rs-field__label">{t('pages.rejectedStables.filters.stableType')}</span>
            <select className="rs-select" value={fType} onChange={(e) => setFType(e.target.value)}>
              <option value={ALL}>{t('pages.rejectedStables.filters.all')}</option>
              {types.filter((x) => x !== ALL).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
          <div className="rs-field">
            <span className="rs-field__label">{t('pages.rejectedStables.filters.rejectionReason')}</span>
            <select className="rs-select" value={fReason} onChange={(e) => setFReason(e.target.value)}>
              <option value={ALL}>{t('pages.rejectedStables.filters.all')}</option>
              {reasons.filter((x) => x !== ALL).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
          <div className="rs-field">
            <span className="rs-field__label">{t('pages.rejectedStables.filters.rejectedFrom')}</span>
            <input className="rs-input" type="date" value={fDateFrom} onChange={(e) => setFDateFrom(e.target.value)} />
          </div>
          <div className="rs-field">
            <span className="rs-field__label">{t('pages.rejectedStables.filters.rejectedTo')}</span>
            <input className="rs-input" type="date" value={fDateTo} onChange={(e) => setFDateTo(e.target.value)} />
          </div>
          <div className="rs-field">
            <span className="rs-field__label" style={{ visibility: 'hidden' }}>
              .
            </span>
            <button type="button" className="rs-btn rs-btn--ghost" onClick={resetFilters}>
              <RefreshCw size={16} aria-hidden />
              {t('pages.rejectedStables.filters.reset')}
            </button>
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rs-empty">
          <AlertCircle size={22} aria-hidden />
          <p>{t('pages.rejectedStables.empty')}</p>
        </div>
      ) : (
        <div className="rs-table-wrap">
          <table className="rs-table">
            <thead>
              <tr>
                {[
                  'requestId',
                  'stableName',
                  'ownerName',
                  'email',
                  'phone',
                  'countryCity',
                  'stableType',
                  'horses',
                  'riders',
                  'rejectionReason',
                  'rejectedBy',
                  'rejectedDate',
                  'status',
                  'actions',
                ].map((c) => (
                  <th key={c}>{t(`pages.rejectedStables.table.${c}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.requestId}>
                  <td>{r.requestId}</td>
                  <td>
                    <strong>{r.stableName}</strong>
                  </td>
                  <td>{r.ownerName}</td>
                  <td>{r.ownerEmail}</td>
                  <td>{r.ownerPhone}</td>
                  <td>
                    {r.country} / {r.city}
                  </td>
                  <td>{r.stableType}</td>
                  <td>{r.numberOfHorses}</td>
                  <td>{r.numberOfRiders}</td>
                  <td className="rs-cell-reason">{r.rejectionReason}</td>
                  <td>{r.rejectedBy}</td>
                  <td>{r.rejectedDate}</td>
                  <td>
                    <span className={r.status === 'Rejected' ? 'rs-badge rs-badge--rejected' : 'rs-badge rs-badge--pending'}>
                      {trStatus(r.status)}
                    </span>
                  </td>
                  <td className="rs-table__actions">
                    <button type="button" className="rs-btn rs-btn--ghost rs-btn--sm" onClick={() => setDetailRow(r)}>
                      {t('pages.rejectedStables.actions.viewDetails')}
                    </button>
                    <button
                      type="button"
                      className="rs-btn rs-btn--gold rs-btn--sm"
                      disabled={r.status !== 'Rejected'}
                      onClick={() => setReopenRow(r)}
                    >
                      <RotateCcw size={14} aria-hidden />
                      {t('pages.rejectedStables.actions.reopen')}
                    </button>
                    <button
                      type="button"
                      className="rs-btn rs-btn--ghost rs-btn--sm"
                      onClick={() => toast(t('pages.rejectedStables.toasts.delete'))}
                    >
                      <Trash2 size={14} aria-hidden />
                      {t('pages.rejectedStables.actions.delete')}
                    </button>
                    <button
                      type="button"
                      className="rs-btn rs-btn--ghost rs-btn--sm"
                      onClick={() => toast(t('pages.rejectedStables.toasts.export'))}
                    >
                      <FileDown size={14} aria-hidden />
                      {t('pages.rejectedStables.actions.export')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailRow ? (
        <div className="rs-modal-overlay" role="dialog" aria-modal="true">
          <div className="rs-modal rs-modal--wide">
            <div className="rs-modal__head">
              <h2 className="rs-modal__title">{detailRow.stableName}</h2>
              <button type="button" className="rs-icon-btn" onClick={() => setDetailRow(null)} aria-label={t('pages.rejectedStables.actions.close')}>
                <X size={20} />
              </button>
            </div>
            <div className="rs-modal__body">
              <section className="rs-panel">
                <h3 className="rs-panel__title">{t('pages.rejectedStables.detail.stableInfo')}</h3>
                <div className="rs-info-grid">
                  <div className="rs-info">
                    <span>{t('pages.rejectedStables.detail.stableId')}</span>
                    <strong>{detailRow.stableId}</strong>
                  </div>
                  <div className="rs-info">
                    <span>{t('pages.rejectedStables.detail.stableName')}</span>
                    <strong>{detailRow.stableName}</strong>
                  </div>
                  <div className="rs-info">
                    <span>{t('pages.rejectedStables.detail.stableType')}</span>
                    <strong>{detailRow.stableType}</strong>
                  </div>
                  <div className="rs-info">
                    <span>{t('pages.rejectedStables.detail.country')}</span>
                    <strong>{detailRow.country}</strong>
                  </div>
                  <div className="rs-info">
                    <span>{t('pages.rejectedStables.detail.city')}</span>
                    <strong>{detailRow.city}</strong>
                  </div>
                </div>
              </section>
              <section className="rs-panel">
                <h3 className="rs-panel__title">{t('pages.rejectedStables.detail.ownerInfo')}</h3>
                <div className="rs-info-grid">
                  <div className="rs-info">
                    <span>{t('pages.rejectedStables.detail.ownerName')}</span>
                    <strong>{detailRow.ownerName}</strong>
                  </div>
                  <div className="rs-info">
                    <span>{t('pages.rejectedStables.detail.email')}</span>
                    <strong>{detailRow.ownerEmail}</strong>
                  </div>
                  <div className="rs-info">
                    <span>{t('pages.rejectedStables.detail.phone')}</span>
                    <strong>{detailRow.ownerPhone}</strong>
                  </div>
                </div>
              </section>
              <section className="rs-panel">
                <h3 className="rs-panel__title">{t('pages.rejectedStables.detail.datesAndReason')}</h3>
                <div className="rs-info-grid">
                  <div className="rs-info">
                    <span>{t('pages.rejectedStables.detail.submittedDate')}</span>
                    <strong>{detailRow.submittedDate}</strong>
                  </div>
                  <div className="rs-info">
                    <span>{t('pages.rejectedStables.detail.rejectedDate')}</span>
                    <strong>{detailRow.rejectedDate}</strong>
                  </div>
                  <div className="rs-info rs-info--full">
                    <span>{t('pages.rejectedStables.detail.rejectionReason')}</span>
                    <strong>{detailRow.rejectionReason}</strong>
                  </div>
                  <div className="rs-info rs-info--full">
                    <span>{t('pages.rejectedStables.detail.adminNotes')}</span>
                    <strong>{detailRow.adminNotes}</strong>
                  </div>
                  <div className="rs-info">
                    <span>{t('pages.rejectedStables.detail.documentStatus')}</span>
                    <strong>{trDoc(detailRow.documentStatus)}</strong>
                  </div>
                  <div className="rs-info">
                    <span>{t('pages.rejectedStables.detail.status')}</span>
                    <strong>{trStatus(detailRow.status)}</strong>
                  </div>
                </div>
              </section>
              <section className="rs-panel">
                <h3 className="rs-panel__title">{t('pages.rejectedStables.detail.timeline')}</h3>
                <ul className="rs-timeline">
                  {[...(detailRow.activityTimeline || [])]
                    .sort((a, b) => (a.dateTime < b.dateTime ? 1 : -1))
                    .map((item) => (
                      <li key={item.id} className="rs-timeline__item">
                        <div className="rs-timeline__time">{item.dateTime}</div>
                        <div className="rs-timeline__action">{trTimeline(item.actionKey)}</div>
                        <div className="rs-timeline__meta">
                          {item.performedBy} · {item.status}
                        </div>
                      </li>
                    ))}
                </ul>
              </section>
            </div>
            <div className="rs-modal__foot">
              <button type="button" className="rs-btn rs-btn--primary" onClick={() => setDetailRow(null)}>
                {t('pages.rejectedStables.actions.close')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reopenRow ? (
        <div className="rs-modal-overlay" role="dialog" aria-modal="true">
          <div className="rs-modal">
            <div className="rs-modal__head">
              <h2 className="rs-modal__title">{t('pages.rejectedStables.reopenModal.title')}</h2>
              <button type="button" className="rs-icon-btn" onClick={() => setReopenRow(null)} aria-label={t('pages.rejectedStables.actions.close')}>
                <X size={20} />
              </button>
            </div>
            <div className="rs-modal__body">
              <p>{t('pages.rejectedStables.reopenModal.body', { name: reopenRow.stableName })}</p>
            </div>
            <div className="rs-modal__foot">
              <button type="button" className="rs-btn rs-btn--ghost" onClick={() => setReopenRow(null)}>
                {t('pages.rejectedStables.actions.cancel')}
              </button>
              <button type="button" className="rs-btn rs-btn--gold" onClick={confirmReopen}>
                <RotateCcw size={16} aria-hidden />
                {t('pages.rejectedStables.reopenModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
