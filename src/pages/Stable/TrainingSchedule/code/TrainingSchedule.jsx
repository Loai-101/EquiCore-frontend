/**
 * Training Schedule — calendar planning, templates, rider sends (frontend demo).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  stableDashboardChartAxisTick,
  stableDashboardChartTooltipContentStyle,
} from '../../../../utils/chartUiConfig';
import {
  buildInitialScheduleEvents,
  CREATED_BY_I18N,
  DIFFICULTY_I18N,
  DISCIPLINE_I18N,
  EVENT_STATUSES,
  EVENT_TYPE_I18N,
  EVENT_TYPES,
  eventTypeClass,
  nextEventId,
  SCHEDULE_HORSES,
  SCHEDULE_RIDERS,
  SCHEDULE_TRAINERS,
  STATUS_I18N,
  statusClass,
  TRAINING_LIBRARY_TEMPLATES,
} from './trainingScheduleData';
import { computeScheduleSummary } from './computeScheduleSummary';
import {
  ASSIGNMENT_EVENT_TYPES,
  buildAssignmentFields,
  eventMatchesHorseFilter,
  eventMatchesRiderFilter,
  getEventCardDisplay,
  getGroupPairLines,
  normalizeScheduleEvent,
  pairsFromForm,
} from './scheduleAssignment';

function useTrainingScheduleI18n() {
  const { t, i18n } = useTranslation();

  const th = useCallback((key, opts) => t(`pages.trainingSchedule.${key}`, opts), [t]);

  const translateEventType = useCallback((value) => {
    const k = EVENT_TYPE_I18N[value];
    return k ? t(`pages.trainingSchedule.enums.eventType.${k}`) : value;
  }, [t]);

  const translateStatus = useCallback((value) => {
    const k = STATUS_I18N[value];
    return k ? t(`pages.trainingSchedule.enums.status.${k}`) : value;
  }, [t]);

  const translateDifficulty = useCallback((value) => {
    const k = DIFFICULTY_I18N[value];
    return k ? t(`pages.trainingSchedule.enums.difficulty.${k}`) : value;
  }, [t]);

  const translateDiscipline = useCallback((value) => {
    const k = DISCIPLINE_I18N[value];
    return k ? t(`pages.trainingSchedule.enums.discipline.${k}`) : value;
  }, [t]);

  const translateCreatedBy = useCallback((value) => {
    const k = CREATED_BY_I18N[value];
    return k ? t(`pages.trainingSchedule.enums.createdBy.${k}`) : value;
  }, [t]);

  const translateTemplateName = useCallback(
    (tpl) => (tpl ? t(`pages.trainingSchedule.templates.${tpl.id}.name`, { defaultValue: tpl.name }) : ''),
    [t],
  );

  const translateAssignmentType = useCallback(
    (type) => (type === 'group' ? th('assignment.typeGroup') : th('assignment.typeSingle')),
    [th],
  );

  const emptyCell = useCallback(() => t('common.emptyCell'), [t]);

  const numberLocale = i18n.language === 'ar' ? 'ar' : 'en';

  return {
    t,
    i18n,
    th,
    translateEventType,
    translateStatus,
    translateDifficulty,
    translateDiscipline,
    translateCreatedBy,
    translateTemplateName,
    translateAssignmentType,
    emptyCell,
    numberLocale,
  };
}
import '../styles/TrainingSchedule.css';

const VISIBLE_EVENTS_PER_DAY = 4;
const DEMO_ANCHOR = new Date(2026, 4, 17);

function getWeekStartSunday(from) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatMonthBanner(start, end, lang) {
  const loc = lang === 'ar' ? 'ar' : 'en';
  const m1 = new Intl.DateTimeFormat(loc, { month: 'long' }).format(start);
  const y1 = start.getFullYear();
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${m1} ${y1}`;
  }
  const m2 = new Intl.DateTimeFormat(loc, { month: 'long' }).format(end);
  const y2 = end.getFullYear();
  if (y1 === y2) return `${m1} – ${m2} ${y1}`;
  return `${m1} ${y1} – ${m2} ${y2}`;
}

function AssignmentFields({ form, set, setForm, th, supportsGroup = true, showRider = true }) {
  const isGroup = supportsGroup && form.assignmentType === 'group';
  const groupPairs = pairsFromForm(form);

  const setAssignmentType = (type) => {
    setForm((f) => ({
      ...f,
      assignmentType: type,
      ...(type === 'group' ? { groupPairs: pairsFromForm(f) } : {}),
    }));
  };

  const updatePair = (index, field, value) => {
    setForm((f) => {
      const pairs = [...pairsFromForm(f)];
      pairs[index] = { ...pairs[index], [field]: value };
      return { ...f, groupPairs: pairs };
    });
  };

  const addPair = () => {
    setForm((f) => ({
      ...f,
      groupPairs: [...pairsFromForm(f), { horseId: '', riderId: '' }],
    }));
  };

  const removePair = (index) => {
    setForm((f) => {
      const pairs = pairsFromForm(f).filter((_, i) => i !== index);
      return { ...f, groupPairs: pairs.length ? pairs : [{ horseId: '', riderId: '' }] };
    });
  };

  return (
    <div className="tsp-assignment-block tsp-field--full">
      {supportsGroup ? (
        <div className="tsp-assignment-type">
          <span className="tsp-assignment-type__label">{th('assignment.typeLabel')}</span>
          <div className="tsp-assignment-type__radios">
            <label className={`tsp-assignment-type__option${!isGroup ? ' is-active' : ''}`}>
              <input
                type="radio"
                name={`assignmentType-${form.date}`}
                checked={!isGroup}
                onChange={() => setAssignmentType('single')}
              />
              {th('assignment.single')}
            </label>
            <label className={`tsp-assignment-type__option${isGroup ? ' is-active' : ''}`}>
              <input
                type="radio"
                name={`assignmentType-${form.date}`}
                checked={isGroup}
                onChange={() => setAssignmentType('group')}
              />
              {th('assignment.group')}
            </label>
          </div>
        </div>
      ) : null}

      {!isGroup ? (
        <>
          <label className="tsp-field">
            <span>{th('assignment.selectHorse')}</span>
            <select value={form.horseId} onChange={(e) => set('horseId', e.target.value)}>
              <option value="">—</option>
              {SCHEDULE_HORSES.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </label>
          {showRider ? (
            <label className="tsp-field">
              <span>{th('assignment.selectRider')}</span>
              <select value={form.riderId} onChange={(e) => set('riderId', e.target.value)}>
                <option value="">—</option>
                {SCHEDULE_RIDERS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
          ) : null}
        </>
      ) : (
        <>
          <div className="tsp-field tsp-field--full">
            <span className="tsp-group-pairs__heading">{th('assignment.groupPairsTitle')}</span>
            <ul className="tsp-group-pairs">
              {groupPairs.map((pair, index) => (
                <li key={`pair-${index}`} className="tsp-group-pairs__row">
                  <label className="tsp-field tsp-group-pairs__cell">
                    <span>{th('assignment.pairHorse')}</span>
                    <select
                      value={pair.horseId}
                      onChange={(e) => updatePair(index, 'horseId', e.target.value)}
                    >
                      <option value="">—</option>
                      {SCHEDULE_HORSES.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="tsp-field tsp-group-pairs__cell">
                    <span>{th('assignment.pairRider')}</span>
                    <select
                      value={pair.riderId}
                      onChange={(e) => updatePair(index, 'riderId', e.target.value)}
                    >
                      <option value="">—</option>
                      {SCHEDULE_RIDERS.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="tsp-group-pairs__remove"
                    onClick={() => removePair(index)}
                    disabled={groupPairs.length <= 1}
                    aria-label={th('assignment.removePair')}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="tsp-group-pairs__add" onClick={addPair}>
              <Plus size={16} aria-hidden />
              {th('assignment.addPair')}
            </button>
          </div>
          <label className="tsp-field">
            <span>{th('assignment.groupName')}</span>
            <input value={form.groupName} onChange={(e) => set('groupName', e.target.value)} />
          </label>
          <label className="tsp-field tsp-field--full">
            <span>{th('assignment.groupNotes')}</span>
            <textarea rows={2} value={form.groupNotes} onChange={(e) => set('groupNotes', e.target.value)} />
          </label>
        </>
      )}
    </div>
  );
}

function emptyAddForm(dateIso = '') {
  return {
    eventType: 'Training',
    assignmentType: 'single',
    trainingTemplateId: '',
    horseId: '',
    riderId: '',
    horseIds: [],
    riderIds: [],
    groupPairs: [{ horseId: '', riderId: '' }],
    trainerId: '',
    groupName: '',
    groupNotes: '',
    date: dateIso,
    time: '08:00',
    duration: '1h',
    notes: '',
    competitionName: '',
    raceName: '',
    discipline: '',
    location: '',
    recoveryStart: dateIso,
    recoveryEnd: dateIso,
    reason: '',
    vetName: '',
  };
}

function TemplatePreview({ templateId, th, translateTemplateName, translateDiscipline, translateDifficulty }) {
  const tpl = TRAINING_LIBRARY_TEMPLATES.find((x) => x.id === templateId);
  if (!tpl) return null;
  return (
    <div className="tsp-template-preview">
      <h4 className="tsp-template-preview__title">{th('addModal.templatePreview')}</h4>
      <dl className="tsp-template-preview__dl">
        <div><dt>{translateTemplateName(tpl)}</dt><dd>{translateDiscipline(tpl.discipline)} · {tpl.category}</dd></div>
        <div><dt>{translateDifficulty(tpl.difficultyLevel)}</dt><dd>{tpl.estimatedDistance} · {tpl.estimatedDuration}</dd></div>
        <div><dt>{tpl.targetAverageSpeed}</dt><dd>{tpl.goal}</dd></div>
        <div><dt>{th('templatePreview.warmUp')}</dt><dd>{tpl.warmUp}</dd></div>
        <div><dt>{th('templatePreview.mainExercise')}</dt><dd>{tpl.mainExercise}</dd></div>
        <div><dt>{th('templatePreview.coolDown')}</dt><dd>{tpl.coolDown}</dd></div>
        <div><dt>{th('templatePreview.precautions')}</dt><dd>{tpl.healthPrecautions}</dd></div>
      </dl>
    </div>
  );
}

function ScheduleEventCard({ event, onOpen, translateEventType, translateStatus, th, compact }) {
  const typeCls = eventTypeClass(event.eventType);
  const statusCls = statusClass(event.status);
  const card = getEventCardDisplay(event, th);
  return (
    <button
      type="button"
      className={`ec-ts-event ec-ts-event--${typeCls}${compact ? ' ec-ts-event--compact' : ''}`}
      onClick={() => onOpen(event)}
    >
      {event.time ? <span className="ec-ts-event__time">{event.time}</span> : null}
      <span className="ec-ts-event__title">{event.title}</span>
      {card.meta ? <span className="ec-ts-event__meta">{card.meta}</span> : null}
      {card.sub ? <span className="ec-ts-event__rider">{card.sub}</span> : null}
      <span className="ec-ts-event__badges">
        <span className={`ec-ts-event__type ec-ts-event__type--${typeCls}`}>
          {translateEventType(event.eventType)}
        </span>
        <span className={`ec-ts-event__status ec-ts-event__status--${statusCls}`}>
          {translateStatus(event.status)}
        </span>
      </span>
    </button>
  );
}

function AddScheduleModal({ open, onClose, onSave, initialDate, th, t, translateEventType, translateTemplateName, translateDiscipline, translateDifficulty }) {
  const [form, setForm] = useState(() => emptyAddForm(initialDate ? toISODate(initialDate) : ''));

  useEffect(() => {
    if (open) setForm(emptyAddForm(initialDate ? toISODate(initialDate) : ''));
  }, [open, initialDate]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleClose = () => {
    onClose();
    setForm(emptyAddForm());
  };

  if (!open) return null;

  const tpl = TRAINING_LIBRARY_TEMPLATES.find((x) => x.id === form.trainingTemplateId);
  const isTraining = form.eventType === 'Training';

  const buildPayload = (status) => {
    const trainer = SCHEDULE_TRAINERS.find((tr) => tr.id === form.trainerId);
    let title = form.competitionName || form.raceName || tpl?.name || form.eventType;
    if (form.eventType === 'Vet Check') title = form.reason || 'Vet Check';
    if (form.eventType === 'Recovery') title = form.reason || 'Recovery';
    if (form.assignmentType === 'group' && form.groupName) title = form.groupName;
    const assignment = ASSIGNMENT_EVENT_TYPES.has(form.eventType)
      ? buildAssignmentFields(form)
      : buildAssignmentFields({ ...form, assignmentType: 'single' });
    return {
      id: nextEventId(),
      stableId: 'stable_001',
      eventType: form.eventType,
      status,
      title,
      trainingTemplateId: isTraining ? form.trainingTemplateId : '',
      ...assignment,
      trainerId: trainer?.id || '',
      trainerName: trainer?.name || '',
      date: form.eventType === 'Recovery' ? form.recoveryStart : form.date,
      time: form.time,
      duration: form.duration,
      location: form.location,
      discipline: form.discipline,
      recoveryEnd: form.recoveryEnd,
      reason: form.reason,
      vetName: form.vetName,
      notes: form.notes,
      createdBy: 'Trainer',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      sentAt: status === 'Sent to Rider' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : null,
      completedAt: null,
    };
  };

  return (
    <div className="tsp-modal-backdrop" role="presentation" onClick={handleClose}>
      <div
        className="tsp-modal tsp-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tsp-add-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="tsp-modal__head">
          <h2 id="tsp-add-title">{t('pages.trainingSchedule.addModal.title')}</h2>
          <button type="button" className="tsp-modal__close" onClick={handleClose} aria-label={t('pages.trainingSchedule.modalClose')}>
            <X size={20} />
          </button>
        </header>
        <div className="tsp-modal__body tsp-modal__body--grid">
          <label className="tsp-field">
            <span>{t('pages.trainingSchedule.filters.eventType')}</span>
            <select value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>
              {EVENT_TYPES.map((et) => (
                <option key={et} value={et}>{translateEventType(et)}</option>
              ))}
            </select>
          </label>

          {isTraining ? (
            <>
              <label className="tsp-field">
                <span>{t('pages.trainingSchedule.addModal.selectTemplate')}</span>
                <select value={form.trainingTemplateId} onChange={(e) => set('trainingTemplateId', e.target.value)}>
                  <option value="">—</option>
                  {TRAINING_LIBRARY_TEMPLATES.map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </label>
              <label className="tsp-field">
                <span>{t('pages.trainingSchedule.fields.trainer')}</span>
                <select value={form.trainerId} onChange={(e) => set('trainerId', e.target.value)}>
                  <option value="">—</option>
                  {SCHEDULE_TRAINERS.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
                </select>
              </label>
              <AssignmentFields form={form} set={set} setForm={setForm} th={th} />
              <label className="tsp-field">
                <span>{t('pages.trainingSchedule.fields.date')}</span>
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
              </label>
              <label className="tsp-field">
                <span>{t('pages.trainingSchedule.fields.time')}</span>
                <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
              </label>
              <label className="tsp-field">
                <span>{t('pages.trainingSchedule.fields.duration')}</span>
                <input value={form.duration} onChange={(e) => set('duration', e.target.value)} />
              </label>
            </>
          ) : null}

          {form.eventType === 'Competition' ? (
            <>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.addModal.competitionName')}</span>
                <input value={form.competitionName} onChange={(e) => set('competitionName', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.addModal.discipline')}</span>
                <input value={form.discipline} onChange={(e) => set('discipline', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.addModal.location')}</span>
                <input value={form.location} onChange={(e) => set('location', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.fields.date')}</span>
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.fields.time')}</span>
                <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} /></label>
              <AssignmentFields form={form} set={set} setForm={setForm} th={th} />
            </>
          ) : null}

          {form.eventType === 'Race' ? (
            <>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.addModal.raceName')}</span>
                <input value={form.raceName} onChange={(e) => set('raceName', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.addModal.discipline')}</span>
                <input value={form.discipline} onChange={(e) => set('discipline', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.addModal.location')}</span>
                <input value={form.location} onChange={(e) => set('location', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.fields.date')}</span>
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.fields.time')}</span>
                <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} /></label>
              <AssignmentFields form={form} set={set} setForm={setForm} th={th} />
            </>
          ) : null}

          {form.eventType === 'Recovery' ? (
            <>
              <AssignmentFields form={form} set={set} setForm={setForm} th={th} supportsGroup={false} showRider={false} />
              <label className="tsp-field"><span>{t('pages.trainingSchedule.addModal.recoveryStart')}</span>
                <input type="date" value={form.recoveryStart} onChange={(e) => set('recoveryStart', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.addModal.recoveryEnd')}</span>
                <input type="date" value={form.recoveryEnd} onChange={(e) => set('recoveryEnd', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.addModal.reason')}</span>
                <input value={form.reason} onChange={(e) => set('reason', e.target.value)} /></label>
            </>
          ) : null}

          {form.eventType === 'Vet Check' ? (
            <>
              <AssignmentFields form={form} set={set} setForm={setForm} th={th} supportsGroup={false} showRider={false} />
              <label className="tsp-field"><span>{t('pages.trainingSchedule.addModal.vetName')}</span>
                <input value={form.vetName} onChange={(e) => set('vetName', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.fields.date')}</span>
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.fields.time')}</span>
                <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} /></label>
              <label className="tsp-field"><span>{t('pages.trainingSchedule.addModal.reason')}</span>
                <input value={form.reason} onChange={(e) => set('reason', e.target.value)} /></label>
            </>
          ) : null}

          <label className="tsp-field tsp-field--full">
            <span>{t('pages.trainingSchedule.fields.notes')}</span>
            <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </label>

          {isTraining && form.trainingTemplateId ? (
            <div className="tsp-field--full">
              <TemplatePreview templateId={form.trainingTemplateId} th={th} translateTemplateName={translateTemplateName} translateDiscipline={translateDiscipline} translateDifficulty={translateDifficulty} />
            </div>
          ) : null}
        </div>
        <footer className="tsp-modal__foot">
          <button type="button" className="tsp-btn tsp-btn--ghost" onClick={handleClose}>
            {t('pages.trainingSchedule.addModal.cancel')}
          </button>
          <button
            type="button"
            className="tsp-btn tsp-btn--gold"
            onClick={() => {
              onSave(normalizeScheduleEvent(buildPayload('Saved')));
              toast.success(t('pages.trainingSchedule.toast.saved'));
              handleClose();
            }}
          >
            {t('pages.trainingSchedule.addModal.saveEvent')}
          </button>
          <button
            type="button"
            className="tsp-btn tsp-btn--primary"
            onClick={() => {
              onSave(normalizeScheduleEvent(buildPayload('Sent to Rider')));
              toast.success(t('pages.trainingSchedule.toast.sentToRider'));
              handleClose();
            }}
          >
            {t('pages.trainingSchedule.addModal.sendToRider')}
          </button>
        </footer>
      </div>
    </div>
  );
}

function EventDetailModal({
  event,
  onClose,
  onUpdate,
  th,
  t,
  translateEventType,
  translateStatus,
  translateCreatedBy,
  translateTemplateName,
  translateAssignmentType,
}) {
  if (!event) return null;
  const e = normalizeScheduleEvent(event);
  const groupPairLines = getGroupPairLines(e);
  const tpl = TRAINING_LIBRARY_TEMPLATES.find((x) => x.id === e.trainingTemplateId);
  const typeCls = eventTypeClass(e.eventType);

  const patch = (changes, toastKey) => {
    onUpdate({ ...event, ...changes });
    if (toastKey) toast.success(t(`pages.trainingSchedule.toast.${toastKey}`));
  };

  return (
    <div className="tsp-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="tsp-modal tsp-modal--detail"
        id="tsp-print-area"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="tsp-modal__head">
          <h2>{t('pages.trainingSchedule.detailModal.title')}</h2>
          <button type="button" className="tsp-modal__close" onClick={onClose} aria-label={t('pages.trainingSchedule.modalClose')}>
            <X size={20} />
          </button>
        </header>
        <div className="tsp-modal__body">
          <div className="tsp-detail-badges">
            <span className={`ec-ts-event__type ec-ts-event__type--${typeCls}`}>
              {translateEventType(e.eventType)}
            </span>
            <span className={`ec-ts-event__status ec-ts-event__status--${statusClass(e.status)}`}>
              {translateStatus(e.status)}
            </span>
          </div>
          <h3 className="tsp-detail-title">{e.title}</h3>
          <dl className="tsp-detail-dl">
            <div><dt>{th('assignment.typeLabel')}</dt><dd>{translateAssignmentType(e.assignmentType)}</dd></div>
            <div><dt>{t('pages.trainingSchedule.fields.date')}</dt><dd>{e.date}{e.recoveryEnd ? ` → ${e.recoveryEnd}` : ''}</dd></div>
            {e.time ? <div><dt>{t('pages.trainingSchedule.fields.time')}</dt><dd>{e.time}</dd></div> : null}
            {e.duration ? <div><dt>{t('pages.trainingSchedule.fields.duration')}</dt><dd>{e.duration}</dd></div> : null}
            {e.assignmentType === 'group' ? (
              <>
                {e.groupName ? <div><dt>{th('assignment.groupName')}</dt><dd>{e.groupName}</dd></div> : null}
                {groupPairLines.length ? (
                  <div><dt>{th('assignment.groupPairsTitle')}</dt><dd>{groupPairLines.join(' · ')}</dd></div>
                ) : null}
                {e.groupNotes ? <div><dt>{th('assignment.groupNotes')}</dt><dd>{e.groupNotes}</dd></div> : null}
              </>
            ) : (
              <>
                {e.horseName ? <div><dt>{t('pages.trainingSchedule.fields.horse')}</dt><dd>{e.horseName}</dd></div> : null}
                {e.riderName ? <div><dt>{t('pages.trainingSchedule.fields.rider')}</dt><dd>{e.riderName}</dd></div> : null}
              </>
            )}
            {e.trainerName ? <div><dt>{t('pages.trainingSchedule.fields.trainer')}</dt><dd>{e.trainerName}</dd></div> : null}
            {e.location ? <div><dt>{t('pages.trainingSchedule.addModal.location')}</dt><dd>{e.location}</dd></div> : null}
            {e.notes ? <div><dt>{t('pages.trainingSchedule.fields.notes')}</dt><dd>{e.notes}</dd></div> : null}
            <div><dt>{t('pages.trainingSchedule.fields.createdBy')}</dt><dd>{translateCreatedBy(e.createdBy)}</dd></div>
            <div><dt>{t('pages.trainingSchedule.fields.createdAt')}</dt><dd>{e.createdAt}</dd></div>
          </dl>
          {tpl ? (
            <div className="tsp-template-preview tsp-template-preview--inline">
              <h4>{translateTemplateName(tpl)}</h4>
              <p>{tpl.goal}</p>
              <p><strong>{th('templatePreview.warmUp')}:</strong> {tpl.warmUp}</p>
              <p><strong>{th('templatePreview.mainExercise')}:</strong> {tpl.mainExercise}</p>
              <p><strong>{th('templatePreview.coolDown')}:</strong> {tpl.coolDown}</p>
            </div>
          ) : null}
        </div>
        <footer className="tsp-modal__foot tsp-modal__foot--wrap">
          <button type="button" className="tsp-btn tsp-btn--primary" onClick={() => patch({ status: 'Sent to Rider', sentAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }, 'sentToRider')}>
            {t('pages.trainingSchedule.addModal.sendToRider')}
          </button>
          <button type="button" className="tsp-btn tsp-btn--ghost" onClick={() => patch({ status: 'Completed', completedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }, 'completed')}>
            {t('pages.trainingSchedule.detailModal.markCompleted')}
          </button>
          <button type="button" className="tsp-btn tsp-btn--danger" onClick={() => patch({ status: 'Cancelled' }, 'cancelled')}>
            {t('pages.trainingSchedule.detailModal.cancelEvent')}
          </button>
          <button
            type="button"
            className="tsp-btn tsp-btn--ghost"
            onClick={() => {
              toast(t('pages.trainingSchedule.toast.printPreparing'));
              window.print();
            }}
          >
            {t('pages.trainingSchedule.detailModal.print')}
          </button>
          <button type="button" className="tsp-btn tsp-btn--ghost" onClick={onClose}>
            {t('pages.trainingSchedule.modalClose')}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function TrainingSchedule() {
  const {
    t,
    i18n,
    th,
    translateEventType,
    translateStatus,
    translateDifficulty,
    translateDiscipline,
    translateCreatedBy,
    translateTemplateName,
    translateAssignmentType,
    numberLocale,
  } = useTrainingScheduleI18n();
  const [events, setEvents] = useState(() => buildInitialScheduleEvents().map(normalizeScheduleEvent));
  const [view, setView] = useState('week');
  const [anchorDate, setAnchorDate] = useState(DEMO_ANCHOR);
  const [expandedDays, setExpandedDays] = useState(() => new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [filters, setFilters] = useState({
    eventType: '', horseId: '', riderId: '', trainerId: '', status: '', date: '',
  });

  const todayIso = toISODate(new Date());

  const filteredEvents = useMemo(
    () => events.filter((ev) => {
      if (filters.eventType && ev.eventType !== filters.eventType) return false;
      if (!eventMatchesHorseFilter(ev, filters.horseId)) return false;
      if (!eventMatchesRiderFilter(ev, filters.riderId)) return false;
      if (filters.trainerId && ev.trainerId !== filters.trainerId) return false;
      if (filters.status && ev.status !== filters.status) return false;
      if (filters.date && ev.date !== filters.date) return false;
      return true;
    }),
    [events, filters],
  );

  const { weekDays, monthBanner } = useMemo(() => {
    const base = getWeekStartSunday(anchorDate);
    const end = addDays(base, 6);
    const days = [];
    for (let i = 0; i < 7; i += 1) days.push(addDays(base, i));
    return { weekDays: days, monthBanner: formatMonthBanner(base, end, i18n.language) };
  }, [anchorDate, i18n.language]);

  const periodRange = useMemo(() => {
    if (view === 'today') {
      const iso = toISODate(anchorDate);
      return { start: iso, end: iso };
    }
    if (view === 'month') {
      const y = anchorDate.getFullYear();
      const m = anchorDate.getMonth();
      return {
        start: toISODate(new Date(y, m, 1)),
        end: toISODate(new Date(y, m + 1, 0)),
      };
    }
    return {
      start: toISODate(weekDays[0]),
      end: toISODate(weekDays[6]),
    };
  }, [view, anchorDate, weekDays]);

  const periodEvents = useMemo(
    () => filteredEvents.filter(
      (e) => e.date >= periodRange.start && e.date <= periodRange.end,
    ),
    [filteredEvents, periodRange],
  );

  const summaryCards = useMemo(() => ({
    today: periodEvents.filter((e) => e.date === todayIso).length,
    trainings: periodEvents.filter((e) => e.eventType === 'Training').length,
    competitions: periodEvents.filter((e) => e.eventType === 'Competition' || e.eventType === 'Race').length,
    recovery: periodEvents.filter((e) => e.eventType === 'Recovery').length,
    pending: periodEvents.filter((e) => e.status === 'Saved' || e.status === 'Draft').length,
  }), [periodEvents, todayIso]);

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

  const monthCells = useMemo(() => {
    const y = anchorDate.getFullYear();
    const m = anchorDate.getMonth();
    const start = getWeekStartSunday(new Date(y, m, 1));
    const cells = [];
    for (let i = 0; i < 42; i += 1) cells.push(addDays(start, i));
    return { cells, month: m };
  }, [anchorDate]);

  const sidebarSummary = useMemo(
    () => computeScheduleSummary({
      events: filteredEvents,
      periodStartIso: periodRange.start,
      periodEndIso: periodRange.end,
      horses: SCHEDULE_HORSES,
      trainers: SCHEDULE_TRAINERS,
      todayIso,
    }),
    [filteredEvents, periodRange, todayIso],
  );

  const chartData = useMemo(
    () => sidebarSummary.last7Days.map((row) => ({
      ...row,
      label: new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar' : 'en', {
        weekday: 'short',
        day: 'numeric',
      }).format(new Date(`${row.iso}T12:00:00`)),
    })),
    [sidebarSummary.last7Days, i18n.language],
  );

  const trainingPct = sidebarSummary.totalHorsesCap > 0
    ? Math.round((sidebarSummary.totalHorsesTraining / sidebarSummary.totalHorsesCap) * 100)
    : 0;

  const periodLabel = useMemo(() => {
    const loc = i18n.language === 'ar' ? 'ar' : 'en';
    if (view === 'today') {
      return new Intl.DateTimeFormat(loc, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(anchorDate);
    }
    if (view === 'month') {
      return new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(anchorDate);
    }
    return monthBanner;
  }, [view, anchorDate, monthBanner, i18n.language]);

  const resetFilters = () => setFilters({
    eventType: '', horseId: '', riderId: '', trainerId: '', status: '', date: '',
  });

  const goToday = () => {
    setAnchorDate(new Date());
    setView('today');
  };
  const goPrev = () => {
    if (view === 'month') setAnchorDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else if (view === 'today') setAnchorDate((d) => addDays(d, -1));
    else setAnchorDate((d) => addDays(d, -7));
  };
  const goNext = () => {
    if (view === 'month') setAnchorDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else if (view === 'today') setAnchorDate((d) => addDays(d, 1));
    else setAnchorDate((d) => addDays(d, 7));
  };

  const openAdd = (d) => {
    setAddDate(d || anchorDate);
    setAddOpen(true);
  };

  const toggleDayExpand = (iso) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  };

  const addEvent = (payload) => setEvents((prev) => [...prev, normalizeScheduleEvent(payload)]);
  const updateEvent = (updated) => {
    const normalized = normalizeScheduleEvent(updated);
    setEvents((prev) => prev.map((e) => (e.id === normalized.id ? normalized : e)));
    setDetailEvent(normalized);
  };

  const renderDayColumn = (d) => {
    const iso = toISODate(d);
    const list = byDate.get(iso) || [];
    const expanded = expandedDays.has(iso);
    const visible = expanded ? list : list.slice(0, VISIBLE_EVENTS_PER_DAY);
    const hidden = expanded ? 0 : Math.max(0, list.length - visible.length);
    const weekday = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar' : 'en', { weekday: 'short' }).format(d);
    const isToday = iso === todayIso;

    return (
      <div key={iso} className={`ec-training-schedule__col${isToday ? ' ec-training-schedule__col--today' : ''}`}>
        <div className="ec-training-schedule__col-head">
          <span className="ec-training-schedule__col-dow">{weekday}</span>
          <span className="ec-training-schedule__col-dom">{d.getDate()}</span>
        </div>
        <div className="ec-training-schedule__col-body">
          {visible.map((ev) => (
            <ScheduleEventCard key={ev.id} event={ev} onOpen={setDetailEvent} translateEventType={translateEventType} translateStatus={translateStatus} th={th} />
          ))}
          {list.length > VISIBLE_EVENTS_PER_DAY ? (
            <button type="button" className="ec-training-schedule__more-types" onClick={() => toggleDayExpand(iso)}>
              {expanded ? t('pages.trainingSchedule.showFewer') : t('pages.trainingSchedule.moreTypes', { count: hidden })}
            </button>
          ) : null}
          <button type="button" className="ec-training-schedule__add-inline" onClick={() => openAdd(d)}>
            + {t('common.add')}
          </button>
        </div>
      </div>
    );
  };

  const dayIso = toISODate(anchorDate);
  const dayList = byDate.get(dayIso) || [];

  return (
    <div className="tsp-page">
      <header className="tsp-page__header">
        <div>
          <h1 className="tsp-page__title">{t('pages.trainingSchedule.title')}</h1>
          <p className="tsp-page__subtitle">{t('pages.trainingSchedule.subtitle')}</p>
        </div>
        <div className="tsp-page__actions">
          <button type="button" className="tsp-btn tsp-btn--gold" onClick={() => openAdd()}>
            <Plus size={16} aria-hidden />
            {t('pages.trainingSchedule.addScheduleEvent')}
          </button>
          <button type="button" className="tsp-btn tsp-btn--ghost" onClick={goToday}>{t('pages.trainingSchedule.today')}</button>
          <button type="button" className="tsp-btn tsp-btn--ghost" onClick={() => toast(t('pages.trainingSchedule.toast.exportPlaceholder'))}>
            <Download size={16} aria-hidden />
            {t('pages.trainingSchedule.exportPlaceholder')}
          </button>
        </div>
      </header>

      <div className="tsp-summary">
        <article className="tsp-summary__card"><span>{t('pages.trainingSchedule.summaryCards.todayEvents')}</span><strong>{summaryCards.today}</strong></article>
        <article className="tsp-summary__card"><span>{t('pages.trainingSchedule.summaryCards.scheduledTrainings')}</span><strong>{summaryCards.trainings}</strong></article>
        <article className="tsp-summary__card"><span>{t('pages.trainingSchedule.summaryCards.competitions')}</span><strong>{summaryCards.competitions}</strong></article>
        <article className="tsp-summary__card"><span>{t('pages.trainingSchedule.summaryCards.recoveryPeriods')}</span><strong>{summaryCards.recovery}</strong></article>
        <article className="tsp-summary__card"><span>{t('pages.trainingSchedule.summaryCards.pendingSends')}</span><strong>{summaryCards.pending}</strong></article>
      </div>

      <section className="ec-training-schedule" aria-label={t('pages.trainingSchedule.a11yCalendar')}>
        <div className="tsp-filters">
          <select value={filters.eventType} onChange={(e) => setFilters((f) => ({ ...f, eventType: e.target.value }))}>
            <option value="">{t('pages.trainingSchedule.filters.allTypes')}</option>
            {EVENT_TYPES.map((et) => <option key={et} value={et}>{translateEventType(et)}</option>)}
          </select>
          <select value={filters.horseId} onChange={(e) => setFilters((f) => ({ ...f, horseId: e.target.value }))}>
            <option value="">{t('pages.trainingSchedule.filters.allHorses')}</option>
            {SCHEDULE_HORSES.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select value={filters.riderId} onChange={(e) => setFilters((f) => ({ ...f, riderId: e.target.value }))}>
            <option value="">{t('pages.trainingSchedule.filters.allRiders')}</option>
            {SCHEDULE_RIDERS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={filters.trainerId} onChange={(e) => setFilters((f) => ({ ...f, trainerId: e.target.value }))}>
            <option value="">{t('pages.trainingSchedule.filters.allTrainers')}</option>
            {SCHEDULE_TRAINERS.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">{t('pages.trainingSchedule.filters.allStatuses')}</option>
            {EVENT_STATUSES.map((s) => <option key={s} value={s}>{translateStatus(s)}</option>)}
          </select>
          <input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} aria-label={t('pages.trainingSchedule.filters.date')} />
          <button type="button" className="tsp-btn tsp-btn--ghost tsp-filters__reset" onClick={resetFilters}>{t('pages.trainingSchedule.resetFilters')}</button>
        </div>

        <div className="ec-training-schedule__layout">
          <div className="ec-training-schedule__main">
            <div className="ec-training-schedule__toolbar">
              <span className="ec-training-schedule__month ec-training-schedule__month--hero">{monthBanner}</span>
              <div className="tsp-view-tabs">
                {['today', 'week', 'month'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`tsp-view-tabs__btn${view === v ? ' is-active' : ''}`}
                    onClick={() => {
                      setView(v);
                      if (v === 'today') setAnchorDate(new Date());
                    }}
                  >
                    {t(`pages.trainingSchedule.views.${v}`)}
                  </button>
                ))}
              </div>
              <div className="ec-training-schedule__toolbar-actions">
                <button type="button" className="ec-training-schedule__btn ec-training-schedule__btn--ghost" onClick={goToday}>{t('pages.trainingSchedule.today')}</button>
                <div className="ec-training-schedule__nav-arrows">
                  <button type="button" className="ec-training-schedule__icon-btn" onClick={goPrev} aria-label={t('pages.trainingSchedule.prevPeriod')}><ChevronLeft size={20} /></button>
                  <button type="button" className="ec-training-schedule__icon-btn" onClick={goNext} aria-label={t('pages.trainingSchedule.nextPeriod')}><ChevronRight size={20} /></button>
                </div>
              </div>
            </div>

            {filteredEvents.length === 0 ? <p className="tsp-empty">{t('pages.trainingSchedule.emptyFiltered')}</p> : null}

            {view === 'week' ? <div className="ec-training-schedule__grid">{weekDays.map(renderDayColumn)}</div> : null}

            {view === 'today' ? (
              <div className="tsp-day-view">
                <h3 className="tsp-day-view__title">{dayIso}</h3>
                {dayList.length === 0 ? <p className="tsp-empty">{t('pages.trainingSchedule.emptyFiltered')}</p> : dayList.map((ev) => (
                  <ScheduleEventCard key={ev.id} event={ev} onOpen={setDetailEvent} translateEventType={translateEventType} translateStatus={translateStatus} th={th} />
                ))}
              </div>
            ) : null}

            {view === 'month' ? (
              <div className="tsp-month-grid">
                {monthCells.cells.map((d) => {
                  const iso = toISODate(d);
                  const inMonth = d.getMonth() === monthCells.month;
                  const dayEvents = (byDate.get(iso) || []).slice(0, 2);
                  return (
                    <button key={iso} type="button" className={`tsp-month-cell${inMonth ? '' : ' tsp-month-cell--muted'}${iso === todayIso ? ' is-today' : ''}`} onClick={() => { setAnchorDate(d); setView('today'); }}>
                      <span className="tsp-month-cell__dom">{d.getDate()}</span>
                      {dayEvents.map((ev) => <span key={ev.id} className={`tsp-month-cell__dot tsp-month-cell__dot--${eventTypeClass(ev.eventType)}`} title={ev.title} />)}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <aside className="ec-training-schedule__sidebar">
            <h3 className="ec-training-schedule__side-title">{t('pages.trainingSchedule.summaryTitle')}</h3>
            <p className="ec-ts-summary-period">{periodLabel}</p>
            <p className="ec-ts-summary-period-meta">
              {th('summaryPeriodEvents', { count: sidebarSummary.periodEventCount })}
            </p>
            <div className="ec-ts-stat">
              <div className="ec-ts-stat__label-row"><span>{t('pages.trainingSchedule.totalDuration')}</span><strong>{sidebarSummary.totalDurationLabel}</strong></div>
              <div className="ec-ts-stat__bar"><span style={{ width: `${sidebarSummary.durationBarPct}%` }} /></div>
            </div>
            <div className="ec-ts-stat">
              <div className="ec-ts-stat__label-row"><span>{t('pages.trainingSchedule.totalDistance')}</span><strong>{t('pages.trainingSchedule.kmTotal', { km: sidebarSummary.totalDistanceKm.toLocaleString(numberLocale) })}</strong></div>
              <div className="ec-ts-stat__bar ec-ts-stat__bar--soft"><span style={{ width: `${sidebarSummary.distanceBarPct}%` }} /></div>
            </div>
            <div className="ec-ts-stat">
              <div className="ec-ts-stat__label-row"><span>{t('pages.trainingSchedule.canterDuration')}</span><strong>{sidebarSummary.canterDurationLabel}</strong></div>
              <div className="ec-ts-stat__bar ec-ts-stat__bar--canter"><span style={{ width: `${sidebarSummary.canterBarPct}%` }} /></div>
            </div>
            <div className="ec-ts-warn">
              <AlertTriangle className="ec-ts-warn__icon" size={22} aria-hidden />
              <div><p className="ec-ts-warn__value">{sidebarSummary.horsesNotTraining}</p><p className="ec-ts-warn__text">{t('pages.trainingSchedule.horsesIdle')}</p></div>
            </div>
            <h3 className="ec-training-schedule__side-title">{t('pages.trainingSchedule.trainersTitle')}</h3>
            <ul className="ec-ts-legend">
              {sidebarSummary.trainerLegend.map((tr) => (
                <li key={tr.id} className="ec-ts-legend__item" style={{ borderColor: tr.color }}>
                  <span className="ec-ts-legend__dot" style={{ background: tr.color }} aria-hidden />
                  <span className="ec-ts-legend__name">
                    {tr.name}
                    <span className="ec-ts-legend__count"> ({tr.eventCount})</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="ec-ts-horses-summary">
              <p className="ec-ts-horses-summary__value">{sidebarSummary.totalHorsesTraining}</p>
              <p className="ec-ts-horses-summary__label">{t('pages.trainingSchedule.totalHorsesTraining')}</p>
              <div className="ec-ts-horses-summary__bar-wrap">
                <div className="ec-ts-horses-summary__bar"><span style={{ width: `${trainingPct}%` }} /></div>
                <p className="ec-ts-horses-summary__sub">{t('pages.trainingSchedule.horsesProgress', { n: sidebarSummary.totalHorsesTraining, cap: sidebarSummary.totalHorsesCap })}</p>
              </div>
            </div>
            <h3 className="ec-training-schedule__side-title ec-training-schedule__side-title--chart">{t('pages.trainingSchedule.chartTitle')}</h3>
            <div className="ec-ts-mini-chart">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" vertical={false} />
                  <XAxis dataKey="label" tick={stableDashboardChartAxisTick} interval={0} fontSize={10} />
                  <YAxis hide />
                  <Tooltip contentStyle={stableDashboardChartTooltipContentStyle} />
                  <Bar dataKey="sessions" fill="#c9a227" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </aside>
        </div>
      </section>

      <AddScheduleModal open={addOpen} onClose={() => setAddOpen(false)} onSave={addEvent} initialDate={addDate} th={th} t={t} translateEventType={translateEventType} translateTemplateName={translateTemplateName} translateDiscipline={translateDiscipline} translateDifficulty={translateDifficulty} />
      <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} onUpdate={updateEvent} th={th} t={t} translateEventType={translateEventType} translateStatus={translateStatus} translateCreatedBy={translateCreatedBy} translateTemplateName={translateTemplateName} translateAssignmentType={translateAssignmentType} />
    </div>
  );
}
