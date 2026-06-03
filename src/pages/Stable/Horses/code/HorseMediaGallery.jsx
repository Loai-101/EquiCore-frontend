import { useRef, useState } from 'react';
import { Image as ImageIcon, Trash2, Upload, UserCircle, Users, Video, X } from 'lucide-react';
import { formatMediaDate, MEDIA_CATEGORIES } from './horseMediaLibrary';

/**
 * Per-horse photo & video galleries (owner vs rider/coach).
 * @param {'horses'|'health'} theme — button / utility class prefix
 */
export function HorseMediaLibrary({ media, labels, onUpload, onRemove, theme = 'horses' }) {
  const ownerInputRef = useRef(null);
  const riderInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const isHealth = theme === 'health';
  const srOnly = isHealth ? 'hm-sr-only' : 'hp-sr-only';
  const uploadBtn = isHealth
    ? 'hm-btn hm-btn--ghost hm-btn--sm'
    : 'hp-btn hp-btn--outline hp-btn--sm';
  const closeBtn = isHealth ? 'hm-btn hm-btn--ghost' : 'hp-btn hp-btn--ghost hp-btn--icon';

  const renderCategory = (category, inputRef) => {
    const items = media[category] || [];
    const isOwner = category === MEDIA_CATEGORIES.owner;
    const title = isOwner ? labels.ownerTitle : labels.riderCoachTitle;
    const hint = isOwner ? labels.ownerHint : labels.riderCoachHint;

    const handleFiles = (fileList) => {
      const file = fileList?.[0];
      if (file) onUpload(category, file);
    };

    return (
      <div className={`hp-media__category${isOwner ? ' hp-media__category--owner' : ' hp-media__category--staff'}`}>
        <div className="hp-media__category-head">
          <div className="hp-media__category-title">
            {isOwner ? <UserCircle size={20} aria-hidden /> : <Users size={20} aria-hidden />}
            <div>
              <h4>{title}</h4>
              <p>{hint}</p>
            </div>
          </div>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className={srOnly}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button type="button" className={uploadBtn} onClick={() => inputRef.current?.click()}>
              <Upload size={14} aria-hidden />
              {labels.upload}
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="hp-media__empty">{labels.empty}</p>
        ) : (
          <ul className="hp-media__grid">
            {items.map((item) => (
              <li key={item.id} className="hp-media__card">
                <button type="button" className="hp-media__thumb" onClick={() => setPreview(item)}>
                  {item.url && item.type === 'image' ? (
                    <img src={item.url} alt="" />
                  ) : (
                    <span className={`hp-media__placeholder hp-media__placeholder--${item.type}`}>
                      {item.type === 'video' ? <Video size={28} aria-hidden /> : <ImageIcon size={28} aria-hidden />}
                    </span>
                  )}
                  {item.type === 'video' ? <span className="hp-media__type-badge">Video</span> : null}
                </button>
                <div className="hp-media__meta">
                  <span className="hp-media__filename" title={item.fileName}>{item.fileName}</span>
                  {item.sessionLabel ? <span className="hp-media__session">{item.sessionLabel}</span> : null}
                  {item.caption ? <span className="hp-media__caption">{item.caption}</span> : null}
                  <span className="hp-media__by">{item.uploadedBy}</span>
                  <span className="hp-media__date">{formatMediaDate(item.createdAt)}</span>
                </div>
                <button
                  type="button"
                  className="hp-media__remove"
                  aria-label={labels.remove}
                  onClick={() => onRemove(category, item.id)}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="hp-media">
      <p className="hp-media__lead">{labels.lead}</p>
      {renderCategory(MEDIA_CATEGORIES.owner, ownerInputRef)}
      {renderCategory(MEDIA_CATEGORIES.riderCoach, riderInputRef)}

      {preview ? (
        <div className="hp-media-preview-backdrop" role="presentation" onClick={() => setPreview(null)}>
          <div className="hp-media-preview" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <header className="hp-media-preview__head">
              <h3>{preview.fileName}</h3>
              <button type="button" className={closeBtn} onClick={() => setPreview(null)} aria-label={labels.close}>
                <X size={20} />
              </button>
            </header>
            <div className="hp-media-preview__body">
              {preview.url && preview.type === 'image' ? (
                <img src={preview.url} alt="" className="hp-media-preview__img" />
              ) : preview.url && preview.type === 'video' ? (
                <video src={preview.url} controls className="hp-media-preview__video" />
              ) : (
                <div className="hp-media-preview__placeholder">
                  {preview.type === 'video' ? <Video size={48} /> : <ImageIcon size={48} />}
                  <p>{labels.demoPlaceholder}</p>
                </div>
              )}
              {preview.sessionLabel ? <p className="hp-media-preview__session">{preview.sessionLabel}</p> : null}
              <p className="hp-media-preview__meta">
                {preview.uploadedBy} · {formatMediaDate(preview.createdAt)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

