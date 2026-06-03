import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CreditCard,
  FileDown,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldOff,
  X,
} from 'lucide-react';
import {
  dummySuperAdminSubscriptionsFull,
  SUBSCRIPTION_STABLE_TYPES_ALL,
  SUBSCRIPTION_COUNTRIES_ALL,
  DUMMY_STABLE_DIRECTORY,
} from '../../../../services/mock/dummyData';
import { isRtlLanguage } from '../../../../utils/i18nHelpers';
import '../styles/Subscriptions.css';

const ALL = '__ALL__';

const PLAN_OPTIONS = ['3 Months', '6 Months', 'Yearly'];
const PAY_STATUSES = ['Paid', 'Unpaid', 'Partially Paid', 'Overdue', 'Pending Confirmation'];
const SUB_STATUSES = ['Active', 'Expired', 'Suspended', 'Cancelled', 'Trial'];
const PAY_METHODS = ['Cash', 'BenefitPay', 'Card', 'Bank Transfer', 'Cheque', 'Other'];

const CUSTOM_STABLE = '__custom__';

function parseList(s) {
  return String(s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function joinList(arr) {
  return [...new Set((arr || []).filter(Boolean))].join(', ');
}

function slugKey(s) {
  return String(s).replace(/\s+/g, '');
}

function resolveStableName(form) {
  if (!form) return '';
  if (form.stableId && form.stableName) return String(form.stableName).trim();
  if (form.stableNameSelect === CUSTOM_STABLE) return (form.stableNameCustom || '').trim();
  return (form.stableNameSelect || form.stableName || '').trim();
}

function generateSubscriptionInvoicePdf(form, t, resolvedStableName, stableTypeLabel, countryLabel) {
  const doc = new jsPDF();
  doc.setFontSize(15);
  doc.text(t('pages.subscriptions.invoicePdf.title'), 14, 16);
  doc.setFontSize(10);
  let y = 26;
  const addLine = (label, value) => {
    const text = `${label}: ${String(value ?? '—')}`;
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 2;
    if (y > 270) {
      doc.addPage();
      y = 16;
    }
  };
  addLine(t('pages.subscriptions.invoicePdf.subscriptionId'), form.subscriptionId);
  addLine(t('pages.subscriptions.invoicePdf.stable'), resolvedStableName);
  addLine(t('pages.subscriptions.invoicePdf.owner'), form.ownerName || '—');
  addLine(t('pages.subscriptions.invoicePdf.country'), countryLabel);
  addLine(t('pages.subscriptions.invoicePdf.stableType'), stableTypeLabel);
  addLine(t('pages.subscriptions.invoicePdf.plan'), t(`pages.subscriptions.planDuration.${slugKey(form.planDuration)}`, { defaultValue: form.planDuration }));
  addLine(t('pages.subscriptions.invoicePdf.period'), `${form.startDate} → ${form.endDate}`);
  addLine(t('pages.subscriptions.invoicePdf.renewal'), form.renewalDate);
  addLine(t('pages.subscriptions.invoicePdf.amount'), String(form.subscriptionAmount ?? ''));
  addLine(t('pages.subscriptions.invoicePdf.paid'), String(form.paidAmount ?? ''));
  addLine(t('pages.subscriptions.invoicePdf.remaining'), String(calcRemaining(form.subscriptionAmount, form.paidAmount)));
  addLine(t('pages.subscriptions.invoicePdf.payStatus'), t(`pages.subscriptions.paymentStatus.${slugKey(form.paymentStatus)}`, { defaultValue: form.paymentStatus }));
  addLine(t('pages.subscriptions.invoicePdf.subStatus'), t(`pages.subscriptions.subscriptionStatus.${slugKey(form.subscriptionStatus)}`, { defaultValue: form.subscriptionStatus }));
  addLine(t('pages.subscriptions.invoicePdf.reference'), form.paymentReference || '—');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(t('pages.subscriptions.invoicePdf.footer'), 14, 288);
  doc.setTextColor(0, 0, 0);
  const fname = `invoice-${form.subscriptionId}.pdf`;
  doc.save(fname);
  return fname;
}

function cloneRows() {
  return JSON.parse(JSON.stringify(dummySuperAdminSubscriptionsFull));
}

function calcRemaining(subscriptionAmount, paidAmount) {
  const s = Number(subscriptionAmount) || 0;
  const p = Number(paidAmount) || 0;
  return Math.max(0, s - p);
}

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function todayDate() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function planDurationMonths(plan) {
  if (plan === 'Yearly') return 12;
  if (plan === '6 Months') return 6;
  return 3;
}

function addMonthsIso(iso, months) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1 + months, d);
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

function isoAddDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

function endDateForPlan(startIso, plan) {
  return isoAddDays(addMonthsIso(startIso, planDurationMonths(plan)), -1);
}

function suggestPaymentStatus(sa, pa) {
  const s = Number(sa) || 0;
  const p = Number(pa) || 0;
  const rem = calcRemaining(s, p);
  if (rem === 0 && p > 0) return 'Paid';
  if (p > 0 && rem > 0) return 'Partially Paid';
  return 'Unpaid';
}

function snapshotFromRow(r) {
  return {
    subscriptionId: r.subscriptionId,
    planDuration: r.planDuration,
    startDate: r.startDate,
    endDate: r.endDate,
    renewalDate: r.renewalDate,
    subscriptionStatus: r.subscriptionStatus,
    paymentStatus: r.paymentStatus,
    subscriptionAmount: r.subscriptionAmount,
    paidAmount: r.paidAmount,
    remainingAmount: r.remainingAmount,
    lastPaymentDate: r.lastPaymentDate || '',
  };
}

export default function Subscriptions() {
  const { t } = useTranslation();
  const rtl = isRtlLanguage();
  const ym = currentYearMonth();

  const [rows, setRows] = useState(cloneRows);
  const [searchStable, setSearchStable] = useState('');
  const [searchOwner, setSearchOwner] = useState('');
  const [fPlan, setFPlan] = useState(ALL);
  const [fSub, setFSub] = useState(ALL);
  const [fPay, setFPay] = useState(ALL);
  const [fMethod, setFMethod] = useState(ALL);
  const [fCountry, setFCountry] = useState(ALL);
  const [fRenewFrom, setFRenewFrom] = useState('');
  const [fRenewTo, setFRenewTo] = useState('');

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [paymentRow, setPaymentRow] = useState(null);
  const [paymentForm, setPaymentForm] = useState(null);
  const [renewRow, setRenewRow] = useState(null);
  const [renewForm, setRenewForm] = useState(null);
  const [suspendRow, setSuspendRow] = useState(null);
  const [suspendForm, setSuspendForm] = useState({ reason: '', notes: '' });
  const [markPaidRow, setMarkPaidRow] = useState(null);
  const [markPaidForm, setMarkPaidForm] = useState(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!menuOpenId) return;
      if (e.target.closest('.su-menu-wrap')) return;
      setMenuOpenId(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpenId]);

  const patchRow = useCallback((subscriptionId, patch) => {
    setRows((prev) => prev.map((r) => (r.subscriptionId === subscriptionId ? { ...r, ...patch } : r)));
  }, []);

  const appendHistory = useCallback((subscriptionId, entry) => {
    setRows((prev) =>
      prev.map((r) =>
        r.subscriptionId === subscriptionId
          ? { ...r, paymentHistory: [{ ...entry, paymentId: entry.paymentId || `PAY-${Date.now()}` }, ...(r.paymentHistory || [])] }
          : r
      )
    );
  }, []);

  const countries = useMemo(() => {
    const fromRows = rows.flatMap((r) => parseList(r.country));
    const merged = [...new Set([...SUBSCRIPTION_COUNTRIES_ALL, ...fromRows])].sort((a, b) => a.localeCompare(b));
    return [ALL, ...merged];
  }, [rows]);

  const filtered = useMemo(() => {
    const qs = searchStable.trim().toLowerCase();
    const qo = searchOwner.trim().toLowerCase();
    return rows.filter((r) => {
      if (qs && !r.stableName.toLowerCase().includes(qs)) return false;
      if (qo && !r.ownerName.toLowerCase().includes(qo)) return false;
      if (fPlan !== ALL && r.planDuration !== fPlan) return false;
      if (fSub !== ALL && r.subscriptionStatus !== fSub) return false;
      if (fPay !== ALL && r.paymentStatus !== fPay) return false;
      if (fMethod !== ALL && r.paymentMethod !== fMethod) return false;
      if (fCountry !== ALL) {
        const rowCountries = parseList(r.country);
        if (!rowCountries.includes(fCountry) && r.country !== fCountry) return false;
      }
      if (fRenewFrom && r.renewalDate < fRenewFrom) return false;
      if (fRenewTo && r.renewalDate > fRenewTo) return false;
      return true;
    });
  }, [rows, searchStable, searchOwner, fPlan, fSub, fPay, fMethod, fCountry, fRenewFrom, fRenewTo]);

  const paidThisMonthSum = useCallback(
    (list) =>
      list.reduce((sum, r) => {
        (r.paymentHistory || []).forEach((h) => {
          if (h.date && h.date.startsWith(ym) && Number(h.amount) > 0) sum += Number(h.amount);
        });
        return sum;
      }, 0),
    [ym]
  );

  const summary = useMemo(() => {
    const paidMonth = paidThisMonthSum(filtered);
    const outstanding = filtered.reduce((s, r) => s + (Number(r.remainingAmount) || 0), 0);
    const expected = filtered.reduce((s, r) => s + (Number(r.subscriptionAmount) || 0), 0);
    return {
      total: filtered.length,
      active: filtered.filter((r) => r.subscriptionStatus === 'Active').length,
      expired: filtered.filter((r) => r.subscriptionStatus === 'Expired').length,
      overdue: filtered.filter((r) => r.paymentStatus === 'Overdue').length,
      paidThisMonth: paidMonth,
      outstanding,
      expected,
      yearly: filtered.filter((r) => r.planDuration === 'Yearly').length,
      six: filtered.filter((r) => r.planDuration === '6 Months').length,
      three: filtered.filter((r) => r.planDuration === '3 Months').length,
    };
  }, [filtered, paidThisMonthSum]);

  const resetFilters = () => {
    setSearchStable('');
    setSearchOwner('');
    setFPlan(ALL);
    setFSub(ALL);
    setFPay(ALL);
    setFMethod(ALL);
    setFCountry(ALL);
    setFRenewFrom('');
    setFRenewTo('');
  };

  const closeMenu = () => setMenuOpenId(null);

  const openEdit = (r, isAdd) => {
    closeMenu();
    setEditMode(isAdd ? 'add' : 'edit');
    if (isAdd) {
      const start = todayDate();
      const plan = '3 Months';
      setEditForm({
        subscriptionId: `SUB-${Date.now()}`,
        stablePick: '',
        stableId: '',
        stableName: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        country: '',
        city: '',
        stableType: '',
        commercialRegistrationNumber: '',
        accessStatus: '',
        stableNameSelect: '',
        stableNameCustom: '',
        stableTypesSelected: [],
        countriesSelected: [],
        existingSubscriptionSnapshot: null,
        planDuration: plan,
        startDate: start,
        endDate: endDateForPlan(start, plan),
        renewalDate: endDateForPlan(start, plan),
        subscriptionAmount: 0,
        paidAmount: 0,
        paymentStatus: 'Unpaid',
        subscriptionStatus: 'Trial',
        paymentMethod: 'Cash',
        invoiceFile: '',
        paymentReference: '',
        notes: '',
        paymentHistory: [],
        lastPaymentDate: '',
      });
    } else {
      const dir = DUMMY_STABLE_DIRECTORY.find((x) => x.stableId === r.stableId);
      const typesList = parseList(r.stableType).length ? parseList(r.stableType) : r.stableType ? [r.stableType] : [];
      const countriesList = parseList(r.country).length ? parseList(r.country) : r.country ? [r.country] : [];
      const stableFields = dir
        ? {
            stablePick: r.stableId,
            stableId: dir.stableId,
            stableName: dir.stableName,
            ownerName: dir.ownerName,
            ownerEmail: dir.ownerEmail,
            ownerPhone: dir.ownerPhone,
            country: dir.country,
            city: dir.city,
            stableType: dir.stableType,
            commercialRegistrationNumber: dir.commercialRegistrationNumber,
            accessStatus: dir.accessStatus,
            stableTypesSelected: [dir.stableType],
            countriesSelected: [dir.country],
            stableNameSelect: dir.stableName,
            stableNameCustom: '',
          }
        : {
            stablePick: r.stableId || '',
            stableId: r.stableId,
            stableName: r.stableName,
            ownerName: r.ownerName,
            ownerEmail: r.ownerEmail,
            ownerPhone: r.ownerPhone,
            country: r.country,
            city: r.city || '',
            stableType: joinList(typesList) || r.stableType || '',
            commercialRegistrationNumber: r.commercialRegistrationNumber || '',
            accessStatus: r.accessStatus || '',
            stableTypesSelected: typesList,
            countriesSelected: countriesList,
            stableNameSelect: CUSTOM_STABLE,
            stableNameCustom: r.stableName || '',
          };
      setEditForm({
        ...r,
        ...stableFields,
        paymentHistory: r.paymentHistory ? [...r.paymentHistory] : [],
        existingSubscriptionSnapshot: snapshotFromRow(r),
      });
    }
  };

  const saveEdit = () => {
    if (!editForm) return;

    if (editMode === 'add') {
      if (!editForm.stableId) {
        toast.error(t('pages.subscriptions.toasts.needStablePick'));
        return;
      }
      const dir = DUMMY_STABLE_DIRECTORY.find((x) => x.stableId === editForm.stableId);
      if (!dir) {
        toast.error(t('pages.subscriptions.toasts.needStablePick'));
        return;
      }
      if (!editForm.startDate || !editForm.endDate || !editForm.renewalDate) {
        toast.error(t('pages.subscriptions.toasts.needDates'));
        return;
      }
      if (editForm.startDate > editForm.endDate) {
        toast.error(t('pages.subscriptions.toasts.invalidDateRange'));
        return;
      }
      const sa = Number(editForm.subscriptionAmount) || 0;
      const pa = Number(editForm.paidAmount) || 0;
      if (sa < 0 || pa < 0) {
        toast.error(t('pages.subscriptions.toasts.invalidAmounts'));
        return;
      }
      const rem = calcRemaining(sa, pa);
      const row = {
        subscriptionId: editForm.subscriptionId,
        stableId: dir.stableId,
        stableName: dir.stableName,
        ownerName: dir.ownerName,
        ownerEmail: dir.ownerEmail,
        ownerPhone: dir.ownerPhone,
        country: dir.country,
        city: dir.city,
        stableType: dir.stableType,
        commercialRegistrationNumber: dir.commercialRegistrationNumber,
        accessStatus: dir.accessStatus,
        planDuration: editForm.planDuration,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        renewalDate: editForm.renewalDate,
        subscriptionAmount: sa,
        paidAmount: pa,
        remainingAmount: rem,
        paymentStatus: editForm.paymentStatus,
        subscriptionStatus: editForm.subscriptionStatus,
        paymentMethod: editForm.paymentMethod,
        lastPaymentDate: editForm.lastPaymentDate || '',
        paymentReference: editForm.paymentReference || '',
        invoiceFile: editForm.invoiceFile || '',
        notes: editForm.notes || '',
        paymentHistory: editForm.paymentHistory ? [...editForm.paymentHistory] : [],
      };
      setRows((prev) => [...prev, row]);
      toast.success(t('pages.subscriptions.toasts.added'));
      setEditForm(null);
      setEditMode(null);
      syncDetailIfOpen(row);
      return;
    }

    if (editMode === 'edit') {
      if (!editForm.startDate || !editForm.endDate || !editForm.renewalDate) {
        toast.error(t('pages.subscriptions.toasts.needDates'));
        return;
      }
      if (editForm.startDate > editForm.endDate) {
        toast.error(t('pages.subscriptions.toasts.invalidDateRange'));
        return;
      }
      const sa = Number(editForm.subscriptionAmount) || 0;
      const pa = Number(editForm.paidAmount) || 0;
      if (sa < 0 || pa < 0) {
        toast.error(t('pages.subscriptions.toasts.invalidAmounts'));
        return;
      }
      const rem = calcRemaining(sa, pa);
      const dir = DUMMY_STABLE_DIRECTORY.find((x) => x.stableId === editForm.stableId);
      let row;
      if (dir) {
        row = {
          subscriptionId: editForm.subscriptionId,
          stableId: dir.stableId,
          stableName: dir.stableName,
          ownerName: dir.ownerName,
          ownerEmail: dir.ownerEmail,
          ownerPhone: dir.ownerPhone,
          country: dir.country,
          city: dir.city,
          stableType: dir.stableType,
          commercialRegistrationNumber: dir.commercialRegistrationNumber,
          accessStatus: dir.accessStatus,
          planDuration: editForm.planDuration,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          renewalDate: editForm.renewalDate,
          subscriptionAmount: sa,
          paidAmount: pa,
          remainingAmount: rem,
          paymentStatus: editForm.paymentStatus,
          subscriptionStatus: editForm.subscriptionStatus,
          paymentMethod: editForm.paymentMethod,
          lastPaymentDate: editForm.lastPaymentDate || '',
          paymentReference: editForm.paymentReference || '',
          invoiceFile: editForm.invoiceFile || '',
          notes: editForm.notes || '',
          paymentHistory: editForm.paymentHistory ? [...editForm.paymentHistory] : [],
        };
      } else {
        const prev = rows.find((x) => x.subscriptionId === editForm.subscriptionId);
        const stableType = joinList(
          editForm.stableTypesSelected?.length ? editForm.stableTypesSelected : parseList(editForm.stableType)
        );
        const country = joinList(
          editForm.countriesSelected?.length ? editForm.countriesSelected : parseList(editForm.country)
        );
        row = {
          subscriptionId: editForm.subscriptionId,
          stableId: editForm.stableId,
          stableName: editForm.stableName,
          ownerName: editForm.ownerName,
          ownerEmail: editForm.ownerEmail,
          ownerPhone: editForm.ownerPhone,
          country,
          stableType,
          planDuration: editForm.planDuration,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          renewalDate: editForm.renewalDate,
          subscriptionAmount: sa,
          paidAmount: pa,
          remainingAmount: rem,
          paymentStatus: editForm.paymentStatus,
          subscriptionStatus: editForm.subscriptionStatus,
          paymentMethod: editForm.paymentMethod,
          lastPaymentDate: editForm.lastPaymentDate || '',
          paymentReference: editForm.paymentReference || '',
          invoiceFile: editForm.invoiceFile || '',
          notes: editForm.notes || '',
          paymentHistory: editForm.paymentHistory ? [...editForm.paymentHistory] : [],
        };
        if (prev?.city) row.city = prev.city;
        if (prev?.commercialRegistrationNumber) row.commercialRegistrationNumber = prev.commercialRegistrationNumber;
        if (prev?.accessStatus) row.accessStatus = prev.accessStatus;
      }
      patchRow(row.subscriptionId, row);
      toast.success(t('pages.subscriptions.toasts.updated'));
      setEditForm(null);
      setEditMode(null);
      syncDetailIfOpen(row);
      return;
    }
  };

  const syncDetailIfOpen = (row) => {
    setDetailRow((d) => (d && d.subscriptionId === row.subscriptionId ? { ...row } : d));
  };

  const openPayment = (r) => {
    closeMenu();
    setPaymentRow(r);
    setPaymentForm({
      newPaymentAmount: '',
      paymentMethod: r.paymentMethod,
      paymentDate: todayDate(),
      paymentReference: '',
      notes: '',
    });
  };

  const savePayment = () => {
    if (!paymentRow || !paymentForm) return;
    const add = Number(paymentForm.newPaymentAmount) || 0;
    if (add <= 0) {
      toast.error(t('pages.subscriptions.toasts.needAmount'));
      return;
    }
    const paid = (Number(paymentRow.paidAmount) || 0) + add;
    const rem = calcRemaining(paymentRow.subscriptionAmount, paid);
    const ps = suggestPaymentStatus(Number(paymentRow.subscriptionAmount) || 0, paid);
    patchRow(paymentRow.subscriptionId, {
      paidAmount: paid,
      remainingAmount: rem,
      paymentStatus: ps,
      paymentMethod: paymentForm.paymentMethod,
      lastPaymentDate: paymentForm.paymentDate,
      paymentReference: paymentForm.paymentReference || paymentRow.paymentReference,
    });
    appendHistory(paymentRow.subscriptionId, {
      date: paymentForm.paymentDate,
      amount: add,
      method: paymentForm.paymentMethod,
      reference: paymentForm.paymentReference || '—',
      receiptFile: '',
      notes: paymentForm.notes || '',
    });
    toast.success(t('pages.subscriptions.toasts.paymentRecorded'));
    const updated = { ...paymentRow, paidAmount: paid, remainingAmount: rem, paymentStatus: ps, lastPaymentDate: paymentForm.paymentDate };
    syncDetailIfOpen(updated);
    setPaymentRow(null);
    setPaymentForm(null);
  };

  const openRenew = (r) => {
    closeMenu();
    setRenewRow(r);
    setRenewForm({
      planDuration: r.planDuration,
      startDate: r.startDate,
      endDate: r.endDate,
      renewalDate: r.renewalDate,
      newAmount: r.subscriptionAmount,
      paidAmount: String(r.paidAmount ?? ''),
      paymentStatus: r.paymentStatus,
      paymentMethod: r.paymentMethod || 'Cash',
      notes: '',
    });
  };

  const saveRenew = () => {
    if (!renewRow || !renewForm) return;
    const amt = Number(renewForm.newAmount) || 0;
    const paid = Number(renewForm.paidAmount) || 0;
    const rem = calcRemaining(amt, paid);
    patchRow(renewRow.subscriptionId, {
      planDuration: renewForm.planDuration,
      startDate: renewForm.startDate,
      endDate: renewForm.endDate,
      renewalDate: renewForm.renewalDate,
      subscriptionAmount: amt,
      paidAmount: paid,
      remainingAmount: rem,
      paymentStatus: renewForm.paymentStatus,
      paymentMethod: renewForm.paymentMethod,
      subscriptionStatus: 'Active',
      lastPaymentDate: renewRow.lastPaymentDate || '',
    });
    appendHistory(renewRow.subscriptionId, {
      date: todayDate(),
      amount: 0,
      method: renewForm.paymentMethod || '—',
      reference: 'RENEW',
      receiptFile: '',
      notes: renewForm.notes || t('pages.subscriptions.labels.renewedContract'),
    });
    toast.success(t('pages.subscriptions.toasts.renewed'));
    syncDetailIfOpen({
      ...renewRow,
      ...renewForm,
      subscriptionAmount: amt,
      paidAmount: paid,
      remainingAmount: rem,
      subscriptionStatus: 'Active',
    });
    setRenewRow(null);
    setRenewForm(null);
  };

  const openMarkPaid = (r) => {
    closeMenu();
    setMarkPaidRow(r);
    setMarkPaidForm({
      paymentMethod: r.paymentMethod || 'Cash',
      paymentDate: todayDate(),
      paymentReference: '',
    });
  };

  const saveMarkPaid = () => {
    if (!markPaidRow || !markPaidForm) return;
    const amt = Number(markPaidRow.subscriptionAmount) || 0;
    const paid = amt;
    patchRow(markPaidRow.subscriptionId, {
      paidAmount: paid,
      remainingAmount: 0,
      paymentStatus: 'Paid',
      paymentMethod: markPaidForm.paymentMethod,
      lastPaymentDate: markPaidForm.paymentDate,
      paymentReference: markPaidForm.paymentReference || markPaidRow.paymentReference,
    });
    appendHistory(markPaidRow.subscriptionId, {
      date: markPaidForm.paymentDate,
      amount: Math.max(0, amt - (Number(markPaidRow.paidAmount) || 0)),
      method: markPaidForm.paymentMethod,
      reference: markPaidForm.paymentReference || 'MARK-PAID',
      receiptFile: '',
      notes: t('pages.subscriptions.labels.markedPaid'),
    });
    toast.success(t('pages.subscriptions.toasts.markedPaid'));
    syncDetailIfOpen({
      ...markPaidRow,
      paidAmount: paid,
      remainingAmount: 0,
      paymentStatus: 'Paid',
      lastPaymentDate: markPaidForm.paymentDate,
      paymentMethod: markPaidForm.paymentMethod,
    });
    setMarkPaidRow(null);
    setMarkPaidForm(null);
  };

  const openSuspend = (r) => {
    closeMenu();
    setSuspendRow(r);
    setSuspendForm({ reason: '', notes: '' });
  };

  const confirmSuspend = () => {
    if (!suspendRow) return;
    const { reason, notes } = suspendForm;
    const extra = [reason ? t('pages.subscriptions.suspendModal.reasonLine', { reason }) : '', notes].filter(Boolean).join('\n');
    const mergedNotes = extra ? [suspendRow.notes, extra].filter(Boolean).join('\n\n') : suspendRow.notes;
    patchRow(suspendRow.subscriptionId, {
      subscriptionStatus: 'Suspended',
      suspensionReason: reason || '',
      notes: mergedNotes || '',
    });
    toast.success(t('pages.subscriptions.toasts.suspended'));
    syncDetailIfOpen({
      ...suspendRow,
      subscriptionStatus: 'Suspended',
      suspensionReason: reason || '',
      notes: mergedNotes || '',
    });
    setSuspendRow(null);
    setSuspendForm({ reason: '', notes: '' });
  };

  const handleInvoicePdf = () => {
    if (!editForm) return;
    const resolved = resolveStableName(editForm);
    const stableLabel = resolved || editForm.stableName || '';
    if (!stableLabel.trim()) {
      toast.error(t('pages.subscriptions.toasts.invoiceNeedStable'));
      return;
    }
    const types = editForm.stableTypesSelected?.length ? editForm.stableTypesSelected : parseList(editForm.stableType);
    let ctr = editForm.countriesSelected?.length ? editForm.countriesSelected : parseList(editForm.country);
    if (!ctr.length && editForm.country) ctr = [editForm.country];
    const typeLabel = joinList(types.map((x) => t(`pages.subscriptions.stableTypes.${slugKey(x)}`, { defaultValue: x })));
    const countryLabel = joinList(ctr.map((x) => t(`pages.subscriptions.countries.${slugKey(x)}`, { defaultValue: x })));
    const fname = generateSubscriptionInvoicePdf(editForm, t, stableLabel, typeLabel, countryLabel);
    setEditForm((f) => ({ ...f, invoiceFile: fname }));
    toast.success(t('pages.subscriptions.toasts.invoicePdfCreated'));
  };

  const trPay = (s) => t(`pages.subscriptions.paymentStatus.${String(s).replace(/\s+/g, '')}`);
  const trSub = (s) => t(`pages.subscriptions.subscriptionStatus.${String(s).replace(/\s+/g, '')}`);
  const trMethod = (s) => t(`pages.subscriptions.paymentMethod.${String(s).replace(/\s+/g, '')}`);
  const trPlan = (s) => t(`pages.subscriptions.planDuration.${String(s).replace(/\s+/g, '')}`);
  const trStableTypesJoined = (s) =>
    parseList(s)
      .map((x) => t(`pages.subscriptions.stableTypes.${slugKey(x)}`, { defaultValue: x }))
      .join(', ') || '—';
  const trCountriesJoined = (s) =>
    parseList(s)
      .map((x) => t(`pages.subscriptions.countries.${slugKey(x)}`, { defaultValue: x }))
      .join(', ') || '—';
  const trAccessStatus = (s) =>
    s ? t(`pages.subscriptions.accessStatus.${slugKey(s)}`, { defaultValue: s }) : '—';

  const renderEditStableReadonly = () => {
    if (!editForm?.stableId) return null;
    const typeKeys =
      editForm.stableTypesSelected?.length ? editForm.stableTypesSelected : parseList(editForm.stableType);
    const disciplineLabel =
      typeKeys.length > 0
        ? joinList(typeKeys.map((st) => t(`pages.subscriptions.stableTypes.${slugKey(st)}`, { defaultValue: st })))
        : t(`pages.subscriptions.stableTypes.${slugKey(editForm.stableType)}`, { defaultValue: editForm.stableType });
    const snap = editForm.existingSubscriptionSnapshot;
    return (
      <section className="su-stable-readonly-card su-field--full">
        <h3 className="su-stable-readonly-card__title">{t('pages.subscriptions.editModal.stableInfoTitle')}</h3>
        <div className="su-readonly-grid">
          {[
            ['stableId', editForm.stableId],
            ['stableName', editForm.stableName],
            ['ownerName', editForm.ownerName],
            ['ownerEmail', editForm.ownerEmail],
            ['ownerPhone', editForm.ownerPhone],
            ['country', editForm.country],
            ['city', editForm.city],
            ['discipline', disciplineLabel],
            ['crNumber', editForm.commercialRegistrationNumber],
            [
              'accessStatus',
              t(`pages.subscriptions.accessStatus.${slugKey(editForm.accessStatus)}`, { defaultValue: editForm.accessStatus }),
            ],
          ].map(([key, val]) => (
            <div key={key} className="su-readonly-row">
              <span className="su-readonly-row__label">{t(`pages.subscriptions.editModal.stableInfo.${key}`)}</span>
              <strong className="su-readonly-row__value">{val || '—'}</strong>
            </div>
          ))}
        </div>
        <h4 className="su-stable-readonly-card__subtitle">{t('pages.subscriptions.editModal.subscriptionSnapshotTitle')}</h4>
        {snap ? (
          <div className="su-readonly-grid su-readonly-grid--snapshot">
            {[
              ['snapshotPlan', trPlan(snap.planDuration)],
              ['snapshotPeriod', `${snap.startDate} → ${snap.endDate}`],
              ['snapshotRenewal', snap.renewalDate],
              ['snapshotSubStatus', trSub(snap.subscriptionStatus)],
              ['snapshotPayStatus', trPay(snap.paymentStatus)],
              ['snapshotAmount', String(snap.subscriptionAmount)],
              ['snapshotPaid', String(snap.paidAmount)],
              ['snapshotRemaining', String(snap.remainingAmount)],
              ['snapshotLastPay', snap.lastPaymentDate || '—'],
            ].map(([key, val]) => (
              <div key={key} className="su-readonly-row">
                <span className="su-readonly-row__label">{t(`pages.subscriptions.editModal.${key}`)}</span>
                <strong className="su-readonly-row__value">{val}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="su-snapshot-empty">{t('pages.subscriptions.editModal.noActiveSubscription')}</p>
        )}
      </section>
    );
  };

  const payBadgeClass = (s) => {
    if (s === 'Paid') return 'su-badge su-badge--paid';
    if (s === 'Partially Paid') return 'su-badge su-badge--partial';
    if (s === 'Unpaid') return 'su-badge su-badge--unpaid';
    if (s === 'Overdue') return 'su-badge su-badge--overdue';
    if (s === 'Pending Confirmation') return 'su-badge su-badge--pending';
    return 'su-badge';
  };

  const subBadgeClass = (s) => {
    if (s === 'Active') return 'su-badge su-badge--active';
    if (s === 'Expired') return 'su-badge su-badge--expired';
    if (s === 'Suspended') return 'su-badge su-badge--suspended';
    if (s === 'Cancelled') return 'su-badge su-badge--cancelled';
    if (s === 'Trial') return 'su-badge su-badge--trial';
    return 'su-badge';
  };

  const editRemaining = editForm ? calcRemaining(editForm.subscriptionAmount, editForm.paidAmount) : 0;

  return (
    <div className="su-page" dir={rtl ? 'rtl' : 'ltr'}>
      <header className="su-page__header">
        <div className="su-page__head-row">
          <div>
            <h1 className="su-page__title">{t('pages.subscriptions.title')}</h1>
            <p className="su-page__subtitle">{t('pages.subscriptions.subtitle')}</p>
          </div>
          <button type="button" className="su-btn su-btn--gold" onClick={() => openEdit(null, true)}>
            <Plus size={18} aria-hidden />
            {t('pages.subscriptions.actions.add')}
          </button>
        </div>
      </header>

      <section className="su-summary">
        {[
          ['total', summary.total],
          ['active', summary.active],
          ['expired', summary.expired],
          ['overdue', summary.overdue],
          ['paidThisMonth', summary.paidThisMonth],
          ['outstanding', summary.outstanding],
          ['expected', summary.expected],
          ['yearly', summary.yearly],
          ['six', summary.six],
          ['three', summary.three],
        ].map(([k, v]) => (
          <div key={k} className="su-kpi">
            <div className="su-kpi__label">{t(`pages.subscriptions.summary.${k}`)}</div>
            <div className="su-kpi__value">{v}</div>
          </div>
        ))}
      </section>

      <section className="su-filters">
        <div className="su-filters__grid">
          <div className="su-field">
            <label className="su-field__label" htmlFor="su-s">{t('pages.subscriptions.filters.stable')}</label>
            <div className="su-search">
              <Search size={17} aria-hidden />
              <input id="su-s" className="su-input" value={searchStable} onChange={(e) => setSearchStable(e.target.value)} placeholder="…" />
            </div>
          </div>
          <div className="su-field">
            <label className="su-field__label" htmlFor="su-o">{t('pages.subscriptions.filters.owner')}</label>
            <input id="su-o" className="su-input" value={searchOwner} onChange={(e) => setSearchOwner(e.target.value)} placeholder="…" />
          </div>
          <div className="su-field">
            <span className="su-field__label">{t('pages.subscriptions.filters.planDuration')}</span>
            <select className="su-select" value={fPlan} onChange={(e) => setFPlan(e.target.value)}>
              <option value={ALL}>{t('pages.subscriptions.filters.all')}</option>
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {trPlan(p)}
                </option>
              ))}
            </select>
          </div>
          <div className="su-field">
            <span className="su-field__label">{t('pages.subscriptions.filters.subStatus')}</span>
            <select className="su-select" value={fSub} onChange={(e) => setFSub(e.target.value)}>
              <option value={ALL}>{t('pages.subscriptions.filters.all')}</option>
              {SUB_STATUSES.map((p) => (
                <option key={p} value={p}>
                  {trSub(p)}
                </option>
              ))}
            </select>
          </div>
          <div className="su-field">
            <span className="su-field__label">{t('pages.subscriptions.filters.payStatus')}</span>
            <select className="su-select" value={fPay} onChange={(e) => setFPay(e.target.value)}>
              <option value={ALL}>{t('pages.subscriptions.filters.all')}</option>
              {PAY_STATUSES.map((p) => (
                <option key={p} value={p}>
                  {trPay(p)}
                </option>
              ))}
            </select>
          </div>
          <div className="su-field">
            <span className="su-field__label">{t('pages.subscriptions.filters.payMethod')}</span>
            <select className="su-select" value={fMethod} onChange={(e) => setFMethod(e.target.value)}>
              <option value={ALL}>{t('pages.subscriptions.filters.all')}</option>
              {PAY_METHODS.map((p) => (
                <option key={p} value={p}>
                  {trMethod(p)}
                </option>
              ))}
            </select>
          </div>
          <div className="su-field">
            <span className="su-field__label">{t('pages.subscriptions.filters.country')}</span>
            <select className="su-select" value={fCountry} onChange={(e) => setFCountry(e.target.value)}>
              <option value={ALL}>{t('pages.subscriptions.filters.all')}</option>
              {countries.filter((c) => c !== ALL).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="su-field">
            <span className="su-field__label">{t('pages.subscriptions.filters.renewFrom')}</span>
            <input className="su-input" type="date" value={fRenewFrom} onChange={(e) => setFRenewFrom(e.target.value)} />
          </div>
          <div className="su-field">
            <span className="su-field__label">{t('pages.subscriptions.filters.renewTo')}</span>
            <input className="su-input" type="date" value={fRenewTo} onChange={(e) => setFRenewTo(e.target.value)} />
          </div>
          <div className="su-field">
            <span className="su-field__label" style={{ visibility: 'hidden' }}>
              .
            </span>
            <button type="button" className="su-btn su-btn--ghost" onClick={resetFilters}>
              <RefreshCw size={16} aria-hidden />
              {t('pages.subscriptions.filters.reset')}
            </button>
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="su-empty">{t('pages.subscriptions.empty')}</div>
      ) : (
        <div className="subscriptions-table-wrapper">
          <table className="su-table">
            <thead>
              <tr>
                {[
                  'subscriptionId',
                  'stableName',
                  'ownerName',
                  'planDuration',
                  'startDate',
                  'endDate',
                  'renewalDate',
                  'amount',
                  'paidAmount',
                  'remaining',
                  'payStatus',
                  'subStatus',
                  'payMethod',
                  'lastPayment',
                  'invoice',
                  'notes',
                  'actions',
                ].map((c) => (
                  <th key={c} className={c === 'invoice' ? 'su-col-invoice' : undefined}>
                    {t(`pages.subscriptions.table.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.subscriptionId} className={r.paymentStatus === 'Overdue' ? 'su-tr--overdue' : undefined}>
                  <td>{r.subscriptionId}</td>
                  <td>
                    <strong>{r.stableName}</strong>
                  </td>
                  <td>{r.ownerName}</td>
                  <td>{trPlan(r.planDuration)}</td>
                  <td>{r.startDate}</td>
                  <td>{r.endDate}</td>
                  <td>{r.renewalDate}</td>
                  <td>{r.subscriptionAmount}</td>
                  <td>{r.paidAmount}</td>
                  <td>{r.remainingAmount}</td>
                  <td>
                    <span className={payBadgeClass(r.paymentStatus)}>{trPay(r.paymentStatus)}</span>
                  </td>
                  <td>
                    <span className={subBadgeClass(r.subscriptionStatus)}>{trSub(r.subscriptionStatus)}</span>
                  </td>
                  <td>{trMethod(r.paymentMethod)}</td>
                  <td>{r.lastPaymentDate || '—'}</td>
                  <td className="su-col-invoice su-cell-invoice">
                    {r.invoiceFile ? (
                      <div className="su-invoice-cell">
                        <span className="su-invoice-name" title={r.invoiceFile}>
                          {r.invoiceFile}
                        </span>
                        <button
                          type="button"
                          className="su-invoice-view"
                          title={t('pages.subscriptions.actions.viewInvoice')}
                          aria-label={t('pages.subscriptions.actions.viewInvoice')}
                          onClick={() =>
                            toast.success(t('pages.subscriptions.toasts.invoicePreview', { file: r.invoiceFile }))
                          }
                        >
                          <FileText size={16} aria-hidden />
                        </button>
                      </div>
                    ) : (
                      <span className="su-cell-muted">—</span>
                    )}
                  </td>
                  <td className="su-cell-notes">{r.notes || '—'}</td>
                  <td className="su-table__actions">
                    <div className="su-menu-wrap">
                      <button
                        type="button"
                        className="su-btn su-btn--ghost su-btn--icon"
                        aria-expanded={menuOpenId === r.subscriptionId}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId((id) => (id === r.subscriptionId ? null : r.subscriptionId));
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {menuOpenId === r.subscriptionId ? (
                        <div className="su-menu" role="menu">
                          <button type="button" className="su-menu__item" role="menuitem" onClick={() => { closeMenu(); setDetailRow(rows.find((x) => x.subscriptionId === r.subscriptionId) || r); }}>
                            {t('pages.subscriptions.actions.viewDetails')}
                          </button>
                          <button type="button" className="su-menu__item" role="menuitem" onClick={() => openPayment(r)}>
                            <CreditCard size={16} aria-hidden /> {t('pages.subscriptions.actions.addPayment')}
                          </button>
                          <button type="button" className="su-menu__item" role="menuitem" onClick={() => openEdit(r, false)}>
                            <Pencil size={16} aria-hidden /> {t('pages.subscriptions.actions.edit')}
                          </button>
                          <button type="button" className="su-menu__item" role="menuitem" onClick={() => openRenew(r)}>
                            <RefreshCw size={16} aria-hidden /> {t('pages.subscriptions.actions.renew')}
                          </button>
                          <button type="button" className="su-menu__item" role="menuitem" onClick={() => openMarkPaid(r)}>
                            {t('pages.subscriptions.actions.markPaid')}
                          </button>
                          <button type="button" className="su-menu__item" role="menuitem" onClick={() => openSuspend(r)}>
                            <ShieldOff size={16} aria-hidden /> {t('pages.subscriptions.actions.suspend')}
                          </button>
                          <button type="button" className="su-menu__item" role="menuitem" onClick={() => { closeMenu(); toast.success(t('pages.subscriptions.toasts.exportInvoiceConnected')); }}>
                            <FileDown size={16} aria-hidden /> {t('pages.subscriptions.actions.exportInvoice')}
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

      {detailRow
        ? createPortal(
            (
              <div
                dir={rtl ? 'rtl' : 'ltr'}
                className="su-modal-overlay su-modal-overlay--centered"
                role="dialog"
                aria-modal="true"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setDetailRow(null);
                }}
              >
                <div className="su-modal su-modal--wide su-modal--dialog" onClick={(e) => e.stopPropagation()}>
                  <div className="su-modal__head">
                    <h2 className="su-modal__title">{detailRow.stableName}</h2>
                    <button type="button" className="su-icon-btn" onClick={() => setDetailRow(null)} aria-label={t('pages.subscriptions.actions.close')}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="su-modal__body">
                    {(detailRow.paymentStatus === 'Overdue' || detailRow.remainingAmount > 0) && (
                      <div className="su-warn-row">
                        {detailRow.paymentStatus === 'Overdue' ? (
                          <div className="su-warning">
                            <AlertTriangle size={18} aria-hidden />
                            <span>{t('pages.subscriptions.warnings.overdue')}</span>
                          </div>
                        ) : null}
                        {detailRow.remainingAmount > 0 ? (
                          <div className="su-warning su-warning--soft">
                            <AlertTriangle size={18} aria-hidden />
                            <span>{t('pages.subscriptions.warnings.remaining', { amount: detailRow.remainingAmount })}</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                    <section className="su-panel">
                      <h3 className="su-panel__title">{t('pages.subscriptions.detail.stable')}</h3>
                      <div className="su-info-grid">
                        {[
                          ['stableId', detailRow.stableId || '—'],
                          ['stableName', detailRow.stableName],
                          ['country', trCountriesJoined(detailRow.country)],
                          ['city', detailRow.city || '—'],
                          ['stableType', trStableTypesJoined(detailRow.stableType)],
                          ['crNumber', detailRow.commercialRegistrationNumber || '—'],
                          ['accessStatus', trAccessStatus(detailRow.accessStatus)],
                        ].map(([k, v]) => (
                          <div key={k} className="su-info">
                            <span>{t(`pages.subscriptions.detail.fields.${k}`)}</span>
                            <strong>{v}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="su-panel">
                      <h3 className="su-panel__title">{t('pages.subscriptions.detail.owner')}</h3>
                      <div className="su-info-grid">
                        {[
                          ['ownerName', detailRow.ownerName],
                          ['email', detailRow.ownerEmail],
                          ['phone', detailRow.ownerPhone],
                        ].map(([k, v]) => (
                          <div key={k} className="su-info">
                            <span>{t(`pages.subscriptions.detail.ownerFields.${k}`)}</span>
                            <strong>{v || '—'}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="su-panel">
                      <h3 className="su-panel__title">{t('pages.subscriptions.detail.subscription')}</h3>
                      <div className="su-info-grid">
                        {[
                          ['subscriptionId', detailRow.subscriptionId],
                          ['planDuration', trPlan(detailRow.planDuration)],
                          ['startDate', detailRow.startDate],
                          ['endDate', detailRow.endDate],
                          ['renewalDate', detailRow.renewalDate],
                        ].map(([k, v]) => (
                          <div key={k} className="su-info">
                            <span>{t(`pages.subscriptions.detail.subscriptionFields.${k}`)}</span>
                            <strong>{v}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="su-panel">
                      <h3 className="su-panel__title">{t('pages.subscriptions.detail.paymentSummary')}</h3>
                      <div className="su-info-grid">
                        {[
                          ['amount', detailRow.subscriptionAmount],
                          ['paid', detailRow.paidAmount],
                          ['remaining', detailRow.remainingAmount],
                          ['payStatus', trPay(detailRow.paymentStatus)],
                          ['subStatus', trSub(detailRow.subscriptionStatus)],
                          ['method', trMethod(detailRow.paymentMethod)],
                          ['lastPaymentDate', detailRow.lastPaymentDate || '—'],
                        ].map(([k, v]) => (
                          <div key={k} className="su-info">
                            <span>{t(`pages.subscriptions.detail.paymentSummaryFields.${k}`)}</span>
                            <strong>{v}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="su-panel">
                      <h3 className="su-panel__title">{t('pages.subscriptions.detail.history')}</h3>
                      <div className="su-mini-wrap">
                        <table className="su-mini-table">
                          <thead>
                            <tr>
                              {['date', 'amount', 'method', 'reference', 'receipt', 'notes'].map((c) => (
                                <th key={c}>{t(`pages.subscriptions.history.${c}`)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(detailRow.paymentHistory || []).length === 0 ? (
                              <tr>
                                <td colSpan={6} className="su-mini-empty">
                                  {t('pages.subscriptions.detail.noHistory')}
                                </td>
                              </tr>
                            ) : (
                              [...detailRow.paymentHistory].map((h) => (
                                <tr key={h.paymentId}>
                                  <td>{h.date}</td>
                                  <td>{h.amount}</td>
                                  <td>{h.method}</td>
                                  <td>{h.reference}</td>
                                  <td>{h.receiptFile || '—'}</td>
                                  <td>{h.notes || '—'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>
                    <section className="su-panel">
                      <h3 className="su-panel__title">{t('pages.subscriptions.detail.invoiceSection')}</h3>
                      <div className="su-info-grid">
                        <div className="su-info su-info--block">
                          <span>{t('pages.subscriptions.detail.invoiceFile')}</span>
                          <strong>{detailRow.invoiceFile || t('pages.subscriptions.detail.invoicePlaceholder')}</strong>
                        </div>
                        <div className="su-info su-info--block">
                          <span>{t('pages.subscriptions.detail.receiptPlaceholder')}</span>
                          <strong>{t('pages.subscriptions.detail.receiptConnect')}</strong>
                        </div>
                      </div>
                    </section>
                  </div>
                  <div className="su-modal__foot">
                    <button type="button" className="su-btn su-btn--primary" onClick={() => setDetailRow(null)}>
                      {t('pages.subscriptions.actions.close')}
                    </button>
                  </div>
                </div>
              </div>
            ),
            document.body
          )
        : null}

      {editForm
        ? createPortal(
            (
              <div
                dir={rtl ? 'rtl' : 'ltr'}
                className="su-modal-overlay su-modal-overlay--centered"
                role="dialog"
                aria-modal="true"
                aria-labelledby="su-subscription-modal-title"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setEditForm(null);
                    setEditMode(null);
                  }
                }}
              >
                <div
                  className="su-modal su-modal--wide su-modal--dialog su-modal--fill-body"
                  onClick={(e) => e.stopPropagation()}
                >
            <div className="su-modal__head">
              <h2 id="su-subscription-modal-title" className="su-modal__title">
                {editMode === 'add' ? t('pages.subscriptions.editModal.addTitle') : t('pages.subscriptions.editModal.editTitle')}
              </h2>
              <button type="button" className="su-icon-btn" onClick={() => { setEditForm(null); setEditMode(null); }} aria-label={t('pages.subscriptions.actions.close')}>
                <X size={20} />
              </button>
            </div>
            <div className="su-modal__body">
              <div className="su-form-grid">
                {editMode === 'add' ? (
                    <div className="su-field su-field--full">
                      <span className="su-field__label">{t('pages.subscriptions.editModal.selectStableDirectory')}</span>
                      <select
                        className="su-select"
                        value={editForm.stablePick ?? ''}
                        onChange={(e) => {
                          const stableId = e.target.value;
                          if (!stableId) {
                            setEditForm((f) => ({
                              ...f,
                              stablePick: '',
                              stableId: '',
                              stableName: '',
                              ownerName: '',
                              ownerEmail: '',
                              ownerPhone: '',
                              country: '',
                              city: '',
                              stableType: '',
                              commercialRegistrationNumber: '',
                              accessStatus: '',
                              stableTypesSelected: [],
                              countriesSelected: [],
                              stableNameSelect: '',
                              existingSubscriptionSnapshot: null,
                            }));
                            return;
                          }
                          const dir = DUMMY_STABLE_DIRECTORY.find((x) => x.stableId === stableId);
                          if (!dir) return;
                          const existing = rows.find((r) => r.stableId === stableId) || null;
                          setEditForm((f) => {
                            const start = todayDate();
                            const plan = f.planDuration || '3 Months';
                            const end = endDateForPlan(start, plan);
                            return {
                              ...f,
                              subscriptionId: `SUB-${Date.now()}`,
                              stablePick: stableId,
                              stableId: dir.stableId,
                              stableName: dir.stableName,
                              ownerName: dir.ownerName,
                              ownerEmail: dir.ownerEmail,
                              ownerPhone: dir.ownerPhone,
                              country: dir.country,
                              city: dir.city,
                              stableType: dir.stableType,
                              commercialRegistrationNumber: dir.commercialRegistrationNumber,
                              accessStatus: dir.accessStatus,
                              stableTypesSelected: [dir.stableType],
                              countriesSelected: [dir.country],
                              stableNameSelect: dir.stableName,
                              stableNameCustom: '',
                              existingSubscriptionSnapshot: existing ? snapshotFromRow(existing) : null,
                              startDate: start,
                              endDate: end,
                              renewalDate: end,
                              subscriptionAmount: 0,
                              paidAmount: 0,
                              paymentStatus: 'Unpaid',
                              subscriptionStatus: 'Trial',
                            };
                          });
                        }}
                      >
                        <option value="">{t('pages.subscriptions.editModal.stableDirectoryPlaceholder')}</option>
                        {DUMMY_STABLE_DIRECTORY.map((s) => (
                          <option key={s.stableId} value={s.stableId}>
                            {s.stableName}
                          </option>
                        ))}
                      </select>
                    </div>
                ) : null}
                {(editMode === 'add' || editMode === 'edit') && renderEditStableReadonly()}
                <div className="su-field">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.planDuration')}</span>
                  <select
                    className="su-select"
                    value={editForm.planDuration}
                    onChange={(e) => {
                      const plan = e.target.value;
                      setEditForm((f) => {
                        if ((editMode === 'add' || editMode === 'edit') && f.stableId) {
                          const end = endDateForPlan(f.startDate, plan);
                          return { ...f, planDuration: plan, endDate: end, renewalDate: end };
                        }
                        return { ...f, planDuration: plan };
                      });
                    }}
                  >
                    {PLAN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {trPlan(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="su-field">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.startDate')}</span>
                  <input
                    className="su-input"
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => {
                      const start = e.target.value;
                      setEditForm((f) => {
                        if ((editMode === 'add' || editMode === 'edit') && f.stableId) {
                          const end = endDateForPlan(start, f.planDuration);
                          return { ...f, startDate: start, endDate: end, renewalDate: end };
                        }
                        return { ...f, startDate: start };
                      });
                    }}
                  />
                </div>
                <div className="su-field">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.endDate')}</span>
                  <input className="su-input" type="date" value={editForm.endDate} onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))} />
                </div>
                <div className="su-field">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.renewalDate')}</span>
                  <input className="su-input" type="date" value={editForm.renewalDate} onChange={(e) => setEditForm((f) => ({ ...f, renewalDate: e.target.value }))} />
                </div>
                <div className="su-field">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.subscriptionAmount')}</span>
                  <input
                    className="su-input"
                    type="number"
                    value={editForm.subscriptionAmount}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditForm((f) => {
                        const sa = Number(v) || 0;
                        const pa = Number(f.paidAmount) || 0;
                        const ps = (editMode === 'add' || editMode === 'edit') && f.stableId ? suggestPaymentStatus(sa, pa) : f.paymentStatus;
                        return { ...f, subscriptionAmount: v, paymentStatus: ps };
                      });
                    }}
                  />
                </div>
                <div className="su-field">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.paidAmount')}</span>
                  <input
                    className="su-input"
                    type="number"
                    value={editForm.paidAmount}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditForm((f) => {
                        const pa = Number(v) || 0;
                        const sa = Number(f.subscriptionAmount) || 0;
                        const ps = (editMode === 'add' || editMode === 'edit') && f.stableId ? suggestPaymentStatus(sa, pa) : f.paymentStatus;
                        return { ...f, paidAmount: v, paymentStatus: ps };
                      });
                    }}
                  />
                </div>
                <div className="su-field">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.remaining')}</span>
                  <input className="su-input" readOnly value={editRemaining} />
                </div>
                <div className="su-field">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.payStatus')}</span>
                  <select className="su-select" value={editForm.paymentStatus} onChange={(e) => setEditForm((f) => ({ ...f, paymentStatus: e.target.value }))}>
                    {PAY_STATUSES.map((p) => (
                      <option key={p} value={p}>
                        {trPay(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="su-field">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.subStatus')}</span>
                  <select className="su-select" value={editForm.subscriptionStatus} onChange={(e) => setEditForm((f) => ({ ...f, subscriptionStatus: e.target.value }))}>
                    {SUB_STATUSES.map((p) => (
                      <option key={p} value={p}>
                        {trSub(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="su-field">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.payMethod')}</span>
                  <select className="su-select" value={editForm.paymentMethod} onChange={(e) => setEditForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
                    {PAY_METHODS.map((p) => (
                      <option key={p} value={p}>
                        {trMethod(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="su-field">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.lastPaymentDate')}</span>
                  <input
                    className="su-input"
                    type="date"
                    value={editForm.lastPaymentDate || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, lastPaymentDate: e.target.value }))}
                  />
                </div>
                <div className="su-field su-field--full">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.invoice')}</span>
                  <div className="su-invoice-actions">
                    <div className="su-placeholder su-placeholder--grow">{t('pages.subscriptions.editModal.invoicePlaceholder')}</div>
                    <button type="button" className="su-btn su-btn--primary su-btn--nowrap" onClick={handleInvoicePdf}>
                      {t('pages.subscriptions.editModal.createInvoicePdf')}
                    </button>
                  </div>
                  {editForm.invoiceFile ? (
                    <p className="su-field__note">{t('pages.subscriptions.editModal.invoiceSavedAs', { file: editForm.invoiceFile })}</p>
                  ) : null}
                </div>
                <div className="su-field su-field--full">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.reference')}</span>
                  <input className="su-input" value={editForm.paymentReference} onChange={(e) => setEditForm((f) => ({ ...f, paymentReference: e.target.value }))} />
                </div>
                <div className="su-field su-field--full">
                  <span className="su-field__label">{t('pages.subscriptions.editModal.notes')}</span>
                  <textarea className="su-textarea" rows={2} value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="su-modal__foot">
              <button type="button" className="su-btn su-btn--ghost" onClick={() => { setEditForm(null); setEditMode(null); }}>
                {t('pages.subscriptions.actions.cancel')}
              </button>
              <button type="button" className="su-btn su-btn--gold" onClick={saveEdit}>
                {t('pages.subscriptions.editModal.save')}
              </button>
            </div>
                </div>
              </div>
            ),
            document.body
          )
        : null}

      {paymentRow && paymentForm
        ? createPortal(
            (
              <div
                dir={rtl ? 'rtl' : 'ltr'}
                className="su-modal-overlay su-modal-overlay--centered"
                role="dialog"
                aria-modal="true"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setPaymentRow(null);
                    setPaymentForm(null);
                  }
                }}
              >
                <div className="su-modal su-modal--wide su-modal--dialog" onClick={(e) => e.stopPropagation()}>
                  <div className="su-modal__head">
                    <h2 className="su-modal__title">{t('pages.subscriptions.paymentModal.title')}</h2>
                    <button type="button" className="su-icon-btn" onClick={() => { setPaymentRow(null); setPaymentForm(null); }} aria-label={t('pages.subscriptions.actions.close')}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="su-modal__body">
                    <div className="su-info-grid">
                      <div className="su-info">
                        <span>{t('pages.subscriptions.paymentModal.stable')}</span>
                        <strong>{paymentRow.stableName}</strong>
                      </div>
                      <div className="su-info">
                        <span>{t('pages.subscriptions.paymentModal.subId')}</span>
                        <strong>{paymentRow.subscriptionId}</strong>
                      </div>
                      <div className="su-info">
                        <span>{t('pages.subscriptions.paymentModal.total')}</span>
                        <strong>{paymentRow.subscriptionAmount}</strong>
                      </div>
                      <div className="su-info">
                        <span>{t('pages.subscriptions.paymentModal.currentPaid')}</span>
                        <strong>{paymentRow.paidAmount}</strong>
                      </div>
                      <div className="su-info">
                        <span>{t('pages.subscriptions.paymentModal.remaining')}</span>
                        <strong>{calcRemaining(paymentRow.subscriptionAmount, paymentRow.paidAmount)}</strong>
                      </div>
                    </div>
                    <div className="su-form-grid su-form-grid--tight-top">
                      <div className="su-field">
                        <span className="su-field__label">{t('pages.subscriptions.paymentModal.newAmount')}</span>
                        <input className="su-input" type="number" value={paymentForm.newPaymentAmount} onChange={(e) => setPaymentForm((f) => ({ ...f, newPaymentAmount: e.target.value }))} />
                      </div>
                      <div className="su-field">
                        <span className="su-field__label">{t('pages.subscriptions.paymentModal.method')}</span>
                        <select className="su-select" value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
                          {PAY_METHODS.map((p) => (
                            <option key={p} value={p}>
                              {trMethod(p)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="su-field">
                        <span className="su-field__label">{t('pages.subscriptions.paymentModal.date')}</span>
                        <input className="su-input" type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm((f) => ({ ...f, paymentDate: e.target.value }))} />
                      </div>
                      <div className="su-field">
                        <span className="su-field__label">{t('pages.subscriptions.paymentModal.reference')}</span>
                        <input className="su-input" value={paymentForm.paymentReference} onChange={(e) => setPaymentForm((f) => ({ ...f, paymentReference: e.target.value }))} />
                      </div>
                      <div className="su-field su-field--full">
                        <span className="su-field__label">{t('pages.subscriptions.paymentModal.receipt')}</span>
                        <div className="su-placeholder">{t('pages.subscriptions.paymentModal.receiptPlaceholder')}</div>
                      </div>
                      <div className="su-field su-field--full">
                        <span className="su-field__label">{t('pages.subscriptions.paymentModal.notes')}</span>
                        <textarea className="su-textarea" rows={2} value={paymentForm.notes} onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div className="su-modal__foot">
                    <button type="button" className="su-btn su-btn--ghost" onClick={() => { setPaymentRow(null); setPaymentForm(null); }}>
                      {t('pages.subscriptions.actions.cancel')}
                    </button>
                    <button type="button" className="su-btn su-btn--gold" onClick={savePayment}>
                      {t('pages.subscriptions.paymentModal.save')}
                    </button>
                  </div>
                </div>
              </div>
            ),
            document.body
          )
        : null}

      {renewRow && renewForm
        ? createPortal(
            (
              <div
                dir={rtl ? 'rtl' : 'ltr'}
                className="su-modal-overlay su-modal-overlay--centered"
                role="dialog"
                aria-modal="true"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setRenewRow(null);
                    setRenewForm(null);
                  }
                }}
              >
                <div className="su-modal su-modal--wide su-modal--dialog" onClick={(e) => e.stopPropagation()}>
                  <div className="su-modal__head">
                    <h2 className="su-modal__title">{t('pages.subscriptions.renewModal.title')}</h2>
                    <button type="button" className="su-icon-btn" onClick={() => { setRenewRow(null); setRenewForm(null); }} aria-label={t('pages.subscriptions.actions.close')}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="su-modal__body">
                    <p className="su-muted">{renewRow.stableName}</p>
                    <div className="su-form-grid">
                      <div className="su-field su-field--full">
                        <span className="su-field__label">{t('pages.subscriptions.renewModal.plan')}</span>
                        <select
                          className="su-select"
                          value={renewForm.planDuration}
                          onChange={(e) => {
                            const plan = e.target.value;
                            setRenewForm((f) => {
                              const end = endDateForPlan(f.startDate, plan);
                              return { ...f, planDuration: plan, endDate: end, renewalDate: end };
                            });
                          }}
                        >
                          {PLAN_OPTIONS.map((p) => (
                            <option key={p} value={p}>
                              {trPlan(p)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="su-field">
                        <span className="su-field__label">{t('pages.subscriptions.renewModal.start')}</span>
                        <input
                          className="su-input"
                          type="date"
                          value={renewForm.startDate}
                          onChange={(e) => {
                            const start = e.target.value;
                            setRenewForm((f) => {
                              const end = endDateForPlan(start, f.planDuration);
                              return { ...f, startDate: start, endDate: end, renewalDate: end };
                            });
                          }}
                        />
                      </div>
                      <div className="su-field">
                        <span className="su-field__label">{t('pages.subscriptions.renewModal.end')}</span>
                        <input className="su-input" type="date" value={renewForm.endDate} onChange={(e) => setRenewForm((f) => ({ ...f, endDate: e.target.value }))} />
                      </div>
                      <div className="su-field">
                        <span className="su-field__label">{t('pages.subscriptions.renewModal.renewal')}</span>
                        <input className="su-input" type="date" value={renewForm.renewalDate} onChange={(e) => setRenewForm((f) => ({ ...f, renewalDate: e.target.value }))} />
                      </div>
                      <div className="su-field">
                        <span className="su-field__label">{t('pages.subscriptions.renewModal.newAmount')}</span>
                        <input className="su-input" type="number" value={renewForm.newAmount} onChange={(e) => setRenewForm((f) => ({ ...f, newAmount: e.target.value }))} />
                      </div>
                      <div className="su-field">
                        <span className="su-field__label">{t('pages.subscriptions.renewModal.paidAmount')}</span>
                        <input className="su-input" type="number" value={renewForm.paidAmount} onChange={(e) => setRenewForm((f) => ({ ...f, paidAmount: e.target.value }))} />
                      </div>
                      <div className="su-field">
                        <span className="su-field__label">{t('pages.subscriptions.renewModal.payMethod')}</span>
                        <select className="su-select" value={renewForm.paymentMethod} onChange={(e) => setRenewForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
                          {PAY_METHODS.map((p) => (
                            <option key={p} value={p}>
                              {trMethod(p)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="su-field su-field--full">
                        <span className="su-field__label">{t('pages.subscriptions.renewModal.payStatus')}</span>
                        <select className="su-select" value={renewForm.paymentStatus} onChange={(e) => setRenewForm((f) => ({ ...f, paymentStatus: e.target.value }))}>
                          {PAY_STATUSES.map((p) => (
                            <option key={p} value={p}>
                              {trPay(p)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="su-field su-field--full">
                        <span className="su-field__label">{t('pages.subscriptions.renewModal.notes')}</span>
                        <textarea className="su-textarea" rows={2} value={renewForm.notes} onChange={(e) => setRenewForm((f) => ({ ...f, notes: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div className="su-modal__foot">
                    <button type="button" className="su-btn su-btn--ghost" onClick={() => { setRenewRow(null); setRenewForm(null); }}>
                      {t('pages.subscriptions.actions.cancel')}
                    </button>
                    <button type="button" className="su-btn su-btn--gold" onClick={saveRenew}>
                      {t('pages.subscriptions.renewModal.save')}
                    </button>
                  </div>
                </div>
              </div>
            ),
            document.body
          )
        : null}

      {markPaidRow && markPaidForm
        ? createPortal(
            (
              <div
                dir={rtl ? 'rtl' : 'ltr'}
                className="su-modal-overlay su-modal-overlay--centered"
                role="dialog"
                aria-modal="true"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setMarkPaidRow(null);
                    setMarkPaidForm(null);
                  }
                }}
              >
                <div className="su-modal su-modal--wide su-modal--dialog" onClick={(e) => e.stopPropagation()}>
                  <div className="su-modal__head">
                    <h2 className="su-modal__title">{t('pages.subscriptions.markPaidModal.title')}</h2>
                    <button type="button" className="su-icon-btn" onClick={() => { setMarkPaidRow(null); setMarkPaidForm(null); }} aria-label={t('pages.subscriptions.actions.close')}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="su-modal__body">
                    <div className="su-info-grid">
                      <div className="su-info">
                        <span>{t('pages.subscriptions.markPaidModal.stable')}</span>
                        <strong>{markPaidRow.stableName}</strong>
                      </div>
                      <div className="su-info">
                        <span>{t('pages.subscriptions.markPaidModal.remaining')}</span>
                        <strong>{markPaidRow.remainingAmount}</strong>
                      </div>
                    </div>
                    <div className="su-form-grid su-form-grid--tight-top">
                      <div className="su-field su-field--full">
                        <span className="su-field__label">{t('pages.subscriptions.markPaidModal.method')}</span>
                        <select className="su-select" value={markPaidForm.paymentMethod} onChange={(e) => setMarkPaidForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
                          {PAY_METHODS.map((p) => (
                            <option key={p} value={p}>
                              {trMethod(p)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="su-field">
                        <span className="su-field__label">{t('pages.subscriptions.markPaidModal.date')}</span>
                        <input className="su-input" type="date" value={markPaidForm.paymentDate} onChange={(e) => setMarkPaidForm((f) => ({ ...f, paymentDate: e.target.value }))} />
                      </div>
                      <div className="su-field su-field--full">
                        <span className="su-field__label">{t('pages.subscriptions.markPaidModal.referenceOptional')}</span>
                        <input className="su-input" value={markPaidForm.paymentReference} onChange={(e) => setMarkPaidForm((f) => ({ ...f, paymentReference: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div className="su-modal__foot">
                    <button type="button" className="su-btn su-btn--ghost" onClick={() => { setMarkPaidRow(null); setMarkPaidForm(null); }}>
                      {t('pages.subscriptions.actions.cancel')}
                    </button>
                    <button type="button" className="su-btn su-btn--gold" onClick={saveMarkPaid}>
                      {t('pages.subscriptions.markPaidModal.confirm')}
                    </button>
                  </div>
                </div>
              </div>
            ),
            document.body
          )
        : null}

      {suspendRow
        ? createPortal(
            (
              <div
                dir={rtl ? 'rtl' : 'ltr'}
                className="su-modal-overlay su-modal-overlay--centered"
                role="dialog"
                aria-modal="true"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setSuspendRow(null);
                    setSuspendForm({ reason: '', notes: '' });
                  }
                }}
              >
                <div className="su-modal su-modal--wide su-modal--dialog" onClick={(e) => e.stopPropagation()}>
                  <div className="su-modal__head">
                    <h2 className="su-modal__title">{t('pages.subscriptions.suspendModal.title')}</h2>
                    <button
                      type="button"
                      className="su-icon-btn"
                      onClick={() => {
                        setSuspendRow(null);
                        setSuspendForm({ reason: '', notes: '' });
                      }}
                      aria-label={t('pages.subscriptions.actions.close')}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="su-modal__body">
                    <p>{t('pages.subscriptions.suspendModal.body', { name: suspendRow.stableName })}</p>
                    <div className="su-warning su-field--full">
                      <AlertTriangle size={18} aria-hidden />
                      <span>{t('pages.subscriptions.suspendModal.accessWarning')}</span>
                    </div>
                    <div className="su-form-grid su-form-grid--tight-top">
                      <div className="su-field su-field--full">
                        <span className="su-field__label">{t('pages.subscriptions.suspendModal.reason')}</span>
                        <input className="su-input" value={suspendForm.reason} onChange={(e) => setSuspendForm((f) => ({ ...f, reason: e.target.value }))} />
                      </div>
                      <div className="su-field su-field--full">
                        <span className="su-field__label">{t('pages.subscriptions.suspendModal.notesField')}</span>
                        <textarea className="su-textarea" rows={2} value={suspendForm.notes} onChange={(e) => setSuspendForm((f) => ({ ...f, notes: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div className="su-modal__foot">
                    <button
                      type="button"
                      className="su-btn su-btn--ghost"
                      onClick={() => {
                        setSuspendRow(null);
                        setSuspendForm({ reason: '', notes: '' });
                      }}
                    >
                      {t('pages.subscriptions.actions.cancel')}
                    </button>
                    <button type="button" className="su-btn su-btn--danger" onClick={confirmSuspend}>
                      {t('pages.subscriptions.suspendModal.confirm')}
                    </button>
                  </div>
                </div>
              </div>
            ),
            document.body
          )
        : null}
    </div>
  );
}
