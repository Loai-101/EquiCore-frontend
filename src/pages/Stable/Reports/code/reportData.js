/**
 * Build report preview/PDF payloads from dummy tenant data.
 */
import {
  dummyExpenses,
  dummyHealthRecords,
  dummyHorses,
  dummyInventory,
  dummyRiders,
  dummyStableUsers,
  dummyTrainingSessions,
  initialStables,
} from '../../../../services/mock/dummyData';
import { getReportById } from './reportCatalog';

function inDateRange(dateStr, from, to) {
  if (!dateStr) return true;
  const d = dateStr.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

function stableName(stableId) {
  return initialStables.find((s) => s.id === stableId)?.stableName || stableId;
}

function labelPair(labels, key, value) {
  return { label: labels[key] || key, value: value ?? '—' };
}

export function buildReportPayload(reportId, options) {
  const {
    stableId,
    language = 'en',
    dateFrom = '',
    dateTo = '',
    horseId = '',
    riderId = '',
    category = '',
    status = '',
    generatedBy = 'EquiCore User',
  } = options;

  const report = getReportById(reportId);
  const isAr = language === 'ar';
  const L = (en, ar) => (isAr ? ar : en);

  const horses = dummyHorses.filter((h) => h.stableId === stableId);
  const riders = dummyRiders.filter((r) => r.stableId === stableId);
  const training = dummyTrainingSessions.filter(
    (t) => t.stableId === stableId && inDateRange(t.date, dateFrom, dateTo)
  );
  const health = dummyHealthRecords.filter(
    (h) => h.stableId === stableId && inDateRange(h.date, dateFrom, dateTo)
  );
  const inventory = dummyInventory.filter((i) => i.stableId === stableId);
  const expenses = dummyExpenses.filter(
    (e) => e.stableId === stableId && inDateRange(e.date, dateFrom, dateTo)
  );
  const users = dummyStableUsers.filter((u) => u.stableId === stableId);

  let filteredTraining = training;
  let filteredHealth = health;
  let filteredExpenses = expenses;

  if (horseId) {
    const horse = horses.find((h) => h.id === horseId);
    const horseName = horse?.name;
    filteredTraining = filteredTraining.filter((t) => t.horse === horseName);
    filteredHealth = filteredHealth.filter((h) => h.horseName === horseName);
    filteredExpenses = filteredExpenses.filter(
      (e) => e.relatedHorse === horseName || e.relatedHorses?.includes?.(horseName)
    );
  }
  if (riderId) {
    const rider = riders.find((r) => r.id === riderId);
    const riderName = rider?.name;
    filteredTraining = filteredTraining.filter((t) => t.rider === riderName);
  }
  if (category) {
    filteredExpenses = filteredExpenses.filter((e) => e.category === category);
  }
  if (status) {
    // users status filter
  }

  const dateRangeLabel =
    dateFrom || dateTo
      ? `${dateFrom || '…'} — ${dateTo || '…'}`
      : L('All dates', 'كل التواريخ');

  const base = {
    reportId,
    reportTitle: isAr ? report?.titleAr : report?.title,
    language,
    stableName: stableName(stableId),
    generatedBy,
    generatedAt: new Date().toLocaleString(isAr ? 'ar-BH' : 'en-GB'),
    dateRange: dateRangeLabel,
    filtersUsed: [],
    summary: [],
    tableColumns: [],
    tableRows: [],
    notes: L(
      'This report was generated from EquiCore demo data. Connect the API for live exports.',
      'تم إنشاء هذا التقرير من بيانات تجريبية. اربط واجهة البرمجة للتصدير المباشر.'
    ),
  };

  if (!report || report.status === 'comingSoon') {
    return {
      ...base,
      summary: [labelPair({ s: L('Status', 'الحالة') }, 's', L('Coming soon', 'قريباً'))],
      tableColumns: [L('Message', 'رسالة')],
      tableRows: [[L('This report will be available in a future release.', 'سيتوفر هذا التقرير في إصدار لاحق.')]],
    };
  }

  // Horse reports
  if (reportId.startsWith('horse-')) {
    const horse = horseId ? horses.find((h) => h.id === horseId) : horses[0];
    base.filtersUsed = [
      horse ? `${L('Horse', 'الحصان')}: ${horse.name}` : L('All horses', 'كل الخيول'),
      dateRangeLabel,
    ];
    base.summary = horse
      ? [
          labelPair({ n: L('Name', 'الاسم') }, 'n', horse.name),
          labelPair({ p: L('Passport', 'جواز السفر') }, 'p', horse.passportNumber),
          labelPair({ m: L('Microchip', 'الشريحة') }, 'm', horse.microchip),
          labelPair({ b: L('Breed', 'السلالة') }, 'b', horse.breed),
          labelPair({ s: L('Status', 'الحالة') }, 's', horse.status),
          labelPair({ r: L('Assigned rider', 'الفارس') }, 'r', horse.assignedRider),
        ]
      : [labelPair({ c: L('Total horses', 'إجمالي الخيول') }, 'c', String(horses.length))];
    base.tableColumns = [
      L('Name', 'الاسم'),
      L('Breed', 'السلالة'),
      L('Sport', 'الرياضة'),
      L('Status', 'الحالة'),
      L('Rider', 'الفارس'),
    ];
    base.tableRows = (horseId && horse ? [horse] : horses).map((h) => [
      h.name,
      h.breed,
      h.sportType,
      h.status,
      h.assignedRider || '—',
    ]);
    return base;
  }

  // Rider reports
  if (reportId.startsWith('rider-')) {
    const rider = riderId ? riders.find((r) => r.id === riderId) : null;
    base.filtersUsed = [rider ? `${L('Rider', 'الفارس')}: ${rider.name}` : L('All riders', 'كل الفرسان')];
    base.summary = rider
      ? [
          labelPair({ n: L('Name', 'الاسم') }, 'n', rider.name),
          labelPair({ e: L('Experience', 'الخبرة') }, 'e', rider.experienceLevel),
          labelPair({ w: L('Weight', 'الوزن') }, 'w', `${rider.weight} kg`),
          labelPair({ g: L('Garmin', 'Garmin') }, 'g', rider.garminConnected ? L('Connected', 'متصل') : L('No', 'لا')),
        ]
      : [labelPair({ c: L('Total riders', 'إجمالي الفرسان') }, 'c', String(riders.length))];
    base.tableColumns = [
      L('Name', 'الاسم'),
      L('Nationality', 'الجنسية'),
      L('Experience', 'الخبرة'),
      L('Horses', 'الخيول'),
      L('Garmin', 'Garmin'),
    ];
    base.tableRows = (rider ? [rider] : riders).map((r) => [
      r.name,
      r.nationality,
      r.experienceLevel,
      r.assignedHorses,
      r.garminConnected ? L('Yes', 'نعم') : L('No', 'لا'),
    ]);
    return base;
  }

  // Training reports
  if (reportId.startsWith('training-')) {
    base.filtersUsed = [dateRangeLabel, horseId && L('Horse filter', 'تصفية الحصان'), riderId && L('Rider filter', 'تصفية الفارس')].filter(Boolean);
    const totalDist = filteredTraining.reduce((s, t) => s + (Number(t.distance) || 0), 0);
    base.summary = [
      labelPair({ s: L('Sessions', 'الجلسات') }, 's', String(filteredTraining.length)),
      labelPair({ d: L('Total distance (km)', 'المسافة الكلية') }, 'd', totalDist.toFixed(1)),
    ];
    base.tableColumns = [
      L('Date', 'التاريخ'),
      L('Horse', 'الحصان'),
      L('Rider', 'الفارس'),
      L('Type', 'النوع'),
      L('Distance', 'المسافة'),
      L('Condition', 'الحالة'),
    ];
    base.tableRows = filteredTraining.map((t) => [
      t.date,
      t.horse,
      t.rider,
      t.trainingType,
      `${t.distance} km`,
      t.conditionAfter,
    ]);
    return base;
  }

  // Medical reports
  if (reportId.startsWith('medical-')) {
    base.filtersUsed = [dateRangeLabel, horseId && L('Horse filter', 'تصفية الحصان')].filter(Boolean);
    base.summary = [
      labelPair({ r: L('Records', 'السجلات') }, 'r', String(filteredHealth.length)),
    ];
    base.tableColumns = [
      L('Date', 'التاريخ'),
      L('Horse', 'الحصان'),
      L('Section', 'القسم'),
      L('Title', 'العنوان'),
      L('Detail', 'التفاصيل'),
    ];
    base.tableRows = filteredHealth.map((h) => [
      h.date,
      h.horseName,
      h.section,
      h.title,
      h.detail,
    ]);
    return base;
  }

  // Inventory reports
  if (reportId.startsWith('inventory-')) {
    let items = inventory;
    if (reportId.includes('low-stock')) {
      items = items.filter((i) => i.quantity <= (i.minStock || 2));
    }
    if (reportId.includes('expiring')) {
      items = items.filter((i) => i.expiryDate);
    }
    base.summary = [
      labelPair({ i: L('Line items', 'البنود') }, 'i', String(items.length)),
    ];
    base.tableColumns = [
      L('Item', 'الصنف'),
      L('Category', 'الفئة'),
      L('Qty', 'الكمية'),
      L('Min', 'الحد الأدنى'),
      L('Supplier', 'المورد'),
      L('Expiry', 'الانتهاء'),
    ];
    base.tableRows = items.map((i) => [
      i.itemName,
      i.category,
      String(i.quantity),
      String(i.minStock),
      i.supplier,
      i.expiryDate || '—',
    ]);
    return base;
  }

  // Expense reports
  if (reportId.startsWith('expense-')) {
    let rows = filteredExpenses;
    if (reportId.includes('deferred')) {
      rows = rows.filter((e) => e.paymentStatus === 'Deferred');
    }
    if (reportId.includes('feed')) rows = rows.filter((e) => e.category === 'Feed');
    if (reportId.includes('medication')) rows = rows.filter((e) => e.category === 'Veterinary');
    if (reportId.includes('supplies')) rows = rows.filter((e) => e.category === 'Equipment');
    const total = rows.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    base.summary = [
      labelPair({ t: L('Transactions', 'المعاملات') }, 't', String(rows.length)),
      labelPair({ a: L('Total (BHD)', 'الإجمالي') }, 'a', total.toLocaleString(isAr ? 'ar-BH' : 'en-BH', { minimumFractionDigits: 3 })),
    ];
    base.tableColumns = [
      L('Date', 'التاريخ'),
      L('Category', 'الفئة'),
      L('Supplier', 'المورد'),
      L('Amount', 'المبلغ'),
      L('Payment', 'الدفع'),
      L('Status', 'الحالة'),
    ];
    base.tableRows = rows.map((e) => [
      e.date,
      e.category,
      e.supplier,
      `BHD ${Number(e.amount).toLocaleString(isAr ? 'ar-BH' : 'en-BH', { minimumFractionDigits: 3 })}`,
      e.paymentMethod,
      e.paymentStatus || 'Paid',
    ]);
    return base;
  }

  // Users reports
  if (reportId.startsWith('users-')) {
    let list = users;
    if (status) list = list.filter((u) => u.status === status);
    base.summary = [labelPair({ u: L('Users', 'المستخدمون') }, 'u', String(list.length))];
    base.tableColumns = [
      L('Name', 'الاسم'),
      L('Role', 'الدور'),
      L('Email', 'البريد'),
      L('Status', 'الحالة'),
      L('Last login', 'آخر دخول'),
    ];
    base.tableRows = list.map((u) => [u.name, u.role, u.email, u.status, u.lastLogin]);
    return base;
  }

  // Stable reports
  if (reportId.startsWith('stable-')) {
    const expTotal = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    base.summary = [
      labelPair({ h: L('Horses', 'الخيول') }, 'h', String(horses.length)),
      labelPair({ r: L('Riders', 'الفرسان') }, 'r', String(riders.length)),
      labelPair({ t: L('Training sessions', 'جلسات التدريب') }, 't', String(training.length)),
      labelPair({ e: L('Expenses (BHD)', 'المصروفات') }, 'e', expTotal.toLocaleString(isAr ? 'ar-BH' : 'en-BH', { minimumFractionDigits: 3 })),
    ];
    base.tableColumns = [L('Module', 'الوحدة'), L('Metric', 'المؤشر'), L('Value', 'القيمة')];
    base.tableRows = [
      [L('Horses', 'الخيول'), L('Active', 'نشط'), String(horses.filter((h) => h.status === 'Competing').length)],
      [L('Training', 'التدريب'), L('Sessions (range)', 'الجلسات'), String(training.length)],
      [L('Health', 'الصحة'), L('Records', 'السجلات'), String(health.length)],
      [L('Inventory', 'المخزون'), L('SKUs', 'الأصناف'), String(inventory.length)],
      [L('Expenses', 'المصروفات'), L('Total BHD', 'الإجمالي'), expTotal.toFixed(3)],
    ];
    return base;
  }

  // Default fallback
  base.tableColumns = [L('Field', 'الحقل'), L('Value', 'القيمة')];
  base.tableRows = [[L('Report', 'التقرير'), report?.title || reportId]];
  return base;
}
