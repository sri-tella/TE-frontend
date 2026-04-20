import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Eye, PersonVideo3, ShieldLock, Envelope, ArrowRightCircle, PencilSquare, CheckCircle, XCircle } from 'react-bootstrap-icons';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { getPageContent, savePageContent } from '../../api/contentApi';
import InlineEdit from '../../components/InlineEdit/InlineEdit';
import { toast } from 'react-toastify';
import './Help.css';

const DEFAULT_CONTENT = {
  OBSERVER: `<h3>Observer Workflow</h3><ol><li>Navigate to <strong>Start Observation</strong> dashboard</li><li>Identify target <strong>Instructor &amp; Class</strong> credentials</li><li>Document insights via <strong>Pedagogical Framework</strong></li><li>Execute <strong>Data Validation</strong> &amp; Save progress</li><li>Generate <strong>Professional AI-Enhanced Report</strong></li></ol>`,
  INSTRUCTOR: `<h3>Instructor Workflow</h3><ol><li>Initialize your <strong>Course Credentials</strong> form</li><li>Define <strong>Strategic Learning Objectives</strong></li><li>Finalize session for <strong>Observer Discovery</strong></li><li>Request <strong>Dual-Role Privileges</strong> if needed</li></ol>`,
  ADMIN: `<h3>Admin Orchestration</h3><ol><li>Manage <strong>User Identities</strong> &amp; access levels</li><li>Authorize <strong>Cross-Role Access</strong> requests</li><li>Monitor <strong>System-Wide Integrity</strong> &amp; Audits</li></ol>`,
};

