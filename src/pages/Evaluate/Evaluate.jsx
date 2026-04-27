import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressStepper from '../../components/ProgressStepper/ProgressStepper.jsx';
import { useSaveIndicator } from '../../hooks/useSaveIndicator';
import { Card, Button, Form, Collapse } from 'react-bootstrap';
import { ChevronDown } from 'react-bootstrap-icons';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import TextArea from '../../components/TextArea/TextArea.jsx';
import ActivityLog from '../../components/ActivityLog/ActivityLog.jsx';
import SectionText from '../../components/SectionText/SectionText.jsx';
import { useEvaluationStore } from '../../store/evaluationStore';
import { useRoles } from '../../hooks/useRoles';
import { useEditableSections, buildDefaultSections } from '../../hooks/useEditableSections.js';
import { useEvalPageState } from '../../hooks/useEvalPageState';
import { storageKeys } from '../../utils/storageKeys';
import InlineEdit from '../../components/InlineEdit/InlineEdit.jsx';
import EditableButton from '../../components/InlineEdit/EditableButton.jsx';
import './Evaluate.css';

const Evaluate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearLog } = useEvaluationStore();
  const { canEdit } = useRoles();
  const { evaluationId, observerId, instructorId, classId } = location.state || {};

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
    const storedResponses = JSON.parse(localStorage.getItem(storageKeys.evalResponses(evaluationId)) || '[]');
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

  const { saved, flash } = useSaveIndicator();

  const { searchQuery, setSearchQuery, openSections, toggleSection, filteredData } = useEvalPageState({
    evaluationId,
    responses,
    storagePrefix: 'eval',
  });

  useEffect(() => {
    if (!evaluationId) navigate('/obs-home');
  }, [evaluationId, navigate]);

  const updateState = (updated) => {
    setResponses(updated);
    localStorage.setItem(storageKeys.evalResponses(evaluationId), JSON.stringify(updated));
    flash();
  };

  return (
    <div id="evaluation-container-v3">
      <ActivityLog />
      <div className="container py-5">
        <ProgressStepper currentStep={1} />
        <div className="text-center mb-5">
          <InlineEdit pageKey="evaluate-title" defaultValue="Teaching Evaluation Form" canEdit={canEdit} tag="h1" className="eval-page-heading" />
          <InlineEdit pageKey="evaluate-subtitle" defaultValue="Search by criteria or your notes" canEdit={canEdit} tag="p" className="eval-page-subtext" />
        </div>
        <div className="search-container-v3 mb-4 mx-auto" style={{ maxWidth: '600px' }}>
          <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
        </div>
        <Form onSubmit={(e) => {
          e.preventDefault();
          navigate('/recommendations', { state: { evaluationId, observerId, instructorId, classId, allObservations: responses } });
        }}>
          <div className="eval-sections-wrapper" style={{ minHeight: '400px' }}>
            {filteredData.map((section) => {
              const sIdx = section.originalIdx !== undefined
                ? section.originalIdx
                : responses.findIndex(r => r.title === section.title);
              const isExpanded = openSections.includes(String(sIdx));
              const isAdditional = normalizeTitle(section.title) === 'Additional Feedback';

              return (
                <Card key={section.title} className="eval-section-card border-0 mb-4 shadow-sm">
                  <Card.Header
                    className={`eval-card-header d-flex align-items-center justify-content-between ${isExpanded ? 'active-header' : ''}`}
                    onClick={() => toggleSection(sIdx)}
                  >
                    <div className="d-flex align-items-center gap-2">
                      {getSectionNumber(section.title) && (
                        <div className="section-badge-circle">{getSectionNumber(section.title)}</div>
                      )}
                      {(() => {
                        const titleVal = sections[sIdx]
                          ? normalizeTitle(sections[sIdx].title)
                          : normalizeTitle(section.title);
                        return (
                          <SectionText
                            key={titleVal}
                            value={titleVal}
                            onSave={val => saveSectionTitle(sIdx, `${getSectionNumber(section.title) ? getSectionNumber(section.title) + '. ' : ''}${val}`)}
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
                          const secOptIdx = oIdx >= 0 ? oIdx : optDisplayIdx;
                          const currentDesc = (sIdx >= 0 && sections[sIdx]?.options[secOptIdx])
                            ? sections[sIdx].options[secOptIdx].description
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
                                    onSave={val => saveOptionDescription(sIdx, secOptIdx, val)}
                                    canEdit={canEdit}
                                  />
                                </div>
                              ) : (
                                <div className="fw-bold mb-2 d-flex align-items-center gap-2">
                                  <SectionText
                                    key={currentDesc}
                                    value={currentDesc}
                                    onSave={val => saveOptionDescription(sIdx, secOptIdx, val)}
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
            <span className={`autosave-indicator ${saved ? 'visible' : ''}`}>✓ Draft saved</span>
            <EditableButton pageKey="evaluate-btn-submit" defaultValue="SAVE AND CONTINUE" canEdit={canEdit} type="submit" className="eval-submit-btn-v3" />
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Evaluate;
