 import React, { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Accordion, Card, Button } from 'react-bootstrap';
 import './mainform.css';
 import { API_BASE_URL } from '../../constants';

 const Recommendations = ({ sections }) => {
   const [recommendations, setRecommendations] = useState([]);
   const navigate = useNavigate();

   useEffect(() => {
     // Fetch recommendations from the backend
     fetch(`${API_BASE_URL}/api/options`)
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










