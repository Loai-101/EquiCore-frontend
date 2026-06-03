/**
 * Weekly training schedule + summary sidebar (demo data; used by Training Schedule page).
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
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
import { useAuth } from '../../../../context/AuthContext';
import {
  dummyTrainingScheduleBlocks,
  trainingScheduleLast7Days,
  trainingScheduleSummary,
  trainingScheduleTrainers,
} from '../../../../features/training-schedule/trainingScheduleDummy';
import {
  stableDashboardChartAxisTick,
  stableDashboardChartTooltipContentStyle,
} from '../../../../utils/chartUiConfig';
import AddTrainingModal from './AddTrainingModal';
import '../styles/TrainingSchedule.css';

function getWeekStartSunday(from) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const dow = d.getDay();
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatMonthBanner(weekStart, weekEnd, lang) {
  const loc = lang === 'ar' ? 'ar' : 'en';
  const m1 = new Intl.DateTimeFormat(loc, { month: 'long' }).format(weekStart);
  const y1 = weekStart.getFullYear();
  if (weekStart.getMonth() === weekEnd.getMonth() && weekStart.getFullYear() === weekEnd.getFullYear()) {
    return `${m1} ${y1}`;
  }
  const m2 = new Intl.DateTimeFormat(loc, { month: 'long' }).format(weekEnd);
  const y2 = weekEnd.getFullYear();
  if (y1 === y2) return `${m1} – ${m2} ${y1}`;
  return `${m1} ${y1} – ${m2} ${y2}`;
}

const VISIBLE_SESSIONS_PER_DAY = 3;

export default function TrainingScheduleSection() {
  const { t, i18n } = useTranslation();
  const { stableId } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalDate, setModalDate] = useState(null);
  const [expandedDays, setExpandedDays] = useState(() => new Set());

  const hasDemo = stableId === 'stable-1';

  const { weekStart, weekEnd, weekDays, monthBanner } = useMemo(() => {
    const base = getWeekStartSunday(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    const end = new Date(base);
    end.setDate(end.getDate() + 6);
    const days = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return {
      weekStart: base,
      weekEnd: end,
      weekDays: days,
      monthBanner: formatMonthBanner(base, end, i18n.language),
    };
  }, [weekOffset, i18n.language]);

  const byDate = useMemo(() => {
    const map = new Map();
    if (!hasDemo) return map;
    dummyTrainingScheduleBlocks
      .filter((b) => b.stableId === stableId)
      .forEach((b) => {
        const d = weekDays[b.weekColumnIndex];
        if (!d) return;
        const iso = toISODate(d);
        const arr = map.get(iso) || [];
        arr.push(b);
        map.set(iso, arr);
      });
    return map;
  }, [hasDemo, stableId, weekDays]);

  const summary = hasDemo ? trainingScheduleSummary : {
    totalDurationLabel: '0:00',
    totalDistanceKm: 0,
    canterDurationLabel: '0:00',
    durationBarPct: 0,
    distanceBarPct: 0,
    canterBarPct: 0,
    horsesNotTraining: 0,
    totalHorsesTraining: 0,
    totalHorsesCap: 0,
  };

  const chartData = useMemo(
    () =>
      trainingScheduleLast7Days.map((r) => ({
        ...r,
        label: t(`pages.trainingSchedule.chartDays.${r.dayKey}`),
      })),
    [t]
  );

  const trainerMap = useMemo(() => {
    const m = new Map();
    trainingScheduleTrainers.forEach((tr) => m.set(tr.id, tr));
    return m;
  }, []);

  const openAdd = (d) => setModalDate(d);
  const closeModal = () => setModalDate(null);

  const toggleDayExpand = (iso) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  };

  const goToday = () => setWeekOffset(0);
  const goPrev = () => setWeekOffset((o) => o - 1);
  const goNext = () => setWeekOffset((o) => o + 1);

  const trainingPct =
    summary.totalHorsesCap > 0
      ? Math.round((summary.totalHorsesTraining / summary.totalHorsesCap) * 100)
      : 0;

  return (
    <section
      className="ec-training-schedule"
      aria-label={t('pages.trainingSchedule.a11yCalendar')}
    >
      <div className="ec-training-schedule__layout">
        <div className="ec-training-schedule__main">
          <div className="ec-training-schedule__toolbar">
            <span className="ec-training-schedule__month ec-training-schedule__month--hero">
              {monthBanner}
            </span>
            <div className="ec-training-schedule__toolbar-actions">
              <button type="button" className="ec-training-schedule__btn ec-training-schedule__btn--ghost" onClick={goToday}>
                {t('pages.trainingSchedule.today')}
              </button>
              <div className="ec-training-schedule__nav-arrows">
                <button type="button" className="ec-training-schedule__icon-btn" onClick={goPrev} aria-label={t('pages.trainingSchedule.prevWeek')}>
                  <ChevronLeft size={20} />
                </button>
                <button type="button" className="ec-training-schedule__icon-btn" onClick={goNext} aria-label={t('pages.trainingSchedule.nextWeek')}>
                  <ChevronRight size={20} />
                </button>
              </div>
              <button
                type="button"
                className="ec-training-schedule__btn ec-training-schedule__btn--filters"
                onClick={() => toast(t('pages.trainingSchedule.filtersSoon'))}
              >
                <Filter size={16} aria-hidden />
                {t('pages.trainingSchedule.filters')}
              </button>
            </div>
          </div>

          {!hasDemo ? (
            <p className="ec-training-schedule__empty-hint">{t('pages.trainingSchedule.demoOnlyStable1')}</p>
          ) : null}

          <div className="ec-training-schedule__grid">
            {weekDays.map((d) => {
              const iso = toISODate(d);
              const list = byDate.get(iso) || [];
              const expanded = expandedDays.has(iso);
              const visible = expanded ? list : list.slice(0, VISIBLE_SESSIONS_PER_DAY);
              const hidden = expanded ? 0 : Math.max(0, list.length - visible.length);
              const weekday = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar' : 'en', {
                weekday: 'short',
              }).format(d);

              return (
                <div key={iso} className="ec-training-schedule__col">
                  <div className="ec-training-schedule__col-head">
                    <span className="ec-training-schedule__col-dow">{weekday}</span>
                    <span className="ec-training-schedule__col-dom">{d.getDate()}</span>
                  </div>
                  <div className="ec-training-schedule__col-body">
                    {visible.map((session) => {
                      const tr = trainerMap.get(session.trainerId);
                      const barColor = tr?.color || '#1c2f5c';
                      return (
                        <article
                          key={session.id}
                          className="ec-ts-card"
                          style={{ '--ts-trainer-color': barColor }}
                        >
                          <button type="button" className="ec-ts-card__bar">
                            <span className="ec-ts-card__bar-text">
                              {t('pages.trainingSchedule.horseCount', { count: session.horseCount })}
                            </span>
                            <ChevronDown size={16} className="ec-ts-card__bar-chev" aria-hidden />
                          </button>
                          <div className="ec-ts-card__body">
                            <dl className="ec-ts-card__dl">
                              <div className="ec-ts-card__row">
                                <dt>{t('pages.trainingSchedule.fields.time')}</dt>
                                <dd>{session.timeText}</dd>
                              </div>
                              <div className="ec-ts-card__row">
                                <dt>{t('pages.trainingSchedule.fields.distance')}</dt>
                                <dd>{t('pages.trainingSchedule.kmValue', { km: session.distanceKm.toFixed(1) })}</dd>
                              </div>
                              <div className="ec-ts-card__row">
                                <dt>{t('pages.trainingSchedule.fields.trainer')}</dt>
                                <dd title={tr?.name}>{tr?.name}</dd>
                              </div>
                              <div className="ec-ts-card__row">
                                <dt>{t('pages.trainingSchedule.fields.type')}</dt>
                                <dd>{t(`pages.trainingSchedule.types.${session.typeKey}`)}</dd>
                              </div>
                            </dl>
                            <div className="ec-ts-card__footer">
                              <span className="ec-ts-card__country">{t(`pages.trainingSchedule.countries.${session.countryKey}`)}</span>
                              <span className={`ec-ts-card__intensity ec-ts-card__intensity--${session.intensity}`}>
                                {t(`pages.trainingSchedule.intensity.${session.intensity}`)}
                              </span>
                            </div>
                            {session.moreTypes ? (
                              <p className="ec-ts-card__more">
                                {t('pages.trainingSchedule.moreTypesInSession', { count: session.moreTypes })}
                              </p>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                    {list.length > VISIBLE_SESSIONS_PER_DAY ? (
                      <button
                        type="button"
                        className="ec-training-schedule__more-types"
                        onClick={() => toggleDayExpand(iso)}
                      >
                        {expanded
                          ? t('pages.trainingSchedule.showFewer')
                          : t('pages.trainingSchedule.moreTypes', { count: hidden })}
                      </button>
                    ) : null}
                    {list.length === 0 ? (
                      <button
                        type="button"
                        className="ec-training-schedule__add-empty"
                        onClick={() => openAdd(d)}
                      >
                        + {t('common.add')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ec-training-schedule__add-inline"
                        onClick={() => openAdd(d)}
                      >
                        + {t('common.add')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="ec-training-schedule__sidebar">
          <h3 className="ec-training-schedule__side-title">{t('pages.trainingSchedule.summaryTitle')}</h3>
          <div className="ec-ts-stat">
            <div className="ec-ts-stat__label-row">
              <span>{t('pages.trainingSchedule.totalDuration')}</span>
              <strong>{summary.totalDurationLabel}</strong>
            </div>
            <div className="ec-ts-stat__bar">
              <span style={{ width: `${summary.durationBarPct}%` }} />
            </div>
          </div>
          <div className="ec-ts-stat">
            <div className="ec-ts-stat__label-row">
              <span>{t('pages.trainingSchedule.totalDistance')}</span>
              <strong>{t('pages.trainingSchedule.kmTotal', { km: summary.totalDistanceKm.toLocaleString() })}</strong>
            </div>
            <div className="ec-ts-stat__bar ec-ts-stat__bar--soft">
              <span style={{ width: `${summary.distanceBarPct}%` }} />
            </div>
          </div>
          <div className="ec-ts-stat">
            <div className="ec-ts-stat__label-row">
              <span>{t('pages.trainingSchedule.canterDuration')}</span>
              <strong>{summary.canterDurationLabel}</strong>
            </div>
            <div className="ec-ts-stat__bar ec-ts-stat__bar--canter">
              <span style={{ width: `${summary.canterBarPct}%` }} />
            </div>
          </div>

          <div className="ec-ts-warn">
            <AlertTriangle className="ec-ts-warn__icon" size={22} aria-hidden />
            <div>
              <p className="ec-ts-warn__value">{summary.horsesNotTraining}</p>
              <p className="ec-ts-warn__text">{t('pages.trainingSchedule.horsesIdle')}</p>
            </div>
          </div>

          <h3 className="ec-training-schedule__side-title">{t('pages.trainingSchedule.trainersTitle')}</h3>
          <ul className="ec-ts-legend">
            {trainingScheduleTrainers.map((tr) => (
              <li key={tr.id} className="ec-ts-legend__item" style={{ borderColor: tr.color }}>
                <span className="ec-ts-legend__dot" style={{ background: tr.color }} aria-hidden />
                <span className="ec-ts-legend__name">{tr.name}</span>
              </li>
            ))}
          </ul>

          <div className="ec-ts-horses-summary">
            <p className="ec-ts-horses-summary__value">{summary.totalHorsesTraining}</p>
            <p className="ec-ts-horses-summary__label">{t('pages.trainingSchedule.totalHorsesTraining')}</p>
            <div className="ec-ts-horses-summary__bar-wrap">
              <div className="ec-ts-horses-summary__bar">
                <span style={{ width: `${trainingPct}%` }} />
              </div>
              <p className="ec-ts-horses-summary__sub">
                {t('pages.trainingSchedule.horsesProgress', {
                  n: summary.totalHorsesTraining,
                  cap: summary.totalHorsesCap,
                })}
              </p>
            </div>
          </div>

          <h3 className="ec-training-schedule__side-title ec-training-schedule__side-title--chart">
            {t('pages.trainingSchedule.chartTitle')}
          </h3>
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

      <AddTrainingModal open={Boolean(modalDate)} onClose={closeModal} date={modalDate} />
    </section>
  );
}
