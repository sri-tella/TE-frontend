import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressStepper from '../../components/ProgressStepper/ProgressStepper.jsx';
import { useSaveIndicator } from '../../hooks/useSaveIndicator';
import { Card, Button, Form, Collapse } from 'react-bootstrap';
import { ChevronDown } from 'react-bootstrap-icons';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import TextArea from '../../components/TextArea/TextArea.jsx';
import ActivityLog from '../../components/ActivityLog/ActivityLog.jsx';
import SectionText from '../../components/SectionText/SectionText.jsx';
import { useRoles } from '../../hooks/useRoles';
import { useEditableMapping } from '../../hooks/useEditableMapping.js';
import { useEditableSections } from '../../hooks/useEditableSections.js';
import { useEvalPageState } from '../../hooks/useEvalPageState';
import { storageKeys } from '../../utils/storageKeys';
import recommendationsMapping from '../../constants/recommendationsMapping';
import InlineEdit from '../../components/InlineEdit/InlineEdit.jsx';
import EditableButton from '../../components/InlineEdit/EditableButton.jsx';
import './Recommendations.css';

const Recommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canEdit } = useRoles();
  const { evaluationId, observerId, instructorId, classId, allObservations: stateObs } = location.state || {};

  const { mapping, saveSectionTitle, saveRecommendation } = useEditableMapping();
  const { sections: evalSections, saveOptionDescription: saveEvalOption, saveSectionTitle: saveEvalTitle } = useEditableSections();
  const additionalFeedbackSection = evalSections[evalSections.length - 1];
  const additionalFeedbackIdx = evalSections.length - 1;

  const allObservations = useMemo(() => {
    if (stateObs && stateObs.length > 0) return stateObs;
    if (evaluationId) {
      return JSON.parse(localStorage.getItem(storageKeys.evalResponses(evaluationId)) || '[]');
    }
    return [];
  }, [stateObs, evaluationId]);

  const normalizeTitle = (title) => title.replace(/^\d+\.\s*/, '');

  const [responses, setResponses] = useState(() => {
    if (!evaluationId) return [];
    const storedData = JSON.parse(localStorage.getItem(storageKeys.recsData(evaluationId)) || '[]');

    const initial = Object.entries(recommendationsMapping).map(([sectionTitle, recGroups]) => {
      const normalized = normalizeTitle(sectionTitle);
      const storedSection = storedData.find(res => normalizeTitle(res.title) === normalized) || {};

      return {
        title: sectionTitle,
        options: Object.entries(recGroups).flatMap(([observation, recommendations]) =>
          recommendations.map(recommendation => {
            const matchedObs = allObservations.flatMap(s => s.options).find(o => o.description === observation);
            const storedOption = storedSection.options?.find(opt => opt.description === recommendation);
            const obsSelected = matchedObs?.selected ?? false;
            return {
              description: recommendation,
              observedDescription: observation,
              selected: storedOption?.selected ?? obsSelected,
              showFeedback: storedOption?.selected ?? obsSelected,
              feedbackText: storedOption?.feedbackText || ''
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

  const { saved, flash } = useSaveIndicator();

  const { searchQuery, setSearchQuery, openSections, toggleSection, filteredData } = useEvalPageState({
    evaluationId,
    responses,
    storagePrefix: 'recs',
  });

  useEffect(() => {
    if (!evaluationId) navigate('/obs-home');
  }, [evaluationId, navigate]);

  const updateState = (updated) => {
    setResponses(updated);
    localStorage.setItem(storageKeys.recsData(evaluationId), JSON.stringify(updated));
    flash();
  };

  return (
    <div id="recommendations-container-v3">
      <ActivityLog />
      <div className="container py-5">
        <ProgressStepper currentStep={2} />
        <div className="text-center mb-5">
          <InlineEdit pageKey="recommendations-title" defaultValue="Possible Recommendations" canEdit={canEdit} tag="h1" className="eval-page-heading" />
          <InlineEdit pageKey="recommendations-subtitle" defaultValue="Review and select based on observations" canEdit={canEdit} tag="p" className="eval-page-subtext" />
        </div>
        <div className="search-container-v3 mb-4 mx-auto" style={{ maxWidth: '600px' }}>
          <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
        </div>
        <Form onSubmit={(e) => {
          e.preventDefault();
          navigate('/report-viewer', { state: { evaluationId, observerId, instructorId, classId, allObservations, allRecommendations: responses } });
        }}>
          <div className="eval-sections-wrapper" style={{ minHeight: '400px' }}>
            {filteredData.map((section) => {
              const sIdx = section.originalIdx !== undefined
                ? section.originalIdx
                : responses.findIndex(r => r.title === section.title);
              const isExpanded = openSections.includes(String(sIdx));
              const isAdditional = normalizeTitle(section.title) === 'Additional Feedback';
              const mappingSection = mapping[sIdx];

              const groups = section.options.reduce((acc, opt) => {
                const group = opt.observedDescription || 'General';
                if (!acc[group]) acc[group] = [];
                acc[group].push(opt);
                return acc;
              }, {});

              const sectionTitle = isAdditional
                ? (additionalFeedbackSection ? normalizeTitle(additionalFeedbackSection.title) : 'Additional Feedback')
                : (evalSections[sIdx] ? normalizeTitle(evalSections[sIdx].title) : normalizeTitle(section.title));

              return (
                <Card key={section.title} className="eval-section-card border-0 mb-4 shadow-sm">
                  <Card.Header
                    className={`eval-card-header d-flex align-items-center justify-content-between ${isExpanded ? 'active-header' : ''}`}
                    onClick={() => toggleSection(sIdx)}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <div className="section-badge-circle me-3">{sIdx + 1}</div>
                      <SectionText
                        key={sectionTitle}
                        value={sectionTitle}
                        onSave={val => isAdditional
                          ? saveEvalTitle(additionalFeedbackIdx, `9. ${val}`)
                          : saveEvalTitle(sIdx, `${sIdx + 1}. ${val}`)
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
                                          const item = updated[sIdx].options[originalOptIdx];
                                          item.selected = !item.selected;
                                          item.showFeedback = item.selected;
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
            {filteredData.length === 0 && responses.length > 0 && (
              <div className="text-center text-white p-5">
                <h3>No matches found</h3>
                <Button variant="link" className="text-warning" onClick={() => setSearchQuery('')}>Clear Search</Button>
              </div>
            )}
          </div>
          <div className="eval-action-footer-container">
            <span className={`autosave-indicator ${saved ? 'visible' : ''}`}>✓ Draft saved</span>
            <EditableButton pageKey="recommendations-btn-back" defaultValue="GO BACK" canEdit={canEdit} className="eval-btn-secondary-v3" onClick={() => navigate(-1)} />
            <EditableButton pageKey="recommendations-btn-submit" defaultValue="SAVE AND VIEW REPORT" canEdit={canEdit} type="submit" className="eval-submit-btn-v3" />
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Recommendations;
