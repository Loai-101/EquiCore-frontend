/**
 * Add / edit user modal — credentials + role + status (demo only, no API).
 * Invited users use official roles only; Stable Owner is account ownership (not an invite role).
 */
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getPermissionsForRole } from '../stableUsersPermissionCatalog';
import UserAvatar from './UserAvatar';

/** Official roles for stable members (invite / staff). Stable Owner is separate. */
export const STABLE_INVITE_ROLE_OPTIONS = ['Stable Admin', 'Trainer', 'Rider', 'Veterinarian', 'Accountant', 'Staff'];

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

function roleDescKey(role) {
  const map = {
    'Stable Owner': 'roleDescStableOwner',
    'Stable Admin': 'roleDescStableAdmin',
    Trainer: 'roleDescTrainer',
    Rider: 'roleDescRider',
    Veterinarian: 'roleDescVeterinarian',
    Accountant: 'roleDescAccountant',
    Staff: 'roleDescStaff',
  };
  return map[role] || 'roleDescStaff';
}

const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

function emptyForm() {
  return {
    name: '',
    username: '',
    tempPassword: '',
    email: '',
    phone: '',
    role: 'Stable Admin',
    status: 'active',
    notes: '',
    photoUrl: null,
  };
}

export default function UserFormModal({ open, mode, initialUser, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (mode === 'add') {
      setForm(emptyForm());
    } else if (initialUser) {
      setForm({
        name: initialUser.name || '',
        username: initialUser.username || '',
        tempPassword: '',
        email: initialUser.email || '',
        phone: initialUser.phone || '',
        role: initialUser.role || 'Stable Admin',
        status: initialUser.status || 'active',
        notes: initialUser.notes || '',
        photoUrl: initialUser.photoUrl || null,
      });
    }
  }, [open, mode, initialUser]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const titleKey =
    mode === 'add' ? 'pages.stableUsers.formAddTitle' : 'pages.stableUsers.formEditTitle';

  const isOwnerEdit = mode === 'edit' && initialUser?.role === 'Stable Owner';

  const onPhotoSelected = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('pages.stableUsers.toastPhotoInvalidType'));
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      toast.error(t('pages.stableUsers.toastPhotoTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, photoUrl: typeof reader.result === 'string' ? reader.result : null }));
    };
    reader.readAsDataURL(file);
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      ...(initialUser && mode === 'edit' ? { id: initialUser.id } : {}),
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: isOwnerEdit ? 'Stable Owner' : form.role,
      status: form.status,
      notes: form.notes.trim(),
      tempPassword: form.tempPassword.trim() || null,
      photoUrl: form.photoUrl || null,
    };
    if (mode === 'add') {
      payload.permissions = getPermissionsForRole(form.role);
    }
    onSave(payload, mode);
  };

  return (
    <div className="su-modal" role="dialog" aria-modal="true">
      <button type="button" className="su-modal__backdrop" onClick={onClose} aria-label={t('pages.stableUsers.close')} />
      <div className="su-modal__panel su-modal__panel--form">
        <div className="su-modal__head">
          <h2 className="su-modal__title">{t(titleKey)}</h2>
          <button type="button" className="su-modal__icon-btn" onClick={onClose} aria-label={t('pages.stableUsers.close')}>
            <X size={20} />
          </button>
        </div>
        <form className="su-form" onSubmit={submit}>
          <label className="su-field">
            <span>{t('pages.stableUsers.fieldFullName')}</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoComplete="name"
            />
          </label>
          <div className="su-field su-field--photo">
            <span>{t('pages.stableUsers.fieldPhoto')}</span>
            <div className="su-photo-row">
              <UserAvatar name={form.name} photoUrl={form.photoUrl} size="lg" />
              <div className="su-photo-row__actions">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="su-photo-file"
                  onChange={onPhotoSelected}
                />
                <button
                  type="button"
                  className="su-btn su-btn--ghost su-btn--sm"
                  onClick={() => fileRef.current?.click()}
                >
                  {t('pages.stableUsers.photoUploadChoose')}
                </button>
                {form.photoUrl ? (
                  <button
                    type="button"
                    className="su-btn su-btn--outline su-btn--sm"
                    onClick={() => setForm((f) => ({ ...f, photoUrl: null }))}
                  >
                    {t('pages.stableUsers.photoRemove')}
                  </button>
                ) : null}
              </div>
            </div>
            <p className="su-photo-hint">{t('pages.stableUsers.photoHint')}</p>
          </div>
          <label className="su-field">
            <span>{t('pages.stableUsers.fieldUsername')}</span>
            <input
              required
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              autoComplete="username"
            />
          </label>
          <label className="su-field">
            <span>{t('pages.stableUsers.fieldTempPassword')}</span>
            <input
              type="password"
              value={form.tempPassword}
              onChange={(e) => setForm((f) => ({ ...f, tempPassword: e.target.value }))}
              placeholder={mode === 'edit' ? '••••••••' : ''}
              autoComplete="new-password"
            />
          </label>
          <div className="su-form__row">
            <label className="su-field">
              <span>{t('pages.stableUsers.fieldEmail')}</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label className="su-field">
              <span>{t('pages.stableUsers.fieldPhone')}</span>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </label>
          </div>
          <div className="su-form__row">
            <div className="su-field su-field--role-block">
              <span>{t('pages.stableUsers.fieldRole')}</span>
              {isOwnerEdit ? (
                <div className="su-role-readonly">{t(`pages.stableUsers.${roleLabelKey('Stable Owner')}`)}</div>
              ) : (
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  {STABLE_INVITE_ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {t(`pages.stableUsers.${roleLabelKey(r)}`)}
                    </option>
                  ))}
                </select>
              )}
              <p className="su-field-helper">{t('pages.stableUsers.roleTemplateHelper')}</p>
              <p className="su-role-desc">{t(`pages.stableUsers.${roleDescKey(isOwnerEdit ? 'Stable Owner' : form.role)}`)}</p>
              {mode === 'add' ? (
                <p className="su-form__callout su-form__callout--inline" role="status">
                  {t('pages.stableUsers.rolePresetAppliedMessage')}
                </p>
              ) : null}
            </div>
            <label className="su-field">
              <span>{t('pages.stableUsers.fieldStatus')}</span>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="active">{t('pages.stableUsers.statusActive')}</option>
                <option value="inactive">{t('pages.stableUsers.statusInactive')}</option>
              </select>
            </label>
          </div>
          <label className="su-field">
            <span>{t('pages.stableUsers.fieldNotes')}</span>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </label>
          <div className="su-form__actions">
            <button type="button" className="su-btn su-btn--ghost" onClick={onClose}>
              {t('pages.stableUsers.cancel')}
            </button>
            <button type="submit" className="su-btn su-btn--gold">
              {t('pages.stableUsers.saveUser')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
