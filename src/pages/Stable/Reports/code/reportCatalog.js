/**
 * Report catalog — backend-ready config (titles EN/AR, filters, status).
 */
export const REPORT_CATEGORIES = [
  { id: 'horse', labelKey: 'categories.horse', icon: 'horse' },
  { id: 'rider', labelKey: 'categories.rider', icon: 'rider' },
  { id: 'training', labelKey: 'categories.training', icon: 'training' },
  { id: 'medical', labelKey: 'categories.medical', icon: 'medical' },
  { id: 'inventory', labelKey: 'categories.inventory', icon: 'inventory' },
  { id: 'expense', labelKey: 'categories.expense', icon: 'expense' },
  { id: 'users', labelKey: 'categories.users', icon: 'users' },
  { id: 'stable', labelKey: 'categories.stable', icon: 'stable' },
  { id: 'ai', labelKey: 'categories.ai', icon: 'ai' },
];

const R = (id, category, title, titleAr, description, descriptionAr, filters, status = 'ready') => ({
  id,
  category,
  title,
  titleAr,
  description,
  descriptionAr,
  filters,
  exportFormats: ['PDF', 'Print'],
  status,
});

export const REPORT_CATALOG = [
  // Horse
  R('horse-profile-report', 'horse', 'Horse Profile Report', 'تقرير ملف الخيل', 'Complete horse profile and registration details', 'تقرير شامل لبيانات الخيل والتسجيل', ['horse', 'dateRange']),
  R('horse-identification-report', 'horse', 'Horse Identification Report', 'تقرير تعريف الخيل', 'Passport, microchip, and identification records', 'جواز السفر والشريحة والتعريف', ['horse']),
  R('horse-ownership-report', 'horse', 'Horse Ownership & Registration Report', 'تقرير الملكية والتسجيل', 'Ownership and FEI registration summary', 'ملخص الملكية والتسجيل', ['horse']),
  R('horse-vet-summary-report', 'horse', 'Horse Veterinary Summary', 'ملخص بيطري للخيل', 'Veterinary status and clinical flags', 'الحالة البيطرية والتنبيهات', ['horse', 'dateRange']),
  R('horse-competition-report', 'horse', 'Horse Competition & Qualification Report', 'تقرير المنافسة والتأهيل', 'Competition readiness and qualifications', 'جاهزية المنافسة والتأهيل', ['horse']),
  R('horse-performance-report', 'horse', 'Horse Performance Metrics Report', 'تقرير مؤشرات الأداء', 'Training load and performance KPIs', 'مؤشرات التدريب والأداء', ['horse', 'dateRange']),
  R('horse-tracking-report', 'horse', 'Horse Device & Tracking Report', 'تقرير الأجهزة والتتبع', 'GPS and tracking device summary', 'ملخص أجهزة التتبع', ['horse'], 'comingSoon'),
  R('horse-documents-report', 'horse', 'Horse Documents Report', 'تقرير مستندات الخيل', 'Uploaded documents and certificates', 'المستندات والشهادات', ['horse'], 'requiresData'),

  // Rider
  R('rider-profile-report', 'rider', 'Rider Profile Report', 'تقرير ملف الفارس', 'Rider profile and contact details', 'ملف الفارس وبيانات الاتصال', ['rider']),
  R('rider-qualification-report', 'rider', 'Rider Qualification Report', 'تقرير تأهيل الفارس', 'Licenses and qualification status', 'التراخيص والتأهيل', ['rider']),
  R('rider-performance-report', 'rider', 'Rider Performance Report', 'تقرير أداء الفارس', 'Performance trends and workload', 'اتجاهات الأداء والأحمال', ['rider', 'dateRange']),
  R('rider-training-participation-report', 'rider', 'Rider Training Participation Report', 'تقرير مشاركة التدريب', 'Sessions attended and completion', 'الجلسات والإكمال', ['rider', 'dateRange']),
  R('rider-assigned-horses-report', 'rider', 'Rider Assigned Horses Report', 'تقرير الخيول المعينة', 'Horses assigned to rider', 'الخيول المعينة للفارس', ['rider']),
  R('rider-garmin-report', 'rider', 'Garmin Connection Report', 'تقرير اتصال Garmin', 'Device sync and connection status', 'حالة المزامنة والاتصال', ['rider'], 'comingSoon'),

  // Training
  R('training-daily-report', 'training', 'Daily Training Report', 'تقرير التدريب اليومي', 'Sessions for selected day range', 'جلسات الفترة المحددة', ['dateRange', 'horse', 'rider']),
  R('training-weekly-report', 'training', 'Weekly Training Report', 'تقرير التدريب الأسبوعي', 'Weekly volume and intensity', 'الحجم والشدة الأسبوعية', ['dateRange']),
  R('training-monthly-report', 'training', 'Monthly Training Report', 'تقرير التدريب الشهري', 'Monthly training summary', 'ملخص التدريب الشهري', ['dateRange']),
  R('training-schedule-report', 'training', 'Training Schedule Report', 'تقرير جدول التدريب', 'Planned vs completed sessions', 'المخطط مقابل المكتمل', ['dateRange']),
  R('training-completed-sessions-report', 'training', 'Completed Training Sessions Report', 'تقرير الجلسات المكتملة', 'All completed sessions in range', 'جميع الجلسات المكتملة', ['dateRange', 'horse', 'rider']),
  R('training-library-report', 'training', 'Training Library Report', 'تقرير مكتبة التدريب', 'Training types and templates', 'أنواع وقوالب التدريب', [], 'comingSoon'),
  R('training-horse-history-report', 'training', 'Horse Training History Report', 'تقرير تاريخ تدريب الخيل', 'Per-horse session history', 'تاريخ جلسات الخيل', ['horse', 'dateRange']),
  R('training-rider-history-report', 'training', 'Rider Training History Report', 'تقرير تاريخ تدريب الفارس', 'Per-rider session history', 'تاريخ جلسات الفارس', ['rider', 'dateRange']),
  R('training-calendar-report', 'training', 'Calendar Events Report', 'تقرير أحداث التقويم', 'Scheduled training events', 'أحداث التدريب المجدولة', ['dateRange']),
  R('training-recovery-report', 'training', 'Recovery Periods Report', 'تقرير فترات التعافي', 'Rest and recovery blocks', 'فترات الراحة والتعافي', ['dateRange', 'horse'], 'requiresData'),

  // Medical
  R('medical-summary-report', 'medical', 'Horse Medical Summary', 'ملخص طبي للخيل', 'Overall medical status', 'الحالة الطبية العامة', ['horse', 'dateRange']),
  R('medical-weight-report', 'medical', 'Weight Records Report', 'تقرير سجلات الوزن', 'Weight tracking over time', 'تتبع الوزن', ['horse', 'dateRange']),
  R('medical-physical-exam-report', 'medical', 'Physical Examination Report', 'تقرير الفحص البدني', 'Physical exam findings', 'نتائج الفحص البدني', ['horse', 'dateRange']),
  R('medical-blood-test-report', 'medical', 'Blood Test Report', 'تقرير فحص الدم', 'Laboratory results summary', 'ملخص نتائج المختبر', ['horse', 'dateRange']),
  R('medical-vaccination-report', 'medical', 'Vaccination Report', 'تقرير التطعيمات', 'Vaccination schedule and history', 'جدول وتاريخ التطعيمات', ['horse', 'dateRange']),
  R('medical-medication-courses-report', 'medical', 'Medication Courses Report', 'تقرير دورات الأدوية', 'Active and completed courses', 'الدورات النشطة والمكتملة', ['horse', 'dateRange']),
  R('medical-care-history-report', 'medical', 'Medical Care History Report', 'تقرير تاريخ الرعاية', 'Care events timeline', 'جدول أحداث الرعاية', ['horse', 'dateRange']),
  R('medical-calendar-report', 'medical', 'Medical Calendar Report', 'تقرير التقويم الطبي', 'Upcoming and past medical events', 'الأحداث الطبية', ['dateRange', 'horse']),
  R('medical-quick-check-report', 'medical', 'Post-Training Quick Check Report', 'تقرير الفحص السريع بعد التدريب', 'Quick checks after training', 'فحوصات ما بعد التدريب', ['horse', 'dateRange'], 'requiresData'),
  R('medical-weekly-exam-report', 'medical', 'Weekly Detailed Examination Report', 'تقرير الفحص الأسبوعي المفصل', 'Weekly vet examinations', 'الفحوصات البيطرية الأسبوعية', ['horse', 'dateRange'], 'requiresData'),

  // Inventory
  R('inventory-dashboard-report', 'inventory', 'Inventory Dashboard Report', 'تقرير لوحة المخزون', 'Stock overview across sections', 'نظرة عامة على المخزون', ['dateRange', 'category']),
  R('inventory-medication-stock-report', 'inventory', 'Medication Stock Report', 'تقرير مخزون الأدوية', 'Medication quantities and alerts', 'كميات الأدوية والتنبيهات', ['category']),
  R('inventory-feed-report', 'inventory', 'Feed & Nutrition Report', 'تقرير الأعلاف والتغذية', 'Feed mixes and nutrition stock', 'مخزون الأعلاف والتغذية', ['category']),
  R('inventory-supplies-report', 'inventory', 'Horse Supplies Report', 'تقرير مستلزمات الخيل', 'Tack, blankets, and supplies', 'المعدات والمستلزمات', ['category']),
  R('inventory-low-stock-report', 'inventory', 'Low Stock Report', 'تقرير المخزون المنخفض', 'Items below alert threshold', 'عناصر تحت حد التنبيه', []),
  R('inventory-expiring-report', 'inventory', 'Expiring Items Report', 'تقرير العناصر المنتهية', 'Items nearing expiry', 'عناصر قريبة الانتهاء', []),
  R('inventory-assigned-report', 'inventory', 'Assigned Items Report', 'تقرير العناصر المعينة', 'Stock assigned to horses', 'المخزون المعين للخيول', ['horse']),
  R('inventory-movements-report', 'inventory', 'Stock Movements Report', 'تقرير حركات المخزون', 'In/out movement log', 'سجل الحركات', ['dateRange', 'category']),

  // Expense
  R('expense-monthly-report', 'expense', 'Monthly Expense Report', 'تقرير المصروفات الشهري', 'Expenses by month', 'المصروفات حسب الشهر', ['dateRange', 'category']),
  R('expense-yearly-report', 'expense', 'Yearly Expense Report', 'تقرير المصروفات السنوي', 'Annual expense totals', 'إجماليات سنوية', ['dateRange']),
  R('expense-category-report', 'expense', 'Category Expense Report', 'تقرير المصروفات حسب الفئة', 'Spend by category', 'الإنفاق حسب الفئة', ['dateRange', 'category']),
  R('expense-feed-report', 'expense', 'Feed Expenses Report', 'تقرير مصروفات الأعلاف', 'Feed-related spend', 'مصروفات الأعلاف', ['dateRange']),
  R('expense-medication-report', 'expense', 'Medication Expenses Report', 'تقرير مصروفات الأدوية', 'Veterinary and medication spend', 'مصروفات بيطرية وأدوية', ['dateRange']),
  R('expense-supplies-report', 'expense', 'Supplies Expenses Report', 'تقرير مصروفات المستلزمات', 'Equipment and supplies spend', 'مصروفات المعدات', ['dateRange']),
  R('expense-deferred-report', 'expense', 'Deferred Payments Report', 'تقرير الدفعات المؤجلة', 'Outstanding deferred payments', 'الدفعات المؤجلة', ['dateRange']),
  R('expense-payment-method-report', 'expense', 'Payment Method Summary Report', 'تقرير طرق الدفع', 'Totals by payment method', 'الإجماليات حسب طريقة الدفع', ['dateRange']),
  R('expense-invoice-report', 'expense', 'Invoice Attachments Report', 'تقرير مرفقات الفواتير', 'Expenses with invoice files', 'مصروفات مع فواتير', ['dateRange'], 'comingSoon'),

  // Users
  R('users-stable-report', 'users', 'Stable Users Report', 'تقرير مستخدمي الإسطبل', 'All users and roles', 'جميع المستخدمين والأدوار', ['status']),
  R('users-role-permissions-report', 'users', 'Role Permissions Report', 'تقرير صلاحيات الأدوار', 'Permission matrix by role', 'مصفوفة الصلاحيات', []),
  R('users-access-report', 'users', 'User Access Report', 'تقرير وصول المستخدم', 'Module access per user', 'وصول الوحدات لكل مستخدم', ['status']),
  R('users-activity-report', 'users', 'User Activity Logs', 'سجلات نشاط المستخدم', 'Login and activity history', 'سجل الدخول والنشاط', ['dateRange'], 'comingSoon'),

  // Stable
  R('stable-overview-report', 'stable', 'Stable Overview Report', 'تقرير نظرة عامة على الإسطبل', 'Horses, riders, and operations snapshot', 'لمحة عن الخيول والعمليات', ['dateRange']),
  R('stable-operations-report', 'stable', 'Stable Operations Summary', 'ملخص عمليات الإسطبل', 'Training, health, inventory activity', 'نشاط التدريب والصحة والمخزون', ['dateRange']),
  R('stable-financial-report', 'stable', 'Stable Financial Summary', 'ملخص مالي للإسطبل', 'Expense and budget overview', 'نظرة على المصروفات', ['dateRange']),
  R('stable-health-report', 'stable', 'Stable Health Summary', 'ملخص صحة الإسطبل', 'Herd health status', 'حالة صحة القطيع', ['dateRange']),
  R('stable-performance-report', 'stable', 'Stable Performance Summary', 'ملخص أداء الإسطبل', 'Competition and training KPIs', 'مؤشرات المنافسة والتدريب', ['dateRange']),

  // AI
  R('ai-horse-summary', 'ai', 'AI Horse Summary', 'ملخص ذكاء اصطناعي للخيل', 'AI-generated horse insights', 'رؤى ذكية للخيل', ['horse'], 'comingSoon'),
  R('ai-rider-summary', 'ai', 'AI Rider Summary', 'ملخص ذكاء اصطناعي للفارس', 'AI rider workload insights', 'رؤى أحمال الفارس', ['rider'], 'comingSoon'),
  R('ai-training-insights', 'ai', 'AI Training Insights', 'رؤى التدريب بالذكاء الاصطناعي', 'Training optimization suggestions', 'اقتراحات تحسين التدريب', ['dateRange'], 'comingSoon'),
  R('ai-medical-alerts', 'ai', 'AI Medical Alerts', 'تنبيهات طبية بالذكاء الاصطناعي', 'Predictive health alerts', 'تنبيهات صحية تنبؤية', ['dateRange'], 'comingSoon'),
  R('ai-expense-summary', 'ai', 'AI Expense Summary', 'ملخص مصروفات بالذكاء الاصطناعي', 'Spend anomaly detection', 'كشف شذوذ الإنفاق', ['dateRange'], 'comingSoon'),
  R('ai-stable-performance', 'ai', 'AI Stable Performance Summary', 'ملخص أداء الإسطبل بالذكاء الاصطناعي', 'Holistic stable AI briefing', 'إحاطة شاملة بالذكاء الاصطناعي', ['dateRange'], 'comingSoon'),
];

export function getReportsByCategory(categoryId) {
  return REPORT_CATALOG.filter((r) => r.category === categoryId);
}

export function getReportById(id) {
  return REPORT_CATALOG.find((r) => r.id === id);
}

export function countByCategory(categoryId) {
  return REPORT_CATALOG.filter((r) => r.category === categoryId).length;
}
