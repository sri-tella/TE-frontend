import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion, Card, Button, Form, useAccordionToggle } from 'react-bootstrap';
import Header from '../../components/Header/header';
import SearchBar from '../../components/Searchbar/searchbar';
import TextArea from '../../components/Textarea/textarea';
import './mainform.css';


const MainForm = ({ sections, saveSection }) => {
  const [responses, setResponses] = useState(
    sections.map(section => ({
      title: section.title,
      options: section.options.map(option => ({ ...option, selected: false }))
    }))
  );
  const [feedbacks, setFeedbacks] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const normalizeTitle = (title) => title.replace(/^\d+\.\s*/, '');
//  console.log("Available localStorage keys:", Object.fromEntries(Object.entries(localStorage)));
//  useEffect(() => {
//
//    const storedOptions = JSON.parse(localStorage.getItem('selectedOptions') || '[]');
//    const storedFeedbacks = JSON.parse(localStorage.getItem('sectionFeedbacks') || '{}');
//      // Initialize responses state based on sections received
//      const initialResponses = sections.map(section => ({
//        title: section.title,
//        options: section.options.map(option => ({ ...option, selected: false }))
//      }));
//      setResponses(initialResponses);
//    }, [sections]);

useEffect(() => {
  const storedOptions = JSON.parse(localStorage.getItem('selectedOptions') || '[]');
  const storedFeedbacks = JSON.parse(localStorage.getItem('sectionFeedbacks') || '{}');

  const initialResponses = sections.map(section => {
    const normalized = normalizeTitle(section.title);
    const selectedDescriptions = storedOptions
      .filter(opt => normalizeTitle(opt.sectionTitle) === normalized)
      .map(opt => opt.description);

    return {
      title: section.title,
      options: section.options.map(option => ({
        ...option,
        selected: selectedDescriptions.includes(option.description)
      }))
    };
  });

  setResponses(initialResponses);
  setFeedbacks(storedFeedbacks);
}, [sections]);

  const handleCheckboxChange = (sectionIndex, optionIndex) => {
    const updatedResponses = [...responses];
    updatedResponses[sectionIndex].options[optionIndex].selected = !updatedResponses[sectionIndex].options[optionIndex].selected;
    setResponses(updatedResponses);

    const selectedOptions = updatedResponses.flatMap(section =>
        section.options
          .filter(option => option.selected)
          .map(option => ({
            section_id: option.section_id,
            sectionTitle: normalizeTitle(section.title),
            description: option.description,
            feedback: feedbacks[normalizeTitle(section.title)] || ''
          }))
      );
      localStorage.setItem('selectedOptions', JSON.stringify(selectedOptions));
  };

  const handleFeedbackChange = (sectionTitle, value) => {
      const normalized = normalizeTitle(sectionTitle);
//      setFeedbacks(prev => ({ ...prev, [normalized]: value }));
      const updated = { ...feedbacks, [normalized]: value };
      setFeedbacks(updated);
      const selectedOptions = responses.flatMap(section =>
          section.options
            .filter(option => option.selected)
            .map(option => ({
              section_id: option.section_id,
              sectionTitle: normalizeTitle(section.title),
              description: option.description,
              feedback: updated[normalizeTitle(section.title)] || ''
            }))
        );
        localStorage.setItem('selectedOptions', JSON.stringify(selectedOptions));
        localStorage.setItem('sectionFeedbacks', JSON.stringify(updated));
    };


  const handleSave = () => {
  const evaluationId = localStorage.getItem('evaluationId');
    if (!evaluationId) {
      console.error("Evaluation ID not found in localStorage.");
      return;
    }

       const selectedOptions = responses.flatMap((section) =>
             section.options
               .filter(option => option.selected)
               .map(option => {
                 const normalized = normalizeTitle(section.title);
                 return {
                   section_id: option.section_id,
                   sectionTitle: normalized,
                   description: option.description,
                   feedback: feedbacks[normalized] || ''
                 };
               })
           );

       console.log("selected options:", selectedOptions)

       navigate('/SelectedRecommendations', {
           state: {
             evaluationId,
             selectedOptions,
             feedbacks
           }
         });
       };


      // Send POST request to save selected sections
//      fetch('http://localhost:8080/api/options/saveSelected', {
//        method: 'POST',
//        headers: {
//          'Content-Type': 'application/json',
//        },
//        body: JSON.stringify(selectedOptions),
//      })
//      .then(response => response.json())
//      .then(data => {
//        console.log('Save successful:', data);
//        navigate('/SelectedRecommendations');
//      })
//      .catch(error => console.error('Error saving selected sections:', error));
//    };

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
      >
        {children}
      </Button>
    );
  };

  const filteredResponses = responses.map(section => ({
      ...section,
      options: section.options.filter(option =>
        option.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(section =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.options.length > 0
    );

  return (
  <>
  <Header/>
  <div>
    <h4>Select all observations that apply. Click on the headers to expand/collapse and use the search bar on the right to quickly find key words.</h4>
    <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
    </div>
    <div>
    <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <Accordion defaultActiveKey="0">
        {filteredResponses.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            <Card.Header>
              <CustomToggle eventKey={String(sectionIndex)}>
                {section.title}
              </CustomToggle>
            </Card.Header>
            <Accordion.Collapse eventKey={String(sectionIndex)}>
              <Card.Body>
                {section.options.map((option, optionIndex) => (
                  <Form.Check
                    key={optionIndex}
                    type="checkbox"
                    label={option.description}
                    checked={option.selected}
                    onChange={() => handleCheckboxChange(sectionIndex, optionIndex)}
                  />
                ))}
                <TextArea
                value={feedbacks[normalizeTitle(section.title)] || ''}
                  onChange={(e) => handleFeedbackChange(section.title, e.target.value)}/>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        ))}
        <Card>
          <Card.Header>
            <CustomToggle eventKey={String(responses.length)}>
              9. Additional Feedback
            </CustomToggle>
          </Card.Header>
          <Accordion.Collapse eventKey={String(responses.length)}>
            <Card.Body>
              <TextArea value={feedbacks['Additional Feedback'] || ''}
                          onChange={(e) => handleFeedbackChange('Additional Feedback', e.target.value)}/>
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
      <Button type="submit" className="mt-3">Save and Continue</Button>
    </Form>
  </div>
 </>
  );
};

export default MainForm;
