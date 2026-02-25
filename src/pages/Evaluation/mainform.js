import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion, Card, Button, Form, useAccordionToggle } from 'react-bootstrap';
import Header from '../../components/Header/header';
import SearchBar from '../../components/Searchbar/searchbar';
import TextArea from '../../components/Textarea/textarea';
import './mainform.css';

const MainForm = ({ sections, saveSection }) => {
  const [responses, setResponses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const normalizeTitle = (title) => title.replace(/^\d+\.\s*/, '');

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
    
    const missingFields = [];
    if (!evaluationId) missingFields.push('Evaluation ID');
    if (!observerId) missingFields.push('Observer ID');
    if (!instructorInfoRaw) missingFields.push('Instructor Info');
    
    if (missingFields.length > 0) {
      alert(`The necessary data is missing:\n${missingFields.join('\n')}\n\nPlease start the process again.`);
      return;
    }

    let instructorInfo = null;
    try {
      instructorInfo = JSON.parse(instructorInfoRaw);
    } catch (e) {
      console.error('Error parsing instructor info:', e);
      return;
    }

    const selectedOptions = responses.flatMap((section) => {
      if (normalizeTitle(section.title) === 'Additional Feedback') {
        return section.options.map(opt => ({
          ...opt,
          sectionTitle: 'Additional Feedback',
        }));
      }
      return section.options
        .filter(option => option.selected)
        .map(option => ({
          ...option,
          sectionTitle: normalizeTitle(section.title),
        }));
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

  const CustomToggle = ({ children, eventKey }) => {
    const decoratedOnClick = useAccordionToggle(eventKey, () => {});
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
              <h4>Evaluation Form</h4>
              <p>Select all observations that apply. Click headers to expand. Use the search bar to find keywords.</p>
            </div>
            <div className="form-search">
              <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
            </div>
          </div>

          <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <Accordion defaultActiveKey="0" className="custom-accordion">
              {responses.map((section, originalIndex) => {
                const normalizedTitle = normalizeTitle(section.title);
                const matchesSearch = searchQuery === '' ||
                  section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  section.options.some(option =>
                    option.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (option.feedbackText || '').toLowerCase().includes(searchQuery.toLowerCase())
                  );

                if (!matchesSearch) {
                  return null;
                }

                return (
                  <Card key={originalIndex} className="accordion-card">
                    <Card.Header className="accordion-header-custom">
                      <CustomToggle eventKey={String(originalIndex)}>
                        {section.title}
                      </CustomToggle>
                    </Card.Header>
                    <Accordion.Collapse eventKey={String(originalIndex)}>
                      <Card.Body className="accordion-body-custom">
                        {section.options.map((option, optionIndex) => {
                          const showOption = searchQuery === '' ||
                            option.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (normalizedTitle !== 'Additional Feedback' && (option.feedbackText || '').toLowerCase().includes(searchQuery.toLowerCase()));

                          if (!showOption && normalizedTitle !== 'Additional Feedback') {
                            return null;
                          }

                          return (
                            <div key={optionIndex} className="option-item">
                              {normalizedTitle !== 'Additional Feedback' ? (
                                <Form.Check
                                  type="checkbox"
                                  id={`checkbox-${originalIndex}-${optionIndex}`}
                                  label={option.description}
                                  checked={option.selected}
                                  onChange={() => handleCheckboxChange(originalIndex, optionIndex)}
                                  className="custom-checkbox"
                                />
                              ) : (
                                <p className="additional-feedback-label">{option.description}</p>
                              )}
                              {option.showFeedback && (
                                <div className="feedback-area">
                                  <TextArea
                                    value={option.feedbackText || ''}
                                    placeholder="Add specific comments here..."
                                    onChange={(e) => handleFeedbackChange(originalIndex, optionIndex, e.target.value)}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </Card.Body>
                    </Accordion.Collapse>
                  </Card>
                );
              })}
            </Accordion>
            
            <div className="form-footer">
              <Button type="submit" className="btn-baylor-save">
                SAVE AND CONTINUE
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
};

export default MainForm;