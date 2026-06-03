/**
 * Inventory Management — medications, feed, supplies, movements, assignments (frontend demo).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Package,
  Pill,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShoppingBag,
  Sprout,
  LayoutDashboard,
  ArrowLeftRight,
  Link2,
  Filter,
  Eye,
  Pencil,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../../../context/AuthContext';
import { DEFAULT_HORSE_IMAGE_URL } from '../../Horses/code/horseMediaLibrary';
import {
  stableDashboardChartAxisTick,
  stableDashboardChartTooltipContentStyle,
} from '../../../../utils/chartUiConfig';
import '../styles/Inventory.css';

const DEMO_TODAY = new Date(2026, 4, 17);
const EXPIRING_DAYS = 60;

const TABS = [
  { id: 'dashboard', labelKey: 'tabs.dashboard', icon: LayoutDashboard },
  { id: 'medications', labelKey: 'tabs.medications', icon: Pill },
  { id: 'feed', labelKey: 'tabs.feed', icon: Sprout },
  { id: 'supplies', labelKey: 'tabs.supplies', icon: ShoppingBag },
  { id: 'movements', labelKey: 'tabs.movements', icon: ArrowLeftRight },
  { id: 'assignments', labelKey: 'tabs.assignments', icon: Link2 },
];

const MED_CATEGORIES = ['Anti-inflammatory', 'Antibiotic', 'Supplement', 'Pain management', 'Gastrointestinal', 'Respiratory', 'Other'];
const MED_UNITS = ['ml', 'tablets', 'bottles', 'sachets', 'tubes', 'units'];
const MED_ROUTES = ['IV', 'IM', 'Oral', 'Topical', 'Other'];
const MED_ASSIGNED_TYPES = ['Single Horse', 'Horse Group', 'Medication Course', 'General Stock'];

const FEED_TYPES = ['Hay', 'Alfalfa', 'Oats', 'Concentrate', 'Electrolytes', 'Supplements', 'Custom Mix'];
const FEED_UNITS = ['kg', 'bags', 'scoops', 'bales', 'containers'];
const FEED_FREQ = ['Once daily', 'Twice daily', 'Three times daily', 'Before training', 'After training', 'Custom'];
const FEED_ASSIGNED_TYPES = ['Single Horse', 'Horse Group', 'General Stable Feed'];

const SUPPLY_CATEGORIES = ['Saddle', 'Bridle', 'Halter', 'Lead rope', 'Horse boots', 'Bandages', 'Blankets', 'Grooming tools', 'Buckets', 'Stable tools', 'Rider equipment', 'Worker equipment', 'Other'];
const SUPPLY_UNITS = ['piece', 'set', 'box', 'pair', 'unit'];
const SUPPLY_CONDITIONS = ['New', 'Good', 'Needs Maintenance', 'Damaged', 'Retired'];
const SUPPLY_ASSIGNED_TYPES = ['Horse', 'Rider', 'Worker / Staff', 'General Stable'];

const MOVEMENT_TYPES = ['Stock In', 'Stock Out', 'Assigned', 'Returned', 'Damaged', 'Expired'];
const SECTIONS = ['Medications', 'Feed & Nutrition', 'Horse Supplies'];
const STOCK_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock', 'Expiring Soon', 'Expired', 'Assigned'];
const MED_COURSES = ['Recovery Course A', 'Endurance Support B', 'Post-Training Care'];

const DEMO_HORSES = [
  { id: 'horse_001', name: 'Thunder' },
  { id: 'horse_002', name: 'Desert Pearl' },
  { id: 'horse_003', name: 'Royal Flame' },
  { id: 'horse_004', name: 'Silver Arrow' },
];

const DEMO_RIDERS = [
  { id: 'rider_001', name: 'Ahmed Al-Mansoori' },
  { id: 'rider_002', name: 'Khalid Hassan' },
  { id: 'rider_003', name: 'Sara Al-Khalifa' },
  { id: 'rider_004', name: 'Mohammed Al-Salem' },
];

const DEMO_STAFF = [
  { id: 'staff_doctor', name: 'Doctor' },
  { id: 'staff_trainer', name: 'Trainer' },
  { id: 'staff_worker', name: 'Stable Worker' },
];

let idCounter = 100;

function nextId(prefix) {
  idCounter += 1;
  return `${prefix}${idCounter}`;
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(iso) {
  if (!iso) return null;
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysUntil(iso) {
  const d = parseDate(iso);
  if (!d) return null;
  return Math.ceil((d - DEMO_TODAY) / (1000 * 60 * 60 * 24));
}

function computeStockStatus({ stockQuantity, lowStockAlert, expiryDate, assignedType }) {
  const qty = Number(stockQuantity) || 0;
  const low = Number(lowStockAlert) || 0;
  const days = daysUntil(expiryDate);
  if (days !== null && days < 0) return 'Expired';
  if (qty <= 0) return 'Out of Stock';
  if (days !== null && days >= 0 && days <= EXPIRING_DAYS) return 'Expiring Soon';
  if (qty <= low) return 'Low Stock';
  if (assignedType && !['General Stock', 'General Stable Feed', 'General Stable'].includes(assignedType)) {
    return 'Assigned';
  }
  return 'In Stock';
}

function withUpdatedAt(items, iso) {
  return items.map((item) => ({ ...item, updatedAt: item.updatedAt || iso }));
}

function buildInitialStore(stableId) {
  return {
    medications: withUpdatedAt([
      {
        id: 'med_001',
        stableId,
        image: '',
        name: 'Electrolyte Solution',
        category: 'Supplement',
        description: 'Post-training electrolyte support.',
        stockQuantity: 10,
        unit: 'bottles',
        lowStockAlert: 2,
        expiryDate: '2026-12-31',
        route: 'Oral',
        administrationNotes: 'Use only as approved by veterinarian.',
        assignedType: 'Single Horse',
        assignedHorseIds: ['horse_001'],
        assignedGroupName: '',
        medicationCourse: '',
        supplier: 'Vet Supplier',
        purchasePrice: 25,
        status: 'In Stock',
        notes: '',
      },
      {
        id: 'med_002',
        stableId,
        image: '',
        name: 'Anti-inflammatory Gel',
        category: 'Anti-inflammatory',
        description: 'Topical application for limbs.',
        stockQuantity: 3,
        unit: 'tubes',
        lowStockAlert: 4,
        expiryDate: '2026-08-15',
        route: 'Topical',
        administrationNotes: '5 ml after veterinary approval — no auto dosage.',
        assignedType: 'Horse Group',
        assignedHorseIds: ['horse_001', 'horse_002'],
        assignedGroupName: 'Endurance Group',
        medicationCourse: '',
        supplier: 'Equine Pharmacy',
        purchasePrice: 42,
        status: 'Low Stock',
        notes: '',
      },
      {
        id: 'med_003',
        stableId,
        image: '',
        name: 'Respiratory Support Syrup',
        category: 'Respiratory',
        description: '',
        stockQuantity: 6,
        unit: 'bottles',
        lowStockAlert: 2,
        expiryDate: '2026-06-20',
        route: 'Oral',
        administrationNotes: 'Record only — vet must approve administration.',
        assignedType: 'Medication Course',
        assignedHorseIds: [],
        assignedGroupName: '',
        medicationCourse: 'Recovery Course A',
        supplier: 'Vet Supplier',
        purchasePrice: 38,
        status: 'Expiring Soon',
        notes: '',
      },
    ], '2026-05-17T08:00:00.000Z'),
    feed: withUpdatedAt([
      {
        id: 'feed_001',
        stableId,
        image: '',
        mixName: 'Endurance Morning Mix',
        feedType: 'Custom Mix',
        description: 'Morning endurance ration.',
        ingredientsNotes: 'Hay, oats, electrolytes',
        quantity: 50,
        unit: 'kg',
        feedingFrequency: 'Twice daily',
        assignedType: 'Horse Group',
        assignedHorseIds: ['horse_001', 'horse_002'],
        servingNotes: '2 scoops morning and evening',
        supplier: 'Feed Supplier',
        purchaseDate: '2026-05-10',
        expiryDate: '',
        cost: 80,
        status: 'In Stock',
        notes: '',
      },
      {
        id: 'feed_002',
        stableId,
        image: '',
        mixName: 'Recovery Feed Mix',
        feedType: 'Concentrate',
        description: '',
        ingredientsNotes: 'Recovery concentrate blend',
        quantity: 8,
        unit: 'bags',
        feedingFrequency: 'After training',
        assignedType: 'Single Horse',
        assignedHorseIds: ['horse_003'],
        servingNotes: '1 scoop after session',
        supplier: 'Feed Supplier',
        purchaseDate: '2026-05-12',
        expiryDate: '2026-11-01',
        cost: 55,
        status: 'In Stock',
        notes: '',
      },
      {
        id: 'feed_003',
        stableId,
        image: '',
        mixName: 'Premium Hay',
        feedType: 'Hay',
        description: '',
        ingredientsNotes: 'Premium timothy hay',
        quantity: 12,
        unit: 'bales',
        feedingFrequency: 'Twice daily',
        assignedType: 'General Stable Feed',
        assignedHorseIds: [],
        servingNotes: 'Free choice in paddock',
        supplier: 'Local Hay Co',
        purchaseDate: '2026-05-15',
        expiryDate: '',
        cost: 120,
        status: 'In Stock',
        notes: '',
      },
      {
        id: 'feed_004',
        stableId,
        image: '',
        mixName: 'Oats Mix',
        feedType: 'Oats',
        description: '',
        ingredientsNotes: 'Whole oats blend',
        quantity: 2,
        unit: 'bags',
        feedingFrequency: 'Once daily',
        assignedType: 'Single Horse',
        assignedHorseIds: ['horse_004'],
        servingNotes: '1 scoop daily',
        supplier: 'Feed Supplier',
        purchaseDate: '2026-05-17',
        expiryDate: '',
        cost: 35,
        status: 'Low Stock',
        notes: '',
      },
    ], '2026-05-16T10:00:00.000Z'),
    supplies: withUpdatedAt([
      {
        id: 'sup_001',
        stableId,
        image: '',
        itemName: 'Cooling Boots',
        category: 'Horse boots',
        description: 'Set of four cooling boots.',
        quantity: 4,
        unit: 'set',
        condition: 'Good',
        assignedType: 'Horse',
        assignedHorseIds: ['horse_001'],
        assignedRiderIds: [],
        assignedStaffIds: [],
        purchaseDate: '2026-05-17',
        supplier: 'Equipment Supplier',
        cost: 120,
        maintenanceDate: '',
        status: 'Assigned',
        notes: '',
      },
      {
        id: 'sup_002',
        stableId,
        image: '',
        itemName: 'Endurance Saddle',
        category: 'Saddle',
        description: '',
        quantity: 1,
        unit: 'piece',
        condition: 'Good',
        assignedType: 'Horse',
        assignedHorseIds: ['horse_002'],
        assignedRiderIds: [],
        assignedStaffIds: [],
        purchaseDate: '2026-04-01',
        supplier: 'Tack Shop',
        cost: 2400,
        maintenanceDate: '2026-08-01',
        status: 'Assigned',
        notes: '',
      },
      {
        id: 'sup_003',
        stableId,
        image: '',
        itemName: 'Grooming Kit',
        category: 'Grooming tools',
        description: '',
        quantity: 3,
        unit: 'set',
        condition: 'Good',
        assignedType: 'Worker / Staff',
        assignedHorseIds: [],
        assignedRiderIds: [],
        assignedStaffIds: ['staff_worker'],
        purchaseDate: '2026-03-20',
        supplier: 'Stable Supply',
        cost: 45,
        maintenanceDate: '',
        status: 'In Stock',
        notes: '',
      },
      {
        id: 'sup_004',
        stableId,
        image: '',
        itemName: 'Stable Blanket',
        category: 'Blankets',
        description: '',
        quantity: 6,
        unit: 'piece',
        condition: 'Needs Maintenance',
        assignedType: 'General Stable',
        assignedHorseIds: [],
        assignedRiderIds: [],
        assignedStaffIds: [],
        purchaseDate: '2025-11-10',
        supplier: 'Blanket Co',
        cost: 90,
        maintenanceDate: '2026-05-20',
        status: 'Low Stock',
        notes: 'One blanket needs repair',
      },
    ], '2026-05-15T12:00:00.000Z'),
    movements: [
      {
        id: 'mov_001',
        stableId,
        date: '2026-05-16',
        itemName: 'Electrolyte Solution',
        section: 'Medications',
        movementType: 'Stock In',
        quantity: 5,
        relatedLabel: '—',
        recordedBy: 'Stable Worker',
        notes: 'Weekly restock',
      },
      {
        id: 'mov_002',
        stableId,
        date: '2026-05-15',
        itemName: 'Cooling Boots',
        section: 'Horse Supplies',
        movementType: 'Assigned',
        quantity: 1,
        relatedLabel: 'Thunder',
        recordedBy: 'Trainer',
        notes: '',
      },
      {
        id: 'mov_003',
        stableId,
        date: '2026-05-14',
        itemName: 'Endurance Morning Mix',
        section: 'Feed & Nutrition',
        movementType: 'Stock Out',
        quantity: 10,
        relatedLabel: 'Endurance Group',
        recordedBy: 'Stable Worker',
        notes: 'Morning feeding',
      },
    ],
  };
}

const ENUM_MAPS = {
  stockStatus: {
    'In Stock': 'inStock',
    'Low Stock': 'lowStock',
    'Out of Stock': 'outOfStock',
    'Expiring Soon': 'expiringSoon',
    Expired: 'expired',
    Assigned: 'assigned',
  },
  section: {
    Medications: 'medications',
    'Feed & Nutrition': 'feed',
    'Horse Supplies': 'supplies',
  },
  medCategory: {
    'Anti-inflammatory': 'antiInflammatory',
    Antibiotic: 'antibiotic',
    Supplement: 'supplement',
    'Pain management': 'painManagement',
    Gastrointestinal: 'gastrointestinal',
    Respiratory: 'respiratory',
    Other: 'other',
  },
  route: { IV: 'iv', IM: 'im', Oral: 'oral', Topical: 'topical', Other: 'other' },
  movementType: {
    'Stock In': 'stockIn',
    'Stock Out': 'stockOut',
    Assigned: 'assigned',
    Returned: 'returned',
    Damaged: 'damaged',
    Expired: 'expired',
  },
  assignedType: {
    'Single Horse': 'singleHorse',
    'Horse Group': 'horseGroup',
    'Medication Course': 'medicationCourse',
    'General Stock': 'generalStock',
    'General Stable Feed': 'generalStableFeed',
    Horse: 'horse',
    Rider: 'rider',
    'Worker / Staff': 'workerStaff',
    'General Stable': 'generalStable',
  },
};

function useInventoryI18n() {
  const { t, i18n } = useTranslation();
  const ti = useCallback((key, opts) => t(`pages.inventory.${key}`, opts), [t]);

  const translateEnum = useCallback((ns, map, value) => {
    const slug = map[value];
    return slug ? t(`pages.inventory.enums.${ns}.${slug}`, { defaultValue: value }) : value;
  }, [t]);

  return {
    ti,
    language: i18n.language,
    translateStockStatus: (v) => translateEnum('stockStatus', ENUM_MAPS.stockStatus, v),
    translateSection: (v) => translateEnum('section', ENUM_MAPS.section, v),
    translateMedCategory: (v) => translateEnum('medCategory', ENUM_MAPS.medCategory, v),
    translateRoute: (v) => translateEnum('route', ENUM_MAPS.route, v),
    translateMovementType: (v) => translateEnum('movementType', ENUM_MAPS.movementType, v),
    translateAssignedType: (v) => translateEnum('assignedType', ENUM_MAPS.assignedType, v),
  };
}

function badgeTone(status) {
  const v = String(status || '').toLowerCase();
  if (['in stock'].includes(v)) return 'positive';
  if (['low stock', 'expiring soon', 'assigned'].includes(v)) return 'warning';
  if (['out of stock', 'expired', 'damaged'].includes(v)) return 'danger';
  return 'neutral';
}

function Modal({ open, title, subtitle, onClose, children, wide, foot, closeLabel }) {
  if (!open) return null;
  return (
    <div className="inv-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`inv-modal${wide ? ' inv-modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="inv-modal__head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p className="inv-modal__subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="inv-modal__close" onClick={onClose} aria-label={closeLabel}>
            <X size={20} />
            </button>
        </header>
        <div className="inv-modal__body">{children}</div>
        {foot ? <footer className="inv-modal__foot">{foot}</footer> : null}
      </div>
    </div>
  );
}

function ImageUpload({ label, preview, onFile }) {
  const ref = useRef(null);
  return (
    <label className="inv-upload">
      {preview ? (
        <img src={preview} alt="" className={preview === DEFAULT_HORSE_IMAGE_URL ? 'inv-item-card__img--default' : ''} />
      ) : (
        <Package size={28} aria-hidden />
      )}
      <span>{label}</span>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="inv-sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </label>
  );
}

function GlobalFilters({ filters, onChange, onReset, ti, translateStockStatus, translateSection, showSection }) {
  return (
    <div className="inv-filters">
      <label className="inv-search">
        <Search size={18} aria-hidden />
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder={ti('filters.searchPlaceholder')}
        />
      </label>
      {showSection ? (
        <label className="inv-filter-select">
          <Filter size={16} aria-hidden />
          <select value={filters.section} onChange={(e) => onChange({ ...filters, section: e.target.value })}>
            <option value="">{ti('filters.allSections')}</option>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>{translateSection(s)}</option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="inv-filter-select">
        <select value={filters.stockStatus} onChange={(e) => onChange({ ...filters, stockStatus: e.target.value })}>
          <option value="">{ti('filters.allStockStatuses')}</option>
          {STOCK_STATUSES.map((s) => (
            <option key={s} value={s}>{translateStockStatus(s)}</option>
          ))}
        </select>
      </label>
      <label className="inv-filter-select">
        <select value={filters.expiryStatus} onChange={(e) => onChange({ ...filters, expiryStatus: e.target.value })}>
          <option value="">{ti('filters.allExpiry')}</option>
          <option value="expiring">{ti('filters.expiringSoon')}</option>
          <option value="expired">{ti('filters.expired')}</option>
        </select>
      </label>
      <button type="button" className="inv-btn inv-btn--ghost" onClick={onReset}>
        <RotateCcw size={16} aria-hidden /> {ti('filters.reset')}
            </button>
          </div>
  );
}

function StatusBadge({ status, translate }) {
  return (
    <span className={`inv-badge inv-badge--${badgeTone(status)}`}>{translate(status)}</span>
  );
}

function InvChartCard({ title, children, className = '' }) {
  return (
    <div className={`inv-chart-card${className ? ` ${className}` : ''}`}>
      <h4>{title}</h4>
      <div className="inv-chart-card__body">{children}</div>
    </div>
  );
}

function InvChartContainer({ children, height = INV_CHART_HEIGHT }) {
  return (
    <ResponsiveContainer width="100%" height={height} debounce={80}>
      {children}
    </ResponsiveContainer>
  );
}

function horseNames(ids) {
  return ids.map((id) => DEMO_HORSES.find((h) => h.id === id)?.name).filter(Boolean).join(', ');
}

function formatAssignedMed(item, ti) {
  if (item.assignedType === 'Single Horse') return horseNames(item.assignedHorseIds) || '—';
  if (item.assignedType === 'Horse Group') return item.assignedGroupName || horseNames(item.assignedHorseIds) || '—';
  if (item.assignedType === 'Medication Course') return item.medicationCourse || '—';
  return ti('enums.assignedType.generalStock');
}

function formatAssignedFeed(item, ti) {
  if (item.assignedType === 'Single Horse') return horseNames(item.assignedHorseIds) || '—';
  if (item.assignedType === 'Horse Group') return horseNames(item.assignedHorseIds) || '—';
  return ti('enums.assignedType.generalStableFeed');
}

function formatAssignedSupply(item, ti) {
  if (item.assignedType === 'Horse') return horseNames(item.assignedHorseIds) || '—';
  if (item.assignedType === 'Rider') {
    return item.assignedRiderIds.map((id) => DEMO_RIDERS.find((r) => r.id === id)?.name).filter(Boolean).join(', ') || '—';
  }
  if (item.assignedType === 'Worker / Staff') {
    return item.assignedStaffIds.map((id) => DEMO_STAFF.find((s) => s.id === id)?.name).filter(Boolean).join(', ') || '—';
  }
  return ti('enums.assignedType.generalStable');
}

function refreshStatuses(items, qtyKey, lowKey, expiryKey, assignedKey) {
  return items.map((item) => ({
    ...item,
    status: computeStockStatus({
      stockQuantity: item[qtyKey],
      lowStockAlert: item[lowKey],
      expiryDate: item[expiryKey],
      assignedType: item[assignedKey],
    }),
  }));
}

const STATUS_CHART_COLORS = ['#27ae60', '#c9a227', '#c0392b', '#e67e22', '#95a5a6', '#2980b9'];
const INV_CHART_HEIGHT = 252;
const INV_BAR_MARGIN = { top: 12, right: 16, left: 8, bottom: 8 };
const INV_BAR_MARGIN_X = { top: 12, right: 16, left: 8, bottom: 52 };
const INV_AXIS_TICK = { ...stableDashboardChartAxisTick, fontSize: 11 };

function toStockRow(item, section) {
  const name = item.name || item.mixName || item.itemName;
  const qty = Number(item.stockQuantity ?? item.quantity ?? 0);
  const low = Number(item.lowStockAlert ?? (section === 'Feed & Nutrition' ? 3 : 2));
  const updated = (item.updatedAt || item.purchaseDate || '').slice(0, 10);
  return {
    id: item.id,
    section,
    name,
    qty,
    low,
    unit: item.unit || '',
    status: item.status,
    updated,
  };
}

function applyMovementToStock(prevStore, movement) {
  const { itemName, section, movementType, quantity } = movement;
  const qty = Number(quantity) || 0;
  if (!qty || !itemName) return prevStore;

  const delta = ['Stock In', 'Returned'].includes(movementType) ? qty
    : ['Stock Out', 'Assigned', 'Damaged', 'Expired'].includes(movementType) ? -qty
    : 0;
  if (delta === 0) return prevStore;

  const now = new Date().toISOString();
  const patch = (list, nameKey, qtyKey) => list.map((item) => {
    if ((item[nameKey] || '') !== itemName) return item;
    const nextQty = Math.max(0, (Number(item[qtyKey]) || 0) + delta);
    return { ...item, [qtyKey]: nextQty, updatedAt: now };
  });

  if (section === 'Medications') {
    return { ...prevStore, medications: patch(prevStore.medications, 'name', 'stockQuantity') };
  }
  if (section === 'Feed & Nutrition') {
    return { ...prevStore, feed: patch(prevStore.feed, 'mixName', 'quantity') };
  }
  if (section === 'Horse Supplies') {
    return { ...prevStore, supplies: patch(prevStore.supplies, 'itemName', 'quantity') };
  }
  return prevStore;
}

export default function Inventory() {
  const { stableId } = useAuth();
  const { ti, translateStockStatus, translateSection, translateMedCategory, translateRoute, translateMovementType, translateAssignedType } = useInventoryI18n();

  const [tab, setTab] = useState('dashboard');
  const [store, setStore] = useState(() => buildInitialStore(stableId || 'stable_001'));
  const [filters, setFilters] = useState({ search: '', section: '', category: '', assignedTo: '', stockStatus: '', expiryStatus: '' });
  const [assignFilters, setAssignFilters] = useState({ entityType: '', name: '', section: '', status: '' });

  const [medModal, setMedModal] = useState(false);
  const [feedModal, setFeedModal] = useState(false);
  const [supplyModal, setSupplyModal] = useState(false);
  const [movModal, setMovModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const urlRefs = useRef([]);

  useEffect(() => () => {
    urlRefs.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const registerUrl = (url) => {
    urlRefs.current.push(url);
    return url;
  };

  const medications = useMemo(
    () => refreshStatuses(store.medications, 'stockQuantity', 'lowStockAlert', 'expiryDate', 'assignedType'),
    [store.medications],
  );
  const feed = useMemo(
    () => refreshStatuses(store.feed.map((f) => ({ ...f, stockQuantity: f.quantity, lowStockAlert: 3 })), 'stockQuantity', 'lowStockAlert', 'expiryDate', 'assignedType'),
    [store.feed],
  );
  const supplies = useMemo(
    () => refreshStatuses(store.supplies.map((s) => ({ ...s, stockQuantity: s.quantity, lowStockAlert: 2 })), 'stockQuantity', 'lowStockAlert', 'maintenanceDate', 'assignedType'),
    [store.supplies],
  );

  const metrics = useMemo(() => {
    const lowMed = medications.filter((m) => ['Low Stock', 'Out of Stock'].includes(m.status)).length;
    const expMed = medications.filter((m) => ['Expiring Soon', 'Expired'].includes(m.status)).length;
    const lowFeed = feed.filter((f) => f.status === 'Low Stock' || f.status === 'Out of Stock').length;
    const assignedCount = [...medications, ...feed, ...supplies].filter((i) => i.status === 'Assigned').length;
    const stockValue = [...medications, ...feed, ...supplies].reduce((sum, i) => {
      const price = i.purchasePrice ?? i.cost ?? 0;
      const qty = i.stockQuantity ?? i.quantity ?? 0;
      return sum + price * qty;
    }, 0);
    const monthlySpend = medications.reduce((s, m) => s + (m.purchasePrice || 0), 0)
      + feed.reduce((s, f) => s + (f.cost || 0), 0)
      + supplies.reduce((s, x) => s + (x.cost || 0), 0);

    const saddles = supplies.filter((s) => s.category === 'Saddle').length;
    const bridles = supplies.filter((s) => s.category === 'Bridle').length;
    const blankets = supplies.filter((s) => s.category === 'Blankets').length;
    const boots = supplies.filter((s) => s.category === 'Horse boots').length;
    const grooming = supplies.filter((s) => s.category === 'Grooming tools').length;
    const maint = supplies.filter((s) => s.condition === 'Needs Maintenance').length;

    return {
      totalMed: medications.length,
      totalFeed: feed.length,
      totalSupplies: supplies.length,
      lowAlerts: lowMed + lowFeed + supplies.filter((s) => s.status === 'Low Stock').length,
      expiringSoon: expMed + feed.filter((f) => f.status === 'Expiring Soon').length,
      assignedCount,
      monthlySpend,
      stockValue,
      medAssignedHorses: medications.filter((m) => m.assignedHorseIds?.length).length,
      medCourses: medications.filter((m) => m.assignedType === 'Medication Course').length,
      feedGroups: feed.filter((f) => f.assignedType === 'Horse Group').length,
      feedHorses: feed.reduce((n, f) => n + (f.assignedHorseIds?.length || 0), 0),
      lastFeedUpdate: feed[0]?.purchaseDate || '—',
      saddles,
      bridles,
      blankets,
      boots,
      grooming,
      supplyMaint: maint,
      supplyAssigned: supplies.filter((s) => s.status === 'Assigned').length,
      totalUnits: medications.reduce((s, m) => s + m.stockQuantity, 0)
        + feed.reduce((s, f) => s + f.quantity, 0)
        + supplies.reduce((s, x) => s + x.quantity, 0),
      outOfStock: [...medications, ...feed, ...supplies].filter((i) => i.status === 'Out of Stock').length,
    };
  }, [medications, feed, supplies]);

  const stockRows = useMemo(() => {
    const rows = [
      ...medications.map((m) => toStockRow(m, 'Medications')),
      ...feed.map((f) => toStockRow(f, 'Feed & Nutrition')),
      ...supplies.map((s) => toStockRow(s, 'Horse Supplies')),
    ];
    return rows.sort((a, b) => b.updated.localeCompare(a.updated));
  }, [medications, feed, supplies]);

  const criticalStockRows = useMemo(
    () => stockRows.filter((r) => ['Low Stock', 'Out of Stock', 'Expiring Soon', 'Expired'].includes(r.status)),
    [stockRows],
  );

  const recentMovements = useMemo(
    () => [...store.movements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [store.movements],
  );

  const dashboardLastUpdate = useMemo(() => {
    const stamps = [
      ...stockRows.map((r) => r.updated),
      ...store.movements.map((m) => m.date),
    ].filter(Boolean).sort();
    return stamps[stamps.length - 1] || toISODate(DEMO_TODAY);
  }, [stockRows, store.movements]);

  const chartValueByCategory = useMemo(() => [
    { name: ti('charts.medications'), value: medications.reduce((s, m) => s + (m.purchasePrice || 0) * m.stockQuantity, 0) },
    { name: ti('charts.feed'), value: feed.reduce((s, f) => s + (f.cost || 0) * f.quantity, 0) },
    { name: ti('charts.supplies'), value: supplies.reduce((s, x) => s + (x.cost || 0) * x.quantity, 0) },
  ], [medications, feed, supplies, ti]);

  const chartQtyBySection = useMemo(() => [
    { name: ti('charts.medications'), qty: medications.reduce((s, m) => s + m.stockQuantity, 0) },
    { name: ti('charts.feed'), qty: feed.reduce((s, f) => s + f.quantity, 0) },
    { name: ti('charts.supplies'), qty: supplies.reduce((s, x) => s + x.quantity, 0) },
  ], [medications, feed, supplies, ti]);

  const chartLowStock = useMemo(() => [
    { name: ti('charts.medications'), count: medications.filter((m) => ['Low Stock', 'Out of Stock'].includes(m.status)).length },
    { name: ti('charts.feed'), count: feed.filter((f) => ['Low Stock', 'Out of Stock'].includes(f.status)).length },
    { name: ti('charts.supplies'), count: supplies.filter((s) => ['Low Stock', 'Out of Stock'].includes(s.status)).length },
  ], [medications, feed, supplies, ti]);

  const chartStatusMix = useMemo(() => {
    const counts = {};
    [...medications, ...feed, ...supplies].forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    return STOCK_STATUSES
      .filter((status) => counts[status])
      .map((status) => ({
        name: translateStockStatus(status),
        value: counts[status],
        statusKey: status,
      }));
  }, [medications, feed, supplies, translateStockStatus]);

  const chartMovementsByType = useMemo(() => {
    const counts = Object.fromEntries(MOVEMENT_TYPES.map((t) => [t, 0]));
    store.movements.forEach((m) => {
      counts[m.movementType] = (counts[m.movementType] || 0) + 1;
    });
    return MOVEMENT_TYPES.map((t) => ({
      name: translateMovementType(t),
      count: counts[t],
    }));
  }, [store.movements, translateMovementType]);

  const chartMovementVolume = useMemo(() => {
    const byDate = {};
    store.movements.forEach((m) => {
      byDate[m.date] = (byDate[m.date] || 0) + Number(m.quantity || 0);
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, qty]) => ({ date, qty }));
  }, [store.movements]);

  const matchesFilters = useCallback((item, nameKey, sectionLabel) => {
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const name = (item[nameKey] || '').toLowerCase();
      if (!name.includes(q)) return false;
    }
    if (filters.section && sectionLabel !== filters.section) return false;
    if (filters.stockStatus && item.status !== filters.stockStatus) return false;
    if (filters.expiryStatus === 'expiring' && item.status !== 'Expiring Soon') return false;
    if (filters.expiryStatus === 'expired' && item.status !== 'Expired') return false;
    return true;
  }, [filters]);

  const filteredMeds = medications.filter((m) => matchesFilters(m, 'name', 'Medications'));
  const filteredFeed = feed.filter((f) => matchesFilters(f, 'mixName', 'Feed & Nutrition'));
  const filteredSupplies = supplies.filter((s) => matchesFilters(s, 'itemName', 'Horse Supplies'));

  const emptyMedForm = {
    image: '',
    name: '',
    category: 'Supplement',
    description: '',
    stockQuantity: '',
    unit: 'bottles',
    lowStockAlert: '2',
    expiryDate: '',
    route: 'Oral',
    administrationNotes: '',
    assignedType: 'General Stock',
    assignedHorseIds: [],
    assignedGroupName: '',
    medicationCourse: '',
    supplier: '',
    purchasePrice: '',
    notes: '',
  };
  const [medForm, setMedForm] = useState(emptyMedForm);
  const [medPreview, setMedPreview] = useState('');

  const emptyFeedForm = {
    image: '',
    mixName: '',
    feedType: 'Custom Mix',
    description: '',
    ingredientsNotes: '',
    quantity: '',
    unit: 'kg',
    feedingFrequency: 'Twice daily',
    assignedType: 'General Stable Feed',
    assignedHorseIds: [],
    servingNotes: '',
    supplier: '',
    purchaseDate: toISODate(DEMO_TODAY),
    expiryDate: '',
    cost: '',
    notes: '',
  };
  const [feedForm, setFeedForm] = useState(emptyFeedForm);
  const [feedPreview, setFeedPreview] = useState('');

  const emptySupplyForm = {
    image: '',
    itemName: '',
    category: 'Other',
    description: '',
    quantity: '',
    unit: 'piece',
    condition: 'Good',
    assignedType: 'General Stable',
    assignedHorseIds: [],
    assignedRiderIds: [],
    assignedStaffIds: [],
    purchaseDate: toISODate(DEMO_TODAY),
    supplier: '',
    cost: '',
    maintenanceDate: '',
    notes: '',
  };
  const [supplyForm, setSupplyForm] = useState(emptySupplyForm);
  const [supplyPreview, setSupplyPreview] = useState('');

  const emptyMovForm = {
    itemName: '',
    section: 'Medications',
    movementType: 'Stock In',
    quantity: '',
    relatedLabel: '',
    recordedBy: 'Stable Worker',
    notes: '',
  };
  const [movForm, setMovForm] = useState(emptyMovForm);

  const saveMedication = () => {
    if (!medForm.name.trim() || !medForm.stockQuantity) {
      toast.error(ti('toast.medRequired'));
      return;
    }
    const item = {
      id: nextId('med_'),
      stableId: stableId || 'stable_001',
      image: medPreview && medPreview !== DEFAULT_HORSE_IMAGE_URL ? medPreview : '',
      ...medForm,
      stockQuantity: Number(medForm.stockQuantity),
      lowStockAlert: Number(medForm.lowStockAlert) || 0,
      purchasePrice: Number(medForm.purchasePrice) || 0,
      status: 'In Stock',
      updatedAt: new Date().toISOString(),
    };
    item.status = computeStockStatus({
      stockQuantity: item.stockQuantity,
      lowStockAlert: item.lowStockAlert,
      expiryDate: item.expiryDate,
      assignedType: item.assignedType,
    });
    setStore((prev) => ({ ...prev, medications: [item, ...prev.medications] }));
    toast.success(ti('toast.medSaved'));
    setMedModal(false);
    setMedForm(emptyMedForm);
    setMedPreview('');
  };

  const saveFeed = () => {
    if (!feedForm.mixName.trim() || !feedForm.quantity) {
      toast.error(ti('toast.feedRequired'));
      return;
    }
    const item = {
      id: nextId('feed_'),
      stableId: stableId || 'stable_001',
      image: feedPreview && feedPreview !== DEFAULT_HORSE_IMAGE_URL ? feedPreview : '',
      ...feedForm,
      quantity: Number(feedForm.quantity),
      cost: Number(feedForm.cost) || 0,
      status: 'In Stock',
      updatedAt: new Date().toISOString(),
    };
    item.status = computeStockStatus({
      stockQuantity: item.quantity,
      lowStockAlert: 3,
      expiryDate: item.expiryDate,
      assignedType: item.assignedType,
    });
    setStore((prev) => ({ ...prev, feed: [item, ...prev.feed] }));
    toast.success(ti('toast.feedSaved'));
    setFeedModal(false);
    setFeedForm(emptyFeedForm);
    setFeedPreview('');
  };

  const saveSupply = () => {
    if (!supplyForm.itemName.trim() || !supplyForm.quantity) {
      toast.error(ti('toast.supplyRequired'));
      return;
    }
    const item = {
      id: nextId('sup_'),
      stableId: stableId || 'stable_001',
      image: supplyPreview && supplyPreview !== DEFAULT_HORSE_IMAGE_URL ? supplyPreview : '',
      ...supplyForm,
      quantity: Number(supplyForm.quantity),
      cost: Number(supplyForm.cost) || 0,
      status: 'In Stock',
      updatedAt: new Date().toISOString(),
    };
    item.status = computeStockStatus({
      stockQuantity: item.quantity,
      lowStockAlert: 2,
      expiryDate: item.maintenanceDate,
      assignedType: item.assignedType,
    });
    setStore((prev) => ({ ...prev, supplies: [item, ...prev.supplies] }));
    toast.success(ti('toast.supplySaved'));
    setSupplyModal(false);
    setSupplyForm(emptySupplyForm);
    setSupplyPreview('');
  };

  const saveMovement = () => {
    if (!movForm.itemName.trim() || !movForm.quantity) {
      toast.error(ti('toast.movementRequired'));
      return;
    }
    const row = {
      id: nextId('mov_'),
      stableId: stableId || 'stable_001',
      date: toISODate(DEMO_TODAY),
      ...movForm,
      quantity: Number(movForm.quantity),
    };
    setStore((prev) => {
      const withMovement = { ...prev, movements: [row, ...prev.movements] };
      return applyMovementToStock(withMovement, row);
    });
    toast.success(ti('toast.movementSaved'));
    setMovModal(false);
    setMovForm(emptyMovForm);
  };

  const assignmentGroups = useMemo(() => {
    const groups = [];
    DEMO_HORSES.forEach((h) => {
      const meds = medications.filter((m) => m.assignedHorseIds?.includes(h.id));
      const feeds = feed.filter((f) => f.assignedHorseIds?.includes(h.id));
      const sups = supplies.filter((s) => s.assignedHorseIds?.includes(h.id));
      if (meds.length || feeds.length || sups.length) {
        groups.push({ type: 'Horse', id: h.id, name: h.name, meds, feeds, sups, lastUpdate: '2026-05-17' });
      }
    });
    DEMO_RIDERS.forEach((r) => {
      const sups = supplies.filter((s) => s.assignedRiderIds?.includes(r.id));
      if (sups.length) groups.push({ type: 'Rider', id: r.id, name: r.name, meds: [], feeds: [], sups, lastUpdate: '2026-05-16' });
    });
    DEMO_STAFF.forEach((s) => {
      const sups = supplies.filter((x) => x.assignedStaffIds?.includes(s.id));
      if (sups.length) groups.push({ type: 'Staff', id: s.id, name: s.name, meds: [], feeds: [], sups, lastUpdate: '2026-05-15' });
    });
    return groups.filter((g) => {
      if (assignFilters.entityType && g.type !== assignFilters.entityType) return false;
      if (assignFilters.name.trim() && !g.name.toLowerCase().includes(assignFilters.name.toLowerCase())) return false;
      return true;
    });
  }, [medications, feed, supplies, assignFilters]);

  const renderItemCard = (item, section, nameKey, extras) => {
    const name = item[nameKey];
    const img = item.image || DEFAULT_HORSE_IMAGE_URL;
    const isDefault = !item.image;
    return (
      <article key={item.id} className="inv-item-card">
        <div className="inv-item-card__media">
          <img src={img} alt="" className={isDefault ? 'inv-item-card__img--default' : ''} loading="lazy" />
        </div>
        <div className="inv-item-card__body">
          <div className="inv-item-card__head">
            <h3 className="inv-item-card__name">{name}</h3>
            <StatusBadge status={item.status} translate={translateStockStatus} />
          </div>
          <p className="inv-item-card__meta">{extras}</p>
          <div className="inv-item-card__actions">
            <button type="button" className="inv-btn inv-btn--ghost inv-btn--sm" onClick={() => setDetailItem({ section, item })}>
              <Eye size={14} aria-hidden /> {ti('actions.viewDetails')}
            </button>
            <button type="button" className="inv-btn inv-btn--ghost inv-btn--sm" onClick={() => toast(ti('toast.editPlaceholder'))}>
              <Pencil size={14} aria-hidden /> {ti('actions.editPlaceholder')}
            </button>
          </div>
        </div>
      </article>
    );
  };

  const showGlobalFilters = ['medications', 'feed', 'supplies', 'movements'].includes(tab);

  return (
    <div className="inv-page">
      <header className="inv-page__header">
    <div>
          <h1 className="inv-page__title">{ti('title')}</h1>
          <p className="inv-page__subtitle">{ti('subtitle')}</p>
        </div>
        <div className="inv-header-actions">
          <button type="button" className="inv-btn inv-btn--ghost" onClick={() => toast(ti('toast.printPlaceholder'))}>
            <Printer size={16} aria-hidden /> {ti('actions.printReport')}
          </button>
        </div>
      </header>

      <nav className="inv-tabs" aria-label={ti('tabsAria')}>
        {TABS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`inv-tabs__btn${tab === id ? ' is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={16} aria-hidden /> {ti(labelKey)}
          </button>
        ))}
      </nav>

      {showGlobalFilters ? (
        <GlobalFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters({ search: '', section: '', category: '', assignedTo: '', stockStatus: '', expiryStatus: '' })}
          ti={ti}
          translateStockStatus={translateStockStatus}
          translateSection={translateSection}
          showSection={tab === 'movements'}
        />
      ) : null}

      {tab === 'dashboard' ? (
        <>
          <div className="inv-dash-live">
            <span className="inv-dash-live__dot" aria-hidden />
            <span>{ti('dashboard.liveData')}</span>
            <span className="inv-dash-live__time">{ti('dashboard.lastUpdate')}: {dashboardLastUpdate}</span>
          </div>

          <div className="inv-summary-grid">
            {[
              ['dashboard.totalUnits', metrics.totalUnits.toLocaleString()],
              ['dashboard.lowStockAlerts', metrics.lowAlerts, true],
              ['dashboard.outOfStock', metrics.outOfStock, true],
              ['dashboard.expiringSoon', metrics.expiringSoon, true],
              ['dashboard.stockValue', `$${Math.round(metrics.stockValue).toLocaleString()}`],
              ['dashboard.assignedItems', metrics.assignedCount],
              ['dashboard.totalMedications', metrics.totalMed],
              ['dashboard.totalFeed', metrics.totalFeed],
            ].map(([key, val, alert]) => (
              <article key={key} className={`inv-summary-card${alert ? ' inv-summary-card--alert' : ''}`}>
                <span>{ti(key)}</span>
                <strong>{val}</strong>
              </article>
            ))}
          </div>

          <div className="inv-charts inv-charts--dashboard">
            <InvChartCard title={ti('charts.qtyBySection')}>
              <InvChartContainer>
                <BarChart data={chartQtyBySection} margin={INV_BAR_MARGIN_X}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,36,71,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={INV_AXIS_TICK} tickMargin={8} interval={0} />
                  <YAxis tick={INV_AXIS_TICK} allowDecimals={false} width={40} />
                  <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                  <Bar dataKey="qty" fill="var(--color-gold-500)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </InvChartContainer>
            </InvChartCard>

            <InvChartCard title={ti('charts.lowStockBySection')}>
              <InvChartContainer>
                <BarChart data={chartLowStock} margin={INV_BAR_MARGIN_X}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,36,71,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={INV_AXIS_TICK} tickMargin={8} interval={0} />
                  <YAxis tick={INV_AXIS_TICK} allowDecimals={false} width={40} />
                  <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                  <Bar dataKey="count" fill="#c0392b" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </InvChartContainer>
            </InvChartCard>

            <InvChartCard title={ti('charts.statusMix')} className="inv-chart-card--pie">
              <InvChartContainer>
                <PieChart margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                  <Pie
                    data={chartStatusMix}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="42%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {chartStatusMix.map((entry, i) => (
                      <Cell key={entry.statusKey} fill={STATUS_CHART_COLORS[i % STATUS_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, lineHeight: '1.35', paddingTop: 4 }}
                  />
                </PieChart>
              </InvChartContainer>
            </InvChartCard>

            <InvChartCard title={ti('charts.valueByCategory')}>
              <InvChartContainer>
                <BarChart data={chartValueByCategory} margin={INV_BAR_MARGIN_X}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,36,71,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={INV_AXIS_TICK} tickMargin={8} interval={0} />
                  <YAxis tick={INV_AXIS_TICK} width={48} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                  <Tooltip
                    contentStyle={stableDashboardChartTooltipContentStyle}
                    formatter={(v) => `$${Number(v).toLocaleString()}`}
                  />
                  <Bar dataKey="value" fill="var(--color-navy-700)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </InvChartContainer>
            </InvChartCard>

            <InvChartCard title={ti('charts.movementsByType')} className="inv-chart-card--wide">
              <InvChartContainer>
                <BarChart data={chartMovementsByType} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,36,71,0.08)" horizontal={false} />
                  <XAxis type="number" tick={INV_AXIS_TICK} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={INV_AXIS_TICK} width={108} />
                  <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                  <Bar dataKey="count" fill="#2980b9" radius={[0, 6, 6, 0]} maxBarSize={28} />
                </BarChart>
              </InvChartContainer>
            </InvChartCard>

            <InvChartCard title={ti('charts.movementVolume')}>
              {chartMovementVolume.length === 0 ? (
                <p className="inv-empty inv-empty--chart">{ti('dashboard.noMovementData')}</p>
              ) : (
                <InvChartContainer>
                  <BarChart data={chartMovementVolume} margin={INV_BAR_MARGIN}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,36,71,0.08)" vertical={false} />
                    <XAxis dataKey="date" tick={INV_AXIS_TICK} tickMargin={6} />
                    <YAxis tick={INV_AXIS_TICK} allowDecimals={false} width={40} />
                    <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                    <Bar dataKey="qty" fill="var(--color-gold-500)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </InvChartContainer>
              )}
            </InvChartCard>
          </div>

          <div className="inv-dash-tables">
            <section className="inv-dash-table-block">
              <h3>{ti('dashboard.stockLevelsTitle')}</h3>
              <p className="inv-dash-table-block__lead">{ti('dashboard.stockLevelsLead')}</p>
              <div className="inv-table-wrap">
                <table className="inv-table inv-table--stock">
                  <thead>
                    <tr>
                      <th>{ti('columns.item')}</th>
                      <th>{ti('columns.section')}</th>
                      <th className="inv-table__num">{ti('dashboard.colOnHand')}</th>
                      <th className="inv-table__num">{ti('dashboard.colAlertAt')}</th>
                      <th>{ti('columns.status')}</th>
                      <th>{ti('dashboard.colUpdated')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockRows.map((row) => (
                      <tr key={row.id} className={['Low Stock', 'Out of Stock', 'Expired'].includes(row.status) ? 'inv-table__row--warn' : ''}>
                        <td><strong>{row.name}</strong></td>
                        <td>{translateSection(row.section)}</td>
                        <td className="inv-table__num">{row.qty} {row.unit}</td>
                        <td className="inv-table__num">{row.low}</td>
                        <td><StatusBadge status={row.status} translate={translateStockStatus} /></td>
                        <td>{row.updated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="inv-dash-table-block">
              <h3>{ti('dashboard.criticalStockTitle')}</h3>
              <p className="inv-dash-table-block__lead">{ti('dashboard.criticalStockLead')}</p>
              {criticalStockRows.length === 0 ? (
                <p className="inv-empty">{ti('dashboard.noCriticalStock')}</p>
              ) : (
                <div className="inv-table-wrap">
                  <table className="inv-table inv-table--stock">
                    <thead>
                      <tr>
                        <th>{ti('columns.item')}</th>
                        <th>{ti('columns.section')}</th>
                        <th className="inv-table__num">{ti('dashboard.colOnHand')}</th>
                        <th className="inv-table__num">{ti('dashboard.colShortfall')}</th>
                        <th>{ti('columns.status')}</th>
                        <th>{ti('dashboard.colUpdated')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criticalStockRows.map((row) => (
                        <tr key={row.id} className="inv-table__row--warn">
                          <td><strong>{row.name}</strong></td>
                          <td>{translateSection(row.section)}</td>
                          <td className="inv-table__num">{row.qty} {row.unit}</td>
                          <td className="inv-table__num">{Math.max(0, row.low - row.qty)}</td>
                          <td><StatusBadge status={row.status} translate={translateStockStatus} /></td>
                          <td>{row.updated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="inv-dash-table-block">
              <h3>{ti('dashboard.recentMovementsTitle')}</h3>
              <p className="inv-dash-table-block__lead">{ti('dashboard.recentMovementsLead')}</p>
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>{ti('columns.date')}</th>
                      <th>{ti('columns.item')}</th>
                      <th>{ti('columns.section')}</th>
                      <th>{ti('columns.movementType')}</th>
                      <th className="inv-table__num">{ti('columns.quantity')}</th>
                      <th>{ti('columns.recordedBy')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMovements.map((row) => (
                      <tr key={row.id}>
                        <td>{row.date}</td>
                        <td>{row.itemName}</td>
                        <td>{translateSection(row.section)}</td>
                        <td>{translateMovementType(row.movementType)}</td>
                        <td className="inv-table__num">{row.quantity}</td>
                        <td>{row.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      ) : null}

      {tab === 'medications' ? (
        <section>
          <p className="inv-safety">{ti('medication.safetyNotice')}</p>
          <div className="inv-section-head">
            <h2>{ti('tabs.medications')}</h2>
            <button type="button" className="inv-btn inv-btn--gold" onClick={() => setMedModal(true)}>
              <Plus size={16} aria-hidden /> {ti('medication.add')}
            </button>
          </div>
          {filteredMeds.length === 0 ? (
            <p className="inv-empty">{ti('medication.empty')}</p>
          ) : (
            <div className="inv-item-grid">
              {filteredMeds.map((m) => renderItemCard(
                m,
                'medications',
                'name',
                <>
                  {translateMedCategory(m.category)} · {m.stockQuantity} {m.unit} · {translateRoute(m.route)}
                  <br />
                  {ti('columns.expiry')}: {m.expiryDate || '—'} · {ti('columns.assignedTo')}: {formatAssignedMed(m, ti)}
                </>,
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === 'feed' ? (
        <section>
          <div className="inv-section-head">
            <h2>{ti('tabs.feed')}</h2>
            <button type="button" className="inv-btn inv-btn--gold" onClick={() => setFeedModal(true)}>
              <Plus size={16} aria-hidden /> {ti('feed.add')}
            </button>
          </div>
          {filteredFeed.length === 0 ? (
            <p className="inv-empty">{ti('feed.empty')}</p>
          ) : (
            <div className="inv-item-grid">
              {filteredFeed.map((f) => renderItemCard(
                f,
                'feed',
                'mixName',
                <>
                  {f.feedType} · {f.quantity} {f.unit} · {f.feedingFrequency}
                  <br />
                  {ti('columns.assignedTo')}: {formatAssignedFeed(f, ti)} · {ti('columns.lastUpdated')}: {f.purchaseDate}
                </>,
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === 'supplies' ? (
        <section>
          <div className="inv-section-head">
            <h2>{ti('tabs.supplies')}</h2>
            <button type="button" className="inv-btn inv-btn--gold" onClick={() => setSupplyModal(true)}>
              <Plus size={16} aria-hidden /> {ti('supply.add')}
            </button>
          </div>
          {filteredSupplies.length === 0 ? (
            <p className="inv-empty">{ti('supply.empty')}</p>
          ) : (
            <div className="inv-item-grid">
              {filteredSupplies.map((s) => renderItemCard(
                s,
                'supplies',
                'itemName',
                <>
                  {s.category} · {s.quantity} {s.unit} · {s.condition}
                  <br />
                  {ti('columns.assignedTo')}: {formatAssignedSupply(s, ti)}
                </>,
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === 'movements' ? (
        <section>
          <div className="inv-section-head">
            <h2>{ti('tabs.movements')}</h2>
            <button type="button" className="inv-btn inv-btn--gold" onClick={() => setMovModal(true)}>
              <Plus size={16} aria-hidden /> {ti('movement.add')}
            </button>
          </div>
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>{ti('columns.date')}</th>
                  <th>{ti('columns.item')}</th>
                  <th>{ti('columns.section')}</th>
                  <th>{ti('columns.movementType')}</th>
                  <th>{ti('columns.quantity')}</th>
                  <th>{ti('columns.relatedTo')}</th>
                  <th>{ti('columns.recordedBy')}</th>
                  <th>{ti('columns.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {store.movements.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>{row.itemName}</td>
                    <td>{translateSection(row.section)}</td>
                    <td>{translateMovementType(row.movementType)}</td>
                    <td>{row.quantity}</td>
                    <td>{row.relatedLabel}</td>
                    <td>{row.recordedBy}</td>
                    <td>{row.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === 'assignments' ? (
        <section>
          <div className="inv-filters">
            <label className="inv-filter-select">
              <select
                value={assignFilters.entityType}
                onChange={(e) => setAssignFilters((f) => ({ ...f, entityType: e.target.value }))}
              >
                <option value="">{ti('assignments.allTypes')}</option>
                <option value="Horse">{ti('assignments.horse')}</option>
                <option value="Rider">{ti('assignments.rider')}</option>
                <option value="Staff">{ti('assignments.staff')}</option>
              </select>
            </label>
            <label className="inv-search">
              <Search size={18} aria-hidden />
              <input
                value={assignFilters.name}
                onChange={(e) => setAssignFilters((f) => ({ ...f, name: e.target.value }))}
                placeholder={ti('assignments.searchName')}
              />
            </label>
          </div>
          {assignmentGroups.length === 0 ? (
            <p className="inv-empty">{ti('assignments.empty')}</p>
          ) : (
            <div className="inv-table-wrap">
              <table className="inv-table inv-table--assignments">
                <thead>
                  <tr>
                    <th>{ti('assignments.colType')}</th>
                    <th>{ti('assignments.colName')}</th>
                    <th>{ti('assignments.colFeed')}</th>
                    <th>{ti('assignments.colMedications')}</th>
                    <th>{ti('assignments.colSupplies')}</th>
                    <th>{ti('assignments.lastUpdate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentGroups.map((g) => (
                    <tr key={`${g.type}-${g.id}`}>
                      <td>
                        {g.type === 'Horse' ? ti('assignments.horse') : g.type === 'Rider' ? ti('assignments.rider') : ti('assignments.staff')}
                      </td>
                      <td><strong>{g.name}</strong></td>
                      <td>{g.feeds.length ? g.feeds.map((f) => f.mixName).join(', ') : '—'}</td>
                      <td>{g.meds.length ? g.meds.map((m) => m.name).join(', ') : '—'}</td>
                      <td>{g.sups.length ? g.sups.map((s) => s.itemName).join(', ') : '—'}</td>
                      <td>{g.lastUpdate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {/* Medication modal */}
      <Modal
        open={medModal}
        title={ti('medication.modalTitle')}
        closeLabel={ti('close')}
        onClose={() => setMedModal(false)}
        wide
        foot={(
          <>
            <button type="button" className="inv-btn inv-btn--ghost" onClick={() => setMedModal(false)}>{ti('cancel')}</button>
            <button type="button" className="inv-btn inv-btn--gold" onClick={saveMedication}>{ti('save')}</button>
          </>
        )}
      >
        <div className="inv-form-grid">
          <ImageUpload
            label={ti('fields.imageUpload')}
            preview={medPreview || DEFAULT_HORSE_IMAGE_URL}
            onFile={(f) => setMedPreview(registerUrl(URL.createObjectURL(f)))}
          />
          <label className="inv-field"><span>{ti('fields.name')} *</span><input value={medForm.name} onChange={(e) => setMedForm((f) => ({ ...f, name: e.target.value }))} /></label>
          <label className="inv-field">
            <span>{ti('fields.category')} *</span>
            <select value={medForm.category} onChange={(e) => setMedForm((f) => ({ ...f, category: e.target.value }))}>
              {MED_CATEGORIES.map((c) => <option key={c} value={c}>{translateMedCategory(c)}</option>)}
            </select>
          </label>
          <label className="inv-field inv-field--full"><span>{ti('fields.description')}</span><textarea value={medForm.description} onChange={(e) => setMedForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></label>
          <label className="inv-field"><span>{ti('fields.stockQuantity')} *</span><input type="number" min="0" value={medForm.stockQuantity} onChange={(e) => setMedForm((f) => ({ ...f, stockQuantity: e.target.value }))} /></label>
          <label className="inv-field">
            <span>{ti('fields.unit')} *</span>
            <select value={medForm.unit} onChange={(e) => setMedForm((f) => ({ ...f, unit: e.target.value }))}>
              {MED_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <label className="inv-field"><span>{ti('fields.lowStockAlert')}</span><input type="number" min="0" value={medForm.lowStockAlert} onChange={(e) => setMedForm((f) => ({ ...f, lowStockAlert: e.target.value }))} /></label>
          <label className="inv-field"><span>{ti('fields.expiryDate')}</span><input type="date" value={medForm.expiryDate} onChange={(e) => setMedForm((f) => ({ ...f, expiryDate: e.target.value }))} /></label>
          <label className="inv-field">
            <span>{ti('fields.route')} *</span>
            <select value={medForm.route} onChange={(e) => setMedForm((f) => ({ ...f, route: e.target.value }))}>
              {MED_ROUTES.map((r) => <option key={r} value={r}>{translateRoute(r)}</option>)}
            </select>
          </label>
          <label className="inv-field inv-field--full"><span>{ti('fields.administrationNotes')}</span><textarea value={medForm.administrationNotes} onChange={(e) => setMedForm((f) => ({ ...f, administrationNotes: e.target.value }))} placeholder={ti('fields.administrationPlaceholder')} rows={2} /></label>
          <label className="inv-field">
            <span>{ti('fields.assignedType')}</span>
            <select value={medForm.assignedType} onChange={(e) => setMedForm((f) => ({ ...f, assignedType: e.target.value }))}>
              {MED_ASSIGNED_TYPES.map((a) => <option key={a} value={a}>{translateAssignedType(a)}</option>)}
            </select>
          </label>
          {medForm.assignedType === 'Single Horse' || medForm.assignedType === 'Horse Group' ? (
            <div className="inv-multi">
              {DEMO_HORSES.map((h) => (
                <label key={h.id}>
                  <input
                    type="checkbox"
                    checked={medForm.assignedHorseIds.includes(h.id)}
                    onChange={(e) => {
                      const ids = e.target.checked
                        ? [...medForm.assignedHorseIds, h.id]
                        : medForm.assignedHorseIds.filter((x) => x !== h.id);
                      setMedForm((f) => ({ ...f, assignedHorseIds: ids }));
                    }}
                  />
                  {h.name}
                </label>
              ))}
            </div>
          ) : null}
          {medForm.assignedType === 'Horse Group' ? (
            <label className="inv-field inv-field--full"><span>{ti('fields.groupName')}</span><input value={medForm.assignedGroupName} onChange={(e) => setMedForm((f) => ({ ...f, assignedGroupName: e.target.value }))} /></label>
          ) : null}
          {medForm.assignedType === 'Medication Course' ? (
            <label className="inv-field inv-field--full">
              <span>{ti('fields.medicationCourse')}</span>
              <select value={medForm.medicationCourse} onChange={(e) => setMedForm((f) => ({ ...f, medicationCourse: e.target.value }))}>
                <option value="">—</option>
                {MED_COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          ) : null}
          <label className="inv-field"><span>{ti('fields.supplier')}</span><input value={medForm.supplier} onChange={(e) => setMedForm((f) => ({ ...f, supplier: e.target.value }))} /></label>
          <label className="inv-field"><span>{ti('fields.purchasePrice')}</span><input type="number" min="0" value={medForm.purchasePrice} onChange={(e) => setMedForm((f) => ({ ...f, purchasePrice: e.target.value }))} /></label>
          <label className="inv-field inv-field--full"><span>{ti('fields.notes')}</span><textarea value={medForm.notes} onChange={(e) => setMedForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></label>
        </div>
      </Modal>

      <Modal
        open={feedModal}
        title={ti('feed.modalTitle')}
        closeLabel={ti('close')}
        onClose={() => setFeedModal(false)}
        wide
        foot={(
          <>
            <button type="button" className="inv-btn inv-btn--ghost" onClick={() => setFeedModal(false)}>{ti('cancel')}</button>
            <button type="button" className="inv-btn inv-btn--gold" onClick={saveFeed}>{ti('save')}</button>
          </>
        )}
      >
        <div className="inv-form-grid">
          <ImageUpload
            label={ti('fields.feedPhoto')}
            preview={feedPreview || DEFAULT_HORSE_IMAGE_URL}
            onFile={(f) => setFeedPreview(registerUrl(URL.createObjectURL(f)))}
          />
          <label className="inv-field"><span>{ti('fields.mixName')} *</span><input value={feedForm.mixName} onChange={(e) => setFeedForm((f) => ({ ...f, mixName: e.target.value }))} /></label>
          <label className="inv-field">
            <span>{ti('fields.feedType')} *</span>
            <select value={feedForm.feedType} onChange={(e) => setFeedForm((f) => ({ ...f, feedType: e.target.value }))}>
              {FEED_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="inv-field inv-field--full"><span>{ti('fields.ingredientsNotes')}</span><textarea value={feedForm.ingredientsNotes} onChange={(e) => setFeedForm((f) => ({ ...f, ingredientsNotes: e.target.value }))} rows={2} /></label>
          <label className="inv-field"><span>{ti('fields.quantity')} *</span><input type="number" min="0" value={feedForm.quantity} onChange={(e) => setFeedForm((f) => ({ ...f, quantity: e.target.value }))} /></label>
          <label className="inv-field">
            <span>{ti('fields.unit')} *</span>
            <select value={feedForm.unit} onChange={(e) => setFeedForm((f) => ({ ...f, unit: e.target.value }))}>
              {FEED_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <label className="inv-field">
            <span>{ti('fields.feedingFrequency')}</span>
            <select value={feedForm.feedingFrequency} onChange={(e) => setFeedForm((f) => ({ ...f, feedingFrequency: e.target.value }))}>
              {FEED_FREQ.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label className="inv-field">
            <span>{ti('fields.assignedType')}</span>
            <select value={feedForm.assignedType} onChange={(e) => setFeedForm((f) => ({ ...f, assignedType: e.target.value }))}>
              {FEED_ASSIGNED_TYPES.map((a) => <option key={a} value={a}>{translateAssignedType(a)}</option>)}
            </select>
          </label>
          {(feedForm.assignedType === 'Single Horse' || feedForm.assignedType === 'Horse Group') ? (
            <div className="inv-multi">
              {DEMO_HORSES.map((h) => (
                <label key={h.id}>
                  <input
                    type="checkbox"
                    checked={feedForm.assignedHorseIds.includes(h.id)}
                    onChange={(e) => {
                      const ids = e.target.checked
                        ? [...feedForm.assignedHorseIds, h.id]
                        : feedForm.assignedHorseIds.filter((x) => x !== h.id);
                      setFeedForm((f) => ({ ...f, assignedHorseIds: ids }));
                    }}
                  />
                  {h.name}
                </label>
              ))}
            </div>
          ) : null}
          <label className="inv-field inv-field--full"><span>{ti('fields.servingNotes')}</span><textarea value={feedForm.servingNotes} onChange={(e) => setFeedForm((f) => ({ ...f, servingNotes: e.target.value }))} placeholder={ti('fields.servingPlaceholder')} rows={2} /></label>
          <label className="inv-field"><span>{ti('fields.supplier')}</span><input value={feedForm.supplier} onChange={(e) => setFeedForm((f) => ({ ...f, supplier: e.target.value }))} /></label>
          <label className="inv-field"><span>{ti('fields.purchaseDate')}</span><input type="date" value={feedForm.purchaseDate} onChange={(e) => setFeedForm((f) => ({ ...f, purchaseDate: e.target.value }))} /></label>
          <label className="inv-field"><span>{ti('fields.cost')}</span><input type="number" min="0" value={feedForm.cost} onChange={(e) => setFeedForm((f) => ({ ...f, cost: e.target.value }))} /></label>
          <label className="inv-field inv-field--full"><span>{ti('fields.notes')}</span><textarea value={feedForm.notes} onChange={(e) => setFeedForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></label>
        </div>
      </Modal>

      <Modal
        open={supplyModal}
        title={ti('supply.modalTitle')}
        closeLabel={ti('close')}
        onClose={() => setSupplyModal(false)}
        wide
        foot={(
          <>
            <button type="button" className="inv-btn inv-btn--ghost" onClick={() => setSupplyModal(false)}>{ti('cancel')}</button>
            <button type="button" className="inv-btn inv-btn--gold" onClick={saveSupply}>{ti('save')}</button>
          </>
        )}
      >
        <div className="inv-form-grid">
          <ImageUpload
            label={ti('fields.imageUpload')}
            preview={supplyPreview || DEFAULT_HORSE_IMAGE_URL}
            onFile={(f) => setSupplyPreview(registerUrl(URL.createObjectURL(f)))}
          />
          <label className="inv-field"><span>{ti('fields.itemName')} *</span><input value={supplyForm.itemName} onChange={(e) => setSupplyForm((f) => ({ ...f, itemName: e.target.value }))} /></label>
          <label className="inv-field">
            <span>{ti('fields.category')} *</span>
            <select value={supplyForm.category} onChange={(e) => setSupplyForm((f) => ({ ...f, category: e.target.value }))}>
              {SUPPLY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="inv-field"><span>{ti('fields.quantity')} *</span><input type="number" min="0" value={supplyForm.quantity} onChange={(e) => setSupplyForm((f) => ({ ...f, quantity: e.target.value }))} /></label>
          <label className="inv-field">
            <span>{ti('fields.unit')}</span>
            <select value={supplyForm.unit} onChange={(e) => setSupplyForm((f) => ({ ...f, unit: e.target.value }))}>
              {SUPPLY_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <label className="inv-field">
            <span>{ti('fields.condition')}</span>
            <select value={supplyForm.condition} onChange={(e) => setSupplyForm((f) => ({ ...f, condition: e.target.value }))}>
              {SUPPLY_CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="inv-field">
            <span>{ti('fields.assignedType')}</span>
            <select value={supplyForm.assignedType} onChange={(e) => setSupplyForm((f) => ({ ...f, assignedType: e.target.value }))}>
              {SUPPLY_ASSIGNED_TYPES.map((a) => <option key={a} value={a}>{translateAssignedType(a)}</option>)}
            </select>
          </label>
          {supplyForm.assignedType === 'Horse' ? (
            <label className="inv-field inv-field--full">
              <span>{ti('fields.selectHorse')}</span>
              <select
                value={supplyForm.assignedHorseIds[0] || ''}
                onChange={(e) => setSupplyForm((f) => ({ ...f, assignedHorseIds: e.target.value ? [e.target.value] : [] }))}
              >
                <option value="">—</option>
                {DEMO_HORSES.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </label>
          ) : null}
          {supplyForm.assignedType === 'Rider' ? (
            <label className="inv-field inv-field--full">
              <span>{ti('fields.selectRider')}</span>
              <select
                value={supplyForm.assignedRiderIds[0] || ''}
                onChange={(e) => setSupplyForm((f) => ({ ...f, assignedRiderIds: e.target.value ? [e.target.value] : [] }))}
              >
                <option value="">—</option>
                {DEMO_RIDERS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
          ) : null}
          {supplyForm.assignedType === 'Worker / Staff' ? (
            <label className="inv-field inv-field--full">
              <span>{ti('fields.selectStaff')}</span>
              <select
                value={supplyForm.assignedStaffIds[0] || ''}
                onChange={(e) => setSupplyForm((f) => ({ ...f, assignedStaffIds: e.target.value ? [e.target.value] : [] }))}
              >
                <option value="">—</option>
                {DEMO_STAFF.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          ) : null}
          <label className="inv-field"><span>{ti('fields.purchaseDate')}</span><input type="date" value={supplyForm.purchaseDate} onChange={(e) => setSupplyForm((f) => ({ ...f, purchaseDate: e.target.value }))} /></label>
          <label className="inv-field"><span>{ti('fields.cost')}</span><input type="number" min="0" value={supplyForm.cost} onChange={(e) => setSupplyForm((f) => ({ ...f, cost: e.target.value }))} /></label>
          <label className="inv-field inv-field--full"><span>{ti('fields.notes')}</span><textarea value={supplyForm.notes} onChange={(e) => setSupplyForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></label>
        </div>
      </Modal>

      <Modal
        open={movModal}
        title={ti('movement.modalTitle')}
        closeLabel={ti('close')}
        onClose={() => setMovModal(false)}
        foot={(
          <>
            <button type="button" className="inv-btn inv-btn--ghost" onClick={() => setMovModal(false)}>{ti('cancel')}</button>
            <button type="button" className="inv-btn inv-btn--gold" onClick={saveMovement}>{ti('save')}</button>
          </>
        )}
      >
        <div className="inv-form-grid">
          <label className="inv-field"><span>{ti('columns.item')}</span><input value={movForm.itemName} onChange={(e) => setMovForm((f) => ({ ...f, itemName: e.target.value }))} /></label>
          <label className="inv-field">
            <span>{ti('columns.section')}</span>
            <select value={movForm.section} onChange={(e) => setMovForm((f) => ({ ...f, section: e.target.value }))}>
              {SECTIONS.map((s) => <option key={s} value={s}>{translateSection(s)}</option>)}
            </select>
          </label>
          <label className="inv-field">
            <span>{ti('columns.movementType')}</span>
            <select value={movForm.movementType} onChange={(e) => setMovForm((f) => ({ ...f, movementType: e.target.value }))}>
              {MOVEMENT_TYPES.map((m) => <option key={m} value={m}>{translateMovementType(m)}</option>)}
            </select>
          </label>
          <label className="inv-field"><span>{ti('columns.quantity')}</span><input type="number" min="0" value={movForm.quantity} onChange={(e) => setMovForm((f) => ({ ...f, quantity: e.target.value }))} /></label>
          <label className="inv-field"><span>{ti('columns.relatedTo')}</span><input value={movForm.relatedLabel} onChange={(e) => setMovForm((f) => ({ ...f, relatedLabel: e.target.value }))} /></label>
          <label className="inv-field"><span>{ti('columns.recordedBy')}</span><input value={movForm.recordedBy} onChange={(e) => setMovForm((f) => ({ ...f, recordedBy: e.target.value }))} /></label>
          <label className="inv-field inv-field--full"><span>{ti('columns.notes')}</span><textarea value={movForm.notes} onChange={(e) => setMovForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></label>
        </div>
      </Modal>

      <Modal
        open={!!detailItem}
        title={ti('actions.viewDetails')}
        closeLabel={ti('close')}
        onClose={() => setDetailItem(null)}
        wide
        foot={(
          <button type="button" className="inv-btn inv-btn--gold" onClick={() => setDetailItem(null)}>{ti('close')}</button>
        )}
      >
        {detailItem ? (
          <div className="inv-detail">
            <dl>
              <div><dt>{ti('columns.item')}</dt><dd>{detailItem.item.name || detailItem.item.mixName || detailItem.item.itemName}</dd></div>
              <div><dt>{ti('columns.status')}</dt><dd><StatusBadge status={detailItem.item.status} translate={translateStockStatus} /></dd></div>
              <div><dt>{ti('columns.notes')}</dt><dd>{detailItem.item.notes || '—'}</dd></div>
            </dl>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
