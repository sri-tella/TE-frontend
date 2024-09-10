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

  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
      // Initialize responses state based on sections received
      const initialResponses = sections.map(section => ({
        title: section.title,
        options: section.options.map(option => ({ ...option, selected: false }))
      }));
      setResponses(initialResponses);
    }, [sections]);

  const handleCheckboxChange = (sectionIndex, optionIndex) => {
    const updatedResponses = [...responses];
    updatedResponses[sectionIndex].options[optionIndex].selected = !updatedResponses[sectionIndex].options[optionIndex].selected;
    setResponses(updatedResponses);
  };

  const handleSave = () => {
      // Prepare data to send to backend
      const selectedOptions = responses.flatMap((section, sectionIndex) =>
            section.options
              .filter(option => option.selected)
              .map(option => ({
                section_id: option.section_id
              }))
          );

       console.log(selectedOptions)

      // Send POST request to save selected sections
      fetch('https://te-backend-production.up.railway.app/api/options/saveSelected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedOptions),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Save successful:', data);
        navigate('/SelectedRecommendations');
      })
      .catch(error => console.error('Error saving selected sections:', error));
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
        style={{ marginBottom: '1rem'}}
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
    <h4>Select all that apply based on what you observed:</h4>
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
                <TextArea />
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
              <TextArea />
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
      <Button onClick={() => navigate('/EvaluationIntro')} className="button-custom mr-2">
                  Go Back
                </Button>
      <Button type="submit" className="mr-3">Save and Continue</Button>
    </Form>
  </div>
 </>
  );
};

export default MainForm;