const MenuBar = ({ editor }) => {
  if (!editor) return null;
  const btn = (action, label, active) => (
    <button
      type="button"
      onClick={action}
      className={`tiptap-btn${active ? ' is-active' : ''}`}
    >
      {label}
    </button>
  );
  return (
    <div className="tiptap-menubar">
      {btn(() => editor.chain().focus().toggleBold().run(), 'B', editor.isActive('bold'))}
      {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
      {btn(() => editor.chain().focus().toggleUnderline().run(), 'U', editor.isActive('underline'))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', editor.isActive('heading', { level: 3 }))}
      {btn(() => editor.chain().focus().toggleBulletList().run(), '• List', editor.isActive('bulletList'))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. List', editor.isActive('orderedList'))}
      {btn(() => editor.chain().focus().setTextAlign('left').run(), '←', editor.isActive({ textAlign: 'left' }))}
      {btn(() => editor.chain().focus().setTextAlign('center').run(), '↔', editor.isActive({ textAlign: 'center' }))}
      {btn(() => editor.chain().focus().setTextAlign('right').run(), '→', editor.isActive({ textAlign: 'right' }))}
    </div>
  );
};

const SectionEditor = ({ sectionKey, label, icon, isAdmin }) => {
  const [editing, setEditing] = useState(false);
  const [savedHtml, setSavedHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '',
    editable: editing,
  });

  useEffect(() => {
    getPageContent(`help-${sectionKey}`)
      .then(data => {
        const html = data?.htmlContent || DEFAULT_CONTENT[sectionKey] || '';
        setSavedHtml(html);
        editor?.commands.setContent(html);
      })
      .catch(() => {
        const fallback = DEFAULT_CONTENT[sectionKey] || '';
        setSavedHtml(fallback);
        editor?.commands.setContent(fallback);
      })
      .finally(() => setLoading(false));
  }, [editor, sectionKey]);

  useEffect(() => {
    if (editor) editor.setEditable(editing);
  }, [editing, editor]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const html = editor.getHTML();
      await savePageContent(`help-${sectionKey}`, html);
      setSavedHtml(html);
      setEditing(false);
      toast.success('Content saved successfully');
    } catch {
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    editor?.commands.setContent(savedHtml);
    setEditing(false);
  };

  if (loading) return <div className="help-compact-section"><p>Loading...</p></div>;

  return (
    <div className="help-compact-section">
      <div className="help-section-header">
        <h3>{icon} {label}</h3>
        {isAdmin && !editing && (
          <button className="btn-edit-section" onClick={() => setEditing(true)}>
            <PencilSquare /> Edit
          </button>
        )}
        {isAdmin && editing && (
          <div className="edit-actions">
            <button className="btn-save-section" onClick={handleSave} disabled={saving}>
              <CheckCircle /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="btn-cancel-section" onClick={handleCancel} disabled={saving}>
              <XCircle /> Cancel
            </button>
          </div>
        )}
      </div>

      {editing && <MenuBar editor={editor} />}
      <div className={editing ? 'tiptap-editor-active' : 'tiptap-editor-readonly'}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

const FooterButton = ({ canEdit }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('Get Assistance');
  const [saved, setSaved] = useState('Get Assistance');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPageContent('help-footer-btn')
      .then(data => {
        const text = data?.htmlContent || 'Get Assistance';
        setValue(text);
        setSaved(text);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePageContent('help-footer-btn', value);
      setSaved(value);
      setEditing(false);
      toast.success('Saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="footer-btn-wrap">
      {editing ? (
        <div className="inline-edit-wrap">
          <input
            className="inline-edit-input"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
          />
          <button className="btn-save-section" onClick={handleSave} disabled={saving}>
            <CheckCircle /> {saving ? '...' : 'Save'}
          </button>
          <button className="btn-cancel-section" onClick={() => { setValue(saved); setEditing(false); }} disabled={saving}>
            <XCircle />
          </button>
        </div>
      ) : (
        <div className="footer-btn-row">
          <a href="mailto:teachingevaluation@gmail.com" className="btn-contact-simple">
            {value} <ArrowRightCircle />
          </a>
          {canEdit && (
            <button className="btn-inline-edit" onClick={() => setEditing(true)}>
              <PencilSquare />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const Help = () => {
  const { user } = useAuthStore();
  const roles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
  const isObserver = roles.includes('OBSERVER');
  const isInstructor = roles.includes('INSTRUCTOR');
  const isAdmin = roles.includes('ADMIN');

  const canEdit = isAdmin || !!user?.canEditContent;

  return (
    <div className="help-page-container">
      <div className="help-main-card">

        <header className="help-header">
          <InlineEdit
            pageKey="help-header-title"
            defaultValue="Platform Guidance"
            canEdit={canEdit}
            tag="h1"
            className="help-heading"
          />
          <InlineEdit
            pageKey="help-header-subtitle"
            defaultValue="Comprehensive workflow instructions for your institutional role"
            canEdit={canEdit}
            tag="p"
            className="help-subtext"
          />
        </header>

        <div className="help-sections-wrapper">
          {(isObserver || isAdmin) && (
            <SectionEditor
              sectionKey="OBSERVER"
              label="Observer Workflow"
              icon={<Eye />}
              isAdmin={canEdit}
            />
          )}
          {(isInstructor || isAdmin) && (
            <SectionEditor
              sectionKey="INSTRUCTOR"
              label="Instructor Workflow"
              icon={<PersonVideo3 />}
              isAdmin={canEdit}
            />
          )}
          {isAdmin && (
            <SectionEditor
              sectionKey="ADMIN"
              label="Admin Orchestration"
              icon={<ShieldLock />}
              isAdmin={canEdit}
            />
          )}
        </div>

        <footer className="help-footer-simple">
          <div className="contact-info">
            <Envelope style={{ color: '#FFB81C' }} />
            <InlineEdit
              pageKey="help-footer-contact"
              defaultValue="teachingevaluation@gmail.com"
              canEdit={canEdit}
              tag="span"
            />
          </div>
          <FooterButton canEdit={canEdit} />
        </footer>

      </div>
    </div>
  );
};

export default Help;
