import React from 'react';
import { Accordion, Card, Form } from 'react-bootstrap';

const AccordionSection = ({ sections }) => {
  if (!sections || sections.length === 0) {
    return null; // Render nothing if sections is undefined or empty
  }

  return (
      <Accordion defaultActiveKey="0">
        {sections.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            {/* Accordion.Toggle should be used within Card.Header */}
            <Accordion.Toggle as={Card.Header} eventKey={String(sectionIndex)}>
              {section.title}
            </Accordion.Toggle>
            {/* Accordion.Collapse should be used within Card.Body */}
            <Accordion.Collapse eventKey={String(sectionIndex)}>
              <Card.Body>
                {/* Mapping over options array */}
                {section.options.map((option, optionIndex) => (
                  <Form.Check
                    key={optionIndex}
                    type="checkbox"
                    label={option}
                    // Adjust checked state based on your logic
                    checked={false} // Replace with your logic for checked state
                    readOnly
                    disabled
                  />
                ))}
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        ))}
      </Accordion>
    );
  };

  export default AccordionSection;
