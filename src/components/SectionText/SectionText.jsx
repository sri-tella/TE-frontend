import { useState, useEffect } from 'react';
import { PencilSquare, CheckCircle, XCircle } from 'react-bootstrap-icons';
import './SectionText.css';

const SectionText = ({ value, onSave, canEdit, className, as: Tag = 'span' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  if (!canEdit) return <Tag className={className}>{value}</Tag>;

  if (editing) return (
    <span className="section-text-edit" onClick={e => e.stopPropagation()}>
      <input
        className="eval-inline-input"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(draft); setEditing(false); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
      />
      <button type="button" className="ie-btn-icon" onClick={e => { e.stopPropagation(); onSave(draft); setEditing(false); }}>
        <CheckCircle />
      </button>
      <button type="button" className="ie-btn-icon cancel" onClick={e => { e.stopPropagation(); setDraft(value); setEditing(false); }}>
        <XCircle />
      </button>
    </span>
  );

  return (
    <span className="section-text-view" onClick={e => e.stopPropagation()}>
      <Tag className={className}>{value}</Tag>
      <button type="button" className="btn-inline-edit" onClick={e => { e.stopPropagation(); setEditing(true); }}>
        <PencilSquare />
      </button>
    </span>
  );
};

export default SectionText;
