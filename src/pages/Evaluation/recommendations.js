
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion, Card, Button, Form, useAccordionToggle } from 'react-bootstrap';
import Header from '../../components/Header/header';
import SearchBar from '../../components/Searchbar/searchbar';
import recommendationsMapping from './recommendationsMapping';
import TextArea from '../../components/Textarea/textarea';
import './mainform.css';

const SelectedRecommendations = () => {
  const [selectedRecommendations, setSelectedRecommendations] = useState([]);
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch selected recommendations from the backend
    fetch('http://localhost:8080/api/options')
      .then(response => response.json())
      .then(data => {
        console.log("fetched:", data);
        setAllRecommendations(data); // Store all recommendations fetched from API
        setSelectedRecommendations(data.filter(rec => rec.selected)); // Set initially selected recommendations
      })
      .catch(error => console.error('Error fetching recommendations:', error));
  }, []);

  const isSelected = (recommendation) => {
    return selectedRecommendations.some(
      (rec) => rec.description === recommendation && rec.selected
    );
  };

  const handleCheckboxChange = (recommendation) => {
    const recommendationIndex = selectedRecommendations.findIndex(rec => rec.description === recommendation);
    if (recommendationIndex !== -1) {
      const updatedRecommendations = [...selectedRecommendations];
      updatedRecommendations[recommendationIndex].selected = !updatedRecommendations[recommendationIndex].selected;
      setSelectedRecommendations(updatedRecommendations);
    } else {
      const selectedRecommendation = allRecommendations.find(rec => rec.description === recommendation);
      setSelectedRecommendations([...selectedRecommendations, { ...selectedRecommendation, selected: true }]);
    }
  };

  const handleFeedbackChange = (sectionTitle, value) => {
    setFeedbacks(prevFeedbacks => ({
      ...prevFeedbacks,
      [sectionTitle]: value
    }));
  };

  const handleSave = () => {
    const selectedData = selectedRecommendations
      .filter(rec => rec.selected)
      .map(rec => {
        let sectionTitle = '';
        let recommendationType = '';

        // Iterate over recommendationsMapping to find the sectionTitle and recommendationType
        Object.entries(recommendationsMapping).forEach(([secTitle, recommendations]) => {
          Object.entries(recommendations).forEach(([recType, recommendationArray]) => {
            if (recommendationArray.includes(rec.description)) {
              sectionTitle = secTitle;
              recommendationType = recType;
            }
          });
        });

        return {
          section_id: rec.sectionId,
          sectionTitle,
          recommendationType,
          feedback: feedbacks[sectionTitle] || '',
        };
      });

    console.log('Selected Data with Sections and Types:', selectedData);

    fetch('http://localhost:8080/api/options/saveSelected', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(selectedData),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Save successful:', data);
        navigate('/ReviewRecommendations');
      })
      .catch(error => console.error('Error saving selected recommendations:', error));
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
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

  const filteredRecommendationsMapping = Object.fromEntries(
    Object.entries(recommendationsMapping).map(([sectionTitle, recommendations]) => [
      sectionTitle,
      Object.fromEntries(
        Object.entries(recommendations).map(([recommendationType, recommendationArray]) => [
          recommendationType,
          recommendationArray.filter((recommendation) =>
            recommendation.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        ])
      ),
    ])
  );

  return (
    <>
      <Header />
      <div>
        <h4>Here are the recommendations based on your previous selection</h4>
        <SearchBar searchQuery={searchQuery} handleSearchChange={handleSearchChange} />
      </div>
      <div>
        <Form>
          <Accordion defaultActiveKey="0">
            {Object.entries(filteredRecommendationsMapping).map(([sectionTitle, recommendations], sectionIndex) => (
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
                            checked={isSelected(recommendation)} // Check if the recommendation is selected
                            onChange={() => handleCheckboxChange(recommendation)} // Call checkbox change handler
                          />
                        ))}
                      </div>
                    ))}
                    <TextArea
                      value={feedbacks[sectionTitle] || ''}
                      onChange={(e) => handleFeedbackChange(sectionTitle, e.target.value)}
                    />
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            ))}
            <Card>
              <Card.Header>
                <CustomToggle eventKey={String(Object.keys(filteredRecommendationsMapping).length)}>
                  Additional Feedback
                </CustomToggle>
              </Card.Header>
              <Accordion.Collapse eventKey={String(Object.keys(filteredRecommendationsMapping).length)}>
                <Card.Body>
                  <TextArea
                    value={feedbacks['Additional Feedback'] || ''}
                    onChange={(e) => handleFeedbackChange('Additional Feedback', e.target.value)}
                  />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          </Accordion>
          <div className="mt-3">
            <Button onClick={() => navigate('/Evaluate')} className="button-custom mr-2">
              Go Back
            </Button>
            <Button onClick={handleSave} className="button-custom mr-3">
              Save and Review
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
};

export default SelectedRecommendations;

