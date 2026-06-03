/**
 * Primary navigation rail for dashboard layouts (Super Admin + Stable).
 */
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import '../styles/Sidebar.css';

export default function Sidebar({ title, subtitle, items, hint }) {
  const { t } = useTranslation();

  return (
    <aside className="ec-sidebar">
      <div className="ec-sidebar__crest">
        <p className="ec-sidebar__crest-title">{title}</p>
        {subtitle ? <div className="ec-sidebar__crest-sub">{subtitle}</div> : null}
      </div>
      <p className="ec-sidebar__section-label">{t('sidebar.sectionNavigation')}</p>
      <nav className="ec-sidebar__nav">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `ec-sidebar__link${isActive ? ' ec-sidebar__link--active' : ''}`
              }
              end={item.end}
            >
              {Icon ? <Icon size={18} strokeWidth={1.75} /> : null}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      {hint ? <p className="ec-sidebar__hint">{hint}</p> : null}
    </aside>
  );
}
