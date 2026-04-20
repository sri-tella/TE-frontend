import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Form, Collapse } from 'react-bootstrap';
import { ChevronDown, PencilSquare, CheckCircle, XCircle } from 'react-bootstrap-icons';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import TextArea from '../../components/TextArea/TextArea.jsx';
import ActivityLog from '../../components/ActivityLog/ActivityLog.jsx';
import { useEvaluationStore } from '../../store/evaluationStore';
import { useAuthStore } from '../../store/authStore';
import { useEditableSections, buildDefaultSections } from '../../hooks/useEditableSections.js';
import InlineEdit from '../../components/InlineEdit/InlineEdit.jsx';
import EditableButton from '../../components/InlineEdit/EditableButton.jsx';
import './Evaluate.css';

// Inline editable text with pencil icon — no separate DB save per field
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
        onKeyDown={e => { if (e.key === 'Enter') { onSave(draft); setEditing(false); } if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
      />
      <button type="button" className="ie-btn-icon" onClick={e => { e.stopPropagation(); onSave(draft); setEditing(false); }}><CheckCircle /></button>
      <button type="button" className="ie-btn-icon cancel" onClick={e => { e.stopPropagation(); setDraft(value); setEditing(false); }}><XCircle /></button>
    </span>
  );

  return (
    <span className="section-text-view" onClick={e => e.stopPropagation()}>
      <Tag className={className}>{value}</Tag>
      <button type="button" className="btn-inline-edit" onClick={e => { e.stopPropagation(); setEditing(true); }}><PencilSquare /></button>
    </span>
  );
};

