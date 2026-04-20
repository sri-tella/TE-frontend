import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Form, Collapse } from 'react-bootstrap';
import { ChevronDown, PencilSquare, CheckCircle, XCircle } from 'react-bootstrap-icons';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import TextArea from '../../components/TextArea/TextArea.jsx';
import ActivityLog from '../../components/ActivityLog/ActivityLog.jsx';
import { useAuthStore } from '../../store/authStore';
import { useEditableMapping } from '../../hooks/useEditableMapping.js';
import { useEditableSections } from '../../hooks/useEditableSections.js';
import recommendationsMapping from '../../constants/recommendationsMapping';
import InlineEdit from '../../components/InlineEdit/InlineEdit.jsx';
import EditableButton from '../../components/InlineEdit/EditableButton.jsx';
import './Recommendations.css';

const SectionText = ({ value, onSave, canEdit, className, as: Tag = 'span' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);

  if (!canEdit) return <Tag className={className}>{value}</Tag>;
  if (editing) return (
    <span className="section-text-edit" onClick={e => e.stopPropagation()}>
      <input className="eval-inline-input" value={draft} onChange={e => setDraft(e.target.value)} autoFocus
        onKeyDown={e => { if (e.key === 'Enter') { onSave(draft); setEditing(false); } if (e.key === 'Escape') { setDraft(value); setEditing(false); } }} />
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

const Recommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { evaluationId, observerId, instructorId, classId, allObservations: stateObs } = location.state || {};
  const roles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
  const canEdit = roles.includes('ADMIN') || !!user?.canEditContent;
  const { mapping, saveSectionTitle, saveRecommendation } = useEditableMapping();
  // Additional Feedback texts live in evaluate-sections-data (last section, index 8)
  const { sections: evalSections, saveOptionDescription: saveEvalOption, saveSectionTitle: saveEvalTitle } = useEditableSections();
  const additionalFeedbackSection = evalSections[evalSections.length - 1];
  const additionalFeedbackIdx = evalSections.length - 1;

  const allObservations = useMemo(() => {
    if (stateObs && stateObs.length > 0) return stateObs;
    if (evaluationId) {
      return JSON.parse(localStorage.getItem(`responses_${evaluationId}`) || '[]');
    }
    return [];
  }, [stateObs, evaluationId]);

  const normalizeTitle = (title) => title.replace(/^\d+\.\s*/, '');
  const getSectionNumber = (title) => {
    const match = title.match(/^(\d+)\./);
    return match ? match[1] : null;
  };

  // IMMEDIATE INITIALIZATION TO PREVENT BLINKING
  const [responses, setResponses] = useState(() => {
    if (!evaluationId) return [];
    const storedData = JSON.parse(localStorage.getItem(`recs_${evaluationId}`) || '[]');
    
    let initial = Object.entries(recommendationsMapping).map(([sectionTitle, recGroups]) => {
      const normalized = normalizeTitle(sectionTitle);
      const storedSection = storedData.find(res => normalizeTitle(res.title) === normalized) || {};
      
      return {
        title: sectionTitle,
        options: Object.entries(recGroups).flatMap(([observation, recommendations]) => 
          recommendations.map(recommendation => {
            const matchedObs = allObservations.flatMap(s => s.options).find(o => o.description === observation);
            const isSelectedByPrevStep = matchedObs?.selected || false;
            const storedOption = storedSection.options?.find(opt => opt.description === recommendation);
            
            return {
              description: recommendation,
              observedDescription: observation,
              selected: storedOption?.selected ?? isSelectedByPrevStep,
              showFeedback: isSelectedByPrevStep || (storedOption?.selected ?? false),
              feedbackText: storedOption?.feedbackText || (isSelectedByPrevStep ? (matchedObs?.feedbackText || '') : '')
            };
          })
        )
      };
    });

    const additionalSection = allObservations.find(s => normalizeTitle(s.title) === 'Additional Feedback');
    if (additionalSection) {
      initial.push({
        title: '9. Additional Feedback',
        options: additionalSection.options.map(opt => ({ 
          ...opt, 
          selected: !!opt.feedbackText?.trim(), 
          showFeedback: true 
        }))
      });
    }
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState(() => {
    const saved = sessionStorage.getItem(`recs_open_${evaluationId}`);
    return saved ? JSON.parse(saved) : ['0'];
  });

  useEffect(() => {
    if (!evaluationId) navigate('/obs-home');
  }, [evaluationId, navigate]);

  useEffect(() => {
    if (evaluationId) {
      sessionStorage.setItem(`recs_open_${evaluationId}`, JSON.stringify(openSections));
    }
  }, [openSections, evaluationId]);

  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem(`recs_scroll_${evaluationId}`);
    if (savedScroll) {
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 10);
    }
    const handleScroll = () => {
      sessionStorage.setItem(`recs_scroll_${evaluationId}`, window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [evaluationId]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return responses;
    const lowerQuery = searchQuery.toLowerCase();
    return responses.map((section, idx) => {
      const titleMatches = section.title.toLowerCase().includes(lowerQuery);
      const matchingOptions = section.options.filter(o => 
        titleMatches || o.description.toLowerCase().includes(lowerQuery) || (o.observedDescription || '').toLowerCase().includes(lowerQuery) || (o.feedbackText || '').toLowerCase().includes(lowerQuery)
      );
      return matchingOptions.length > 0 ? { ...section, originalIdx: idx, options: matchingOptions } : null;
    }).filter(Boolean);
  }, [responses, searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const lowerQuery = searchQuery.toLowerCase();
    const indicesToOpen = responses.reduce((acc, section, idx) => {
      const hasMatch = section.title.toLowerCase().includes(lowerQuery) || 
                       section.options.some(o => o.description.toLowerCase().includes(lowerQuery) || (o.observedDescription || '').toLowerCase().includes(lowerQuery) || (o.feedbackText || '').toLowerCase().includes(lowerQuery));
      if (hasMatch) acc.push(String(idx));
      return acc;
    }, []);
    if (indicesToOpen.length > 0) setOpenSections(prev => Array.from(new Set([...prev, ...indicesToOpen])));
  }, [searchQuery, responses]);

  const updateState = (updated) => {
    setResponses(updated);
    localStorage.setItem(`recs_${evaluationId}`, JSON.stringify(updated));
  };

  return (
    <div id="recommendations-container-v3">
      <ActivityLog />
      <div className="container py-5">
        <div className="text-center mb-5">
          <InlineEdit pageKey="recommendations-title" defaultValue="Possible Recommendations" canEdit={canEdit} tag="h1" className="eval-page-heading" />
          <InlineEdit pageKey="recommendations-subtitle" defaultValue="Review and select based on observations" canEdit={canEdit} tag="p" className="eval-page-subtext" />
        </div>
        <div className="search-container-v3 mb-4 mx-auto" style={{ maxWidth: '600px' }}>
          <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
        </div>
        <Form onSubmit={(e) => { e.preventDefault(); navigate('/report-viewer', { state: { evaluationId, observerId, instructorId, classId, allObservations, allRecommendations: responses } }); }}>
          <div className="eval-sections-wrapper" style={{ minHeight: '400px' }}>
            {filteredData.map((section) => {
              const sIdx = section.originalIdx !== undefined ? section.originalIdx : responses.findIndex(r => r.title === section.title);
              const isExpanded = openSections.includes(String(sIdx));
              const isAdditional = normalizeTitle(section.title) === 'Additional Feedback';
              // mapping index matches responses index (same order)
              const mappingSection = mapping[sIdx];
              const groups = section.options.reduce((acc, opt) => {
                const group = opt.observedDescription || 'General';
                if (!acc[group]) acc[group] = [];
                acc[group].push(opt);
                return acc;
              }, {});

              const sectionTitle = isAdditional
                ? (additionalFeedbackSection ? normalizeTitle(additionalFeedbackSection.title) : 'Additional Feedback')
                : (mappingSection ? mappingSection.title : normalizeTitle(section.title));

              return (
                <Card key={section.title} className="eval-section-card border-0 mb-4 shadow-sm">
                  <Card.Header className={`eval-card-header d-flex align-items-center justify-content-between ${isExpanded ? 'active-header' : ''}`} onClick={() => setOpenSections(prev => prev.includes(String(sIdx)) ? prev.filter(k => k !== String(sIdx)) : [...prev, String(sIdx)])}>
                    <div className="d-flex align-items-center gap-2">
                      {getSectionNumber(section.title) && <div className="section-badge-circle me-3">{getSectionNumber(section.title)}</div>}
                      <SectionText
                        key={sectionTitle}
                        value={sectionTitle}
                        onSave={val => isAdditional
                          ? saveEvalTitle(additionalFeedbackIdx, `9. ${val}`)
                          : saveSectionTitle(sIdx, val)
                        }
                        canEdit={canEdit}
                        as="h5"
                        className="mb-0 eval-section-title"
                      />
                    </div>
                    <ChevronDown className={`chevron-icon ${isExpanded ? 'rotate-180' : ''}`} />
                  </Card.Header>
                  <Collapse in={isExpanded}>
                    <div>
                      <Card.Body className="eval-section-body p-4 pt-0">
                        {Object.entries(groups).map(([obs, opts], gIdx) => (
                          <div key={obs} className="mt-3">
                            {obs !== 'General' && !isAdditional && (
                              <div className="observation-subtitle-v3 mb-3">{obs}</div>
                            )}
                            {opts.map((opt, rIdx) => {
                              const originalOptIdx = responses[sIdx].options.findIndex(o => o.description === opt.description);
                              const mappingRec = mappingSection?.groups?.[gIdx]?.recommendations?.[rIdx];
                              const evalOpt = additionalFeedbackSection?.options?.[rIdx];
                              const recText = isAdditional
                                ? (evalOpt?.description || opt.description)
                                : (mappingRec ? mappingRec.text : opt.description);

                              return (
                                <div key={opt.description} className="eval-option-item">
                                  {isAdditional ? (
                                    <div className="fw-bold mb-2 d-flex align-items-center gap-2">
                                      <SectionText
                                        key={recText}
                                        value={recText}
                                        onSave={val => saveEvalOption(additionalFeedbackIdx, rIdx, val)}
                                        canEdit={canEdit}
                                      />
                                    </div>
                                  ) : (
                                    <div className="d-flex align-items-center gap-2">
                                      <Form.Check
                                        type="checkbox"
                                        checked={responses[sIdx].options[originalOptIdx]?.selected || false}
                                        onChange={() => {
                                          const updated = [...responses];
                                          updated[sIdx].options[originalOptIdx].selected = !updated[sIdx].options[originalOptIdx].selected;
                                          updated[sIdx].options[originalOptIdx].showFeedback = updated[sIdx].options[originalOptIdx].selected;
                                          updateState(updated);
                                        }}
                                        className="eval-custom-check mb-0 flex-shrink-0"
                                      />
                                      <SectionText
                                        key={recText}
                                        value={recText}
                                        onSave={val => saveRecommendation(sIdx, gIdx, rIdx, val)}
                                        canEdit={canEdit && !!mappingSection}
                                      />
                                    </div>
                                  )}
                                  {responses[sIdx].options[originalOptIdx]?.showFeedback && (
                                    <TextArea
                                      value={responses[sIdx].options[originalOptIdx].feedbackText}
                                      placeholder="Add additional comments or examples here"
                                      onChange={(e) => {
                                        const updated = [...responses];
                                        updated[sIdx].options[originalOptIdx].feedbackText = e.target.value;
                                        updateState(updated);
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </Card.Body>
                    </div>
                  </Collapse>
                </Card>
              );
            })}
            {filteredData.length === 0 && responses.length > 0 && <div className="text-center text-white p-5"><h3>No matches found</h3><Button variant="link" className="text-warning" onClick={() => setSearchQuery('')}>Clear Search</Button></div>}
          </div>
          <div className="eval-action-footer-container">
            <EditableButton pageKey="recommendations-btn-back" defaultValue="GO BACK" canEdit={canEdit} className="eval-btn-secondary-v3" onClick={() => navigate(-1)} />
            <EditableButton pageKey="recommendations-btn-submit" defaultValue="SAVE AND VIEW REPORT" canEdit={canEdit} type="submit" className="eval-submit-btn-v3" />
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Recommendations;
