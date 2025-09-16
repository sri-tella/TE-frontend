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

    const [selectedRecommendations, setSelectedRecommendations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [additionalFeedback, setAdditionalFeedback] = useState('');

    const observerId = localStorage.getItem('observerId');
    const instructorInfo = JSON.parse(localStorage.getItem("selectedInstructor"));
    const instructorId = instructorInfo?.instructorId;
    const classId = instructorInfo?.classId;
    const evaluationId = parseInt(localStorage.getItem('evaluationId'), 10);

    useEffect(() => {
        const savedRecs = JSON.parse(localStorage.getItem('selectedRecommendations') || '[]');
        const savedAdditionalFeedback = localStorage.getItem('additionalFeedback') || '';
        
        const recs = [];
        Object.entries(recommendationsMapping).forEach(([sectionTitle, recGroups]) => {
            Object.entries(recGroups).forEach(([observation, recommendations]) => {
                recommendations.forEach(rec => {
                    const isSelected = selectedOptions.some(opt => opt.description === observation);
                    
                    const savedRec = savedRecs.find(saved => saved.description === rec);
                    
                    recs.push({
                        description: rec,
                        sectionTitle,
                        observedDescription: observation,
                        selected: savedRec ? savedRec.selected : isSelected,
                        feedbackText: savedRec?.feedbackText || '',
                    });
                });
            });
        });

        setSelectedRecommendations(recs);
        setAdditionalFeedback(savedAdditionalFeedback);
    }, [selectedOptions]);

    const handleCheckboxChange = (recommendation) => {
        const updated = selectedRecommendations.map(rec =>
            rec.description === recommendation
                ? { ...rec, selected: !rec.selected, feedbackText: !rec.selected ? rec.feedbackText : '' } : rec
        );
        setSelectedRecommendations(updated);
        localStorage.setItem('selectedRecommendations', JSON.stringify(updated));
    };

    const handleFeedbackChange = (recommendation, value) => {
        const updated = selectedRecommendations.map(rec =>
            rec.description === recommendation
                ? { ...rec, feedbackText: value }
                : rec
        );
        setSelectedRecommendations(updated);
        localStorage.setItem('selectedRecommendations', JSON.stringify(updated));
    };

    const handleAdditionalFeedbackChange = (value) => {
      setAdditionalFeedback(value);
      localStorage.setItem('additionalFeedback', value);
    };

    const handleSave = () => {
        const filteredRecommendations = selectedRecommendations.filter(rec => rec.selected);
        const reportData = {
          selectedRecommendations: filteredRecommendations,
          additionalFeedback,
          observerId,
          instructorId,
          classId,
          evaluationId
        };
        
        console.log("Saving final report data:", reportData);

        navigate('/viewReport', {
            state: reportData
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
    
    const groupedRecommendations = selectedRecommendations.reduce((acc, rec) => {
      if (!acc[rec.sectionTitle]) {
        acc[rec.sectionTitle] = {};
      }
      if (!acc[rec.sectionTitle][rec.observedDescription]) {
        acc[rec.sectionTitle][rec.observedDescription] = [];
      }
      acc[rec.sectionTitle][rec.observedDescription].push(rec);
      return acc;
    }, {});


    return (
        <>
            <Header />
            <div>
                <h4>Here are possible recommendations. Some are selected based on your observations in the previous step. Click on the headers to expand/collapse and use the search bar on the right to quickly find key words.</h4>
                <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
            </div>
            <Form>
                <Accordion defaultActiveKey="0">
                    {Object.entries(groupedRecommendations).map(([sectionTitle, recGroups], sectionIndex) => (
                        <Card key={sectionIndex}>
                            <Card.Header>
                                <CustomToggle eventKey={String(sectionIndex)}>
                                    {sectionTitle}
                                </CustomToggle>
                            </Card.Header>
                            <Accordion.Collapse eventKey={String(sectionIndex)}>
                                <Card.Body>
                                    {Object.entries(recGroups).map(([obs, recArr]) => (
                                        <div key={obs} className="mb-3">
                                            <h5>{obs}</h5>
                                            {recArr.filter(rec => 
                                                rec.description.toLowerCase().includes(searchQuery.toLowerCase())
                                            ).map((rec, index) => (
                                                <div key={index}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        label={rec.description}
                                                        checked={rec.selected}
                                                        onChange={() => handleCheckboxChange(rec.description)}
                                                    />
                                                    {rec.selected && (
                                                        <TextArea
                                                            value={rec.feedbackText}
                                                            onChange={(e) => handleFeedbackChange(rec.description, e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </Card.Body>
                            </Accordion.Collapse>
                        </Card>
                    ))}
                    <Card>
                        <Card.Header>
                            <CustomToggle eventKey={String(Object.keys(groupedRecommendations).length)}>
                                Additional Feedback
                            </CustomToggle>
                        </Card.Header>
                        <Accordion.Collapse eventKey={String(Object.keys(groupedRecommendations).length)}>
                            <Card.Body>
                                <TextArea
                                    value={additionalFeedback}
                                    onChange={(e) => handleAdditionalFeedbackChange(e.target.value)}
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