/**
 * Medical Management — horse cards, full medical profile, tabs & modals (frontend demo).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Camera,
  ClipboardList,
  Droplets,
  Eye,
  Filter,
  Plus,
  Printer,
  RotateCcw,
  Scale,
  Search,
  Stethoscope,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import {
  AUSCULTATION,
  ATTITUDE_OPTIONS,
  APPETITE_OPTIONS,
  BREATHING_EFFORT,
  CALENDAR_ASSIGNED,
  CALENDAR_EVENT_TYPES,
  CALENDAR_PRIORITY,
  CALENDAR_REPEAT,
  CALENDAR_STATUS,
  CARE_SUBTABS,
  COLIC_OPTIONS,
  COUGH_OPTIONS,
  DEMO_NOW,
  GUT_SOUNDS,
  HEAD_TAGS,
  HYDRATION_OPTIONS,
  LIMBS,
  LIMB_TAGS,
  MED_COURSE_STATUS,
  MED_FREQUENCY,
  MUCOUS_OPTIONS,
  NASAL_DISCHARGE,
  RECORDED_BY,
  SKIN_TAGS,
  WEIGHT_METHODS,
  bloodHasAbnormalFlag,
  addDays,
  addMonths,
  buildCalendarEventId,
  buildInitialMedicalStore,
  cloneBloodPanels,
  createCalendarEventForm,
  emptyPhysicalExamForm,
  eventTypeSlug,
  filterCalendarEventsForHorse,
  getWeekStartSunday,
  nextId,
  toISODate,
} from './healthMedicalData';
import { HorseMediaLibrary } from '../../Horses/code/HorseMediaGallery';
import {
  buildInitialMediaByHorse,
  DEFAULT_HORSE_IMAGE_URL,
  getHorseMedia,
  isVideoFile,
  MEDIA_CATEGORIES,
  nextMediaId,
} from '../../Horses/code/horseMediaLibrary';
import { useHealthI18n } from './healthI18n';

const DEMO_TODAY = new Date(2026, 4, 17);

function getMedicalHorseImage(horse, imageOverrides) {
  return imageOverrides[horse.horseId] || horse.image || '';
}

const EMPTY_CAL_FILTERS = { eventType: '', status: '', date: '' };
import '../styles/Health.css';

const PROFILE_TABS = [
  { id: 'summary', labelKey: 'tabs.summary', icon: ClipboardList },
  { id: 'weight', labelKey: 'tabs.weight', icon: Scale },
  { id: 'physical', labelKey: 'tabs.physical', icon: Stethoscope },
  { id: 'blood', labelKey: 'tabs.blood', icon: Droplets },
  { id: 'care', labelKey: 'tabs.care', icon: ClipboardList },
  { id: 'calendar', labelKey: 'tabs.calendar', icon: Calendar },
  { id: 'media', labelKey: 'tabs.media', icon: Camera },
  { id: 'medication', labelKey: 'tabs.medication', icon: AlertTriangle },
];

function badgeTone(status) {
  const v = String(status || '').toLowerCase();
  if (['fit', 'normal', 'completed', 'n'].includes(v)) return 'positive';
  if (['under observation', 'restricted', 'needs review', 'due', 'overdue', 'high'].includes(v)) return 'warning';
  if (['not cleared', 'emergency', 'missed', 'cancelled'].includes(v)) return 'danger';
  return 'neutral';
}

function Modal({ open, title, subtitle, onClose, children, wide, foot, closeLabel = 'Close' }) {
  if (!open) return null;
  return (
    <div className="hm-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`hm-modal${wide ? ' hm-modal--wide' : ''}${wide === 'xl' ? ' hm-modal--xl' : ''}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="hm-modal__head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p className="hm-modal__subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="hm-modal__close" onClick={onClose} aria-label={closeLabel}>
            <X size={20} />
          </button>
        </header>
        <div className="hm-modal__body">{children}</div>
        {foot ? <footer className="hm-modal__foot">{foot}</footer> : null}
      </div>
    </div>
  );
}

function TagMultiSelect({ label, tags, selected, onChange, suggested }) {
  const [draft, setDraft] = useState('');
  const addTag = (tag) => {
    const t = (tag || draft).trim();
    if (!t || selected.includes(t)) return;
    onChange([...selected, t]);
    setDraft('');
  };
  return (
    <div className="hm-tags">
      <span className="hm-tags__label">{label}</span>
      <div className="hm-tags__selected">
        {selected.length === 0 ? (
          <span className="hm-tags__empty">No tags selected</span>
        ) : (
          selected.map((tag) => (
            <span key={tag} className="hm-tags__chip">
              {tag}
              <button type="button" onClick={() => onChange(selected.filter((x) => x !== tag))} aria-label={`Remove ${tag}`}>×</button>
            </span>
          ))
        )}
      </div>
      <div className="hm-tags__suggested">
        {suggested.map((tag) => (
          <button key={tag} type="button" className="hm-tags__suggest" onClick={() => addTag(tag)}>{tag}</button>
        ))}
      </div>
      <div className="hm-tags__add">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add custom tag" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
        <button type="button" className="hm-btn hm-btn--outline hm-btn--sm" onClick={() => addTag()}>Add tag</button>
      </div>
    </div>
  );
}

function DataTable({ columns, rows, emptyLabel }) {
  if (!rows.length) return <p className="hm-empty">{emptyLabel}</p>;
  return (
    <div className="hm-table-wrap">
      <table className="hm-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MedicalCalendar({
  events,
  horseName,
  month,
  onMonthChange,
  selectedDay,
  onSelectDay,
  filters,
  onFilterChange,
  onResetFilters,
  onAddEvent,
}) {
  const hm = useHealthI18n();
  const cells = useMemo(() => {
    const start = getWeekStartSunday(new Date(month.getFullYear(), month.getMonth(), 1));
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [month]);

  const filteredEvents = useMemo(() => events.filter((ev) => {
    if (filters.eventType && ev.eventType !== filters.eventType) return false;
    if (filters.status && ev.status !== filters.status) return false;
    if (filters.date && ev.date !== filters.date) return false;
    return true;
  }), [events, filters]);

  const byDate = useMemo(() => {
    const map = new Map();
    filteredEvents.forEach((ev) => {
      const arr = map.get(ev.date) || [];
      arr.push(ev);
      map.set(ev.date, arr);
    });
    map.forEach((arr) => arr.sort((a, b) => (a.time || '').localeCompare(b.time || '')));
    return map;
  }, [filteredEvents]);

  const monthLabel = hm.formatMonth(month);
  const todayIso = toISODate(DEMO_TODAY);
  const selectedEvents = selectedDay ? (byDate.get(selectedDay) || []) : [];

  return (
    <div className="hm-cal">
      <p className="hm-cal__scope">{hm.th('calendar.scope', { name: horseName })}</p>
      <div className="hm-cal__filters">
        <label className="hm-cal__filter">
          <span>{hm.th('calendar.eventType')}</span>
          <select value={filters.eventType} onChange={(e) => onFilterChange({ ...filters, eventType: e.target.value })}>
            <option value="">{hm.th('calendar.allTypes')}</option>
            {hm.CALENDAR_EVENT_TYPES.map((type) => (
              <option key={type} value={type}>{hm.translateCalendarEventType(type)}</option>
            ))}
          </select>
        </label>
        <label className="hm-cal__filter">
          <span>{hm.th('columns.status')}</span>
          <select value={filters.status} onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}>
            <option value="">{hm.th('calendar.allStatuses')}</option>
            {hm.CALENDAR_STATUS.map((s) => (
              <option key={s} value={s}>{hm.translateCalendarStatus(s)}</option>
            ))}
          </select>
        </label>
        <label className="hm-cal__filter">
          <span>{hm.th('columns.date')}</span>
          <input type="date" value={filters.date} onChange={(e) => onFilterChange({ ...filters, date: e.target.value })} />
        </label>
        <button type="button" className="hm-btn hm-btn--ghost hm-btn--sm" onClick={onResetFilters}>
          <RotateCcw size={14} aria-hidden /> {hm.th('resetFilters')}
        </button>
      </div>

      <div className="hm-cal__toolbar">
        <button type="button" className="hm-btn hm-btn--icon" onClick={() => onMonthChange(addMonths(month, -1))} aria-label={hm.th('calendar.prevMonth')}>
          <ChevronLeft size={20} />
        </button>
        <h4 className="hm-cal__month">{monthLabel}</h4>
        <button type="button" className="hm-btn hm-btn--icon" onClick={() => onMonthChange(addMonths(month, 1))} aria-label={hm.th('calendar.nextMonth')}>
          <ChevronRight size={20} />
        </button>
        <button type="button" className="hm-btn hm-btn--ghost hm-btn--sm" onClick={() => onMonthChange(new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), 1))}>
          {hm.th('today')}
        </button>
      </div>

      <div className="hm-cal__weekdays" aria-hidden>
        {hm.weekdays.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="hm-cal__grid" role="grid" aria-label={monthLabel}>
        {cells.map((d) => {
          const iso = toISODate(d);
          const inMonth = d.getMonth() === month.getMonth();
          const dayEvents = byDate.get(iso) || [];
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              className={`hm-cal__day${!inMonth ? ' hm-cal__day--muted' : ''}${iso === todayIso ? ' hm-cal__day--today' : ''}${selectedDay === iso ? ' is-selected' : ''}${dayEvents.length ? ' has-events' : ''}`}
              onClick={() => onSelectDay(iso)}
            >
              <span className="hm-cal__dom">{d.getDate()}</span>
              <div className="hm-cal__events">
                {dayEvents.slice(0, 2).map((ev) => (
                  <span
                    key={ev.id}
                    className={`hm-cal__event hm-cal__event--${eventTypeSlug(ev.eventType)}`}
                    title={`${ev.eventType} · ${ev.time} · ${ev.status}`}
                  >
                    <span className="hm-cal__event-time">{ev.time}</span>
                    <span className="hm-cal__event-label">{hm.translateCalendarEventType(ev.eventType)}</span>
                  </span>
                ))}
                {dayEvents.length > 2 ? (
                  <span className="hm-cal__more">{hm.th('calendar.more', { count: dayEvents.length - 2 })}</span>
                ) : null}
              </div>
              <span
                role="button"
                tabIndex={0}
                className="hm-cal__add-day"
                title={hm.th('calendar.addEventDay')}
                onClick={(e) => { e.stopPropagation(); onAddEvent(iso); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onAddEvent(iso); } }}
              >
                <Plus size={12} aria-hidden />
              </span>
            </button>
          );
        })}
      </div>

      <div className="hm-cal__day-panel">
        <div className="hm-cal__day-panel-head">
          <h4>{selectedDay ? hm.th('calendar.eventsDay', { date: selectedDay }) : hm.th('calendar.selectDay')}</h4>
          {selectedDay ? (
            <button type="button" className="hm-btn hm-btn--gold hm-btn--sm" onClick={() => onAddEvent(selectedDay)}>
              <Plus size={14} /> {hm.th('calendar.addEventBtn')}
            </button>
          ) : null}
        </div>
        {!selectedDay ? (
          <p className="hm-empty">{hm.th('calendar.clickDayHint')}</p>
        ) : selectedEvents.length === 0 ? (
          <p className="hm-empty">{hm.th('calendar.noEventsDay')}</p>
        ) : (
          <ul className="hm-cal__day-list">
            {selectedEvents.map((ev) => (
              <li key={ev.id} className="hm-cal__day-item">
                <div className="hm-cal__day-item-main">
                  <span className={`hm-cal__dot hm-cal__dot--${eventTypeSlug(ev.eventType)}`} aria-hidden />
                  <div>
                    <strong>{hm.translateCalendarEventType(ev.eventType)}</strong>
                    <span>{ev.time} · {ev.assignedTo}</span>
                  </div>
                </div>
                <span className={`hm-badge hm-badge--${badgeTone(ev.status)}`}>{hm.translateCalendarStatus(ev.status)}</span>
                <span className={`hm-badge hm-badge--${badgeTone(ev.priority)}`}>{hm.translateCalendarPriority(ev.priority)}</span>
                {ev.notes ? <p className="hm-cal__day-notes">{ev.notes}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function HorseCard({ horse, imageSrc, onOpen }) {
  const hm = useHealthI18n();
  const hasUpload = Boolean(imageSrc);
  const mediaSrc = imageSrc || DEFAULT_HORSE_IMAGE_URL;
  const open = () => onOpen(horse.horseId);

  return (
    <article className="hm-horse-card">
      <button
        type="button"
        className={`hm-horse-card__media hm-horse-card__media--photo${hasUpload ? '' : ' hm-horse-card__media--default'}`}
        onClick={open}
        aria-label={hm.th('viewProfileA11y', { name: horse.name })}
      >
        <img
          src={mediaSrc}
          alt=""
          className={`hm-horse-card__img${hasUpload ? '' : ' hm-horse-card__img--default'}`}
          loading="lazy"
        />
        {hasUpload ? <span className="hm-horse-card__media-overlay" aria-hidden /> : null}
        {horse.medicalAlert ? <span className="hm-horse-card__alert">{hm.th('alert')}</span> : null}
      </button>
      <div className="hm-horse-card__body">
        <div className="hm-horse-card__head">
          <h3 className="hm-horse-card__name">{horse.name}</h3>
          <div className="hm-horse-card__badges">
            <span className={`hm-badge hm-badge--${badgeTone(horse.veterinaryStatus)}`}>{hm.translateVetStatus(horse.veterinaryStatus)}</span>
          </div>
        </div>
        <dl className="hm-horse-card__meta">
          <div>
            <dt>{hm.th('card.lastExam')}</dt>
            <dd>{horse.lastExamDate}</dd>
          </div>
          <div>
            <dt>{hm.th('card.nextCare')}</dt>
            <dd>{horse.nextScheduledCare}</dd>
          </div>
        </dl>
        <p className="hm-horse-card__stable">{horse.stableName}</p>
        <button type="button" className="hm-btn hm-btn--outline hm-btn--sm hm-horse-card__cta" onClick={open}>
          <Eye size={14} aria-hidden />
          {hm.th('viewProfile')}
        </button>
      </div>
    </article>
  );
}

function BloodReportView({ test, printId }) {
  const hm = useHealthI18n();
  const renderTable = (title, rows) => (
    <section className="hm-blood-section">
      <h4>{title}</h4>
      <table className="hm-blood-table">
        <thead><tr><th>{hm.th('bloodReport.parameter')}</th><th>{hm.th('bloodReport.value')}</th><th>{hm.th('bloodReport.unit')}</th><th>{hm.th('bloodReport.flag')}</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.parameter} className={r.flag !== 'N' ? 'hm-blood-table__flagged' : ''}>
              <td>{r.parameter}</td><td>{r.value}</td><td>{r.unit}</td><td>{r.flag}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
  return (
    <div id={printId} className="hm-blood-report">
      <h3 className="hm-blood-report__title">{hm.th('bloodReport.title')}</h3>
      <p className="hm-blood-report__device">{hm.th('bloodReport.device', { device: test.device || 'VetScan HM5' })}</p>
      <dl className="hm-blood-report__meta">
        <div><dt>{hm.th('columns.testDate')}</dt><dd>{hm.formatDate(test.testDate)}</dd></div>
        <div><dt>{hm.th('columns.doctor')}</dt><dd>{test.doctor}</dd></div>
        <div><dt>{hm.th('columns.sampleId')}</dt><dd>{test.sampleId}</dd></div>
        <div><dt>{hm.th('columns.patientId')}</dt><dd>{test.patientId}</dd></div>
        <div><dt>{hm.th('columns.notes')}</dt><dd>{test.notes}</dd></div>
      </dl>
      {renderTable('CBC — White Blood Cells', test.panels.wbc)}
      {renderTable('Differential (%)', test.panels.diff)}
      {renderTable('Red Blood Cells', test.panels.rbc)}
      {renderTable('Platelets', test.panels.platelets)}
      {renderTable('Chemistry / Profile', test.panels.chemistry)}
      {test.requiresVetReview ? <p className="hm-review-badge">{hm.th('review.requiresVet')}</p> : null}
    </div>
  );
}

function HorseMedicalProfile({
  horse,
  records,
  imageSrc,
  onBack,
  onImageChange,
  onUpdateRecords,
  horseMedia,
  onMediaUpload,
  onMediaRemove,
  mediaLabels,
}) {
  const hm = useHealthI18n();
  const [tab, setTab] = useState('summary');
  const [careSubTab, setCareSubTab] = useState('Vaccinations');
  const [weightModal, setWeightModal] = useState(false);
  const [examModal, setExamModal] = useState(false);
  const [bloodModal, setBloodModal] = useState(false);
  const [bloodMode, setBloodMode] = useState('manual');
  const [calendarModal, setCalendarModal] = useState(false);
  const [medModal, setMedModal] = useState(false);
  const [careModal, setCareModal] = useState(false);
  const [viewExam, setViewExam] = useState(null);
  const [viewBlood, setViewBlood] = useState(null);
  const [calView, setCalView] = useState('month');
  const [calMonth, setCalMonth] = useState(() => new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), 1));
  const [selectedCalDay, setSelectedCalDay] = useState(toISODate(DEMO_TODAY));
  const [calFilters, setCalFilters] = useState(EMPTY_CAL_FILTERS);
  const fileRef = useRef(null);

  const [weightForm, setWeightForm] = useState({ weight: '', dateTime: DEMO_NOW, method: 'Scale', recordedBy: 'Trainer', notes: '' });
  const [examForm, setExamForm] = useState(emptyPhysicalExamForm);
  const [bloodForm, setBloodForm] = useState({
    testDate: '2025-12-06T08:00', doctor: 'Dr. Smith', sampleId: 'SAMPLE-1-1', patientId: `PAT-${horse.horseId.replace('horse_', '')}`, notes: 'Routine blood work', panels: cloneBloodPanels(),
  });
  const [bloodFile, setBloodFile] = useState('');
  const [calForm, setCalForm] = useState(() => createCalendarEventForm(horse, toISODate(DEMO_TODAY)));

  const horseCalendarEvents = useMemo(
    () => filterCalendarEventsForHorse(records.calendarEvents, horse.horseId),
    [records.calendarEvents, horse.horseId],
  );

  useEffect(() => {
    setCalForm(createCalendarEventForm(horse, toISODate(DEMO_TODAY)));
    setCalFilters(EMPTY_CAL_FILTERS);
    setCalMonth(new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), 1));
    setSelectedCalDay(toISODate(DEMO_TODAY));
    setCalendarModal(false);
  }, [horse.horseId, horse.name]);
  const [medForm, setMedForm] = useState({
    courseName: '', medication: '', reason: '', startDate: '2026-05-17', endDate: '2026-05-24', frequency: 'Once daily', doseNotes: '', assignedBy: 'Dr. Smith', requiresVetApproval: true, withdrawalNotes: '', notes: '',
  });
  const [careForm, setCareForm] = useState({ date: '2026-05-17', name: '', brand: '', nextDue: '', notes: '' });

  const patch = useCallback((updater) => {
    onUpdateRecords(horse.horseId, updater);
  }, [horse.horseId, onUpdateRecords]);

  const saveWeight = () => {
    if (!weightForm.weight.trim()) { toast.error(hm.th('toast.weightRequired')); return; }
    patch((rec) => ({
      ...rec,
      weightRecords: [...rec.weightRecords, { id: nextId('w_', rec.weightRecords), ...weightForm }],
      timeline: [{ id: nextId('tl_', rec.timeline), type: 'weight', label: 'Weight record added', date: weightForm.dateTime.slice(0, 10) }, ...rec.timeline],
    }));
    toast.success(hm.th('toast.weightSaved'));
    setWeightModal(false);
    setWeightForm({ weight: '', dateTime: DEMO_NOW, method: 'Scale', recordedBy: 'Trainer', notes: '' });
  };

  const examNeedsReview = (form) => {
    if (Number(form.painScore) >= 4) return true;
    if (form.colic !== 'No' || form.cough === 'Yes') return true;
    if (form.auscultation === 'Needs Review' || form.auscultation === 'Murmur') return true;
    return LIMBS.some((limb) => {
      const l = form.limbs[limb];
      return l.tags.some((t) => t !== 'Normal') || Number(l.lamenessGrade) > 0;
    });
  };

  const saveExam = () => {
    const requiresVetReview = examNeedsReview(examForm);
    const overallStatus = requiresVetReview ? 'Needs Review' : 'Normal';
    patch((rec) => ({
      ...rec,
      physicalExams: [{
        id: nextId('pe_', rec.physicalExams),
        visitDateTime: examForm.visitDateTime,
        doctor: examForm.doctor,
        location: examForm.location,
        reason: examForm.reason,
        overallStatus,
        painScore: examForm.painScore,
        requiresVetReview,
        form: { ...examForm },
      }, ...rec.physicalExams],
      timeline: [{ id: nextId('tl_', rec.timeline), type: 'exam', label: 'Physical examination completed', date: examForm.visitDateTime.slice(0, 10) }, ...rec.timeline],
    }));
    toast.success(hm.th('toast.examSaved'));
    setExamModal(false);
    setExamForm(emptyPhysicalExamForm());
  };

  const saveBlood = () => {
    const requiresVetReview = bloodHasAbnormalFlag(bloodForm.panels);
    patch((rec) => ({
      ...rec,
      bloodTests: [{
        id: nextId('bt_', rec.bloodTests),
        testDate: bloodForm.testDate,
        doctor: bloodForm.doctor,
        device: 'VetScan HM5',
        sampleId: bloodForm.sampleId,
        patientId: bloodForm.patientId,
        notes: bloodForm.notes,
        overallFlag: requiresVetReview ? 'H' : 'N',
        requiresVetReview,
        panels: bloodForm.panels,
        source: bloodMode,
        fileName: bloodFile || null,
      }, ...rec.bloodTests],
      timeline: [{ id: nextId('tl_', rec.timeline), type: 'blood', label: 'Blood test uploaded', date: bloodForm.testDate.slice(0, 10) }, ...rec.timeline],
    }));
    toast.success(hm.th('toast.bloodSaved'));
    setBloodModal(false);
    setBloodForm({ ...bloodForm, panels: cloneBloodPanels() });
    setBloodFile('');
  };

  const openCalendarModal = (dateIso) => {
    setCalForm(createCalendarEventForm(horse, dateIso || toISODate(DEMO_TODAY)));
    if (dateIso) setSelectedCalDay(dateIso);
    setCalendarModal(true);
  };

  const saveCalendar = () => {
    if (!calForm.date) {
      toast.error(hm.th('toast.dateRequired'));
      return;
    }
    const event = {
      ...calForm,
      horseId: horse.horseId,
      horseName: horse.name,
      stableId: horse.stableId,
    };
    patch((rec) => {
      const horseEvents = filterCalendarEventsForHorse(rec.calendarEvents, horse.horseId);
      return {
        ...rec,
        calendarEvents: [
          { id: buildCalendarEventId(horse.horseId, horseEvents), ...event },
          ...horseEvents,
        ],
        timeline: [{
          id: nextId('tl_', rec.timeline),
          type: 'calendar',
          label: `${event.eventType} scheduled for ${horse.name}`,
          date: event.date,
        }, ...rec.timeline],
      };
    });
    toast.success(hm.th('toast.calendarSaved'));
    setCalendarModal(false);
    setSelectedCalDay(event.date);
    setCalMonth(new Date(`${event.date}T12:00:00`));
    setCalForm(createCalendarEventForm(horse, event.date));
  };

  const filteredCalendarEvents = useMemo(() => horseCalendarEvents.filter((ev) => {
    if (calFilters.eventType && ev.eventType !== calFilters.eventType) return false;
    if (calFilters.status && ev.status !== calFilters.status) return false;
    if (calFilters.date && ev.date !== calFilters.date) return false;
    return true;
  }), [horseCalendarEvents, calFilters]);

  const saveMedCourse = () => {
    if (!medForm.courseName.trim() || !medForm.medication.trim()) {
      toast.error(hm.th('toast.courseRequired'));
      return;
    }
    patch((rec) => ({
      ...rec,
      medicationCourses: [{
        id: nextId('mc_', rec.medicationCourses),
        ...medForm,
        status: medForm.requiresVetApproval ? 'Requires Vet Review' : 'Active',
        nextDose: `${medForm.startDate} 08:00`,
        doses: [`${medForm.startDate} 08:00`, `${medForm.startDate} 20:00`],
      }, ...rec.medicationCourses],
      timeline: [{ id: nextId('tl_', rec.timeline), type: 'med', label: 'Medication course started', date: medForm.startDate }, ...rec.timeline],
    }));
    toast.success(hm.th('toast.medSaved'));
    setMedModal(false);
  };

  const saveCare = () => {
    patch((rec) => {
      const list = rec.careHistory[careSubTab] || [];
      return {
        ...rec,
        careHistory: {
          ...rec.careHistory,
          [careSubTab]: [{ id: nextId('care_', list), ...careForm }, ...list],
        },
        timeline: careSubTab === 'Vaccinations'
          ? [{ id: nextId('tl_', rec.timeline), type: 'vaccine', label: 'Vaccination added', date: careForm.date }, ...rec.timeline]
          : rec.timeline,
      };
    });
    toast.success(hm.th('toast.careSaved', { section: hm.translateCareSubTab(careSubTab) }));
    setCareModal(false);
    setCareForm({ date: '2026-05-17', name: '', brand: '', nextDue: '', notes: '' });
  };

  const lastWeight = records.weightRecords[0];
  const lastExam = records.physicalExams[0];
  const lastBlood = records.bloodTests[0];
  const hasUpload = Boolean(imageSrc);
  const profileMediaSrc = imageSrc || DEFAULT_HORSE_IMAGE_URL;

  return (
    <div className="hm-profile">
      <button type="button" className="hm-back" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden /> {hm.th('backToHorses')}
      </button>

      <header className="hm-profile__hero">
        <div className={`hm-profile__media${hasUpload ? '' : ' hm-profile__media--default'}`}>
          <img
            src={profileMediaSrc}
            alt=""
            className={hasUpload ? '' : 'hm-profile__img--default'}
          />
          <label className="hm-profile__upload">
            <Camera size={16} aria-hidden />
            <span>{hm.th('changePhoto')}</span>
            <input type="file" accept="image/*" className="hm-sr-only" onChange={(e) => onImageChange(e.target.files?.[0])} />
          </label>
        </div>
        <div className="hm-profile__intro">
          <h1>{horse.name}</h1>
          <dl className="hm-profile__facts">
            <div><dt>{hm.th('profile.age')}</dt><dd>{horse.age}</dd></div>
            <div><dt>{hm.th('profile.color')}</dt><dd>{horse.color}</dd></div>
            <div><dt>{hm.th('profile.breed')}</dt><dd>{horse.breed}</dd></div>
            <div><dt>{hm.th('profile.gender')}</dt><dd>{horse.gender}</dd></div>
            <div><dt>{hm.th('profile.stable')}</dt><dd>{horse.stableName}</dd></div>
            <div><dt>{hm.th('profile.vetStatus')}</dt><dd><span className={`hm-badge hm-badge--${badgeTone(horse.veterinaryStatus)}`}>{hm.translateVetStatus(horse.veterinaryStatus)}</span></dd></div>
            <div><dt>{hm.th('profile.lastTrainingCheck')}</dt><dd>{horse.lastTrainingCheck}</dd></div>
            <div><dt>{hm.th('profile.weeklyExam')}</dt><dd>{horse.weeklyExamStatus}</dd></div>
          </dl>
          <div className="hm-profile__badges">
            {horse.badges.fit ? <span className="hm-pill hm-pill--positive">{hm.th('badges.fit')}</span> : null}
            {horse.badges.needsReview ? <span className="hm-pill hm-pill--warning">{hm.th('badges.needsReview')}</span> : null}
            {horse.badges.medicationCourse ? <span className="hm-pill hm-pill--gold">{hm.th('badges.medicationCourse')}</span> : null}
            {horse.badges.recovery ? <span className="hm-pill hm-pill--info">{hm.th('badges.recovery')}</span> : null}
            {horse.badges.bloodTestDue ? <span className="hm-pill hm-pill--warning">{hm.th('badges.bloodTestDue')}</span> : null}
          </div>
        </div>
      </header>

      <nav className="hm-tabs" aria-label={hm.th('tabsAria')}>
        {PROFILE_TABS.map(({ id, labelKey, icon: Icon }) => (
          <button key={id} type="button" className={`hm-tabs__btn${tab === id ? ' is-active' : ''}`} onClick={() => setTab(id)}>
            <Icon size={16} aria-hidden /> {hm.th(labelKey)}
          </button>
        ))}
      </nav>

      <div className="hm-tab-panel">
        {tab === 'summary' ? (
          <>
            <div className="hm-summary-grid">
              <article className="hm-summary-card"><span>{hm.th('summary.currentWeight')}</span><strong>{horse.currentWeight}</strong></article>
              <article className="hm-summary-card"><span>{hm.th('summary.lastPhysicalExam')}</span><strong>{lastExam ? hm.formatDate(lastExam.visitDateTime) : '—'}</strong></article>
              <article className="hm-summary-card"><span>{hm.th('summary.lastBloodTest')}</span><strong>{lastBlood ? hm.formatDate(lastBlood.testDate) : '—'}</strong></article>
              <article className="hm-summary-card"><span>{hm.th('summary.activeMedicationCourses')}</span><strong>{horse.summary.activeMedicationCourses}</strong></article>
              <article className="hm-summary-card"><span>{hm.th('summary.upcomingEvents')}</span><strong>{horse.summary.upcomingEvents}</strong></article>
              <article className="hm-summary-card"><span>{hm.th('summary.healthAlerts')}</span><strong>{horse.summary.healthAlerts}</strong></article>
              <article className="hm-summary-card"><span>{hm.th('summary.lastPostTrainingCheck')}</span><strong>{horse.lastTrainingCheck}</strong></article>
              <article className="hm-summary-card"><span>{hm.th('summary.weeklyDetailedCheck')}</span><strong>{horse.weeklyExamStatus}</strong></article>
            </div>

            <section className="hm-block">
              <h3>{hm.th('summary.timeline')}</h3>
              <ul className="hm-timeline">
                {records.timeline.length ? records.timeline.map((ev) => (
                  <li key={ev.id}><span className="hm-timeline__date">{ev.date}</span><span>{ev.label}</span></li>
                )) : <li className="hm-empty">{hm.th('summary.noTimeline')}</li>}
              </ul>
            </section>

            <section className="hm-block">
              <h3>{hm.th('summary.postTrainingTitle')}</h3>
              <p className="hm-block__lead">{hm.th('summary.postTrainingLead')}</p>
              <DataTable
                emptyLabel={hm.th('summary.noPostTraining')}
                columns={[
                  { key: 'session', label: hm.th('columns.session') },
                  { key: 'checkedBy', label: hm.th('columns.checkedBy') },
                  { key: 'time', label: hm.th('columns.time'), render: (r) => hm.formatDate(r.time) },
                  { key: 'status', label: hm.th('columns.status'), render: (r) => <span className={`hm-badge hm-badge--${badgeTone(r.status)}`}>{r.status}</span> },
                ]}
                rows={records.postTrainingChecks}
              />
            </section>

            <section className="hm-block">
              <h3>{hm.th('summary.weeklyTitle')}</h3>
              <p className="hm-block__lead">{hm.th('summary.weeklyLead')}</p>
              <DataTable
                emptyLabel={hm.th('summary.noWeekly')}
                columns={[
                  { key: 'completedDate', label: hm.th('columns.completedDate') },
                  { key: 'completedBy', label: hm.th('columns.completedBy') },
                  { key: 'nextDue', label: hm.th('columns.nextDue') },
                  { key: 'status', label: hm.th('columns.status') },
                ]}
                rows={records.weeklyExams}
              />
            </section>
          </>
        ) : null}

        {tab === 'weight' ? (
          <section className="hm-block">
            <div className="hm-block__head">
              <h3>{hm.th('weight.title')}</h3>
              <button type="button" className="hm-btn hm-btn--gold" onClick={() => setWeightModal(true)}><Plus size={16} /> {hm.th('weight.add')}</button>
            </div>
            <DataTable
              emptyLabel={hm.th('weight.empty')}
              columns={[
                { key: 'weight', label: hm.th('columns.weight'), render: (r) => hm.th('weight.kg', { value: r.weight }) },
                { key: 'dateTime', label: hm.th('columns.dateTime'), render: (r) => hm.formatDate(r.dateTime) },
                { key: 'method', label: hm.th('columns.method'), render: (r) => hm.translateWeightMethod(r.method) },
                { key: 'recordedBy', label: hm.th('columns.recordedBy'), render: (r) => hm.translateRecordedBy(r.recordedBy) },
                { key: 'notes', label: hm.th('columns.notes') },
              ]}
              rows={records.weightRecords}
            />
          </section>
        ) : null}

        {tab === 'physical' ? (
          <section className="hm-block">
            <div className="hm-block__head">
              <h3>{hm.th('physical.title')}</h3>
              <button type="button" className="hm-btn hm-btn--gold" onClick={() => setExamModal(true)}><Plus size={16} /> {hm.th('physical.add')}</button>
            </div>
            <p className="hm-disclaimer">{hm.th('physical.disclaimer')}</p>
            <DataTable
              emptyLabel={hm.th('physical.empty')}
              columns={[
                { key: 'visitDateTime', label: hm.th('columns.visitDateTime'), render: (r) => hm.formatDate(r.visitDateTime) },
                { key: 'doctor', label: hm.th('columns.doctor') },
                { key: 'location', label: hm.th('columns.location') },
                { key: 'reason', label: hm.th('columns.reason') },
                { key: 'overallStatus', label: hm.th('columns.overallStatus'), render: (r) => (
                  <span className={`hm-badge hm-badge--${badgeTone(r.overallStatus)}`}>{hm.translateOverallStatus(r.overallStatus)}{r.requiresVetReview ? hm.th('physical.vetReviewSuffix') : ''}</span>
                ) },
                { key: 'painScore', label: hm.th('columns.painScore') },
                { key: 'actions', label: hm.th('columns.actions'), render: (r) => (
                  <div className="hm-row-actions">
                    <button type="button" className="hm-btn hm-btn--ghost hm-btn--sm" onClick={() => setViewExam(r)}>{hm.th('view')}</button>
                    <button type="button" className="hm-btn hm-btn--ghost hm-btn--sm" onClick={() => { setViewExam(r); setTimeout(() => window.print(), 200); }}><Printer size={14} /> {hm.th('print')}</button>
                  </div>
                ) },
              ]}
              rows={records.physicalExams}
            />
          </section>
        ) : null}

        {tab === 'blood' ? (
          <section className="hm-block">
            <div className="hm-block__head">
              <h3>{hm.th('blood.title')}</h3>
              <button type="button" className="hm-btn hm-btn--gold" onClick={() => setBloodModal(true)}><Plus size={16} /> {hm.th('blood.add')}</button>
            </div>
            <p className="hm-disclaimer">{hm.th('blood.disclaimer')}</p>
            <DataTable
              emptyLabel={hm.th('blood.empty')}
              columns={[
                { key: 'testDate', label: hm.th('columns.testDate'), render: (r) => hm.formatDate(r.testDate) },
                { key: 'doctor', label: hm.th('columns.doctor') },
                { key: 'device', label: hm.th('columns.device') },
                { key: 'sampleId', label: hm.th('columns.sampleId') },
                { key: 'patientId', label: hm.th('columns.patientId') },
                { key: 'overallFlag', label: hm.th('columns.overallFlag'), render: (r) => (
                  <span className={`hm-badge hm-badge--${r.overallFlag === 'N' ? 'positive' : 'warning'}`}>{r.overallFlag}</span>
                ) },
                { key: 'actions', label: hm.th('columns.actions'), render: (r) => (
                  <div className="hm-row-actions">
                    <button type="button" className="hm-btn hm-btn--ghost hm-btn--sm" onClick={() => setViewBlood(r)}>{hm.th('view')}</button>
                    <button type="button" className="hm-btn hm-btn--ghost hm-btn--sm" onClick={() => { setViewBlood(r); setTimeout(() => window.print(), 200); }}><Printer size={14} /> {hm.th('print')}</button>
                    <button type="button" className="hm-btn hm-btn--ghost hm-btn--sm" onClick={() => toast(hm.th('blood.uploadPlaceholder'))}><Upload size={14} /></button>
                  </div>
                ) },
              ]}
              rows={records.bloodTests}
            />
          </section>
        ) : null}

        {tab === 'care' ? (
          <section className="hm-block">
            <nav className="hm-subtabs">
              {CARE_SUBTABS.map((st) => (
                <button key={st} type="button" className={`hm-subtabs__btn${careSubTab === st ? ' is-active' : ''}`} onClick={() => setCareSubTab(st)}>{hm.translateCareSubTab(st)}</button>
              ))}
            </nav>
            <div className="hm-block__head">
              <h3>{hm.translateCareSubTab(careSubTab)}</h3>
              <button type="button" className="hm-btn hm-btn--gold" onClick={() => setCareModal(true)}><Plus size={16} /> {hm.th('care.add', { section: hm.translateCareSubTab(careSubTab) })}</button>
            </div>
            <DataTable
              emptyLabel={hm.th('care.empty', { section: hm.translateCareSubTab(careSubTab) })}
              columns={[
                { key: 'date', label: hm.th('columns.date') },
                { key: 'name', label: hm.th('columns.nameType') },
                { key: 'brand', label: hm.th('columns.brand') },
                { key: 'nextDue', label: hm.th('columns.nextDue') },
                { key: 'notes', label: hm.th('columns.notes') },
              ]}
              rows={records.careHistory[careSubTab] || []}
            />
          </section>
        ) : null}

        {tab === 'calendar' ? (
          <section className="hm-block">
            <div className="hm-block__head">
              <h3>{hm.th('calendar.title', { name: horse.name })}</h3>
              <div className="hm-inline-actions">
                <button type="button" className={`hm-btn hm-btn--ghost hm-btn--sm${calView === 'month' ? ' is-active' : ''}`} onClick={() => setCalView('month')}>{hm.th('calendar.monthView')}</button>
                <button type="button" className={`hm-btn hm-btn--ghost hm-btn--sm${calView === 'list' ? ' is-active' : ''}`} onClick={() => setCalView('list')}>{hm.th('calendar.listView')}</button>
                <button type="button" className="hm-btn hm-btn--gold" onClick={() => openCalendarModal(selectedCalDay || toISODate(DEMO_TODAY))}><Plus size={16} /> {hm.th('calendar.addEvent')}</button>
              </div>
            </div>
            <p className="hm-block__lead">{hm.th('calendar.lead', { name: horse.name })}</p>
            {calView === 'month' ? (
              <MedicalCalendar
                events={horseCalendarEvents}
                horseName={horse.name}
                month={calMonth}
                onMonthChange={setCalMonth}
                selectedDay={selectedCalDay}
                onSelectDay={setSelectedCalDay}
                filters={calFilters}
                onFilterChange={setCalFilters}
                onResetFilters={() => setCalFilters(EMPTY_CAL_FILTERS)}
                onAddEvent={openCalendarModal}
              />
            ) : (
              <DataTable
                emptyLabel={hm.th('calendar.emptyList')}
                columns={[
                  { key: 'eventType', label: hm.th('columns.eventType'), render: (r) => hm.translateCalendarEventType(r.eventType) },
                  { key: 'date', label: hm.th('columns.date') },
                  { key: 'time', label: hm.th('columns.time') },
                  { key: 'assignedTo', label: hm.th('columns.assignedTo') },
                  { key: 'priority', label: hm.th('columns.priority'), render: (r) => hm.translateCalendarPriority(r.priority) },
                  { key: 'status', label: hm.th('columns.status'), render: (r) => <span className={`hm-badge hm-badge--${badgeTone(r.status)}`}>{hm.translateCalendarStatus(r.status)}</span> },
                ]}
                rows={filteredCalendarEvents}
              />
            )}
          </section>
        ) : null}

        {tab === 'media' ? (
          <section className="hm-block">
            <div className="hm-block__head">
              <h3>{hm.th('media.title')}</h3>
            </div>
            <p className="hm-block__lead">{hm.th('media.lead', { name: horse.name })}</p>
            <HorseMediaLibrary
              theme="health"
              media={horseMedia}
              labels={mediaLabels}
              onUpload={onMediaUpload}
              onRemove={onMediaRemove}
            />
          </section>
        ) : null}

        {tab === 'medication' ? (
          <section className="hm-block">
            <div className="hm-block__head">
              <h3>{hm.th('medication.title')}</h3>
              <button type="button" className="hm-btn hm-btn--gold" onClick={() => setMedModal(true)}><Plus size={16} /> {hm.th('medication.add')}</button>
            </div>
            <p className="hm-safety-notice">{hm.th('medication.safetyNotice')}</p>
            <DataTable
              emptyLabel={hm.th('medication.empty')}
              columns={[
                { key: 'courseName', label: hm.th('columns.courseName') },
                { key: 'medication', label: hm.th('columns.medication') },
                { key: 'startDate', label: hm.th('columns.startDate') },
                { key: 'endDate', label: hm.th('columns.endDate') },
                { key: 'frequency', label: hm.th('columns.frequency'), render: (r) => hm.translateMedFrequency(r.frequency) },
                { key: 'assignedBy', label: hm.th('columns.doctor') },
                { key: 'status', label: hm.th('columns.status'), render: (r) => <span className={`hm-badge hm-badge--${badgeTone(r.status)}`}>{hm.translateMedStatus(r.status)}</span> },
                { key: 'nextDose', label: hm.th('columns.nextDose'), render: (r) => hm.formatDate(r.nextDose) },
              ]}
              rows={records.medicationCourses}
            />
            {records.medicationCourses[0]?.doses?.length ? (
              <div className="hm-dose-list">
                <h4>{hm.th('medication.dosesPlaceholder')}</h4>
                <ul>{records.medicationCourses[0].doses.map((d) => <li key={d}>{d}</li>)}</ul>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      {/* Weight modal */}
      <Modal
        open={weightModal}
        title={hm.th('weight.modalTitle')}
        closeLabel={hm.th('close')}
        onClose={() => setWeightModal(false)}
        foot={(
          <>
            <button type="button" className="hm-btn hm-btn--ghost" onClick={() => setWeightModal(false)}>{hm.th('cancel')}</button>
            <button type="button" className="hm-btn hm-btn--gold" onClick={saveWeight}>{hm.th('save')}</button>
          </>
        )}
      >
        <div className="hm-form-grid">
          <label className="hm-field"><span>{hm.th('weight.weightKg')}</span><input value={weightForm.weight} onChange={(e) => setWeightForm((f) => ({ ...f, weight: e.target.value }))} /></label>
          <label className="hm-field"><span>{hm.th('columns.dateTime')} *</span><input type="datetime-local" value={weightForm.dateTime} onChange={(e) => setWeightForm((f) => ({ ...f, dateTime: e.target.value }))} /></label>
          <label className="hm-field"><span>{hm.th('columns.method')} *</span><select value={weightForm.method} onChange={(e) => setWeightForm((f) => ({ ...f, method: e.target.value }))}>{WEIGHT_METHODS.map((m) => <option key={m} value={m}>{hm.translateWeightMethod(m)}</option>)}</select></label>
          <label className="hm-field"><span>{hm.th('columns.recordedBy')} *</span><select value={weightForm.recordedBy} onChange={(e) => setWeightForm((f) => ({ ...f, recordedBy: e.target.value }))}>{RECORDED_BY.map((m) => <option key={m} value={m}>{hm.translateRecordedBy(m)}</option>)}</select></label>
          <label className="hm-field hm-field--full"><span>{hm.th('columns.notes')}</span><textarea rows={2} value={weightForm.notes} onChange={(e) => setWeightForm((f) => ({ ...f, notes: e.target.value }))} /></label>
        </div>
      </Modal>

      {/* Physical exam modal — abbreviated layout with all sections */}
      <Modal open={examModal} title={hm.th('physical.modalTitle')} closeLabel={hm.th('close')} onClose={() => setExamModal(false)} wide="xl" foot={(
        <>
          <button type="button" className="hm-btn hm-btn--ghost" onClick={() => setExamModal(false)}>{hm.th('cancel')}</button>
          <button type="button" className="hm-btn hm-btn--gold" onClick={saveExam}>{hm.th('physical.saveVisit')}</button>
        </>
      )}>
        <div className="hm-form-section">
          <h4>General Visit Info</h4>
          <div className="hm-form-grid">
            <label className="hm-field"><span>Visit Date & Time *</span><input type="datetime-local" value={examForm.visitDateTime} onChange={(e) => setExamForm((f) => ({ ...f, visitDateTime: e.target.value }))} /></label>
            <label className="hm-field"><span>Doctor *</span><input value={examForm.doctor} onChange={(e) => setExamForm((f) => ({ ...f, doctor: e.target.value }))} /></label>
            <label className="hm-field"><span>Location</span><input value={examForm.location} onChange={(e) => setExamForm((f) => ({ ...f, location: e.target.value }))} /></label>
            <label className="hm-field hm-field--full"><span>Reason / Complaint</span><input value={examForm.reason} onChange={(e) => setExamForm((f) => ({ ...f, reason: e.target.value }))} /></label>
          </div>
        </div>
        <div className="hm-form-section">
          <h4>Vital Signs</h4>
          <div className="hm-form-grid">
            <label className="hm-field"><span>Temperature (°C)</span><input value={examForm.temperature} onChange={(e) => setExamForm((f) => ({ ...f, temperature: e.target.value }))} /></label>
            <label className="hm-field"><span>Pulse (bpm)</span><input value={examForm.pulse} onChange={(e) => setExamForm((f) => ({ ...f, pulse: e.target.value }))} /></label>
            <label className="hm-field"><span>Respiration</span><input value={examForm.respiration} onChange={(e) => setExamForm((f) => ({ ...f, respiration: e.target.value }))} /></label>
            <label className="hm-field"><span>Mucous Membranes</span><select value={examForm.mucousMembranes} onChange={(e) => setExamForm((f) => ({ ...f, mucousMembranes: e.target.value }))}>{MUCOUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label className="hm-field"><span>CRT (seconds)</span><input value={examForm.crt} onChange={(e) => setExamForm((f) => ({ ...f, crt: e.target.value }))} /></label>
            <label className="hm-field"><span>Hydration Status</span><select value={examForm.hydrationStatus} onChange={(e) => setExamForm((f) => ({ ...f, hydrationStatus: e.target.value }))}>{HYDRATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label className="hm-field"><span>Body Condition Score (1-9)</span><input value={examForm.bodyConditionScore} onChange={(e) => setExamForm((f) => ({ ...f, bodyConditionScore: e.target.value }))} /></label>
          </div>
        </div>
        <div className="hm-form-section">
          <h4>General</h4>
          <div className="hm-form-grid">
            <label className="hm-field"><span>Attitude</span><select value={examForm.attitude} onChange={(e) => setExamForm((f) => ({ ...f, attitude: e.target.value }))}>{ATTITUDE_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label className="hm-field"><span>Appetite</span><select value={examForm.appetite} onChange={(e) => setExamForm((f) => ({ ...f, appetite: e.target.value }))}>{APPETITE_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label className="hm-field"><span>Pain Score (0-10)</span><input value={examForm.painScore} onChange={(e) => setExamForm((f) => ({ ...f, painScore: e.target.value }))} /></label>
          </div>
        </div>
        <div className="hm-form-section">
          <h4>Limbs</h4>
          {LIMBS.map((limb) => (
            <div key={limb} className="hm-limb-block">
              <h5>{limb}</h5>
              <TagMultiSelect label="Tags" suggested={LIMB_TAGS} selected={examForm.limbs[limb].tags} onChange={(tags) => setExamForm((f) => ({ ...f, limbs: { ...f.limbs, [limb]: { ...f.limbs[limb], tags } } }))} />
              <label className="hm-field"><span>Lameness Grade (0-5)</span><input value={examForm.limbs[limb].lamenessGrade} onChange={(e) => setExamForm((f) => ({ ...f, limbs: { ...f.limbs, [limb]: { ...f.limbs[limb], lamenessGrade: e.target.value } } }))} /></label>
              <label className="hm-field hm-field--full"><span>Notes</span><input value={examForm.limbs[limb].notes} onChange={(e) => setExamForm((f) => ({ ...f, limbs: { ...f.limbs, [limb]: { ...f.limbs[limb], notes: e.target.value } } }))} /></label>
            </div>
          ))}
        </div>
        <TagMultiSelect label="Skin & Coat Tags" suggested={SKIN_TAGS} selected={examForm.skinTags} onChange={(skinTags) => setExamForm((f) => ({ ...f, skinTags }))} />
        <label className="hm-field hm-field--full"><span>Skin Notes</span><textarea rows={2} value={examForm.skinNotes} onChange={(e) => setExamForm((f) => ({ ...f, skinNotes: e.target.value }))} /></label>
        <TagMultiSelect label="Eyes / Ears / Nose / Mouth Tags" suggested={HEAD_TAGS} selected={examForm.headTags} onChange={(headTags) => setExamForm((f) => ({ ...f, headTags }))} />
        <label className="hm-field hm-field--full"><span>Head Notes</span><textarea rows={2} value={examForm.headNotes} onChange={(e) => setExamForm((f) => ({ ...f, headNotes: e.target.value }))} /></label>
        <label className="hm-field hm-field--full"><span>Dental Quick Check Notes</span><textarea rows={2} value={examForm.dentalNotes} onChange={(e) => setExamForm((f) => ({ ...f, dentalNotes: e.target.value }))} /></label>
        <div className="hm-form-grid">
          <label className="hm-field"><span>Gut Sounds</span><select value={examForm.gutSounds} onChange={(e) => setExamForm((f) => ({ ...f, gutSounds: e.target.value }))}>{GUT_SOUNDS.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="hm-field"><span>Colic</span><select value={examForm.colic} onChange={(e) => setExamForm((f) => ({ ...f, colic: e.target.value }))}>{COLIC_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="hm-field hm-field--full"><span>GI Notes</span><input value={examForm.giNotes} onChange={(e) => setExamForm((f) => ({ ...f, giNotes: e.target.value }))} /></label>
          <label className="hm-field"><span>Cough</span><select value={examForm.cough} onChange={(e) => setExamForm((f) => ({ ...f, cough: e.target.value }))}>{COUGH_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="hm-field"><span>Nasal Discharge</span><select value={examForm.nasalDischarge} onChange={(e) => setExamForm((f) => ({ ...f, nasalDischarge: e.target.value }))}>{NASAL_DISCHARGE.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="hm-field"><span>Breathing Effort</span><select value={examForm.breathingEffort} onChange={(e) => setExamForm((f) => ({ ...f, breathingEffort: e.target.value }))}>{BREATHING_EFFORT.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="hm-field hm-field--full"><span>Respiratory Notes</span><input value={examForm.respiratoryNotes} onChange={(e) => setExamForm((f) => ({ ...f, respiratoryNotes: e.target.value }))} /></label>
          <label className="hm-field"><span>Auscultation Result</span><select value={examForm.auscultation} onChange={(e) => setExamForm((f) => ({ ...f, auscultation: e.target.value }))}>{AUSCULTATION.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="hm-field hm-field--full"><span>Cardiovascular Notes</span><input value={examForm.cardiovascularNotes} onChange={(e) => setExamForm((f) => ({ ...f, cardiovascularNotes: e.target.value }))} /></label>
        </div>
        {examNeedsReview(examForm) ? <p className="hm-review-badge">Requires Veterinarian Review</p> : null}
      </Modal>

      {/* Blood test modal */}
      <Modal open={bloodModal} title={hm.th('blood.modalTitle')} subtitle={hm.th('blood.modalSubtitle')} closeLabel={hm.th('close')} onClose={() => setBloodModal(false)} wide="xl" foot={(
        <>
          <button type="button" className="hm-btn hm-btn--ghost" onClick={() => setBloodModal(false)}>{hm.th('cancel')}</button>
          <button type="button" className="hm-btn hm-btn--gold" onClick={saveBlood}>{hm.th('blood.save')}</button>
        </>
      )}>
        <div className="hm-blood-modes">
          {['scan', 'upload', 'manual'].map((mode) => (
            <button key={mode} type="button" className={`hm-btn hm-btn--ghost${bloodMode === mode ? ' is-active' : ''}`} onClick={() => setBloodMode(mode)}>{mode === 'scan' ? 'Scan' : mode === 'upload' ? 'Upload' : 'Enter manually'}</button>
          ))}
        </div>
        {bloodMode === 'scan' ? (
          <div className="hm-placeholder-panel"><p>Camera scan feature will be connected later.</p></div>
        ) : null}
        {bloodMode === 'upload' ? (
          <div className="hm-placeholder-panel">
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hm-sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setBloodFile(f.name); toast.success(`File selected: ${f.name}`); } }} />
            <button type="button" className="hm-btn hm-btn--outline" onClick={() => fileRef.current?.click()}><Upload size={16} /> Choose file (PDF, JPG, PNG)</button>
            {bloodFile ? <p>Uploaded: {bloodFile}</p> : null}
          </div>
        ) : null}
        {bloodMode === 'manual' ? (
          <div className="hm-form-grid">
            <label className="hm-field"><span>Test Date</span><input type="datetime-local" value={bloodForm.testDate} onChange={(e) => setBloodForm((f) => ({ ...f, testDate: e.target.value }))} /></label>
            <label className="hm-field"><span>Doctor</span><input value={bloodForm.doctor} onChange={(e) => setBloodForm((f) => ({ ...f, doctor: e.target.value }))} /></label>
            <label className="hm-field"><span>Sample ID</span><input value={bloodForm.sampleId} onChange={(e) => setBloodForm((f) => ({ ...f, sampleId: e.target.value }))} /></label>
            <label className="hm-field"><span>Patient ID</span><input value={bloodForm.patientId} onChange={(e) => setBloodForm((f) => ({ ...f, patientId: e.target.value }))} /></label>
            <label className="hm-field hm-field--full"><span>Notes</span><input value={bloodForm.notes} onChange={(e) => setBloodForm((f) => ({ ...f, notes: e.target.value }))} /></label>
          </div>
        ) : null}
        {(bloodMode === 'manual' || bloodFile) ? <BloodReportView test={bloodForm} /> : null}
        {bloodHasAbnormalFlag(bloodForm.panels) ? <p className="hm-review-badge">Requires Veterinarian Review</p> : null}
      </Modal>

      <Modal open={calendarModal} title={hm.th('calendar.modalTitle', { name: horse.name })} closeLabel={hm.th('close')} onClose={() => setCalendarModal(false)} wide foot={(
        <>
          <button type="button" className="hm-btn hm-btn--ghost" onClick={() => setCalendarModal(false)}>{hm.th('cancel')}</button>
          <button type="button" className="hm-btn hm-btn--gold" onClick={saveCalendar}>{hm.th('calendar.saveEvent')}</button>
        </>
      )}>
        <div className="hm-form-grid">
          <label className="hm-field">
            <span>Horse</span>
            <input value={horse.name} readOnly disabled className="hm-field--readonly" />
          </label>
          <label className="hm-field"><span>{hm.th('columns.eventType')}</span><select value={calForm.eventType} onChange={(e) => setCalForm((f) => ({ ...f, eventType: e.target.value }))}>{CALENDAR_EVENT_TYPES.map((et) => <option key={et} value={et}>{hm.translateCalendarEventType(et)}</option>)}</select></label>
          <label className="hm-field"><span>Date</span><input type="date" value={calForm.date} onChange={(e) => setCalForm((f) => ({ ...f, date: e.target.value }))} /></label>
          <label className="hm-field"><span>Time</span><input type="time" value={calForm.time} onChange={(e) => setCalForm((f) => ({ ...f, time: e.target.value }))} /></label>
          <label className="hm-field"><span>Assigned To</span><select value={calForm.assignedTo} onChange={(e) => setCalForm((f) => ({ ...f, assignedTo: e.target.value }))}>{CALENDAR_ASSIGNED.map((a) => <option key={a}>{a}</option>)}</select></label>
          <label className="hm-field"><span>{hm.th('columns.priority')}</span><select value={calForm.priority} onChange={(e) => setCalForm((f) => ({ ...f, priority: e.target.value }))}>{CALENDAR_PRIORITY.map((p) => <option key={p} value={p}>{hm.translateCalendarPriority(p)}</option>)}</select></label>
          <label className="hm-field"><span>{hm.th('columns.repeat')}</span><select value={calForm.repeat} onChange={(e) => setCalForm((f) => ({ ...f, repeat: e.target.value }))}>{CALENDAR_REPEAT.map((r) => <option key={r} value={r}>{hm.translateCalendarRepeat(r)}</option>)}</select></label>
          <label className="hm-field"><span>{hm.th('columns.status')}</span><select value={calForm.status} onChange={(e) => setCalForm((f) => ({ ...f, status: e.target.value }))}>{CALENDAR_STATUS.map((s) => <option key={s} value={s}>{hm.translateCalendarStatus(s)}</option>)}</select></label>
          <label className="hm-field hm-field--full"><span>Notes</span><textarea rows={2} value={calForm.notes} onChange={(e) => setCalForm((f) => ({ ...f, notes: e.target.value }))} /></label>
        </div>
      </Modal>

      <Modal open={medModal} title={hm.th('medication.modalTitle')} closeLabel={hm.th('close')} onClose={() => setMedModal(false)} wide foot={(
        <>
          <button type="button" className="hm-btn hm-btn--ghost" onClick={() => setMedModal(false)}>{hm.th('cancel')}</button>
          <button type="button" className="hm-btn hm-btn--gold" onClick={saveMedCourse}>{hm.th('medication.saveCourse')}</button>
        </>
      )}>
        <div className="hm-form-grid">
          <label className="hm-field"><span>Course Name</span><input value={medForm.courseName} onChange={(e) => setMedForm((f) => ({ ...f, courseName: e.target.value }))} /></label>
          <label className="hm-field"><span>Medication Name</span><input value={medForm.medication} onChange={(e) => setMedForm((f) => ({ ...f, medication: e.target.value }))} /></label>
          <label className="hm-field hm-field--full"><span>Reason</span><input value={medForm.reason} onChange={(e) => setMedForm((f) => ({ ...f, reason: e.target.value }))} /></label>
          <label className="hm-field"><span>Start Date</span><input type="date" value={medForm.startDate} onChange={(e) => setMedForm((f) => ({ ...f, startDate: e.target.value }))} /></label>
          <label className="hm-field"><span>End Date</span><input type="date" value={medForm.endDate} onChange={(e) => setMedForm((f) => ({ ...f, endDate: e.target.value }))} /></label>
          <label className="hm-field"><span>{hm.th('columns.frequency')}</span><select value={medForm.frequency} onChange={(e) => setMedForm((f) => ({ ...f, frequency: e.target.value }))}>{MED_FREQUENCY.map((f) => <option key={f} value={f}>{hm.translateMedFrequency(f)}</option>)}</select></label>
          <label className="hm-field hm-field--full"><span>{hm.th('columns.notes')}</span><textarea rows={2} value={medForm.doseNotes} onChange={(e) => setMedForm((f) => ({ ...f, doseNotes: e.target.value }))} placeholder={hm.th('medication.doseNotesPlaceholder')} /></label>
          <label className="hm-field"><span>{hm.th('columns.recordedBy')}</span><input value={medForm.assignedBy} onChange={(e) => setMedForm((f) => ({ ...f, assignedBy: e.target.value }))} /></label>
          <label className="hm-field hm-field--check"><input type="checkbox" checked={medForm.requiresVetApproval} onChange={(e) => setMedForm((f) => ({ ...f, requiresVetApproval: e.target.checked }))} /> {hm.th('medication.requiresVetApproval')}</label>
          <label className="hm-field hm-field--full"><span>Withdrawal Period Notes</span><input value={medForm.withdrawalNotes} onChange={(e) => setMedForm((f) => ({ ...f, withdrawalNotes: e.target.value }))} /></label>
          <label className="hm-field hm-field--full"><span>Notes</span><textarea rows={2} value={medForm.notes} onChange={(e) => setMedForm((f) => ({ ...f, notes: e.target.value }))} /></label>
        </div>
      </Modal>

      <Modal open={careModal} title={hm.th('care.modalTitle', { section: hm.translateCareSubTab(careSubTab) })} closeLabel={hm.th('close')} onClose={() => setCareModal(false)} foot={(
        <>
          <button type="button" className="hm-btn hm-btn--ghost" onClick={() => setCareModal(false)}>{hm.th('cancel')}</button>
          <button type="button" className="hm-btn hm-btn--gold" onClick={saveCare}>{hm.th('save')}</button>
        </>
      )}>
        <div className="hm-form-grid">
          <label className="hm-field"><span>Date</span><input type="date" value={careForm.date} onChange={(e) => setCareForm((f) => ({ ...f, date: e.target.value }))} /></label>
          <label className="hm-field"><span>Name / Type</span><input value={careForm.name} onChange={(e) => setCareForm((f) => ({ ...f, name: e.target.value }))} /></label>
          <label className="hm-field"><span>Brand</span><input value={careForm.brand} onChange={(e) => setCareForm((f) => ({ ...f, brand: e.target.value }))} /></label>
          <label className="hm-field"><span>Next Due</span><input type="date" value={careForm.nextDue} onChange={(e) => setCareForm((f) => ({ ...f, nextDue: e.target.value }))} /></label>
          <label className="hm-field hm-field--full"><span>Notes</span><textarea rows={2} value={careForm.notes} onChange={(e) => setCareForm((f) => ({ ...f, notes: e.target.value }))} /></label>
        </div>
      </Modal>

      <Modal open={!!viewExam} title={hm.th('physical.modalTitleView')} closeLabel={hm.th('close')} onClose={() => setViewExam(null)} wide foot={(
        <button type="button" className="hm-btn hm-btn--gold" onClick={() => window.print()}><Printer size={16} /> {hm.th('print')}</button>
      )}>
        {viewExam ? (
          <div id="hm-print-exam" className="hm-print-block">
            <p><strong>Date:</strong> {hm.formatDate(viewExam.visitDateTime)}</p>
            <p><strong>Doctor:</strong> {viewExam.doctor}</p>
            <p><strong>Reason:</strong> {viewExam.reason}</p>
            <p><strong>Status:</strong> {viewExam.overallStatus} · Pain {viewExam.painScore}</p>
            {viewExam.requiresVetReview ? <p className="hm-review-badge">{hm.th('review.requiresVet')}</p> : null}
          </div>
        ) : null}
      </Modal>

      <Modal open={!!viewBlood} title={hm.th('blood.modalTitleView')} closeLabel={hm.th('close')} onClose={() => setViewBlood(null)} wide="xl" foot={(
        <button type="button" className="hm-btn hm-btn--gold" onClick={() => window.print()}><Printer size={16} /> {hm.th('print')}</button>
      )}>
        {viewBlood ? <BloodReportView test={viewBlood} printId="hm-print-blood" /> : null}
      </Modal>
    </div>
  );
}

const VET_FILTER_VALUES = ['Fit', 'Under Observation', 'Restricted'];

export default function Health() {
  const hm = useHealthI18n();
  const { stableId } = useAuth();
  const initial = useMemo(() => buildInitialMedicalStore(), []);
  const [horses, setHorses] = useState(initial.horses);
  const [recordsByHorse, setRecordsByHorse] = useState(initial.recordsByHorse);
  const [selectedId, setSelectedId] = useState(null);
  const [imageOverrides, setImageOverrides] = useState({});
  const [search, setSearch] = useState('');
  const [vetFilter, setVetFilter] = useState('');
  const [alertOnly, setAlertOnly] = useState(false);
  const [mediaByHorse, setMediaByHorse] = useState(buildInitialMediaByHorse);
  const objectUrlsRef = useRef([]);

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const registerObjectUrl = useCallback((url) => {
    objectUrlsRef.current.push(url);
    return url;
  }, []);

  const mediaLabels = hm.mediaLabels;

  const visibleHorses = useMemo(() => horses.filter((h) => {
    const stableMatch = !stableId || h.stableId === stableId || ['stable-1', 'stable_001'].includes(stableId);
    if (!stableMatch) return false;
    if (alertOnly && !h.medicalAlert) return false;
    if (vetFilter && h.veterinaryStatus !== vetFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return h.name.toLowerCase().includes(q) || h.color.toLowerCase().includes(q);
    }
    return true;
  }), [horses, stableId, search, vetFilter, alertOnly]);

  const selectedHorse = horses.find((h) => h.horseId === selectedId);
  const selectedRecords = selectedId ? recordsByHorse[selectedId] : null;

  const updateRecords = useCallback((horseId, updater) => {
    setRecordsByHorse((prev) => ({
      ...prev,
      [horseId]: typeof updater === 'function' ? updater(prev[horseId]) : updater,
    }));
  }, []);

  const handleImage = (horseId, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageOverrides((prev) => ({ ...prev, [horseId]: url }));
    toast.success(hm.th('toast.photoUpdated'));
  };

  const handleMediaUpload = useCallback((horseId, category, file) => {
    const url = registerObjectUrl(URL.createObjectURL(file));
    const current = getHorseMedia(mediaByHorse, horseId);
    const entry = {
      id: nextMediaId(horseId, category, current[category]),
      horseId,
      category,
      type: isVideoFile(file) ? 'video' : 'image',
      fileName: file.name,
      url,
      caption: '',
      uploadedBy: category === MEDIA_CATEGORIES.owner
        ? hm.th('media.ownerTitle')
        : hm.th('enums.recordedBy.stableStaff'),
      sessionLabel: category === MEDIA_CATEGORIES.riderCoach
        ? hm.th('media.riderCoachHint')
        : '',
      createdAt: new Date().toISOString(),
    };
    setMediaByHorse((prev) => ({
      ...prev,
      [horseId]: {
        ...getHorseMedia(prev, horseId),
        [category]: [entry, ...current[category]],
      },
    }));
    toast.success(hm.th('toast.mediaAdded'));
  }, [mediaByHorse, registerObjectUrl, hm]);

  const handleMediaRemove = useCallback((horseId, category, mediaId) => {
    setMediaByHorse((prev) => {
      const current = getHorseMedia(prev, horseId);
      const removed = current[category].find((m) => m.id === mediaId);
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return {
        ...prev,
        [horseId]: {
          ...current,
          [category]: current[category].filter((m) => m.id !== mediaId),
        },
      };
    });
    toast.success(hm.th('toast.mediaRemoved'));
  }, [hm]);

  const resetFilters = () => {
    setSearch('');
    setVetFilter('');
    setAlertOnly(false);
  };

  if (selectedHorse && selectedRecords) {
    return (
      <div className="hm-page">
        <HorseMedicalProfile
          key={selectedHorse.horseId}
          horse={selectedHorse}
          records={selectedRecords}
          imageSrc={getMedicalHorseImage(selectedHorse, imageOverrides)}
          onBack={() => setSelectedId(null)}
          onImageChange={(file) => handleImage(selectedHorse.horseId, file)}
          onUpdateRecords={updateRecords}
          horseMedia={getHorseMedia(mediaByHorse, selectedHorse.horseId)}
          onMediaUpload={(category, file) => handleMediaUpload(selectedHorse.horseId, category, file)}
          onMediaRemove={(category, mediaId) => handleMediaRemove(selectedHorse.horseId, category, mediaId)}
          mediaLabels={mediaLabels}
        />
      </div>
    );
  }

  return (
    <div className="hm-page">
      <header className="hm-page__header">
        <div>
          <h1 className="hm-page__title">{hm.th('title')}</h1>
          <p className="hm-page__subtitle">{hm.th('subtitle')}</p>
        </div>
        <button type="button" className="hm-btn hm-btn--ghost" onClick={() => window.print()}><Printer size={16} /> {hm.th('printSummary')}</button>
      </header>

      <div className="hm-filters">
        <label className="hm-search">
          <Search size={18} aria-hidden />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={hm.th('searchPlaceholder')} />
        </label>
        <label className="hm-filter-select">
          <Filter size={16} aria-hidden />
          <select value={vetFilter} onChange={(e) => setVetFilter(e.target.value)}>
            <option value="">{hm.th('allVetStatuses')}</option>
            {VET_FILTER_VALUES.map((v) => <option key={v} value={v}>{hm.translateVetStatus(v)}</option>)}
          </select>
        </label>
        <label className="hm-filter-check">
          <input type="checkbox" checked={alertOnly} onChange={(e) => setAlertOnly(e.target.checked)} />
          {hm.th('medicalAlertsOnly')}
        </label>
        <button type="button" className="hm-btn hm-btn--ghost" onClick={resetFilters}><RotateCcw size={16} /> {hm.th('resetFilters')}</button>
      </div>

      {visibleHorses.length === 0 ? (
        <p className="hm-empty hm-empty--page">{hm.th('noHorsesFiltered')}</p>
      ) : (
        <div className="hm-horse-grid">
          {visibleHorses.map((horse) => (
            <HorseCard key={horse.horseId} horse={horse} imageSrc={getMedicalHorseImage(horse, imageOverrides)} onOpen={setSelectedId} />
          ))}
        </div>
      )}
    </div>
  );
}







