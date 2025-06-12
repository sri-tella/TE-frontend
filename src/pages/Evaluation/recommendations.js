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
  const { selectedOptions = [], feedbacks = {} } = location.state || {};

  const [selectedRecommendations, setSelectedRecommendations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [localFeedbacks, setLocalFeedbacks] = useState(feedbacks);

  const observerId = localStorage.getItem('observerId');
  const instructorInfo = JSON.parse(localStorage.getItem("selectedInstructor"));
  const instructorId = instructorInfo?.instructorId;
  const classId = instructorInfo?.classId;
  const evaluationId = parseInt(localStorage.getItem('evaluationId'), 10);

//  useEffect(() => {
//    const savedRecs = localStorage.getItem('selectedRecommendations');
//    const savedFeedbacks = localStorage.getItem('selectedRecFeedbacks');
//
//    if (savedRecs) {
//      setSelectedRecommendations(JSON.parse(savedRecs));
//    } else {
//      // fallback: populate from selectedOptions if not already saved
//      const recs = [];
//
//      selectedOptions.forEach(option => {
//        Object.entries(recommendationsMapping).forEach(([sectionTitle, recGroups]) => {
//          Object.entries(recGroups).forEach(([observation, recommendations]) => {
//            if (observation === option.description) {
//              recommendations.forEach(rec => {
//                recs.push({
//                  description: rec,
//                  sectionTitle,
//                  observedDescription: observation,
//                  selected: true
//                });
//              });
//            }
//          });
//        });
//      });
//
//      setSelectedRecommendations(recs);
//      localStorage.setItem('selectedRecommendations', JSON.stringify(recs));
//    }
//
//    if (savedFeedbacks) {
//      setLocalFeedbacks(JSON.parse(savedFeedbacks));
//    }
//  }, [selectedOptions]);

//    useEffect(() => {
//      const savedRecs = localStorage.getItem('selectedRecommendations');
//      const savedFeedbacks = localStorage.getItem('selectedRecFeedbacks');
//
//      const hasSavedRecs = savedRecs && JSON.parse(savedRecs).length > 0;
//      const hasFreshState = selectedOptions && selectedOptions.length > 0;
//
//      if (hasFreshState) {
//        // Always prioritize newly selected options from /evaluate
//        const recs = [];
//
//        selectedOptions.forEach(option => {
//          Object.entries(recommendationsMapping).forEach(([sectionTitle, recGroups]) => {
//            Object.entries(recGroups).forEach(([observation, recommendations]) => {
//              if (observation === option.description) {
//                recommendations.forEach(rec => {
//                  recs.push({
//                    description: rec,
//                    sectionTitle,
//                    observedDescription: observation,
//                    selected: true
//                  });
//                });
//              }
//            });
//          });
//        });
//
//        setSelectedRecommendations(recs);
//        localStorage.setItem('selectedRecommendations', JSON.stringify(recs));
//      } else if (hasSavedRecs) {
//        setSelectedRecommendations(JSON.parse(savedRecs));
//      }
//
//      if (savedFeedbacks) {
//        setLocalFeedbacks(JSON.parse(savedFeedbacks));
//      }
//    }, [selectedOptions]);

    useEffect(() => {
      const savedFeedbacks = localStorage.getItem('selectedRecFeedbacks');
      const recs = [];

      Object.entries(recommendationsMapping).forEach(([sectionTitle, recGroups]) => {
        Object.entries(recGroups).forEach(([observation, recommendations]) => {
          recommendations.forEach(rec => {
            const isSelected = selectedOptions.some(opt => opt.description === observation);
            recs.push({
              description: rec,
              sectionTitle,
              observedDescription: observation,
              selected: isSelected
            });
          });
        });
      });

      setSelectedRecommendations(recs);
      localStorage.setItem('selectedRecommendations', JSON.stringify(recs));

      if (savedFeedbacks) {
        setLocalFeedbacks(JSON.parse(savedFeedbacks));
      }
    }, [selectedOptions]);

  useEffect(() => {
    console.log("Loaded feedbacks:", feedbacks);
  }, []);

  const isSelected = (recommendation) => {
    return selectedRecommendations.some(
      (rec) => rec.description === recommendation && rec.selected
    );
  };

  const handleCheckboxChange = (recommendation) => {
    const updated = selectedRecommendations.map(rec =>
        rec.description === recommendation
          ? { ...rec, selected: !rec.selected }
          : rec
      );
    setSelectedRecommendations(updated);
    localStorage.setItem('selectedRecommendations', JSON.stringify(updated));
  };

  const handleFeedbackChange = (sectionTitle, value) => {
    const updated = {
        ...localFeedbacks,
        [sectionTitle]: value
      };
    setLocalFeedbacks(updated);
    localStorage.setItem('selectedRecFeedbacks', JSON.stringify(updated));
  };

  const handleSave = () => {
    const filtered = selectedRecommendations.filter(rec => rec.selected);

    navigate('/viewReport', {
      state: {
        selectedRecommendations: filtered,
        feedbacks: localFeedbacks,
        observerId,
        instructorId,
        classId,
        evaluationId
      }
    });
  };

  const CustomToggle = ({ children, eventKey }) => {
    const decoratedOnClick = useAccordionToggle(eventKey, () => {});
    return (
      <Button type="button" variant="link" onClick={decoratedOnClick}>
        {children}
      </Button>
    );
  };

  const filteredRecommendationsMapping = Object.fromEntries(
    Object.entries(recommendationsMapping).map(([sectionTitle, recs]) => [
      sectionTitle,
      Object.fromEntries(
        Object.entries(recs).map(([obs, recArr]) => [
          obs,
          recArr.filter(rec =>
            rec.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        ])
      ),
    ])
  );

  return (
    <>
      <Header />
      <div>
        <h4>Here are possible recommendations. Some are selected based on your observations in the previous step. Click on the headers to expand/collapse and use the search bar on the right to quickly find key words.</h4>
        <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
      </div>
      <Form>
        <Accordion defaultActiveKey="0">
          {Object.entries(filteredRecommendationsMapping).map(([sectionTitle, recs], sectionIndex) => (
            <Card key={sectionIndex}>
              <Card.Header>
                <CustomToggle eventKey={String(sectionIndex)}>
                  {sectionTitle}
                </CustomToggle>
              </Card.Header>
              <Accordion.Collapse eventKey={String(sectionIndex)}>
                <Card.Body>
                  {Object.entries(recs).map(([obs, recArr]) => (
                    <div key={obs} className="mb-3">
                      <h5>{obs}</h5>
                      {recArr.map((rec, index) => (
                        <Form.Check
                          key={index}
                          type="checkbox"
                          label={rec}
                          checked={isSelected(rec)}
                          onChange={() => handleCheckboxChange(rec)}
                        />
                      ))}
                    </div>
                  ))}
                  <TextArea
                    value={localFeedbacks[sectionTitle] || ''}
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
                  value={localFeedbacks['Additional Feedback'] || ''}
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
            Save and Edit Report
          </Button>
        </div>
      </Form>
    </>
  );
};

export default SelectedRecommendations;
