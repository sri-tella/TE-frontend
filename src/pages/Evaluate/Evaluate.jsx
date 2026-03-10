import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Form, Collapse } from 'react-bootstrap';
import { Search, ChevronDown } from 'react-bootstrap-icons';
import SearchBar from '../../components/SearchBar/SearchBar';
import TextArea from '../../components/TextArea/TextArea';
import { EVALUATION_SECTIONS } from '../../constants/evaluationSections';
import './Evaluate.css';

const Evaluate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { evaluationId, observerId, instructorId, classId } = location.state || {};

  const [responses, setResponses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [openSections, setOpenSections] = useState(() => {
    const saved = sessionStorage.getItem(`eval_open_${evaluationId}`);
    return saved ? JSON.parse(saved) : ['0'];
  });

  const normalizeTitle = (title) => title.replace(/^\d+\.\s*/, '');
  const getSectionNumber = (title) => {
    const match = title.match(/^(\d+)\./);
    return match ? match[1] : null;
  };

  useEffect(() => {
    if (evaluationId) {
      sessionStorage.setItem(`eval_open_${evaluationId}`, JSON.stringify(openSections));
    }
  }, [openSections, evaluationId]);

  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem(`eval_scroll_${evaluationId}`);
    if (savedScroll) {
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 100);
    }
    const handleScroll = () => {
      sessionStorage.setItem(`eval_scroll_${evaluationId}`, window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [evaluationId]);

  useEffect(() => {
    if (!evaluationId) {
      const storedData = JSON.parse(sessionStorage.getItem('currentEvaluation') || '{}');
      if (!storedData.evaluationId) { navigate('/obs-home'); return; }
    }
    const storedResponses = JSON.parse(localStorage.getItem(`responses_${evaluationId}`) || '[]');
    let initialResponses = EVALUATION_SECTIONS.map(section => {
      const normalized = normalizeTitle(section.title);
      const storedSection = storedResponses.find(res => normalizeTitle(res.title) === normalized) || {};
      return {
        title: section.title,
        options: section.options.map(option => {
          const storedOption = storedSection.options?.find(opt => opt.description === option.description);
          return {
            ...option,
            selected: storedOption?.selected || false,
            showFeedback: storedOption?.selected || false,
            feedbackText: storedOption?.feedbackText || ''
          };
        })
      };
    });
    const storedAdditional = storedResponses.find(res => normalizeTitle(res.title) === 'Additional Feedback');
    initialResponses.push({
      title: '9. Additional Feedback',
      options: [
        { description: "Did the class session meet the instructor's goal or objective?", feedbackText: storedAdditional?.options?.[0]?.feedbackText || '', selected: true, showFeedback: true },
        { description: "Other Comments or Recommendations", feedbackText: storedAdditional?.options?.[1]?.feedbackText || '', selected: true, showFeedback: true }
      ]
    });
    setResponses(initialResponses);
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
      <div className="container py-5">
        <div className="text-center mb-5">
          <h1 className="eval-page-heading">Teaching Evaluation Form</h1>
          <p className="eval-page-subtext">Search by criteria or your notes</p>
        </div>
        <div className="search-container-v3 mb-4 mx-auto" style={{maxWidth: '600px'}}>
          <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
        </div>
        <Form onSubmit={(e) => { e.preventDefault(); navigate('/recommendations', { state: { evaluationId, observerId, instructorId, classId, allObservations: responses } }); }}>
          <div className="eval-sections-wrapper" style={{ minHeight: '400px' }}>
            {filteredData.map((section) => {
              const sIdx = section.originalIdx !== undefined ? section.originalIdx : responses.findIndex(r => r.title === section.title);
              const isExpanded = openSections.includes(String(sIdx));
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
                        {section.options.map((option) => {
                          const oIdx = responses[sIdx].options.findIndex(o => o.description === option.description);
                          return (
                            <div key={option.description} className="eval-option-item mt-3">
                              {normalizeTitle(section.title) !== 'Additional Feedback' ? (
                                <Form.Check type="checkbox" label={option.description} checked={responses[sIdx].options[oIdx].selected} onChange={() => {
                                  const updated = [...responses];
                                  const item = updated[sIdx].options[oIdx];
                                  item.selected = !item.selected;
                                  item.showFeedback = item.selected;
                                  if (!item.selected) item.feedbackText = '';
                                  updateState(updated);
                                }} className="eval-custom-check mb-2" />
                              ) : (
                                <div className="fw-bold mb-2">{option.description}</div>
                              )}
                              {responses[sIdx].options[oIdx].showFeedback && (
                                <TextArea value={responses[sIdx].options[oIdx].feedbackText} onChange={(e) => {
                                  const updated = [...responses];
                                  updated[sIdx].options[oIdx].feedbackText = e.target.value;
                                  updateState(updated);
                                }} />
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
            {filteredData.length === 0 && <div className="text-center text-white p-5"><h3>No matches found</h3><Button variant="link" className="text-warning" onClick={() => setSearchQuery('')}>Clear Search</Button></div>}
          </div>
          <div className="eval-action-footer-container"><Button type="submit" className="eval-submit-btn-v3">SAVE AND CONTINUE</Button></div>
        </Form>
      </div>
    </div>
  );
};

export default Evaluate;
