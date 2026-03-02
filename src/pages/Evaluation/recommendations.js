import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Form, Collapse } from 'react-bootstrap';
import { Search, ChevronDown, ArrowLeft } from 'react-bootstrap-icons';
import Header from '../../components/Header/header';
import SearchBar from '../../components/Searchbar/searchbar';
import recommendationsMapping from './recommendationsMapping';
import TextArea from '../../components/Textarea/textarea';
import './mainform.css';

const SelectedRecommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const normalizeTitle = (title) => title.replace(/^\d+\.\s*/, '');
  const getSectionNumber = (title) => {
    const match = title.match(/^(\d+)\./);
    return match ? match[1] : null;
  };

  const [responses, setResponses] = useState(() => {
    const { selectedOptions = [] } = location.state || { selectedOptions: [] };
    const isFreshStart = selectedOptions.length > 0;
    const storedResponses = isFreshStart ? [] : JSON.parse(localStorage.getItem('selectedRecommendations') || '[]');
    
    const goalFeedback = selectedOptions.find(opt => opt.description === "Did the class session meet the instructor's goal or objective?")?.feedbackText || 
                         selectedOptions.find(opt => opt.sectionTitle === 'Additional Feedback')?.feedbackText || '';
    const otherFeedback = selectedOptions.find(opt => opt.description === "Other Comments or Recommendations")?.feedbackText || '';

    let initialResponses = Object.entries(recommendationsMapping).map(([sectionTitle, recGroups]) => {
      const normalized = normalizeTitle(sectionTitle);
      const storedSection = storedResponses.find(res => normalizeTitle(res.title) === normalized) || {};
      
      return {
        title: sectionTitle,
        options: Object.entries(recGroups).flatMap(([observation, recommendations]) => 
          recommendations.map(recommendation => {
            const matchedObservation = selectedOptions.find(opt => opt.description === observation && opt.selected);
            const isSelectedByObservation = !!matchedObservation;
            const storedOption = storedSection.options?.find(opt => opt.description === recommendation);
            
            return {
              description: recommendation,
              observedDescription: observation,
              selected: isSelectedByObservation || (storedOption?.selected ?? false),
              showFeedback: isSelectedByObservation || (storedOption?.selected ?? false),
              feedbackText: storedOption?.feedbackText || matchedObservation?.feedbackText || ''
            };
          })
        )
      };
    });
    initialResponses.push({
      title: '9. Additional Feedback',
      options: [
        {
          description: "Did the class session meet the instructor's goal or objective?",
          feedbackText: goalFeedback,
          selected: true,
          showFeedback: true,
        },
        {
          description: "Other Comments or Recommendations",
          feedbackText: otherFeedback,
          selected: true,
          showFeedback: true,
        }
      ]
    });
    
    return initialResponses;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState(['0']);

  const observerId = localStorage.getItem('observerId');
  const instructorInfo = JSON.parse(localStorage.getItem("selectedInstructor"));
  const instructorId = instructorInfo?.instructorId;
  const classId = instructorInfo?.classId;
  const evaluationId = parseInt(localStorage.getItem('evaluationId'), 10);

  useEffect(() => {
    if (searchQuery.trim() === '') return;

    const searchLower = searchQuery.toLowerCase();
    const matchingIndices = responses.reduce((acc, section, index) => {
      const titleMatches = section.title.toLowerCase().includes(searchLower);
      const hasMatchingOptions = section.options.some(option => 
        option.description.toLowerCase().includes(searchLower) ||
        (option.feedbackText || '').toLowerCase().includes(searchLower) ||
        (option.observedDescription || '').toLowerCase().includes(searchLower)
      );
      
      if (titleMatches || hasMatchingOptions) {
        acc.push(String(index));
      }
      return acc;
    }, []);

    if (matchingIndices.length > 0) {
      setOpenSections(prev => {
        const next = new Set([...prev, ...matchingIndices]);
        return Array.from(next);
      });
    }
  }, [searchQuery, responses]);

  const toggleSection = (key) => {
    setOpenSections(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleFeedbackChange = (sectionIndex, optionIndex, value) => {
    const updatedResponses = [...responses];
    updatedResponses[sectionIndex].options[optionIndex].feedbackText = value;
    
    setResponses(updatedResponses);
    localStorage.setItem('selectedRecommendations', JSON.stringify(updatedResponses));
  };
  
  const handleCheckboxChange = (sectionIndex, optionIndex) => {
    const updatedResponses = [...responses];
    const option = updatedResponses[sectionIndex].options[optionIndex];

    if (normalizeTitle(updatedResponses[sectionIndex].title) === 'Additional Feedback') {
      return;
    }

    option.selected = !option.selected;
    option.showFeedback = option.selected;

    if (!option.selected) {
      option.feedbackText = '';
    }

    setResponses(updatedResponses);
    localStorage.setItem('selectedRecommendations', JSON.stringify(updatedResponses));
  };

  const handleSave = () => {
    const feedbacks = {}; 
    
    const selectedOptions = responses.flatMap((section) => {
      const normalizedTitle = normalizeTitle(section.title);
      
      if (normalizedTitle === 'Additional Feedback') {
        section.options.forEach(opt => {
          if (opt.description === "Did the class session meet the instructor's goal or objective?") {
            feedbacks['Additional Feedback'] = opt.feedbackText;
          } else if (opt.description === "Other Comments or Recommendations") {
            feedbacks['Other Comments or Recommendations'] = opt.feedbackText;
          }
        });
        
        return section.options.filter(opt => opt.feedbackText).map(opt => ({
          ...opt,
          sectionTitle: 'Additional Feedback',
        }));
      }
      
      return section.options
        .filter(option => option.selected)
        .map(option => ({
          ...option,
          sectionTitle: normalizedTitle,
        }));
    });
    navigate('/viewReport', {
      state: {
        evaluationId,
        selectedRecommendations: selectedOptions,
        feedbacks: feedbacks,
        observerId,
        instructorId,
        classId
      }
    });
  };

  return (
    <>
      <Header />
      <div id="evaluation-container-v3">
        <div className="eval-page-bg">
          <div className="container py-5 position-relative">
            
            <div className="eval-main-intro text-center mb-5">
              <h1 className="eval-page-heading">Possible Recommendations</h1>
              <p className="eval-page-subtext">Review and select based on observations</p>
            </div>

            <div className="search-container-v3 mb-4 mx-auto">
                <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
            </div>

            <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="eval-sections-wrapper" style={{ minHeight: '400px' }}>
                {(() => {
                  const searchLower = searchQuery.toLowerCase();
                  const filteredSections = responses.filter(section => {
                    const titleMatches = section.title.toLowerCase().includes(searchLower);
                    const hasMatchingOptions = section.options.some(option => 
                      option.description.toLowerCase().includes(searchLower) ||
                      (option.feedbackText || '').toLowerCase().includes(searchLower) ||
                      (option.observedDescription || '').toLowerCase().includes(searchLower)
                    );
                    return titleMatches || hasMatchingOptions;
                  });

                  if (searchQuery !== '' && filteredSections.length === 0) {
                    return (
                      <Card className="eval-section-card border-0 mb-4 shadow-sm p-5 text-center">
                        <div className="py-4">
                          <Search size={48} className="text-muted mb-3" />
                          <h4 className="eval-section-title mb-2">No recommendations found</h4>
                          <p className="text-muted">No sections, criteria or comments match your search for "{searchQuery}"</p>
                          <Button 
                            variant="link" 
                            className="text-success font-weight-bold" 
                            onClick={() => setSearchQuery('')}
                          >
                            Clear Search
                          </Button>
                        </div>
                      </Card>
                    );
                  }

                  return responses.map((section, originalIndex) => {
                    const key = String(originalIndex);
                    const isExpanded = openSections.includes(key);
                    const sectionNum = getSectionNumber(section.title);
                    const cleanTitle = normalizeTitle(section.title);

                    const titleMatches = section.title.toLowerCase().includes(searchLower);
                    const filteredOptions = section.options.filter(option => 
                      titleMatches || 
                      option.description.toLowerCase().includes(searchLower) ||
                      (option.feedbackText || '').toLowerCase().includes(searchLower) ||
                      (option.observedDescription || '').toLowerCase().includes(searchLower)
                    );

                    if (filteredOptions.length === 0 && !titleMatches) return null;

                    const groupedOptions = filteredOptions.reduce((acc, option) => {
                      const obs = option.observedDescription || 'General';
                      if (!acc[obs]) acc[obs] = [];
                      acc[obs].push(option);
                      return acc;
                    }, {});

                    return (
                      <Card key={originalIndex} className="eval-section-card border-0 mb-4 shadow-sm">
                        <Card.Header 
                          className={`p-0 border-0 bg-transparent eval-card-header d-flex align-items-center justify-content-between p-4 ${isExpanded ? 'active-header' : ''}`}
                          onClick={() => toggleSection(key)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex align-items-center">
                            {sectionNum && <div className="section-badge-circle mr-3">{sectionNum}</div>}
                            <h5 className="mb-0 eval-section-title">{cleanTitle}</h5>
                          </div>
                          <ChevronDown className={`chevron-icon ${isExpanded ? 'rotate-180' : ''}`} />
                        </Card.Header>
                        <Collapse in={isExpanded}>
                          <div>
                            <Card.Body className="eval-section-body p-4 pt-0">
                              {Object.entries(groupedOptions).map(([obs, opts]) => (
                                <div key={obs} className="recommendation-group-v3 mt-3">
                                  {obs !== 'General' && <div className="observation-subtitle-v3 mb-3 p-2 rounded-lg">{obs}</div>}
                                  {opts.map((option) => {
                                    const actualOptionIndex = section.options.findIndex(opt => opt.description === option.description);
                                    return (
                                      <div key={actualOptionIndex} className="eval-option-item p-3 mb-3 rounded-3">
                                        {cleanTitle !== 'Additional Feedback' ? (
                                          <Form.Check
                                            type="checkbox"
                                            id={`rec-check-${originalIndex}-${actualOptionIndex}`}
                                            label={option.description}
                                            checked={option.selected}
                                            onChange={() => handleCheckboxChange(originalIndex, actualOptionIndex)}
                                            className="eval-custom-check"
                                          />
                                        ) : (
                                          <div className="additional-label mb-2 font-weight-bold">{option.description}</div>
                                        )}
                                        
                                        {option.showFeedback && (
                                          <div className="eval-feedback-box mt-3">
                                            <TextArea
                                              value={option.feedbackText || ''}
                                              placeholder="Add comments specific to this recommendation..."
                                              onChange={(e) => handleFeedbackChange(originalIndex, actualOptionIndex, e.target.value)}
                                            />
                                          </div>
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
                  });
                })()}
              </div>
              
              <div className="eval-action-footer-container w-100 d-flex justify-content-center my-4 gap-3" style={{ position: 'sticky', bottom: '30px', zIndex: 1000, pointerEvents: 'none' }}>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/Evaluate')} 
                    className="eval-btn-secondary-v3 px-5 py-3 rounded-pill font-weight-bold shadow"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <ArrowLeft className="mr-2" /> GO BACK
                  </Button>
                  <Button 
                    type="submit" 
                    className="eval-submit-btn-v3 w-auto"
                    style={{ pointerEvents: 'auto' }}
                  >
                    SAVE AND EDIT REPORT
                  </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SelectedRecommendations;