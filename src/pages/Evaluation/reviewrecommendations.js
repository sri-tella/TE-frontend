
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion, Card, Button, Form, useAccordionToggle } from 'react-bootstrap';
import Header from '../../components/Header/header';
import TextArea from '../../components/Textarea/textarea';
import recommendationsMapping from './recommendationsMapping';
import './mainform.css';

const ReviewRecommendations = () => {
  const [selectedRecommendations, setSelectedRecommendations] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch selected recommendations from the backend
    fetch('https://te-backend-production.up.railway.app/api/options')
      .then(response => response.json())
      .then(data => {
              const selectedData = data.filter(rec => rec.selected);
              setSelectedRecommendations(selectedData);
              const feedbackData = {};
              selectedData.forEach(rec => {
                feedbackData[rec.sectionTitle] = rec.feedback || '';
              });
              setFeedbacks(feedbackData);
            })
      .catch(error => console.error('Error fetching recommendations:', error));
  }, []);

  const isSelected = (recommendation) => {
    return selectedRecommendations.some(
      (rec) => rec.description === recommendation && rec.selected
    );
  };

  const CustomToggle = ({ children, eventKey }) => {
    const decoratedOnClick = useAccordionToggle(eventKey, () => {
      console.log('custom toggle', eventKey);
    });

    return (
      <Button
        type="button"
        variant="link"
        onClick={decoratedOnClick}
        style={{ marginBottom: '1rem' }}
      >
        {children}
      </Button>
    );
  };

  const handleSaveAndEditReport = () => {
    navigate('/viewReport', {
      state: {
        selectedRecommendations,
        feedbacks,
      },
    });
  };

  return (
    <>
      <Header />
      <div>
        <h4>Review your selected recommendations</h4>
      </div>
      <div>
        <Form>
          <Accordion defaultActiveKey="0">
            {Object.entries(recommendationsMapping).map(([sectionTitle, recommendations], sectionIndex) => (
              <Card key={sectionIndex}>
                <Card.Header>
                  <CustomToggle eventKey={String(sectionIndex)}>
                    {sectionTitle}
                  </CustomToggle>
                </Card.Header>
                <Accordion.Collapse eventKey={String(sectionIndex)}>
                  <Card.Body>
                    {Object.entries(recommendations).map(([recommendationType, recommendationArray]) => (
                      <div key={recommendationType} className="mb-3">
                        <h5>{recommendationType}</h5>
                        {recommendationArray.map((recommendation, index) => (
                          <Form.Check
                            key={index}
                            type="checkbox"
                            label={recommendation}
                            checked={isSelected(recommendation)}
                            disabled
                            className="text-muted"
                          />
                        ))}
                      </div>
                    ))}
                    <TextArea
                      value={feedbacks[sectionTitle] || ''}
                      disabled
                      className="text-muted"
                    />
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            ))}
            <Card>
              <Card.Header>
                <CustomToggle eventKey={String(Object.keys(recommendationsMapping).length)}>
                  Additional Feedback
                </CustomToggle>
              </Card.Header>
              <Accordion.Collapse eventKey={String(Object.keys(recommendationsMapping).length)}>
                <Card.Body>
                  <TextArea
                    value={feedbacks['Additional Feedback'] || ''}
                    disabled
                    className="text-muted"
                  />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          </Accordion>
          <div className="mt-3">
            <Button onClick={() => navigate('/SelectedRecommendations')} className="button-custom mr-2">
              Go Back
            </Button>
            <Button onClick={handleSaveAndEditReport} className="button-custom mr-3">
              Save and Edit Report
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
};

export default ReviewRecommendations;

