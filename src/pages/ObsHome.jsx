import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ObsHome.css';
import { classApi, evaluationApi } from '../api/classApi';
import { useAuthStore } from '../store/authStore';
import { useRoles } from '../hooks/useRoles';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { JournalCheck, Archive, PlayCircleFill, PersonBadge, Book, CheckCircleFill, PencilSquare, CheckCircle, XCircle } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import InlineEdit from '../components/InlineEdit/InlineEdit';
import { getPageContent, savePageContent } from '../api/contentApi';

const ObsStartButton = ({ canEdit, disabled, onClick, starting }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('Start Evaluation');
  const [saved, setSaved] = useState('Start Evaluation');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPageContent('obs-btn-start')
      .then(data => { const t = data?.htmlContent || 'Start Evaluation'; setValue(t); setSaved(t); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePageContent('obs-btn-start', value);
      setSaved(value);
      setEditing(false);
      toast.success('Saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="obs-btn-edit-wrap">
        <input className="inline-edit-input" value={value} onChange={e => setValue(e.target.value)} autoFocus />
        <button className="ie-btn-save" onClick={handleSave} disabled={saving}><CheckCircle /> {saving ? '...' : 'Save'}</button>
        <button className="ie-btn-cancel" onClick={() => { setValue(saved); setEditing(false); }} disabled={saving}><XCircle /></button>
      </div>
    );
  }

  return (
    <div className="obs-btn-wrap">
      <button className="btn obs-button" disabled={disabled || starting} onClick={onClick}>
        <PlayCircleFill size={22} style={{ marginRight: '10px' }} />
        {starting ? 'Starting...' : value}
      </button>
      {canEdit && (
        <button className="btn-inline-edit" onClick={() => setEditing(true)}>
          <PencilSquare />
        </button>
      )}
    </div>
  );
};

const ObsHome = () => {
  const [activeClasses, setActiveClasses] = useState([]);
  const [archivedClasses, setArchivedClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [classSearch, setClassSearch] = useState('');

  const { user } = useAuthStore();
  const { canEdit } = useRoles();
  const navigate = useNavigate();

  const filteredActiveClasses = classSearch.trim()
    ? activeClasses.filter(c =>
        c.title?.toLowerCase().includes(classSearch.toLowerCase()) ||
        `${c.instructorFirstName} ${c.instructorLastName}`.toLowerCase().includes(classSearch.toLowerCase())
      )
    : activeClasses;

  const selectedClass = activeClasses.find(c => c.classId === selectedClassId);

  useEffect(() => {
    fetchClasses();
    // Prefetch evaluation flow chunks while user is selecting a class
    import('./Evaluate/Evaluate');
    import('./Recommendations/Recommendations');
    import('./ReportViewer/ReportViewer');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.observerId]);

  const fetchClasses = () => {
    setLoading(true);
    classApi.fetchClasses(user?.observerId)
      .then(data => {
        setActiveClasses(data.filter(item => !item.isArchived));
        setArchivedClasses(data.filter(item => item.isArchived));
      })
      .catch(() => {
        toast.error("Failed to load classes.");
      })
      .finally(() => setLoading(false));
  };

  const updateArchiveStatus = (classId, status) => {
    classApi.updateArchiveStatus(classId, status).catch(() => {
        toast.error("Sync error. Please refresh.");
    });
  };

  const handleClassSelect = (info) => {
    if (selectedClassId === info.classId) {
      setSelectedClassId(null);
    } else {
      setSelectedClassId(info.classId);
    }
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const classId = parseInt(draggableId);
    const movingToArchive = destination.droppableId === 'archive';

    let sourceList = source.droppableId === 'active' ? [...activeClasses] : [...archivedClasses];
    let destList = destination.droppableId === 'active' ? [...activeClasses] : [...archivedClasses];

    if (source.droppableId === destination.droppableId) {
      const [removed] = sourceList.splice(source.index, 1);
      sourceList.splice(destination.index, 0, removed);
      if (source.droppableId === 'active') setActiveClasses(sourceList);
      else setArchivedClasses(sourceList);
      return;
    }

    const [movedItem] = sourceList.splice(source.index, 1);
    const updatedItem = { ...movedItem, isArchived: movingToArchive };
    destList.splice(destination.index, 0, updatedItem);

    if (source.droppableId === 'active') {
      setActiveClasses(sourceList);
      setArchivedClasses(destList);
      if (classId === selectedClassId) setSelectedClassId(null);
    } else {
      setArchivedClasses(sourceList);
      setActiveClasses(destList);
    }
    updateArchiveStatus(classId, movingToArchive);
  };

  const handleStartObservation = async () => {
    const selectedClass = activeClasses.find(c => c.classId === selectedClassId);
    if (!selectedClass || !user) {
      toast.error("Please select an active class.");
      return;
    }

    const observerId = user.observerId;
    if (!observerId) {
      toast.error("Observer profile not found. Please log in again.");
      return;
    }

    setStarting(true);
    try {
      const payload = {
        observerId,
        instructorId: selectedClass.instructorId,
        classId: selectedClass.classId,
        date: new Date().toISOString().split('T')[0]
      };
      const response = await evaluationApi.startEvaluation(payload);
      const evaluationId = response.evaluation_id || response.evaluationId || response.id;
      
      // HARD RESET for new evaluation
      localStorage.removeItem('evaluation-storage'); // Reset Zustand Activity Log
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('responses_') || key.startsWith('recs_') || key.startsWith('eval_')) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.clear(); 

      toast.success("Evaluation started!");
      navigate('/evaluate', {
        state: { evaluationId, observerId: payload.observerId, instructorId: payload.instructorId, classId: payload.classId }
      });
    } catch (error) {
      toast.error("Failed to start evaluation.");
      setStarting(false);
    }
  };

  const ClassCard = ({ info, index, isSelected, isClickable = true, isDragDisabled = false }) => (
    <Draggable draggableId={String(info.classId)} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`class-card ${isSelected ? 'selected-card' : ''} ${snapshot.isDragging ? 'dragging-card' : ''}`}
          onClick={() => isClickable && handleClassSelect(info)}
          style={provided.draggableProps.style}
        >
          {isSelected && <CheckCircleFill className="selection-badge" />}
          
          <div className="card-top">
            <div className="course-icon-box"><Book size={20} /></div>
            <div className="course-title-area">
              <strong className="course-title-text">{info.title}</strong>
              <small className="course-id-label">ID: #{info.classId}</small>
            </div>
          </div>

          <div className="card-mid">
            <div className="instructor-badge">
              <PersonBadge className="badge-icon" size={18} />
              <div className="instructor-details">
                <span className="instructor-name-text">{info.instructorFirstName} {info.instructorLastName}</span>
                <span className="instructor-email-text">{info.instructorEmail}</span>
              </div>
            </div>
          </div>

          {info.description && (
            <div className="card-footer-desc"><p>{info.description}</p></div>
          )}
        </div>
      )}
    </Draggable>
  );

  return (
    <div className="obs-container">
      <div className="obs-mesh" />
      {starting && (
        <div className="obs-starting-overlay">
          <div className="spinner-border text-warning obs-starting-spinner" role="status" />
          <span className="obs-starting-label">Starting evaluation...</span>
        </div>
      )}
      <div className="obs-header">
        <InlineEdit pageKey="obs-heading" defaultValue="Teaching Evaluation" canEdit={canEdit} tag="h1" className="obs-heading" />
        <p className="obs-subheading">Select a class below and start your observation</p>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="dnd-container">
          
          <div className="dnd-column">
            <div className="dnd-column-inner">
              <h3>
                <div className="dnd-col-left">
                  <JournalCheck size={14} />
                  <InlineEdit pageKey="obs-col-active" defaultValue="Active Observations" canEdit={canEdit} tag="span" />
                </div>
                <span className="column-count">
                  {loading ? '…' : (classSearch.trim() ? `${filteredActiveClasses.length}/${activeClasses.length}` : activeClasses.length)}
                </span>
              </h3>
              <div className="obs-search-wrap">
                <input
                  className="obs-search-input"
                  type="text"
                  placeholder="Search by class or instructor…"
                  value={classSearch}
                  onChange={e => setClassSearch(e.target.value)}
                />
                {classSearch && (
                  <button className="obs-search-clear" onClick={() => setClassSearch('')}>×</button>
                )}
              </div>
              <Droppable droppableId="active">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`class-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {loading && <p className="empty-msg">Loading classes…</p>}
                    {!loading && filteredActiveClasses.map((info) => (
                      <ClassCard
                        key={info.classId}
                        info={info}
                        index={activeClasses.indexOf(info)}
                        isSelected={selectedClassId === info.classId}
                        isDragDisabled={!!classSearch.trim()}
                      />
                    ))}
                    {provided.placeholder}
                    {!loading && filteredActiveClasses.length === 0 && (
                      <p className="empty-msg">
                        {classSearch.trim() ? 'No classes match your search' : 'No active observations available'}
                      </p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          <div className="dnd-column archive-column">
            <div className="dnd-column-inner">
              <h3>
                <div className="dnd-col-left">
                  <Archive size={14} />
                  <InlineEdit pageKey="obs-col-archive" defaultValue="Archived Sessions" canEdit={canEdit} tag="span" />
                </div>
                <span className="column-count">{loading ? '…' : archivedClasses.length}</span>
              </h3>
              <Droppable droppableId="archive">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`class-list archive-list ${snapshot.isDraggingOver ? 'dragging-over-archive' : ''}`}
                  >
                    {!loading && archivedClasses.map((info, index) => (
                      <ClassCard
                        key={info.classId}
                        info={info}
                        index={index}
                        isSelected={false}
                        isClickable={false}
                      />
                    ))}
                    {provided.placeholder}
                    {!loading && archivedClasses.length === 0 && <p className="empty-msg">Drop here to archive</p>}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

        </div>
      </DragDropContext>

      <div className="actions-area">
        {selectedClass && (
          <div className="selected-class-preview">
            <Book size={15} className="preview-icon" />
            <span className="preview-title">{selectedClass.title}</span>
            <span className="preview-divider">·</span>
            <span className="preview-instructor">
              {selectedClass.instructorFirstName} {selectedClass.instructorLastName}
            </span>
          </div>
        )}
        <ObsStartButton
          canEdit={canEdit}
          disabled={!selectedClassId || loading}
          onClick={handleStartObservation}
          starting={starting}
        />
      </div>
    </div>
  );
};

export default ObsHome;
