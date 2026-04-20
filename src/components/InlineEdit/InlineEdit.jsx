import { useState, useEffect } from 'react';
import { PencilSquare, CheckCircle, XCircle } from 'react-bootstrap-icons';
import { getPageContent, savePageContent } from '../../api/contentApi';
import { toast } from 'react-toastify';
import './InlineEdit.css';

const InlineEdit = ({ pageKey, defaultValue, canEdit, tag: Tag = 'span', className }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPageContent(pageKey)
      .then(data => {
        const text = data?.htmlContent || defaultValue;
        setValue(text);
        setSaved(text);
      })
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

  const handleCancel = () => { setValue(saved); setEditing(false); };

  if (editing) {
    return (
      <div className="inline-edit-wrap">
        <input
          className="inline-edit-input"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
        />
        <button className="ie-btn-save" onClick={handleSave} disabled={saving}>
          <CheckCircle /> {saving ? '...' : 'Save'}
        </button>
        <button className="ie-btn-cancel" onClick={handleCancel} disabled={saving}>
          <XCircle />
        </button>
      </div>
    );
  }

  return (
    <Tag className={className}>
      {value}
      {canEdit && (
        <button className="btn-inline-edit" onClick={() => setEditing(true)}>
          <PencilSquare />
        </button>
      )}
    </Tag>
  );
};

export default InlineEdit;
