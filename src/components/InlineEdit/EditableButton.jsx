import { useState, useEffect } from 'react';
import { PencilSquare, CheckCircle, XCircle } from 'react-bootstrap-icons';
import { getPageContent, savePageContent } from '../../api/contentApi';
import { toast } from 'react-toastify';
import './InlineEdit.css';

const EditableButton = ({ pageKey, defaultValue, canEdit, className, type = 'button', onClick, disabled, children }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPageContent(pageKey)
      .then(data => { const t = data?.htmlContent || defaultValue; setValue(t); setSaved(t); })
      .catch(() => { setValue(defaultValue); setSaved(defaultValue); });
  }, [pageKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePageContent(pageKey, value);
      setSaved(value);
      setEditing(false);
      toast.success('Saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="inline-edit-wrap">
        <input className="inline-edit-input" value={value} onChange={e => setValue(e.target.value)} autoFocus />
        <button className="ie-btn-save" onClick={handleSave} disabled={saving}><CheckCircle /> {saving ? '...' : 'Save'}</button>
        <button className="ie-btn-cancel" onClick={() => { setValue(saved); setEditing(false); }} disabled={saving}><XCircle /></button>
      </div>
    );
  }

  return (
    <div className="editable-btn-wrap">
      <button type={type} className={className} onClick={onClick} disabled={disabled}>
        {children || value}
      </button>
      {canEdit && (
        <button type="button" className="btn-inline-edit" onClick={() => setEditing(true)}>
          <PencilSquare />
        </button>
      )}
    </div>
  );
};

export default EditableButton;
