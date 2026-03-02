import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion, Card, Button, Form, useAccordionToggle, AccordionContext, Collapse } from 'react-bootstrap';
import { Search, ChevronDown, Check2Circle } from 'react-bootstrap-icons';
import Header from '../../components/Header/header';
import SearchBar from '../../components/Searchbar/searchbar';
import TextArea from '../../components/Textarea/textarea';
import './mainform.css';

const MainForm = ({ sections, saveSection }) => {
  const [responses, setResponses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState(['0']);
  const navigate = useNavigate();

  const normalizeTitle = (title) => title.replace(/^\d+\.\s*/, '');
  const getSectionNumber = (title) => {
    const match = title.match(/^(\d+)\./);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const storedResponses = JSON.parse(localStorage.getItem('savedResponses') || '[]');
    
    let initialResponses = sections.map(section => {
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

    const additionalFeedbackTitle = '9. Additional Feedback';
    const hasAdditionalFeedback = initialResponses.some(sec => sec.title === additionalFeedbackTitle);

    if (!hasAdditionalFeedback) {
      const storedAdditional = storedResponses.find(res => normalizeTitle(res.title) === 'Additional Feedback');
      initialResponses.push({
        title: additionalFeedbackTitle,
        options: [
          {
            description: "Did the class session meet the instructor's goal or objective?",
            feedbackText: (storedAdditional?.options?.[0]?.description === "Did the class session meet the instructor's goal or objective?" 
              ? storedAdditional.options[0].feedbackText 
              : storedAdditional?.options?.[0]?.feedbackText) || '',
            selected: true,
            showFeedback: true,
          },
          {
            description: "Other Comments or Recommendations",
            feedbackText: (storedAdditional?.options?.[1]?.description === "Other Comments or Recommendations"
              ? storedAdditional.options[1].feedbackText
              : "") || '',
            selected: true,
            showFeedback: true,
          }
        ]
      });
    }

    setResponses(initialResponses);
  }, [sections]);

  // Авто-раскрытие при поиске
  useEffect(() => {
    if (searchQuery.trim() === '') return;

    const searchLower = searchQuery.toLowerCase();
    const matchingIndices = responses.reduce((acc, section, index) => {
      const titleMatches = section.title.toLowerCase().includes(searchLower);
      const hasMatchingOptions = section.options.some(option => 
        option.description.toLowerCase().includes(searchLower) ||
        (option.feedbackText || '').toLowerCase().includes(searchLower)
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
    localStorage.setItem('savedResponses', JSON.stringify(updatedResponses));
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
    localStorage.setItem('savedResponses', JSON.stringify(updatedResponses));
  };

  const handleSave = () => {
    const evaluationId = localStorage.getItem('evaluationId');
    const observerId = localStorage.getItem('observerId') || localStorage.getItem('userId');
    const instructorInfoRaw = localStorage.getItem('selectedInstructor');
    
    if (!evaluationId || !observerId || !instructorInfoRaw) {
      alert("Missing evaluation data. Please start again.");
      return;
    }

    let instructorInfo = JSON.parse(instructorInfoRaw);

    const selectedOptions = responses.flatMap((section) => {
      if (normalizeTitle(section.title) === 'Additional Feedback') {
        return section.options.map(opt => ({ ...opt, sectionTitle: 'Additional Feedback' }));
      }
      return section.options
        .filter(option => option.selected)
        .map(option => ({ ...option, sectionTitle: normalizeTitle(section.title) }));
    });
    
    navigate('/SelectedRecommendations', {
      state: {
        evaluationId,
        observerId,
        instructorId: instructorInfo.instructorId,
        classId: instructorInfo.classId,
        selectedOptions,
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
              <h1 className="eval-page-heading">Teaching Evaluation Form</h1>
              <p className="eval-page-subtext">Comprehensive Assessment & Observations</p>
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
                      (option.feedbackText || '').toLowerCase().includes(searchLower)
                    );
                    return titleMatches || hasMatchingOptions;
                  });

                  if (searchQuery !== '' && filteredSections.length === 0) {
                    return (
                      <Card className="eval-section-card border-0 mb-4 shadow-sm p-5 text-center">
                        <div className="py-4">
                          <Search size={48} className="text-muted mb-3" />
                          <h4 className="eval-section-title mb-2">No results found</h4>
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
                      (option.feedbackText || '').toLowerCase().includes(searchLower)
                    );

                    if (filteredOptions.length === 0 && !titleMatches) return null;

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
                              <div className="eval-options-grid mt-3">
                                {filteredOptions.map((option, optionIndex) => {
                                  const actualOptionIndex = section.options.findIndex(opt => opt.description === option.description);
                                  return (
                                  <div key={optionIndex} className="eval-option-item p-3 mb-3 rounded-3">
                                    {cleanTitle !== 'Additional Feedback' ? (
                                      <Form.Check
                                        type="checkbox"
                                        id={`check-${originalIndex}-${actualOptionIndex}`}
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
                                          placeholder="Provide specific details or evidence..."
                                          onChange={(e) => handleFeedbackChange(originalIndex, actualOptionIndex, e.target.value)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );})}
                              </div>
                            </Card.Body>
                          </div>
                        </Collapse>
                      </Card>
                    );
                  });
                })()}
              </div>
              
              <div className="eval-action-footer-container w-100 d-flex justify-content-center my-4" style={{ position: 'sticky', bottom: '30px', zIndex: 1000, pointerEvents: 'none' }}>
                  <Button type="submit" className="eval-submit-btn-v3 w-auto" style={{ pointerEvents: 'auto' }}>
                    SAVE AND CONTINUE
                  </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainForm;