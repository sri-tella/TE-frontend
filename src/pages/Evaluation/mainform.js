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
    // В идеале вы бы загружали данные с бэкенда, но для примера используем localStorage
    const storedResponses = JSON.parse(localStorage.getItem('savedResponses') || '[]');
    
    // Инициализируем состояние с учетом сохраненных данных
    const initialResponses = sections.map(section => {
      const normalized = normalizeTitle(section.title);
      const storedSection = storedResponses.find(res => normalizeTitle(res.title) === normalized) || {};
      
      return {
        title: section.title,
        options: section.options.map(option => {
          const storedOption = storedSection.options?.find(opt => opt.description === option.description);
          return {
            ...option,
            // Если есть сохраненные данные, используем их
            selected: storedOption?.selected || false,
            showFeedback: storedOption?.selected || false,
            feedbackText: storedOption?.feedbackText || ''
          };
        })
      };
    });

    setResponses(initialResponses);
  }, [sections]);

  const handleCheckboxChange = (sectionIndex, optionIndex) => {
    const updatedResponses = [...responses];
    const option = updatedResponses[sectionIndex].options[optionIndex];

    option.selected = !option.selected;
    option.showFeedback = option.selected;

    // Очищаем feedbackText, если опция была снята
    if (!option.selected) {
      option.feedbackText = '';
    }

    setResponses(updatedResponses);

    // Сохраняем состояние в localStorage для persistence
    localStorage.setItem('savedResponses', JSON.stringify(updatedResponses));
  };

  const handleFeedbackChange = (sectionIndex, optionIndex, value) => {
    const updatedResponses = [...responses];
    updatedResponses[sectionIndex].options[optionIndex].feedbackText = value;
    
    setResponses(updatedResponses);
    
    // Сохраняем состояние в localStorage
    localStorage.setItem('savedResponses', JSON.stringify(updatedResponses));
  };
  
  const handleSave = () => {
    const evaluationId = localStorage.getItem('evaluationId');
    if (!evaluationId) {
      console.error("Evaluation ID not found in localStorage.");
      return;
    }
    console.log(responses,'Важно ')
    const selectedOptions = responses.flatMap((section) =>
      section.options
        .filter(option => option.selected)
        .map(option => ({
          ...option,
          sectionTitle: normalizeTitle(section.title),
        }))
    );
    
    console.log("Selected options with feedbacks:", selectedOptions);

    navigate('/SelectedRecommendations', {
      state: {
        evaluationId,
        selectedOptions,
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

  const filteredResponses = responses.map(section => ({
    ...section,
    options: section.options.filter(option =>
      option.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.options.length > 0
  );
  
  // Добавляем раздел "9. Additional Feedback" в filteredResponses
  const additionalFeedbackSection = {
    title: '9. Additional Feedback',
    options: [{
      description: 'Additional Feedback',
      feedbackText: responses.find(sec => sec.title === '9. Additional Feedback')?.options[0]?.feedbackText || '',
      selected: true, // Всегда "выбран" для отображения TextArea
      showFeedback: true,
    }]
  };
  const allSections = [...filteredResponses, additionalFeedbackSection];

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
                      <div key={optionIndex}>
                        <Form.Check
                          type="checkbox"
                          label={option.description}
                          checked={option.selected}
                          onChange={() => handleCheckboxChange(sectionIndex, optionIndex)}
                        />
                        {option.showFeedback && (
                          <TextArea
                            value={option.feedbackText || ''}
                            onChange={(e) => handleFeedbackChange(sectionIndex, optionIndex, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            ))}
            {/* Карточка для дополнительного фидбека */}
            <Card>
              <Card.Header>
                <CustomToggle eventKey={String(responses.length)}>
                  9. Additional Feedback
                </CustomToggle>
              </Card.Header>
              <Accordion.Collapse eventKey={String(responses.length)}>
                <Card.Body>
                  <TextArea
                    // Находим нужный объект в состоянии для этого TextArea
                    value={responses.find(sec => normalizeTitle(sec.title) === 'Additional Feedback')?.options[0]?.feedbackText || ''}
                    onChange={(e) => {
                      // Логика для сохранения "дополнительного фидбека"
                      const updatedResponses = [...responses];
                      const additionalSectionIndex = updatedResponses.findIndex(sec => normalizeTitle(sec.title) === 'Additional Feedback');
                      if (additionalSectionIndex !== -1) {
                         updatedResponses[additionalSectionIndex].options[0].feedbackText = e.target.value;
                         setResponses(updatedResponses);
                         localStorage.setItem('savedResponses', JSON.stringify(updatedResponses));
                      }
                    }}
                  />
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