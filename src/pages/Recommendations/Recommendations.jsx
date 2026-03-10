import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Form, Collapse } from 'react-bootstrap';
import { Search, ChevronDown, ArrowLeft } from 'react-bootstrap-icons';
import SearchBar from '../../components/SearchBar/SearchBar';
import TextArea from '../../components/TextArea/TextArea';
import recommendationsMapping from '../../constants/recommendationsMapping';
import './Recommendations.css';

const Recommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { evaluationId, observerId, instructorId, classId, allObservations = [] } = location.state || {};

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
              selected: isSelectedByPrevStep || (storedOption?.selected ?? false),
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
        options: additionalSection.options.map(opt => ({ ...opt, selected: true, showFeedback: true }))
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
      <div className="container py-5">
        <div className="text-center mb-5">
          <h1 className="eval-page-heading">Possible Recommendations</h1>
          <p className="eval-page-subtext">Review and select based on observations</p>
        </div>
        <div className="search-container-v3 mb-4 mx-auto" style={{ maxWidth: '600px' }}>
          <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
        </div>
        <Form onSubmit={(e) => { e.preventDefault(); navigate('/report-viewer', { state: { evaluationId, observerId, instructorId, classId, allObservations, allRecommendations: responses } }); }}>
          <div className="eval-sections-wrapper" style={{ minHeight: '400px' }}>
            {filteredData.map((section) => {
              const sIdx = section.originalIdx !== undefined ? section.originalIdx : responses.findIndex(r => r.title === section.title);
              const isExpanded = openSections.includes(String(sIdx));
              const groups = section.options.reduce((acc, opt) => {
                const group = opt.observedDescription || 'General';
                if (!acc[group]) acc[group] = [];
                acc[group].push(opt);
                return acc;
              }, {});

              return (
                <Card key={section.title} className="eval-section-card border-0 mb-4 shadow-sm">
                  <Card.Header className={`eval-card-header d-flex align-items-center justify-content-between ${isExpanded ? 'active-header' : ''}`} onClick={() => setOpenSections(prev => prev.includes(String(sIdx)) ? prev.filter(k => k !== String(sIdx)) : [...prev, String(sIdx)])}>
                    <div className="d-flex align-items-center">
                      {getSectionNumber(section.title) && <div className="section-badge-circle me-3">{getSectionNumber(section.title)}</div>}
                      <h5 className="mb-0 eval-section-title">{normalizeTitle(section.title)}</h5>
                    </div>
                    <ChevronDown className={`chevron-icon ${isExpanded ? 'rotate-180' : ''}`} />
                  </Card.Header>
                  <Collapse in={isExpanded}>
                    <div>
                      <Card.Body className="eval-section-body p-4 pt-0">
                        {Object.entries(groups).map(([obs, opts]) => (
                          <div key={obs} className="mt-3">
                            {obs !== 'General' && normalizeTitle(section.title) !== 'Additional Feedback' && (
                              <div className="observation-subtitle-v3 mb-3">{obs}</div>
                            )}
                            {opts.map((opt) => {
                              const originalOptIdx = responses[sIdx].options.findIndex(o => o.description === opt.description);
                              return (
                                <div key={opt.description} className="eval-option-item">
                                  {normalizeTitle(section.title) === 'Additional Feedback' ? (
                                    <span className="fw-bold d-block mb-2">{opt.description}</span>
                                  ) : (
                                    <Form.Check type="checkbox" label={opt.description} checked={responses[sIdx].options[originalOptIdx].selected} onChange={() => {
                                      const updated = [...responses];
                                      updated[sIdx].options[originalOptIdx].selected = !updated[sIdx].options[originalOptIdx].selected;
                                      updated[sIdx].options[originalOptIdx].showFeedback = updated[sIdx].options[originalOptIdx].selected;
                                      updateState(updated);
                                    }} className="eval-custom-check mb-2" />
                                  )}
                                  {responses[sIdx].options[originalOptIdx].showFeedback && (
                                    <TextArea value={responses[sIdx].options[originalOptIdx].feedbackText} onChange={(e) => {
                                      const updated = [...responses];
                                      updated[sIdx].options[originalOptIdx].feedbackText = e.target.value;
                                      updateState(updated);
                                    }} />
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
            <Button onClick={() => navigate(-1)} className="eval-btn-secondary-v3">GO BACK</Button>
            <Button type="submit" className="eval-submit-btn-v3">SAVE AND VIEW REPORT</Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Recommendations;
