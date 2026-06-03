/**
 * Metric summary tile for dashboards.
 */
import '../styles/StatCard.css';

export default function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <article className="ec-stat-card">
      <div className="ec-stat-card__top">
        <div>
          <p className="ec-stat-card__label">{label}</p>
          <p className="ec-stat-card__value">{value}</p>
          {hint ? <p className="ec-stat-card__hint">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="ec-stat-card__icon">
            <Icon size={22} strokeWidth={1.75} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
