/**
 * Stable Expenses — year → month navigation, monthly dashboard, ledger, deferred payments.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Calendar,
  CreditCard,
  Filter,
  FileText,
  ChevronDown,
  Plus,
  Printer,
  RotateCcw,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { dummyExpenses, dummyHorses } from '../../../../services/mock/dummyData';
import {
  stableDashboardChartAxisTick,
  stableDashboardChartTooltipContentStyle,
} from '../../../../utils/chartUiConfig';
import '../styles/Expenses.css';

const DEFAULT_YEARS = [2026, 2027, 2028];

function collectYearsFromExpenses(list) {
  const years = new Set();
  list.forEach((e) => {
    const d = parseExpenseDate(e.date);
    if (d) years.add(d.getFullYear());
  });
  return years;
}
const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const CATEGORIES = ['Feed', 'Veterinary', 'Equipment', 'Training', 'Transport', 'Utilities', 'Staff', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Card', 'Wire', 'Cheque'];
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Deferred'];

const CATEGORY_I18N = {
  Feed: 'feed',
  Veterinary: 'veterinary',
  Equipment: 'equipment',
  Training: 'training',
  Transport: 'transport',
  Utilities: 'utilities',
  Staff: 'staff',
  Other: 'other',
};

const PAYMENT_STATUS_I18N = {
  Paid: 'paid',
  Pending: 'pending',
  Deferred: 'deferred',
};

const PAYMENT_METHOD_I18N = {
  Cash: 'cash',
  Card: 'card',
  Wire: 'wire',
  Cheque: 'cheque',
};

let idCounter = 200;

function nextId() {
  idCounter += 1;
  return `exp-${idCounter}`;
}

function parseExpenseDate(iso) {
  if (!iso) return null;
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatBhd(amount, language) {
  const n = Number(amount) || 0;
  const locale = language?.startsWith('ar') ? 'ar-BH' : 'en-BH';
  const num = n.toLocaleString(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  return `BHD ${num}`;
}

function paymentTone(status) {
  if (status === 'Paid') return 'positive';
  if (status === 'Deferred') return 'warning';
  if (status === 'Pending') return 'info';
  return 'neutral';
}

function legacyHorseId(name) {
  return `legacy:${name}`;
}

function getExpenseHorseIds(expense, horses) {
  if (Array.isArray(expense.relatedHorseIds) && expense.relatedHorseIds.length) {
    return expense.relatedHorseIds;
  }
  if (expense.relatedHorse) {
    const match = horses.find((h) => h.name === expense.relatedHorse);
    return [match ? match.id : legacyHorseId(expense.relatedHorse)];
  }
  return [];
}

function getExpenseHorseNames(expense, horses) {
  return getExpenseHorseIds(expense, horses).map((id) => {
    const horse = horses.find((h) => h.id === id);
    if (horse) return horse.name;
    if (id.startsWith('legacy:')) return id.slice(7);
    return '';
  }).filter(Boolean);
}

function isInvoiceImage(row) {
  const mime = row.invoiceMime ?? row.mime;
  const name = row.invoiceName ?? row.name ?? '';
  if (mime?.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(name);
}

function InvoiceTableCell({ row, viewLabel }) {
  if (!row.invoiceUrl) return <span className="exp-invoice-cell__empty">—</span>;
  if (isInvoiceImage(row)) {
    return (
      <a
        href={row.invoiceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="exp-invoice-cell__thumb-link"
        title={row.invoiceName || viewLabel}
      >
        <img src={row.invoiceUrl} alt="" className="exp-thumb" />
      </a>
    );
  }
  return (
    <a
      href={row.invoiceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="exp-file-tag exp-invoice-cell__file"
      title={row.invoiceName || viewLabel}
    >
      <FileText size={14} aria-hidden />
      <span>{row.invoiceName || viewLabel}</span>
    </a>
  );
}

function useExpensesI18n() {
  const { t, i18n } = useTranslation();
  const te = useCallback((key, opts) => t(`pages.expenses.${key}`, opts), [t]);
  const tm = useCallback((key) => te(`months.${key}`), [te]);
  const translateCategory = useCallback(
    (cat) => (CATEGORY_I18N[cat] ? te(`categories.${CATEGORY_I18N[cat]}`) : cat),
    [te]
  );
  const translatePaymentStatus = useCallback(
    (s) => (PAYMENT_STATUS_I18N[s] ? te(`paymentStatus.${PAYMENT_STATUS_I18N[s]}`) : s),
    [te]
  );
  const translatePaymentMethod = useCallback(
    (m) => (PAYMENT_METHOD_I18N[m] ? te(`paymentMethods.${PAYMENT_METHOD_I18N[m]}`) : m),
    [te]
  );
  return {
    te,
    tm,
    language: i18n.language,
    translateCategory,
    translatePaymentStatus,
    translatePaymentMethod,
  };
}

const EMPTY_FORM = {
  category: 'Feed',
  amount: '',
  date: '',
  supplier: '',
  relatedHorseIds: [],
  paymentMethod: 'Wire',
  paymentStatus: 'Paid',
  description: '',
  dueDate: '',
};

export default function Expenses() {
  const { stableId } = useAuth();
  const { te, tm, language, translateCategory, translatePaymentStatus, translatePaymentMethod } = useExpensesI18n();
  const { t } = useTranslation();

  const [expenses, setExpenses] = useState(() =>
    dummyExpenses.map((e) => ({
      paymentStatus: 'Paid',
      ...e,
    }))
  );
  const [years, setYears] = useState(() => [...DEFAULT_YEARS]);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [invoiceDraft, setInvoiceDraft] = useState(null);
  const urlRefs = useRef([]);

  useEffect(() => () => {
    urlRefs.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const registerUrl = useCallback((url) => {
    urlRefs.current.push(url);
    return url;
  }, []);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [showYearAddMenu, setShowYearAddMenu] = useState(false);
  const yearAddMenuRef = useRef(null);

  const stableExpenses = useMemo(
    () => expenses.filter((e) => e.stableId === stableId),
    [expenses, stableId]
  );

  const stableHorses = useMemo(() => {
    const fromRegistry = dummyHorses.filter((h) => h.stableId === stableId);
    const byName = new Map(fromRegistry.map((h) => [h.name, h]));
    stableExpenses.forEach((e) => {
      getExpenseHorseNames(e, fromRegistry).forEach((name) => {
        if (!byName.has(name)) {
          const legacy = { id: legacyHorseId(name), name, legacy: true };
          byName.set(name, legacy);
        }
      });
    });
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [stableId, stableExpenses]);

  const displayYears = useMemo(() => {
    const merged = new Set([...years, ...collectYearsFromExpenses(stableExpenses)]);
    return [...merged].sort((a, b) => a - b);
  }, [years, stableExpenses]);

  const proposedNextYear = useMemo(
    () => (displayYears.length ? Math.max(...displayYears) : new Date().getFullYear()) + 1,
    [displayYears]
  );

  const proposedPreviousYear = useMemo(
    () => (displayYears.length ? Math.min(...displayYears) : new Date().getFullYear()) - 1,
    [displayYears]
  );

  useEffect(() => {
    if (!showYearAddMenu) return undefined;
    const onPointerDown = (ev) => {
      if (yearAddMenuRef.current && !yearAddMenuRef.current.contains(ev.target)) {
        setShowYearAddMenu(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [showYearAddMenu]);

  const yearTotals = useMemo(() => {
    const totals = Object.fromEntries(displayYears.map((y) => [y, 0]));
    stableExpenses.forEach((e) => {
      const d = parseExpenseDate(e.date);
      if (!d) return;
      const y = d.getFullYear();
      if (totals[y] !== undefined) totals[y] += Number(e.amount) || 0;
    });
    return totals;
  }, [stableExpenses, displayYears]);

  const monthTotalsForYear = useMemo(() => {
    const totals = MONTH_INDEXES.map(() => 0);
    stableExpenses.forEach((e) => {
      const d = parseExpenseDate(e.date);
      if (!d || d.getFullYear() !== selectedYear) return;
      totals[d.getMonth()] += Number(e.amount) || 0;
    });
    return totals;
  }, [stableExpenses, selectedYear]);

  const monthExpenses = useMemo(
    () =>
      stableExpenses.filter((e) => {
        const d = parseExpenseDate(e.date);
        return d && d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      }),
    [stableExpenses, selectedYear, selectedMonth]
  );

  const filteredMonthExpenses = useMemo(() => {
    const q = filterSearch.trim().toLowerCase();
    return monthExpenses.filter((e) => {
      if (filterCategory && e.category !== filterCategory) return false;
      if (filterStatus && e.paymentStatus !== filterStatus) return false;
      if (!q) return true;
      const horseText = getExpenseHorseNames(e, stableHorses).join(' ');
      return [e.supplier, horseText, e.category, e.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [monthExpenses, filterCategory, filterStatus, filterSearch, stableHorses]);

  const monthMetrics = useMemo(() => {
    let total = 0;
    let paid = 0;
    let deferred = 0;
    let pending = 0;
    const byCategory = {};
    monthExpenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      total += amt;
      if (e.paymentStatus === 'Paid') paid += amt;
      else if (e.paymentStatus === 'Deferred') deferred += amt;
      else if (e.paymentStatus === 'Pending') pending += amt;
      byCategory[e.category] = (byCategory[e.category] || 0) + amt;
    });
    const chartByCategory = Object.entries(byCategory).map(([category, value]) => ({
      category,
      name: translateCategory(category),
      value,
    }));
    return { total, paid, deferred, pending, count: monthExpenses.length, chartByCategory };
  }, [monthExpenses, translateCategory]);

  const deferredRows = useMemo(
    () =>
      monthExpenses.filter((e) => e.paymentStatus === 'Deferred'),
    [monthExpenses]
  );

  const handleYearSelect = (year) => {
    setSelectedYear(year);
  };

  const addYear = (direction) => {
    const year = direction === 'next' ? proposedNextYear : proposedPreviousYear;
    setShowYearAddMenu(false);
    if (displayYears.includes(year)) {
      setSelectedYear(year);
      setSelectedMonth(0);
      toast(te('toasts.yearExists', { year }));
      return;
    }
    setYears((prev) => [...prev, year].sort((a, b) => a - b));
    setSelectedYear(year);
    setSelectedMonth(0);
    toast.success(te('toasts.yearAdded', { year }));
  };

  const resetFilters = () => {
    setFilterCategory('');
    setFilterStatus('');
    setFilterSearch('');
  };

  const clearInvoiceDraft = useCallback(() => {
    setInvoiceDraft((prev) => {
      if (prev?.url && !urlRefs.current.includes(prev.url)) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
  }, []);

  const closeAddModal = useCallback(() => {
    clearInvoiceDraft();
    setShowAddModal(false);
    setForm(EMPTY_FORM);
  }, [clearInvoiceDraft]);

  const openAddModal = () => {
    const m = String(selectedMonth + 1).padStart(2, '0');
    setInvoiceDraft(null);
    setForm({
      ...EMPTY_FORM,
      date: `${selectedYear}-${m}-01`,
    });
    setShowAddModal(true);
  };

  const handleInvoiceFile = (file) => {
    if (!file) return;
    const allowed = file.type.startsWith('image/') || file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!allowed) {
      toast.error(te('toasts.invoiceType'));
      return;
    }
    setInvoiceDraft((prev) => {
      if (prev?.url && !urlRefs.current.includes(prev.url)) {
        URL.revokeObjectURL(prev.url);
      }
      return {
        url: registerUrl(URL.createObjectURL(file)),
        name: file.name,
        mime: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : ''),
      };
    });
  };

  const saveExpense = (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.date || !form.supplier.trim() || !amount || amount <= 0) {
      toast.error(te('toasts.validation'));
      return;
    }
    const d = parseExpenseDate(form.date);
    if (!d) {
      toast.error(te('toasts.validation'));
      return;
    }
    const relatedHorseIds = [...form.relatedHorseIds];
    const relatedHorses = relatedHorseIds
      .map((id) => stableHorses.find((h) => h.id === id)?.name)
      .filter(Boolean);
    const row = {
      id: nextId(),
      stableId,
      category: form.category,
      amount,
      date: form.date,
      supplier: form.supplier.trim(),
      relatedHorseIds,
      relatedHorses,
      relatedHorse: relatedHorses.length ? relatedHorses.join(', ') : null,
      paymentMethod: form.paymentMethod,
      paymentStatus: form.paymentStatus,
      description: form.description.trim() || '',
      dueDate: form.paymentStatus === 'Deferred' && form.dueDate ? form.dueDate : null,
      invoiceUrl: invoiceDraft?.url ?? null,
      invoiceName: invoiceDraft?.name ?? null,
      invoiceMime: invoiceDraft?.mime ?? null,
    };
    setExpenses((prev) => [...prev, row]);
    setSelectedYear(d.getFullYear());
    setSelectedMonth(d.getMonth());
    setInvoiceDraft(null);
    setShowAddModal(false);
    setForm(EMPTY_FORM);
    toast.success(te('toasts.added'));
  };

  const markPaid = (id) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, paymentStatus: 'Paid', dueDate: null } : e))
    );
    toast.success(te('toasts.markedPaid'));
  };

  const monthLabel = tm(MONTH_KEYS[selectedMonth]);

  return (
    <div className="exp-page">
      <header className="exp-page__header">
        <div>
          <h1 className="exp-page__title">{te('title')}</h1>
          <p className="exp-page__subtitle">
            <Trans i18nKey="pages.expenses.subtitle" values={{ id: stableId }} components={[<code key="c" />]} />
          </p>
        </div>
        <div className="exp-page__actions">
          <button type="button" className="exp-btn exp-btn--ghost" onClick={() => window.print()}>
            <Printer size={16} aria-hidden />
            {te('actions.print')}
          </button>
          <button type="button" className="exp-btn exp-btn--gold" onClick={openAddModal}>
            <Plus size={16} aria-hidden />
            {te('actions.addExpense')}
          </button>
        </div>
      </header>

      <div className="exp-years-row">
        <nav className="exp-years" aria-label={te('a11y.yearNav')}>
          {displayYears.map((year) => (
            <button
              key={year}
              type="button"
              className={`exp-years__btn${selectedYear === year ? ' is-active' : ''}`}
              onClick={() => handleYearSelect(year)}
              aria-pressed={selectedYear === year}
            >
              <span className="exp-years__label">{year}</span>
              <span className="exp-years__total">{formatBhd(yearTotals[year] ?? 0, language)}</span>
            </button>
          ))}
        </nav>
        <div className="exp-years-add-wrap" ref={yearAddMenuRef}>
          <button
            type="button"
            className={`exp-years__add exp-btn exp-btn--ghost${showYearAddMenu ? ' is-open' : ''}`}
            onClick={() => setShowYearAddMenu((open) => !open)}
            aria-expanded={showYearAddMenu}
            aria-haspopup="menu"
          >
            <Plus size={16} aria-hidden />
            {te('actions.addYear')}
            <ChevronDown size={14} aria-hidden className="exp-years__add-chevron" />
          </button>
          {showYearAddMenu ? (
            <div className="exp-years-add-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="exp-years-add-menu__item"
                onClick={() => addYear('next')}
              >
                <span className="exp-years-add-menu__label">{te('actions.addNextYear')}</span>
                <span className="exp-years-add-menu__year">{proposedNextYear}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="exp-years-add-menu__item"
                onClick={() => addYear('previous')}
              >
                <span className="exp-years-add-menu__label">{te('actions.addPreviousYear')}</span>
                <span className="exp-years-add-menu__year">{proposedPreviousYear}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="exp-months" aria-label={te('a11y.monthNav', { year: selectedYear })}>
        {MONTH_INDEXES.map((mi) => (
          <button
            key={mi}
            type="button"
            className={`exp-months__btn${selectedMonth === mi ? ' is-active' : ''}`}
            onClick={() => setSelectedMonth(mi)}
            aria-pressed={selectedMonth === mi}
          >
            <span className="exp-months__name">{tm(MONTH_KEYS[mi])}</span>
            <span className="exp-months__total">{formatBhd(monthTotalsForYear[mi], language)}</span>
          </button>
        ))}
      </nav>

      <section className="exp-block" aria-labelledby="exp-dash-title">
        <h2 id="exp-dash-title" className="exp-section-title">
          <Wallet size={18} aria-hidden />
          {te('dashboard.title', { month: monthLabel, year: selectedYear })}
        </h2>
        <div className="exp-stat-grid">
          <article className="exp-stat exp-stat--highlight">
            <span className="exp-stat__label">{te('dashboard.totalSpent')}</span>
            <strong className="exp-stat__value">{formatBhd(monthMetrics.total, language)}</strong>
          </article>
          <article className="exp-stat">
            <span className="exp-stat__label">{te('dashboard.transactions')}</span>
            <strong className="exp-stat__value">{monthMetrics.count}</strong>
          </article>
          <article className="exp-stat">
            <span className="exp-stat__label">{te('dashboard.paid')}</span>
            <strong className="exp-stat__value">{formatBhd(monthMetrics.paid, language)}</strong>
          </article>
          <article className="exp-stat">
            <span className="exp-stat__label">{te('dashboard.deferred')}</span>
            <strong className="exp-stat__value">{formatBhd(monthMetrics.deferred, language)}</strong>
          </article>
          <article className="exp-stat">
            <span className="exp-stat__label">{te('dashboard.pending')}</span>
            <strong className="exp-stat__value">{formatBhd(monthMetrics.pending, language)}</strong>
          </article>
        </div>

        {monthMetrics.chartByCategory.length > 0 ? (
          <div className="exp-chart-wrap">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthMetrics.chartByCategory} margin={{ top: 12, right: 16, left: 8, bottom: 52 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,36,71,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={stableDashboardChartAxisTick} interval={0} tickMargin={8} />
                <YAxis tick={stableDashboardChartAxisTick} width={56} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <Tooltip
                  contentStyle={stableDashboardChartTooltipContentStyle}
                  formatter={(v) => formatBhd(v, language)}
                />
                <Bar dataKey="value" fill="var(--color-gold-500)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        <div className="exp-payment-summary">
          <div className="exp-payment-pill exp-payment-pill--positive">
            <span>{te('dashboard.paid')}</span>
            <strong>{formatBhd(monthMetrics.paid, language)}</strong>
          </div>
          <div className="exp-payment-pill exp-payment-pill--warning">
            <span>{te('dashboard.deferred')}</span>
            <strong>{formatBhd(monthMetrics.deferred, language)}</strong>
          </div>
          <div className="exp-payment-pill exp-payment-pill--info">
            <span>{te('dashboard.pending')}</span>
            <strong>{formatBhd(monthMetrics.pending, language)}</strong>
          </div>
        </div>
      </section>

      <section className="exp-block" aria-labelledby="exp-table-title">
        <h2 id="exp-table-title" className="exp-section-title">
          <CreditCard size={18} aria-hidden />
          {te('table.title', { month: monthLabel, year: selectedYear })}
        </h2>

        <div className="exp-filters">
          <h3 className="exp-section-title" style={{ marginBottom: 0 }}>
            <Filter size={16} aria-hidden />
            {te('filters.title')}
          </h3>
          <div className="exp-filters__grid">
            <label className="exp-field">
              <span>{te('filters.search')}</span>
              <input
                type="search"
                value={filterSearch}
                onChange={(ev) => setFilterSearch(ev.target.value)}
                placeholder={te('filters.searchPlaceholder')}
              />
            </label>
            <label className="exp-field">
              <span>{t('tables.category')}</span>
              <select value={filterCategory} onChange={(ev) => setFilterCategory(ev.target.value)}>
                <option value="">{te('filters.allCategories')}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{translateCategory(c)}</option>
                ))}
              </select>
            </label>
            <label className="exp-field">
              <span>{te('columns.paymentStatus')}</span>
              <select value={filterStatus} onChange={(ev) => setFilterStatus(ev.target.value)}>
                <option value="">{te('filters.allStatuses')}</option>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{translatePaymentStatus(s)}</option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" className="exp-btn exp-btn--ghost exp-filters__reset" onClick={resetFilters}>
            <RotateCcw size={14} aria-hidden />
            {te('filters.reset')}
          </button>
        </div>

        <div className="exp-table-wrap exp-table-wrap--scroll">
          {filteredMonthExpenses.length === 0 ? (
            <p className="exp-empty">{te('table.empty', { month: monthLabel, year: selectedYear })}</p>
          ) : (
            <table className="exp-table exp-table--dense">
              <thead>
                <tr>
                  <th>{t('tables.date')}</th>
                  <th>{t('tables.category')}</th>
                  <th>{te('columns.description')}</th>
                  <th>{te('columns.invoice')}</th>
                  <th>{t('tables.supplier')}</th>
                  <th>{t('tables.relatedHorse')}</th>
                  <th>{t('tables.amount')}</th>
                  <th>{t('tables.payment')}</th>
                  <th>{te('columns.paymentStatus')}</th>
                  <th>{te('columns.dueDate')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonthExpenses.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td><span className="exp-badge exp-badge--category">{translateCategory(row.category)}</span></td>
                    <td>{row.description || '—'}</td>
                    <td>
                      <InvoiceTableCell row={row} viewLabel={te('invoice.view')} />
                    </td>
                    <td>{row.supplier}</td>
                    <td>
                      {getExpenseHorseNames(row, stableHorses).length ? (
                        <div className="exp-horse-tags">
                          {getExpenseHorseNames(row, stableHorses).map((name) => (
                            <span key={name} className="exp-badge exp-badge--category">{name}</span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td><strong>{formatBhd(row.amount, language)}</strong></td>
                    <td>{translatePaymentMethod(row.paymentMethod)}</td>
                    <td>
                      <span className={`exp-badge exp-badge--${paymentTone(row.paymentStatus)}`}>
                        {translatePaymentStatus(row.paymentStatus)}
                      </span>
                    </td>
                    <td>{row.dueDate || '—'}</td>
                    <td>
                      <div className="exp-row-actions">
                        {row.paymentStatus === 'Deferred' ? (
                          <button type="button" className="exp-btn exp-btn--ghost exp-btn--sm" onClick={() => markPaid(row.id)}>
                            {te('actions.markPaid')}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="exp-block" aria-labelledby="exp-deferred-title">
        <h2 id="exp-deferred-title" className="exp-section-title">
          <Calendar size={18} aria-hidden />
          {te('deferred.title', { month: monthLabel, year: selectedYear })}
        </h2>
        {deferredRows.length === 0 ? (
          <p className="exp-empty">{te('deferred.empty')}</p>
        ) : (
          <div className="exp-detail-cards">
            {deferredRows.map((row) => (
              <article key={row.id} className="exp-detail-card">
                <h4>{row.supplier}</h4>
                <dl>
                  <div>
                    <dt>{t('tables.category')}</dt>
                    <dd>{translateCategory(row.category)}</dd>
                  </div>
                  <div>
                    <dt>{t('tables.amount')}</dt>
                    <dd>{formatBhd(row.amount, language)}</dd>
                  </div>
                  <div>
                    <dt>{te('columns.dueDate')}</dt>
                    <dd>{row.dueDate || '—'}</dd>
                  </div>
                  <div>
                    <dt>{t('tables.date')}</dt>
                    <dd>{row.date}</dd>
                  </div>
                </dl>
                <button type="button" className="exp-btn exp-btn--ghost exp-btn--sm" style={{ marginTop: '0.5rem' }} onClick={() => markPaid(row.id)}>
                  {te('actions.markPaid')}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {showAddModal ? (
        <div className="exp-modal-backdrop" role="presentation" onClick={closeAddModal}>
          <div className="exp-modal exp-modal--wide" role="dialog" aria-modal="true" aria-labelledby="exp-add-title" onClick={(ev) => ev.stopPropagation()}>
            <header className="exp-modal__head">
              <h2 id="exp-add-title">{te('modal.addTitle', { month: monthLabel, year: selectedYear })}</h2>
              <button type="button" className="exp-modal__close" onClick={closeAddModal} aria-label={te('actions.close')}>
                <X size={20} />
              </button>
            </header>
            <form onSubmit={saveExpense}>
              <div className="exp-modal__body">
                <div className="exp-form-section">
                  <h3>{te('modal.details')}</h3>
                  <div className="exp-form-grid">
                    <label className="exp-field">
                      <span>{t('tables.date')}</span>
                      <input type="date" required value={form.date} onChange={(ev) => setForm((f) => ({ ...f, date: ev.target.value }))} />
                    </label>
                    <label className="exp-field">
                      <span>{t('tables.category')}</span>
                      <select value={form.category} onChange={(ev) => setForm((f) => ({ ...f, category: ev.target.value }))}>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{translateCategory(c)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="exp-field">
                      <span>{t('tables.amount')} (BHD)</span>
                      <input type="number" min="0.001" step="0.001" required value={form.amount} onChange={(ev) => setForm((f) => ({ ...f, amount: ev.target.value }))} />
                    </label>
                    <label className="exp-field">
                      <span>{t('tables.supplier')}</span>
                      <input required value={form.supplier} onChange={(ev) => setForm((f) => ({ ...f, supplier: ev.target.value }))} />
                    </label>
                    <div className="exp-field exp-field--full exp-horse-checkboxes">
                      <span>{te('fields.relatedHorses')}</span>
                      <p className="exp-horse-checkboxes__hint">{te('fields.relatedHorsesHint')}</p>
                      {stableHorses.length === 0 ? (
                        <p className="exp-empty exp-empty--inline">{te('fields.noHorses')}</p>
                      ) : (
                        <div className="exp-horse-checkboxes__grid" role="group" aria-label={te('fields.relatedHorses')}>
                          {stableHorses.map((horse) => (
                            <label key={horse.id} className="exp-horse-checkboxes__item">
                              <input
                                type="checkbox"
                                checked={form.relatedHorseIds.includes(horse.id)}
                                onChange={(ev) => {
                                  const { checked } = ev.target;
                                  setForm((f) => ({
                                    ...f,
                                    relatedHorseIds: checked
                                      ? [...f.relatedHorseIds, horse.id]
                                      : f.relatedHorseIds.filter((id) => id !== horse.id),
                                  }));
                                }}
                              />
                              <span>{horse.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <label className="exp-field">
                      <span>{t('tables.payment')}</span>
                      <select value={form.paymentMethod} onChange={(ev) => setForm((f) => ({ ...f, paymentMethod: ev.target.value }))}>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>{translatePaymentMethod(m)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="exp-field">
                      <span>{te('columns.paymentStatus')}</span>
                      <select value={form.paymentStatus} onChange={(ev) => setForm((f) => ({ ...f, paymentStatus: ev.target.value }))}>
                        {PAYMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>{translatePaymentStatus(s)}</option>
                        ))}
                      </select>
                    </label>
                    {form.paymentStatus === 'Deferred' ? (
                      <label className="exp-field">
                        <span>{te('columns.dueDate')}</span>
                        <input type="date" value={form.dueDate} onChange={(ev) => setForm((f) => ({ ...f, dueDate: ev.target.value }))} />
                      </label>
                    ) : null}
                    <label className="exp-field exp-field--full">
                      <span>{te('columns.description')}</span>
                      <textarea rows={2} value={form.description} onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))} />
                    </label>
                  </div>
                </div>
                <div className="exp-form-section">
                  <h3>{te('invoice.uploadTitle')}</h3>
                  <div className="exp-invoice-upload">
                    <label className="exp-invoice-upload__picker">
                      <Upload size={22} aria-hidden />
                      <span>{te('invoice.upload')}</span>
                      <span className="exp-invoice-upload__hint">{te('invoice.uploadHint')}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        className="exp-invoice-upload__input"
                        onChange={(ev) => {
                          const f = ev.target.files?.[0];
                          if (f) handleInvoiceFile(f);
                          ev.target.value = '';
                        }}
                      />
                    </label>
                    {invoiceDraft ? (
                      <div className="exp-invoice-upload__preview">
                        {isInvoiceImage(invoiceDraft) ? (
                          <img src={invoiceDraft.url} alt="" className="exp-upload-preview" />
                        ) : (
                          <div className="exp-invoice-upload__pdf">
                            <FileText size={28} aria-hidden />
                            <span>{invoiceDraft.name}</span>
                          </div>
                        )}
                        <p className="exp-file-name">{invoiceDraft.name}</p>
                        <button type="button" className="exp-btn exp-btn--ghost exp-btn--sm" onClick={clearInvoiceDraft}>
                          {te('invoice.remove')}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <footer className="exp-modal__foot">
                <button type="button" className="exp-btn exp-btn--ghost" onClick={closeAddModal}>
                  {te('actions.cancel')}
                </button>
                <button type="submit" className="exp-btn exp-btn--gold">
                  {te('actions.saveExpense')}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
