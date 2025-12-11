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
    // 1. Load saved responses from localStorage
    const storedResponses = JSON.parse(localStorage.getItem('savedResponses') || '[]');
    
    // 2. Initialize state from props
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

    // 3. Ensure the "Additional Feedback" section is added to the state
    const additionalFeedbackTitle = '9. Additional Feedback';
    const hasAdditionalFeedback = initialResponses.some(sec => sec.title === additionalFeedbackTitle);

    if (!hasAdditionalFeedback) {
      const storedAdditional = storedResponses.find(res => normalizeTitle(res.title) === 'Additional Feedback');
      initialResponses.push({
        title: additionalFeedbackTitle,
        options: [{
          description: 'Please type in any additional feedback or comments.',
          feedbackText: storedAdditional?.options[0]?.feedbackText || '',
          selected: true,
          showFeedback: true,
        }]
      });
    }

    setResponses(initialResponses);
  }, [sections]);

  // Handler for text changes in the TextArea
  const handleFeedbackChange = (sectionIndex, optionIndex, value) => {
    const updatedResponses = [...responses];
    updatedResponses[sectionIndex].options[optionIndex].feedbackText = value;
    
    setResponses(updatedResponses);
    localStorage.setItem('savedResponses', JSON.stringify(updatedResponses));
  };
  
  // Handler for checkboxes
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

  // Save handler
  const handleSave = () => {
    const evaluationId = localStorage.getItem('evaluationId');
    
    const observerId = localStorage.getItem('observerId') || localStorage.getItem('userId');
    const instructorInfoRaw = localStorage.getItem('selectedInstructor');
    
    console.log('=== Data Check in MainForm ===');
    console.log('localStorage observerId:', localStorage.getItem('observerId'));
    console.log('localStorage userId:', localStorage.getItem('userId'));
    console.log('Final observerId:', observerId);
    console.log('evaluationId:', evaluationId);
    console.log('instructorInfoRaw:', instructorInfoRaw);
    console.log('==============================');
    
    const missingFields = [];
    
    if (!evaluationId) missingFields.push('Evaluation ID');
    if (!observerId) missingFields.push('Observer ID (userId или observerId)');
    if (!instructorInfoRaw) missingFields.push('Instructor Info');
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      alert(`The necessary data is missing:\n${missingFields.join('\n')}\n\nPlease start the process again.`);
      return;
    }

    let instructorInfo = null;
    try {
      instructorInfo = JSON.parse(instructorInfoRaw);
    } catch (e) {
      console.error('Error parsing instructor info:', e);
      alert('An error occurred while processing the instructors data. Please start again.');
      return;
    }

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
    
    console.log("✅ Selected options with feedbacks:", selectedOptions);

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

  // Custom toggle for the accordion
  const CustomToggle = ({ children, eventKey }) => {
    const decoratedOnClick = useAccordionToggle(eventKey, () => {});
    return (
      <Button type="button" variant="link" onClick={decoratedOnClick}>
        {children}
      </Button>
    );
  };

  // --- COMPONENT RENDER LOGIC ---
  return (
    <>
      <Header />
      <div>
        <h4>Select all observations that apply. Click on the headers to expand/collapse and use the search bar on the right to quickly find key words.</h4>
        <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
      </div>
      <div>
        <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <Accordion defaultActiveKey="0">
            {/* Iterate over the full array to preserve stable indices */}
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
                  <Form.Check
                    type="checkbox"
                    label={option.description}
                    checked={option.selected}
                    onChange={() => handleCheckboxChange(originalIndex, optionIndex)}
                  />
                ) : (
                  <p>{option.description}</p>
                )}
                {option.showFeedback && (
                  <TextArea
                    value={option.feedbackText || ''}
                    onChange={(e) => handleFeedbackChange(originalIndex, optionIndex, e.target.value)}
                  />
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
          <Button type="submit" className="mt-3">Save and Continue</Button>
        </Form>
      </div>
    </>
  );
};

export default MainForm;
