//import React, { useState, useEffect } from 'react';
//import { useNavigate } from 'react-router-dom';
//import { Accordion, Card, Form, Button } from 'react-bootstrap';
//import './mainform.css';
//
//const Recommendations = ({ sections }) => {
//  const [recommendations, setRecommendations] = useState([]);
//
//  useEffect(() => {
//    // Fetch recommendations from the backend
//    fetch('http://localhost:8080/api/options')
//      .then(response => response.json())
//      .then(data => {
//        console.log('Fetched recommendations:', data);
//        setRecommendations(data); // Assuming data is an array of recommendations with `sectionId` property
//      })
//      .catch(error => console.error('Error fetching recommendations:', error));
//  }, []);
//
//  const navigate = useNavigate();
//
//  const handleCheckboxChange = (recommendationId) => {
//    // Implement logic to handle recommendation selection
//    // Update state accordingly
//  };
//
//  const handleSave = () => {
//    // Implement logic to save selected recommendations
//    // Example: Send selected recommendations to the backend
//    const selectedRecommendations = recommendations.filter(rec => rec.selected);
//    fetch('http://localhost:8080/api/saveSelectedRecommendations', {
//      method: 'POST',
//      headers: {
//        'Content-Type': 'application/json',
//      },
//      body: JSON.stringify(selectedRecommendations),
//    })
//    .then(response => response.json())
//    .then(data => {
//      console.log('Save successful:', data);
//      navigate('/Confirmation'); // Navigate to confirmation page or any desired route
//    })
//    .catch(error => console.error('Error saving selected recommendations:', error));
//  };
//
//  return (
//    <>
//      <h4>Recommendations Page</h4>
//      <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
//        <Accordion defaultActiveKey="0">
//          {sections.map((section, sectionIndex) => (
//            <Card key={sectionIndex}>
//              <Card.Header>
//                <Accordion.Toggle as={Button} variant="link" eventKey={String(sectionIndex)}>
//                  {section.title}
//                </Accordion.Toggle>
//              </Card.Header>
//              <Accordion.Collapse eventKey={String(sectionIndex)}>
//                <Card.Body>
//                  {section.options.map((option, optionIndex) => {
//                    const associatedRecommendations = recommendations.filter(rec => rec.sectionId === section.sectionId && rec.optionId === option.optionId);
//                    const isChecked = associatedRecommendations.length > 0 ? associatedRecommendations[0].selected : false;
//
//                    return (
//                      <Form.Check
//                        key={optionIndex}
//                        type="checkbox"
//                        label={option.description}
//                        checked={isChecked}
//                        onChange={() => handleCheckboxChange(option.optionId)}
//                      />
//                    );
//                  })}
//                </Card.Body>
//              </Accordion.Collapse>
//            </Card>
//          ))}
//        </Accordion>
//        <Button onClick={() => navigate('/MainForm')} className="mr-2">
//          Go Back
//        </Button>
//        <Button type="submit" className="mr-3">Save and Continue</Button>
//      </Form>
//    </>
//  );
//};
//
//export default Recommendations;

