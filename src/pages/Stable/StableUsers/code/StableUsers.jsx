/**
 * Stable Users & Roles — member management, credentials, and per-user permission matrix (demo state).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Eye, Pencil, Search, Shield, UserCheck, UserPlus, Users, UserX, X } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { dummyStableUsers } from '../../../../services/mock/dummyData';
import {
  clonePermissions,
  createEmptyPermissions,
  mergePermissionsWithCatalog,
} from '../../../../features/stable-users/stableUsersPermissionCatalog';
import StatusBadge from '../../../../components/StatusBadge/code/StatusBadge';
import UserFormModal from '../../../../features/stable-users/components/UserFormModal';
import UserAvatar from '../../../../features/stable-users/components/UserAvatar';
import PermissionsPanel from '../../../../features/stable-users/components/PermissionsPanel';
import '../styles/StableUsers.css';

const ROLE_PILLS = [
  'pillStableOwner',
  'pillStableAdmin',
  'pillTrainer',
  'pillRider',
  'pillVet',
  'pillStaff',
  'pillAccountant',
];

function roleLabelKey(role) {
  const map = {
    'Stable Owner': 'pillStableOwner',
    'Stable Admin': 'pillStableAdmin',
    Trainer: 'pillTrainer',
    Rider: 'pillRider',
    Veterinarian: 'pillVet',
    Staff: 'pillStaff',
    Accountant: 'pillAccountant',
  };
  return map[role] || 'pillStaff';
}

function cloneUsersForStable(stableId) {
  return dummyStableUsers
    .filter((u) => u.stableId === stableId)
    .map((u) => ({
      ...u,
      permissions: clonePermissions(u.permissions || createEmptyPermissions()),
    }));
}

export default function StableUsers() {
  const { t } = useTranslation();
  const { stableId } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formUser, setFormUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [permUser, setPermUser] = useState(null);
  const [permDraft, setPermDraft] = useState(() => createEmptyPermissions());

  useEffect(() => {
    setUsers(cloneUsersForStable(stableId));
  }, [stableId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
    );
  }, [users, query]);

  const activeUserCount = useMemo(
    () => filtered.filter((u) => u.status === 'active').length,
    [filtered]
  );

  const openAdd = () => {
    setFormMode('add');
    setFormUser(null);
    setFormOpen(true);
  };

  const openEdit = (u) => {
    setFormMode('edit');
    setFormUser(u);
    setFormOpen(true);
  };

  const openPermissions = useCallback((u) => {
    setPermUser(u);
    setPermDraft(mergePermissionsWithCatalog(u.permissions || createEmptyPermissions()));
  }, []);

  const savePermissions = useCallback(() => {
    if (!permUser) return;
    setUsers((list) =>
      list.map((u) => (u.id === permUser.id ? { ...u, permissions: clonePermissions(permDraft) } : u))
    );
    toast.success(t('pages.stableUsers.toastPermissionsSaved'));
    setPermUser(null);
  }, [permDraft, permUser, t]);

  const handleFormSave = (payload, mode) => {
    if (mode === 'add') {
      const nu = {
        id: `u-${Date.now()}`,
        stableId,
        name: payload.name,
        username: payload.username,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        status: payload.status,
        notes: payload.notes,
        tempPassword: payload.tempPassword,
        lastLogin: '—',
        photoUrl: payload.photoUrl || null,
        permissions: payload.permissions || createEmptyPermissions(),
      };
      setUsers((list) => [...list, nu]);
      toast.success(t('pages.stableUsers.toastUserAdded'));
    } else if (formUser) {
      setUsers((list) =>
        list.map((u) =>
          u.id === formUser.id
            ? {
                ...u,
                name: payload.name,
                username: payload.username,
                email: payload.email,
                phone: payload.phone,
                role: payload.role,
                status: payload.status,
                notes: payload.notes,
                ...(payload.tempPassword ? { tempPassword: payload.tempPassword } : {}),
                photoUrl: payload.photoUrl ?? null,
              }
            : u
        )
      );
      toast.success(t('pages.stableUsers.toastUserUpdated'));
    }
    setFormOpen(false);
  };

  const deactivate = (u) => {
    setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, status: 'inactive' } : x)));
    toast(t('pages.stableUsers.toastUserDeactivated'));
  };

  const activate = (u) => {
    setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, status: 'active' } : x)));
    toast.success(t('pages.stableUsers.toastUserActivated'));
  };

  return (
    <div className="su-page">
      <header className="su-page__header">
        <div>
          <h1 className="su-page__title">{t('pages.stableUsers.title')}</h1>
          <p className="su-page__subtitle">
            <Trans i18nKey="pages.stableUsers.subtitle" values={{ id: stableId }} components={[<code key="stable-id" />]} />
          </p>
        </div>
        <button type="button" className="su-btn su-btn--gold" onClick={openAdd}>
          <UserPlus size={18} aria-hidden />
          {t('pages.stableUsers.addUser')}
        </button>
      </header>

      <div className="su-page__pills">
        {ROLE_PILLS.map((pillKey) => (
          <span key={pillKey} className="su-page__pill">
            {t(`pages.stableUsers.${pillKey}`)}
          </span>
        ))}
      </div>

      <div className="su-toolbar su-toolbar--split">
        <div className="su-toolbar__title-block">
          <span className="su-toolbar__title-icon" aria-hidden>
            <Users size={20} strokeWidth={2} />
          </span>
          <div>
            <p className="su-toolbar__title">{t('pages.stableUsers.sectionActiveUsers')}</p>
            <p className="su-toolbar__meta">{t('pages.stableUsers.sectionActiveUsersCount', { count: activeUserCount })}</p>
          </div>
        </div>
        <div className="su-toolbar__search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('pages.stableUsers.searchPlaceholder')}
          />
        </div>
      </div>

      <div className="su-table-wrap">
        {filtered.length === 0 ? (
          <p className="su-empty">{t('pages.stableUsers.empty')}</p>
        ) : (
          <div className="su-table-scroll">
            <table className="su-table">
              <thead>
                <tr>
                  <th>{t('pages.stableUsers.tableUserName')}</th>
                  <th>{t('pages.stableUsers.tableUsername')}</th>
                  <th>{t('tables.email')}</th>
                  <th>{t('pages.stableUsers.tablePhone')}</th>
                  <th>{t('tables.role')}</th>
                  <th>{t('tables.status')}</th>
                  <th>{t('pages.stableUsers.tableLastLogin')}</th>
                  <th>{t('pages.stableUsers.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="su-user-cell">
                        <UserAvatar name={u.name} photoUrl={u.photoUrl} size="sm" />
                        <span className="su-table__strong su-user-cell__name">{u.name}</span>
                      </div>
                    </td>
                    <td>
                      <code className="su-mono">{u.username}</code>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>{t(`pages.stableUsers.${roleLabelKey(u.role)}`)}</td>
                    <td>
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="su-table__muted">{u.lastLogin}</td>
                    <td>
                      <div className="su-actions">
                        <button
                          type="button"
                          className="su-actions__btn"
                          title={t('pages.stableUsers.actionView')}
                          onClick={() => {
                            setViewUser(u);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="su-actions__btn"
                          title={t('pages.stableUsers.actionEdit')}
                          onClick={() => openEdit(u)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="su-actions__btn su-actions__btn--gold"
                          title={t('pages.stableUsers.actionPermissions')}
                          onClick={() => openPermissions(u)}
                        >
                          <Shield size={16} />
                        </button>
                        {u.status === 'inactive' ? (
                          <button
                            type="button"
                            className="su-actions__btn su-actions__btn--success"
                            title={t('pages.stableUsers.actionActivate')}
                            onClick={() => activate(u)}
                          >
                            <UserCheck size={16} aria-hidden />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="su-actions__btn su-actions__btn--danger"
                            title={t('pages.stableUsers.actionDeactivate')}
                            onClick={() => deactivate(u)}
                          >
                            <UserX size={16} aria-hidden />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserFormModal
        open={formOpen}
        mode={formMode}
        initialUser={formUser}
        onClose={() => setFormOpen(false)}
        onSave={handleFormSave}
      />

      {viewUser ? (
        <div className="su-modal" role="dialog" aria-modal="true">
          <button type="button" className="su-modal__backdrop" onClick={() => setViewUser(null)} aria-label={t('pages.stableUsers.close')} />
          <div className="su-modal__panel su-modal__panel--view">
            <div className="su-modal__head">
              <h2 className="su-modal__title">{t('pages.stableUsers.formViewTitle')}</h2>
              <button type="button" className="su-modal__icon-btn" onClick={() => setViewUser(null)} aria-label={t('pages.stableUsers.close')}>
                <X size={20} />
              </button>
            </div>
            <div className="su-view-profile">
              <UserAvatar name={viewUser.name} photoUrl={viewUser.photoUrl} size="xl" />
              <div className="su-view-profile__text">
                <p className="su-view-profile__name">{viewUser.name}</p>
                <p className="su-view-profile__username">
                  <code>{viewUser.username}</code>
                </p>
              </div>
            </div>
            <dl className="su-view-dl">
              <div>
                <dt>{t('pages.stableUsers.fieldEmail')}</dt>
                <dd>{viewUser.email}</dd>
              </div>
              <div>
                <dt>{t('pages.stableUsers.fieldPhone')}</dt>
                <dd>{viewUser.phone}</dd>
              </div>
              <div>
                <dt>{t('pages.stableUsers.fieldRole')}</dt>
                <dd>{t(`pages.stableUsers.${roleLabelKey(viewUser.role)}`)}</dd>
              </div>
              <div>
                <dt>{t('pages.stableUsers.fieldStatus')}</dt>
                <dd>
                  <StatusBadge status={viewUser.status} />
                </dd>
              </div>
              <div>
                <dt>{t('pages.stableUsers.tableLastLogin')}</dt>
                <dd>{viewUser.lastLogin}</dd>
              </div>
              <div>
                <dt>{t('pages.stableUsers.fieldNotes')}</dt>
                <dd>{viewUser.notes || '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}

      <PermissionsPanel
        open={Boolean(permUser)}
        user={permUser}
        draft={permDraft}
        setDraft={setPermDraft}
        onClose={() => setPermUser(null)}
        onSave={savePermissions}
      />
    </div>
  );
}
