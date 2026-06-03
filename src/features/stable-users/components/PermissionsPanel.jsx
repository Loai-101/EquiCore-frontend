/**
 * Slide-over permission builder (page → feature → CRUD).
 */
import { useMemo, useState } from 'react';
import { ChevronDown, Search, Shield, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  STABLE_USER_PERMISSION_PAGES,
  buildPermissionPreset,
  clonePermissions,
  countPermissionStats,
} from '../stableUsersPermissionCatalog';

const CRUD_KEYS = ['create', 'read', 'update', 'delete'];

const crudLabelKey = (k) =>
  ({
    create: 'permCrudCreate',
    read: 'permCrudRead',
    update: 'permCrudUpdate',
    delete: 'permCrudDelete',
  })[k];

export default function PermissionsPanel({ open, user, draft, setDraft, onClose, onSave }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [openSections, setOpenSections] = useState(
    () => new Set(STABLE_USER_PERMISSION_PAGES.map((p) => p.id))
  );

  const stats = useMemo(() => countPermissionStats(draft), [draft]);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STABLE_USER_PERMISSION_PAGES;
    return STABLE_USER_PERMISSION_PAGES.filter((page) => {
      const pageLabel = t(`pages.stableUsers.${page.labelKey}`).toLowerCase();
      if (pageLabel.includes(q)) return true;
      return page.features.some((f) => t(`pages.stableUsers.${f.labelKey}`).toLowerCase().includes(q));
    });
  }, [query, t]);

  if (!open || !user) return null;

  const toggleSection = (pageId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  const setPageAccess = (pageId, access) => {
    setDraft((prev) => {
      const next = clonePermissions(prev);
      if (next[pageId]) next[pageId].access = access;
      return next;
    });
  };

  const setCrud = (pageId, featureId, key, value) => {
    setDraft((prev) => {
      const next = clonePermissions(prev);
      if (next[pageId]?.features[featureId]) {
        next[pageId].features[featureId][key] = value;
      }
      return next;
    });
  };

  const applyPreset = (preset) => {
    setDraft(() => buildPermissionPreset(preset));
  };

  return (
    <div className="su-perm">
      <button type="button" className="su-perm__backdrop" onClick={onClose} aria-label={t('pages.stableUsers.close')} />
      <aside className="su-perm__panel" aria-labelledby="su-perm-title">
        <header className="su-perm__header">
          <div className="su-perm__header-text">
            <p className="su-perm__eyebrow">
              <Shield size={16} aria-hidden />
              {t('pages.stableUsers.permPanelTitle')}
            </p>
            <h2 id="su-perm-title" className="su-perm__title">
              {user.name}
            </h2>
            <p className="su-perm__subtitle">{t('pages.stableUsers.permPanelSubtitle', { name: user.name })}</p>
            <p className="su-perm__summary">
              {t('pages.stableUsers.permSummary', { pages: stats.pageOn, crud: stats.crudOn })}
            </p>
          </div>
          <button type="button" className="su-modal__icon-btn" onClick={onClose} aria-label={t('pages.stableUsers.close')}>
            <X size={20} />
          </button>
        </header>

        <div className="su-perm__toolbar">
          <div className="su-perm__search">
            <Search size={16} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('pages.stableUsers.permSearch')}
            />
          </div>
          <div className="su-perm__quick">
            <button type="button" className="su-btn su-btn--sm su-btn--ghost" onClick={() => applyPreset('selectAll')}>
              {t('pages.stableUsers.permSelectAll')}
            </button>
            <button type="button" className="su-btn su-btn--sm su-btn--ghost" onClick={() => applyPreset('stableAdmin')}>
              {t('pages.stableUsers.permPresetStableAdmin')}
            </button>
            <button type="button" className="su-btn su-btn--sm su-btn--ghost" onClick={() => applyPreset('readOnly')}>
              {t('pages.stableUsers.permReadOnly')}
            </button>
            <button type="button" className="su-btn su-btn--sm su-btn--ghost" onClick={() => applyPreset('trainer')}>
              {t('pages.stableUsers.permPresetTrainer')}
            </button>
            <button type="button" className="su-btn su-btn--sm su-btn--ghost" onClick={() => applyPreset('rider')}>
              {t('pages.stableUsers.permPresetRider')}
            </button>
            <button type="button" className="su-btn su-btn--sm su-btn--ghost" onClick={() => applyPreset('veterinarian')}>
              {t('pages.stableUsers.permPresetVet')}
            </button>
            <button type="button" className="su-btn su-btn--sm su-btn--ghost" onClick={() => applyPreset('accountant')}>
              {t('pages.stableUsers.permPresetAccountant')}
            </button>
            <button type="button" className="su-btn su-btn--sm su-btn--ghost" onClick={() => applyPreset('staff')}>
              {t('pages.stableUsers.permPresetStaff')}
            </button>
            <button type="button" className="su-btn su-btn--sm su-btn--outline" onClick={() => applyPreset('clear')}>
              {t('pages.stableUsers.permClearAll')}
            </button>
          </div>
        </div>

        <div className="su-perm__steps">
          <span>{t('pages.stableUsers.permStep1')}</span>
          <span className="su-perm__steps-dot">·</span>
          <span>{t('pages.stableUsers.permStep2')}</span>
          <span className="su-perm__steps-dot">·</span>
          <span>{t('pages.stableUsers.permStep3')}</span>
        </div>

        <div className="su-perm__scroll">
          {filteredPages.map((page) => {
            const p = draft[page.id];
            if (!p) return null;
            const isOpen = openSections.has(page.id);
            return (
              <section key={page.id} className="su-perm__page">
                <div className="su-perm__page-head">
                  <button
                    type="button"
                    className={`su-perm__expand${isOpen ? ' is-open' : ''}`}
                    onClick={() => toggleSection(page.id)}
                    aria-expanded={isOpen}
                  >
                    <ChevronDown size={18} aria-hidden />
                  </button>
                  <label className="su-perm__page-access">
                    <input type="checkbox" checked={p.access} onChange={(e) => setPageAccess(page.id, e.target.checked)} />
                    <span>{t(`pages.stableUsers.${page.labelKey}`)}</span>
                  </label>
                  <span className="su-perm__page-tag">{t('pages.stableUsers.permPageAccess')}</span>
                </div>
                {isOpen ? (
                  <div className="su-perm__page-body">
                    {!p.access ? (
                      <p className="su-perm__muted">{t('pages.stableUsers.permFeaturesHint')}</p>
                    ) : (
                      page.features.map((feat) => {
                        const c = p.features[feat.id];
                        return (
                          <div key={feat.id} className="su-perm__feature">
                            <div className="su-perm__feature-label">{t(`pages.stableUsers.${feat.labelKey}`)}</div>
                            <div className="su-perm__crud">
                              {CRUD_KEYS.map((k) => (
                                <label key={k} className="su-perm__crud-item">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(c?.[k])}
                                    onChange={(e) => setCrud(page.id, feat.id, k, e.target.checked)}
                                  />
                                  <span>{t(`pages.stableUsers.${crudLabelKey(k)}`)}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <footer className="su-perm__footer">
          <button type="button" className="su-btn su-btn--ghost" onClick={onClose}>
            {t('pages.stableUsers.cancel')}
          </button>
          <button
            type="button"
            className="su-btn su-btn--gold"
            onClick={() => {
              onSave();
            }}
          >
            {t('pages.stableUsers.permSave')}
          </button>
        </footer>
      </aside>
    </div>
  );
}