//import React, { useState, useEffect } from 'react';
//import { useNavigate } from 'react-router-dom';
//import { Accordion, Card, Form, Button } from 'react-bootstrap';
//import './mainform.css';
//
//const Recommendations = ({ sections }) => {
//  const [recommendations, setRecommendations] = useState([]);
//
//  useEffect(() => {
//    // Fetch recommendations from the backend
//    fetch('http://localhost:8080/api/options')
//      .then(response => response.json())
//      .then(data => {
//        console.log('Fetched recommendations:', data);
//        setRecommendations(data); // Assuming data is an array of recommendations with `sectionId`, `rec_id`, `description`, and `selected` properties
//      })
//      .catch(error => console.error('Error fetching recommendations:', error));
//  }, []);
//
//  const navigate = useNavigate();
//
//  const handleCheckboxChange = (recId) => {
//    // Implement logic to handle recommendation selection
//    setRecommendations(recommendations.map(rec =>
//      rec.rec_id === recId ? { ...rec, selected: !rec.selected } : rec
//    ));
//  };
//
//  const handleSave = () => {
//    // Implement logic to save selected recommendations
//    const selectedRecommendations = recommendations.filter(rec => rec.selected);
//    fetch('http://localhost:8080/api/saveSelectedRecommendations', {
//      method: 'POST',
//      headers: {
//        'Content-Type': 'application/json',
//      },
//      body: JSON.stringify(selectedRecommendations),
//    })
//    .then(response => response.json())
//    .then(data => {
//      console.log('Save successful:', data);
//      navigate('/ReviewRecommendations'); // Navigate to confirmation page or any desired route
//    })
//    .catch(error => console.error('Error saving selected recommendations:', error));
//  };
//
//  if (!sections || sections.length === 0) {
//    return <div>Loading...</div>; // Handle case when sections is undefined or empty
//  }
//
//  return (
//    <>
//      <h4>Recommendations Page</h4>
//      <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
//        <Accordion defaultActiveKey="0">
//          {sections.map((section, sectionIndex) => (
//            <Card key={sectionIndex}>
//              <Card.Header>
//                <Accordion.Toggle as={Button} variant="link" eventKey={String(sectionIndex)}>
//                  {section.title}
//                </Accordion.Toggle>
//              </Card.Header>
//              <Accordion.Collapse eventKey={String(sectionIndex)}>
//                <Card.Body>
//                  {section.options.map((option, optionIndex) => {
//                    const associatedRecommendation = recommendations.find(rec => rec.sectionId === option.section_id && rec.rec_id === option.optionId);
//                    const isChecked = associatedRecommendation ? associatedRecommendation.selected : false;
//
//                    return (
//                      <Form.Check
//                        key={optionIndex}
//                        type="checkbox"
//                        label={option.description}
//                        checked={isChecked}
//                        onChange={() => handleCheckboxChange(option.optionId)}
//                      />
//                    );
//                  })}
//                </Card.Body>
//              </Accordion.Collapse>
//            </Card>
//          ))}
//        </Accordion>
//        <Button onClick={() => navigate('/MainForm')} className="mr-2">
//          Go Back
//        </Button>
//        <Button type="submit" className="mr-3">Save and Continue</Button>
//      </Form>
//    </>
//  );
//};
//
//export default Recommendations;

 import React, { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Accordion, Card, Button } from 'react-bootstrap';
 import './mainform.css';

 const Recommendations = ({ sections }) => {
   const [recommendations, setRecommendations] = useState([]);
   const navigate = useNavigate();

   useEffect(() => {
     // Fetch recommendations from the backend
     fetch('http://localhost:8080/api/options')
       .then(response => response.json())
       .then(data => {
         console.log('Fetched recommendations:', data);
         setRecommendations(data); // Assuming data is an array of recommendations
       })
       .catch(error => console.error('Error fetching recommendations:', error));
   }, []);

   if (!sections || sections.length === 0) {
     return <div>Loading...</div>; // Handle case when sections is undefined or empty
   }

   return (
     <>
       <h4>Recommendations Page</h4>
       <Accordion defaultActiveKey="0">
         {sections.map((section, sectionIndex) => (
           <Card key={sectionIndex}>
             <Card.Header>
               <Accordion.Toggle as={Button} variant="link" eventKey={String(sectionIndex)}>
                 {section.title}
               </Accordion.Toggle>
             </Card.Header>
             <Accordion.Collapse eventKey={String(sectionIndex)}>
               <Card.Body>
                 <ul>
                   {recommendations
                     .filter(rec => rec.sectionId === sectionIndex + 1) // Match section ID
                     .map(recommendation => (
                       <li key={recommendation.recId}>
                         {recommendation.description} {recommendation.selected && <span>&#x2713;</span>}
                       </li>
                     ))}
                   {recommendations.filter(rec => rec.sectionId === sectionIndex + 1).length === 0 && (
                     <li>No recommendations available for this section.</li>
                   )}
                 </ul>
               </Card.Body>
             </Accordion.Collapse>
           </Card>
         ))}
       </Accordion>
       <Button onClick={() => navigate('/MainForm')} className="mr-2">
         Go Back
       </Button>
       <Button className="mr-3">Save and Continue</Button>
     </>
   );
 };

 export default Recommendations;










