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
  const { selectedOptions = [] } = location.state || {};

  const [responses, setResponses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [localFeedbacks, setLocalFeedbacks] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const observerId = localStorage.getItem('observerId');
  const instructorInfoRaw = localStorage.getItem('selectedInstructor');
  const instructorInfo = instructorInfoRaw ? JSON.parse(instructorInfoRaw) : null;
  const instructorId = instructorInfo?.instructorId;
  const classId = instructorInfo?.classId;
  const evaluationIdRaw = localStorage.getItem('evaluationId');
  const evaluationId = evaluationIdRaw && !isNaN(parseInt(evaluationIdRaw, 10)) ? parseInt(evaluationIdRaw, 10) : null;

  const normalizeTitle = (title) => title.replace(/^\d+\.\s*/, '');

  useEffect(() => {
    try {
      setIsLoading(true);
      
      const savedFeedbacks = localStorage.getItem('selectedRecFeedbacks');
      if (savedFeedbacks) {
        try {
          const parsedFeedbacks = JSON.parse(savedFeedbacks);
          setLocalFeedbacks(parsedFeedbacks);
        } catch (parseError) {
          console.error('Error parsing savedFeedbacks:', parseError);
        }
      }

      const storedRecommendations = JSON.parse(localStorage.getItem('selectedRecommendations') || '[]');
      let initialResponses = [];

      Object.entries(recommendationsMapping).forEach(([sectionTitle, recGroups]) => {
        const storedSection = storedRecommendations.find(res => normalizeTitle(res.title) === normalizeTitle(sectionTitle)) || {};
        
        const section = {
          title: sectionTitle,
          options: [],
        };

        Object.entries(recGroups).forEach(([observation, recommendations]) => {
          recommendations.forEach(rec => {
            const storedOption = storedSection.options?.find(opt => opt.description === rec);
            
            const isObservationSelected = selectedOptions.some(opt => opt.description === observation);
            const feedbackFromOptions = selectedOptions.find(opt => opt.description === observation)?.feedbackText || '';
            
            section.options.push({
              description: rec,
              observedDescription: observation,
              selected: storedOption?.selected || isObservationSelected,
              showFeedback: storedOption?.showFeedback || isObservationSelected,
              feedbackText: storedOption?.feedbackText || feedbackFromOptions || '',
            });
          });
        });

        initialResponses.push(section);
      });

      const additionalFeedbackTitle = 'Additional Feedback';
      const hasAdditionalFeedback = initialResponses.some(sec => normalizeTitle(sec.title) === 'Additional Feedback');

      if (!hasAdditionalFeedback) {
        const storedAdditional = storedRecommendations.find(res => normalizeTitle(res.title) === 'Additional Feedback');
        const selectedAdditional = selectedOptions.find(opt => normalizeTitle(opt.sectionTitle) === 'Additional Feedback');
        
        initialResponses.push({
          title: additionalFeedbackTitle,
          options: [{
            description: 'Please type in any additional feedback or comments.',
            feedbackText: storedAdditional?.options[0]?.feedbackText || selectedAdditional?.feedbackText || '',
            selected: true,
            showFeedback: true,
          }],
        });
      }

      setResponses(initialResponses);
    } catch (error) {
      setError('Failed to load recommendations');
      console.error('Error in useEffect:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOptions]);

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

  const handleFeedbackChange = (sectionIndex, optionIndex, value) => {
    const updatedResponses = [...responses];
    updatedResponses[sectionIndex].options[optionIndex].feedbackText = value;

    setResponses(updatedResponses);
    localStorage.setItem('selectedRecommendations', JSON.stringify(updatedResponses));
  };

  const handleSectionFeedbackChange = (sectionTitle, value) => {
    const updated = { ...localFeedbacks, [sectionTitle]: value };
    setLocalFeedbacks(updated);
    localStorage.setItem('selectedRecFeedbacks', JSON.stringify(updated));
  };

  const handleSave = () => {
    if (!observerId || !instructorId || !classId || !evaluationId) {
      console.error('Missing required fields for navigation');
      navigate('/error');
      return;
    }

    const selectedRecommendations = responses.flatMap(section => {
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
        selectedRecommendations,
        feedbacks: localFeedbacks,
        observerId,
        instructorId,
        classId,
        evaluationId,
      },
    });
  };

  const CustomToggle = ({ children, eventKey }) => {
    const decoratedOnClick = useAccordionToggle(eventKey, () => {});
    return (
      <Button
        type="button"
        variant="link"
        onClick={decoratedOnClick}
      >
        {children}
      </Button>
    );
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <Header />
      <div>
        <h4>Here are possible recommendations. Some are selected based on your observations in the previous step. Click on the headers to expand/collapse and use the search bar on the right to quickly find key words.</h4>
        <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
      </div>
      <div>
        <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <Accordion defaultActiveKey="0">
            {responses.map((section, originalIndex) => {
              const normalizedTitle = normalizeTitle(section.title);
              
              const matchesSearch = searchQuery === '' ||
                section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                section.options.some(option => {
                  const descriptionMatch = option.description.toLowerCase().includes(searchQuery.toLowerCase());
                  const feedbackMatch = normalizedTitle !== 'Additional Feedback' &&
                    (option.feedbackText || '').toLowerCase().includes(searchQuery.toLowerCase());
                  return descriptionMatch || feedbackMatch;
                });

              if (!matchesSearch && (normalizedTitle !== 'Additional Feedback' ||
                (normalizedTitle === 'Additional Feedback' && !section.options[0].feedbackText.toLowerCase().includes(searchQuery.toLowerCase())))) {
                return null;
              }

              return (
                <Card key={originalIndex}>
                  <Card.Header>
                    <CustomToggle eventKey={String(originalIndex)}>
                      {section.title}
                    </CustomToggle>
                  </Card.Header>
                  <Accordion.Collapse eventKey={String(originalIndex)}>
                    <Card.Body>
                      {section.options.map((option, optionIndex) => {
                        const showOption = searchQuery === '' ||
                          option.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (normalizedTitle !== 'Additional Feedback' && (option.feedbackText || '').toLowerCase().includes(searchQuery.toLowerCase()));

                        if (!showOption && normalizedTitle !== 'Additional Feedback') {
                          return null;
                        }

                        return (
                          <div key={optionIndex}>
                            {normalizedTitle !== 'Additional Feedback' ? (
                              <>
                                <Form.Check
                                  type="checkbox"
                                  label={`${option.observedDescription}: ${option.description}`}
                                  checked={option.selected}
                                  onChange={() => handleCheckboxChange(originalIndex, optionIndex)}
                                />
                                {option.showFeedback && (
                                  <TextArea
                                    value={option.feedbackText || ''}
                                    onChange={(e) => handleFeedbackChange(originalIndex, optionIndex, e.target.value)}
                                  />
                                )}
                              </>
                            ) : (
                              <>
                                <p>{option.description}</p>
                                <TextArea
                                  value={option.feedbackText || ''}
                                  onChange={(e) => handleFeedbackChange(originalIndex, optionIndex, e.target.value)}
                                />
                              </>
                            )}
                          </div>
                        );
                      })}
                      {normalizedTitle !== 'Additional Feedback' && (
                        <TextArea
                          value={localFeedbacks[normalizedTitle] || ''}
                          onChange={(e) => handleSectionFeedbackChange(normalizedTitle, e.target.value)}
                        />
                      )}
                    </Card.Body>
                  </Accordion.Collapse>
                </Card>
              );
            })}
          </Accordion>
          <div className="mt-3">
            <Button onClick={() => navigate('/Evaluate')} className="button-custom mr-2">
              Go Back
            </Button>
            <Button type="submit" className="button-custom mr-3">
              Save and Edit Report
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
};

export default SelectedRecommendations;