const Evaluate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearLog } = useEvaluationStore();
  const { user } = useAuthStore();
  const { evaluationId, observerId, instructorId, classId } = location.state || {};
  const roles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
  const canEdit = roles.includes('ADMIN') || !!user?.canEditContent;

  const { sections, saveSectionTitle, saveOptionDescription } = useEditableSections();

  useEffect(() => {
    if (evaluationId) clearLog();
  }, [evaluationId, clearLog]);

  const normalizeTitle = (title) => title.replace(/^\d+\.\s*/, '');
  const getSectionNumber = (title) => {
    const match = title.match(/^(\d+)\./);
    return match ? match[1] : null;
  };

  const [responses, setResponses] = useState(() => {
    const defaults = buildDefaultSections();
    const storedResponses = JSON.parse(localStorage.getItem(`responses_${evaluationId}`) || '[]');
    return defaults.map(section => {
      const normalized = normalizeTitle(section.title);
      const storedSection = storedResponses.find(res => normalizeTitle(res.title) === normalized) || {};
      const isAdditional = normalized === 'Additional Feedback';
      return {
        title: section.title,
        options: section.options.map((option, idx) => {
          const storedOption = storedSection.options?.find(opt => opt.description === option.description);
          return {
            ...option,
            selected: isAdditional ? !!storedSection.options?.[idx]?.feedbackText : (storedOption?.selected || false),
            showFeedback: isAdditional ? true : (storedOption?.selected || false),
            feedbackText: isAdditional ? (storedSection.options?.[idx]?.feedbackText || '') : (storedOption?.feedbackText || '')
          };
        })
      };
    });
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState(() => {
    const saved = sessionStorage.getItem(`eval_open_${evaluationId}`);
    return saved ? JSON.parse(saved) : ['0'];
  });

  useEffect(() => {
    if (evaluationId) sessionStorage.setItem(`eval_open_${evaluationId}`, JSON.stringify(openSections));
  }, [openSections, evaluationId]);

  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem(`eval_scroll_${evaluationId}`);
    if (savedScroll) requestAnimationFrame(() => window.scrollTo(0, parseInt(savedScroll)));
    const handleScroll = () => sessionStorage.setItem(`eval_scroll_${evaluationId}`, window.scrollY.toString());
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [evaluationId]);

  useEffect(() => {
    if (!evaluationId) navigate('/obs-home');
  }, [evaluationId, navigate]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return responses;
    const lowerQuery = searchQuery.toLowerCase();
    return responses.map((section, idx) => {
      const titleMatch = section.title.toLowerCase().includes(lowerQuery);
      const matchingOptions = section.options.filter(opt =>
        titleMatch || opt.description.toLowerCase().includes(lowerQuery) || (opt.feedbackText || '').toLowerCase().includes(lowerQuery)
      );
      return matchingOptions.length > 0 ? { ...section, originalIdx: idx, options: matchingOptions } : null;
    }).filter(Boolean);
  }, [responses, searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const lowerQuery = searchQuery.toLowerCase();
    const indicesToOpen = responses.reduce((acc, section, idx) => {
      const hasMatch = section.title.toLowerCase().includes(lowerQuery) ||
        section.options.some(o => o.description.toLowerCase().includes(lowerQuery) || (o.feedbackText || '').toLowerCase().includes(lowerQuery));
      if (hasMatch) acc.push(String(idx));
      return acc;
    }, []);
    if (indicesToOpen.length > 0) setOpenSections(prev => Array.from(new Set([...prev, ...indicesToOpen])));
  }, [searchQuery, responses]);

  const updateState = (updated) => {
    setResponses(updated);
    localStorage.setItem(`responses_${evaluationId}`, JSON.stringify(updated));
  };

  return (
    <div id="evaluation-container-v3">
      <ActivityLog />
      <div className="container py-5">
        <div className="text-center mb-5">
          <InlineEdit pageKey="evaluate-title" defaultValue="Teaching Evaluation Form" canEdit={canEdit} tag="h1" className="eval-page-heading" />
          <InlineEdit pageKey="evaluate-subtitle" defaultValue="Search by criteria or your notes" canEdit={canEdit} tag="p" className="eval-page-subtext" />
        </div>
        <div className="search-container-v3 mb-4 mx-auto" style={{ maxWidth: '600px' }}>
          <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
        </div>
        <Form onSubmit={(e) => { e.preventDefault(); navigate('/recommendations', { state: { evaluationId, observerId, instructorId, classId, allObservations: responses } }); }}>
          <div className="eval-sections-wrapper" style={{ minHeight: '400px' }}>
            {filteredData.map((section) => {
              const sIdx = section.originalIdx !== undefined ? section.originalIdx : responses.findIndex(r => r.title === section.title);
              const isExpanded = openSections.includes(String(sIdx));
              // sections and responses share the same order from buildDefaultSections()
              const sectionInSections = sIdx;
              const isAdditional = normalizeTitle(section.title) === 'Additional Feedback';

              return (
                <Card key={section.title} className="eval-section-card border-0 mb-4 shadow-sm">
                  <Card.Header
                    className={`eval-card-header d-flex align-items-center justify-content-between ${isExpanded ? 'active-header' : ''}`}
                    onClick={() => setOpenSections(prev => prev.includes(String(sIdx)) ? prev.filter(k => k !== String(sIdx)) : [...prev, String(sIdx)])}
                  >
                    <div className="d-flex align-items-center gap-2">
                      {getSectionNumber(section.title) && <div className="section-badge-circle">{getSectionNumber(section.title)}</div>}
                      {(() => {
                        const titleVal = sections[sectionInSections] ? normalizeTitle(sections[sectionInSections].title) : normalizeTitle(section.title);
                        return (
                          <SectionText
                            key={titleVal}
                            value={titleVal}
                            onSave={val => saveSectionTitle(sectionInSections, `${getSectionNumber(section.title) ? getSectionNumber(section.title) + '. ' : ''}${val}`)}
                            canEdit={canEdit}
                            as="h5"
                            className="mb-0 eval-section-title"
                          />
                        );
                      })()}
                    </div>
                    <ChevronDown className={`chevron-icon ${isExpanded ? 'rotate-180' : ''}`} />
                  </Card.Header>
                  <Collapse in={isExpanded}>
                    <div>
                      <Card.Body className="eval-section-body p-4 pt-0">
                        {section.options.map((option, optDisplayIdx) => {
                          const oIdx = responses[sIdx]?.options.findIndex(o => o.description === option.description);
                          // Use oIdx as position in sections too — same order as buildDefaultSections
                          const secOptIdx = oIdx >= 0 ? oIdx : optDisplayIdx;
                          const currentDesc = (sectionInSections >= 0 && sections[sectionInSections]?.options[secOptIdx])
                            ? sections[sectionInSections].options[secOptIdx].description
                            : option.description;

                          return (
                            <div key={option.description} className="eval-option-item mt-3">
                              {!isAdditional ? (
                                <div className="d-flex align-items-center gap-2">
                                  <Form.Check
                                    type="checkbox"
                                    checked={responses[sIdx]?.options[oIdx]?.selected || false}
                                    onChange={() => {
                                      const updated = [...responses];
                                      const item = updated[sIdx].options[oIdx];
                                      item.selected = !item.selected;
                                      item.showFeedback = item.selected;
                                      if (!item.selected) item.feedbackText = '';
                                      updateState(updated);
                                    }}
                                    className="eval-custom-check mb-0 flex-shrink-0"
                                  />
                                  <SectionText
                                    key={currentDesc}
                                    value={currentDesc}
                                    onSave={val => saveOptionDescription(sectionInSections, secOptIdx, val)}
                                    canEdit={canEdit}
                                  />
                                </div>
                              ) : (
                                <div className="fw-bold mb-2 d-flex align-items-center gap-2">
                                  <SectionText
                                    key={currentDesc}
                                    value={currentDesc}
                                    onSave={val => saveOptionDescription(sectionInSections, secOptIdx, val)}
                                    canEdit={canEdit}
                                  />
                                </div>
                              )}
                              {responses[sIdx]?.options[oIdx]?.showFeedback && (
                                <TextArea
                                  value={responses[sIdx].options[oIdx].feedbackText}
                                  placeholder="Add additional comments or examples here"
                                  onChange={(e) => {
                                    const updated = [...responses];
                                    updated[sIdx].options[oIdx].feedbackText = e.target.value;
                                    updateState(updated);
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </Card.Body>
                    </div>
                  </Collapse>
                </Card>
              );
            })}
            {filteredData.length === 0 && (
              <div className="text-center text-white p-5">
                <h3>No matches found</h3>
                <Button variant="link" className="text-warning" onClick={() => setSearchQuery('')}>Clear Search</Button>
              </div>
            )}
          </div>
          <div className="eval-action-footer-container">
            <EditableButton pageKey="evaluate-btn-submit" defaultValue="SAVE AND CONTINUE" canEdit={canEdit} type="submit" className="eval-submit-btn-v3" />
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Evaluate;
