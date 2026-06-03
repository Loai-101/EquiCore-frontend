/**
 * User profile image or initials fallback (Stable Users demo).
 */
function initialsFromName(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0]?.[0] || '?').toUpperCase();
}

export default function UserAvatar({ name, photoUrl, size = 'sm', className = '' }) {
  const initials = initialsFromName(name);
  const rootClass = ['su-avatar', `su-avatar--${size}`, className].filter(Boolean).join(' ');

  if (photoUrl) {
    return (
      <span className={rootClass}>
        <img src={photoUrl} alt="" className="su-avatar__img" />
      </span>
    );
  }

  return (
    <span className={`${rootClass} su-avatar--placeholder`} aria-hidden>
      {initials}
    </span>
  );
}
