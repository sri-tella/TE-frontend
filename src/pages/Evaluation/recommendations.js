import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Accordion, Card, Button, Form, useAccordionToggle } from 'react-bootstrap';
import Header from '../../components/Header/header';
import SearchBar from '../../components/Searchbar/searchbar';
import recommendationsMapping from './recommendationsMapping';
import TextArea from '../../components/Textarea/textarea';
import './mainform.css';

const SelectedRecommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const normalizeTitle = (title) => title.replace(/^\d+\.\s*/, '');

  const [responses, setResponses] = useState(() => {
    const { selectedOptions = [] } = location.state || {};
    const storedResponses = JSON.parse(localStorage.getItem('selectedRecommendations') || '[]');
    
    let initialResponses = Object.entries(recommendationsMapping).map(([sectionTitle, recGroups]) => {
      const normalized = normalizeTitle(sectionTitle);
      const storedSection = storedResponses.find(res => normalizeTitle(res.title) === normalized) || {};
      
      return {
        title: sectionTitle,
        options: Object.entries(recGroups).flatMap(([observation, recommendations]) => 
          recommendations.map(recommendation => {
            const isSelected = selectedOptions.some(opt => opt.description === observation);
            const storedOption = storedSection.options?.find(opt => opt.description === recommendation);
            return {
              description: recommendation,
              observedDescription: observation,
              selected: storedOption?.selected ?? isSelected,
              showFeedback: storedOption?.selected ?? isSelected,
              feedbackText: storedOption?.feedbackText || ''
            };
          })
        )
      };
    });

    const additionalFeedbackTitle = 'Additional Feedback';
    const hasAdditionalFeedback = initialResponses.some(sec => normalizeTitle(sec.title) === additionalFeedbackTitle);

    if (!hasAdditionalFeedback) {
      const storedAdditional = storedResponses.find(res => normalizeTitle(res.title) === additionalFeedbackTitle);
      initialResponses.push({
        title: additionalFeedbackTitle,
        options: [{
          description: 'Please type in any additional feedback or comments.',
          feedbackText: storedAdditional?.options?.[0]?.feedbackText || '',
          selected: true,
          showFeedback: true,
        }]
      });
    }
    return initialResponses;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeKey, setActiveKey] = useState('0');

  const observerId = localStorage.getItem('observerId');
  const instructorInfo = JSON.parse(localStorage.getItem("selectedInstructor"));
  const instructorId = instructorInfo?.instructorId;
  const classId = instructorInfo?.classId;
  const evaluationId = parseInt(localStorage.getItem('evaluationId'), 10);


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
    const selectedOptions = responses.flatMap((section) => {
      if (normalizeTitle(section.title) === 'Additional Feedback') {
        return section.options[0].feedbackText ? [{
          ...section.options[0],
          sectionTitle: 'Additional Feedback',
        }] : [];
      }
      return section.options
        .filter(option => option.selected)
        .map(option => ({
          ...option,
          sectionTitle: normalizeTitle(section.title),
        }));
    });
    
    navigate('/viewReport', {
      state: {
        evaluationId,
        selectedRecommendations: selectedOptions,
        observerId,
        instructorId,
        classId
      }
    });
  };

  const CustomToggle = ({ children, eventKey }) => {
    const decoratedOnClick = useAccordionToggle(eventKey, () =>
      setActiveKey(activeKey === eventKey ? null : eventKey)
    );
    return (
      <div className="custom-accordion-toggle" onClick={decoratedOnClick}>
        {children}
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="main-form-page">
        <div className="main-form-card">
          
          <div className="form-header-row">
            <div className="form-instructions">
              <h4>Possible Recommendations</h4>
              <p>Some are selected based on your previous observations. Click headers to expand.</p>
            </div>
            <div className="form-search">
              <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
            </div>
          </div>

          <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <Accordion activeKey={activeKey} className="custom-accordion">
              {responses.map((section, originalIndex) => {
                
                const filteredOptions = section.options.filter(option =>
                  searchQuery === '' ||
                  section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  option.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (option.feedbackText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (option.observedDescription || '').toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                if (filteredOptions.length === 0) {
                  return null;
                }

                const groupedOptions = filteredOptions.reduce((acc, option) => {
                  const obs = option.observedDescription || 'General';
                  if (!acc[obs]) {
                    acc[obs] = [];
                  }
                  acc[obs].push(option);
                  return acc;
                }, {});

                return (
                  <Card key={originalIndex} className="accordion-card">
                    <Card.Header className="accordion-header-custom">
                      <CustomToggle eventKey={String(originalIndex)}>
                        {section.title}
                      </CustomToggle>
                    </Card.Header>
                    <Accordion.Collapse eventKey={String(originalIndex)}>
                      <Card.Body className="accordion-body-custom">
                        {Object.entries(groupedOptions).map(([obs, opts]) => (
                          <div key={obs} className="recommendation-group">
                            <h5 className="observation-subtitle">{obs}</h5>
                            {opts.map((option) => {
                              const originalOptionIndex = section.options.findIndex(o => o.description === option.description);
                              if (originalOptionIndex === -1) return null;

                              return (
                                <div key={originalOptionIndex} className="option-item">
                                  {normalizeTitle(section.title) !== 'Additional Feedback' ? (
                                    <Form.Check
                                      type="checkbox"
                                      id={`rec-checkbox-${originalIndex}-${originalOptionIndex}`}
                                      label={option.description}
                                      checked={option.selected}
                                      onChange={() => handleCheckboxChange(originalIndex, originalOptionIndex)}
                                      className="custom-checkbox"
                                    />
                                  ) : (
                                    <p className="additional-feedback-label">{option.description}</p>
                                  )}
                                  
                                  {option.showFeedback && (
                                    <div className="feedback-area">
                                      <TextArea
                                        value={option.feedbackText || ''}
                                        placeholder="Add comments specific to this recommendation..."
                                        onChange={(e) => handleFeedbackChange(originalIndex, originalOptionIndex, e.target.value)}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </Card.Body>
                    </Accordion.Collapse>
                  </Card>
                );
              })}
            </Accordion>
            
            <div className="form-footer-dual">
              <Button onClick={() => navigate('/Evaluate')} className="btn-baylor-secondary">
                Go Back
              </Button>
              <Button type="submit" className="btn-baylor-save">
                Save and Edit Report
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
};

export default SelectedRecommendations;