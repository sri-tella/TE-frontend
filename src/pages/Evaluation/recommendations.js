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

  const [responses, setResponses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const observerId = localStorage.getItem('observerId');
  const instructorInfo = JSON.parse(localStorage.getItem("selectedInstructor"));
  const instructorId = instructorInfo?.instructorId;
  const classId = instructorInfo?.classId;
  const evaluationId = parseInt(localStorage.getItem('evaluationId'), 10);

  const normalizeTitle = (title) => title.replace(/^\d+\.\s*/, '');

  useEffect(() => {
    // 1. Загрузка сохраненных ответов из localStorage
    const storedResponses = JSON.parse(localStorage.getItem('selectedRecommendations') || '[]');
    
    // 2. Инициализация состояния из recommendationsMapping
    let initialResponses = Object.entries(recommendationsMapping).map(([sectionTitle, recGroups]) => {
      const normalized = normalizeTitle(sectionTitle);
      const storedSection = storedResponses.find(res => normalizeTitle(res.title) === normalized) || {};
      
      return {
        title: sectionTitle,
        options: Object.entries(recGroups).flatMap(([observation, recommendations]) => 
          recommendations.map(recommendation => {
            const isSelected = selectedOptions.some(opt => opt.description === observation);
            const storedOption = storedSection.options?.find(opt => opt.description === recommendation);
            return {
              description: recommendation,
              observedDescription: observation,
              selected: storedOption?.selected ?? isSelected,
              showFeedback: storedOption?.selected ?? isSelected,
              feedbackText: storedOption?.feedbackText || ''
            };
          })
        )
      };
    });

    // 3. Гарантированное добавление секции "Additional Feedback" в состояние
    const additionalFeedbackTitle = 'Additional Feedback';
    const hasAdditionalFeedback = initialResponses.some(sec => normalizeTitle(sec.title) === additionalFeedbackTitle);

    if (!hasAdditionalFeedback) {
      const storedAdditional = storedResponses.find(res => normalizeTitle(res.title) === additionalFeedbackTitle);
      initialResponses.push({
        title: additionalFeedbackTitle,
        options: [{
          description: 'Please type in any additional feedback or comments.',
          feedbackText: storedAdditional?.options?.[0]?.feedbackText || '',
          selected: true,
          showFeedback: true,
        }]
      });
    }

    setResponses(initialResponses);
  }, [selectedOptions]);

  // Обработчик для изменения текста в TextArea
  const handleFeedbackChange = (sectionIndex, optionIndex, value) => {
    const updatedResponses = [...responses];
    updatedResponses[sectionIndex].options[optionIndex].feedbackText = value;
    
    setResponses(updatedResponses);
    localStorage.setItem('selectedRecommendations', JSON.stringify(updatedResponses));
  };
  
  // Обработчик для чекбоксов
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
    localStorage.setItem('selectedRecommendations', JSON.stringify(updatedResponses));
  };

  // Обработчик сохранения
  const handleSave = () => {
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
    
    console.log("Selected recommendations with feedbacks:", selectedOptions);

    navigate('/viewReport', {
      state: {
        evaluationId,
        selectedRecommendations: selectedOptions,
        observerId,
        instructorId,
        classId
      }
    });
  };

  const handleGoBack = () => {
    localStorage.setItem('selectedRecommendations', JSON.stringify(responses));
    navigate('/Evaluate');
  };

  const CustomToggle = ({ children, eventKey }) => {
    const decoratedOnClick = useAccordionToggle(eventKey, () => {});
    return (
      <Button type="button" variant="link" onClick={decoratedOnClick}>
        {children}
      </Button>
    );
  };

  return (
    <>
      <Header />
      <div>
        <h4>Here are possible recommendations. Some are selected based on your observations in the previous step. Click on the headers to expand/collapse and use the search bar on the right to quickly find key words.</h4>
        <SearchBar searchQuery={searchQuery} handleSearchChange={setSearchQuery} />
      </div>
      <div>
        <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <Accordion defaultActiveKey="0">
            {responses.map((section, originalIndex) => {
              
              // 4. Умная фильтрация: ищет в заголовке, описании И тексте TextArea
              const filteredOptions = section.options.filter(option =>
                searchQuery === '' ||
                section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                option.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (option.feedbackText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (option.observedDescription || '').toLowerCase().includes(searchQuery.toLowerCase())
              );

              // Скрываем секцию, если в ней нет совпадений (кроме "Additional Feedback")
              if (filteredOptions.length === 0 && normalizeTitle(section.title) !== 'Additional Feedback') {
                return null;
              }

              // Группируем отфильтрованные опции по observedDescription для рендеринга
              const groupedOptions = filteredOptions.reduce((acc, option) => {
                const obs = option.observedDescription || 'General';
                if (!acc[obs]) {
                  acc[obs] = [];
                }
                acc[obs].push(option);
                return acc;
              }, {});

              return (
                <Card key={originalIndex}>
                  <Card.Header>
                    <CustomToggle eventKey={String(originalIndex)}>
                      {section.title}
                    </CustomToggle>
                  </Card.Header>
                  <Accordion.Collapse eventKey={String(originalIndex)}>
                    <Card.Body>
                      {Object.entries(groupedOptions).map(([obs, opts]) => (
                        <div key={obs} className="mb-3">
                          <h5>{obs}</h5>
                          {opts.map((option) => {
                            // 5. Находим оригинальный индекс опции для корректного обновления состояния
                            const originalOptionIndex = section.options.findIndex(o => o.description === option.description);
                            if (originalOptionIndex === -1) return null;

                            return (
                              <div key={originalOptionIndex}>
                                {normalizeTitle(section.title) !== 'Additional Feedback' ? (
                                  <Form.Check
                                    type="checkbox"
                                    label={option.description}
                                    checked={option.selected}
                                    onChange={() => handleCheckboxChange(originalIndex, originalOptionIndex)}
                                  />
                                ) : (
                                  <p>{option.description}</p>
                                )}
                                
                                {option.showFeedback && (
                                  <TextArea
                                    value={option.feedbackText || ''}
                                    onChange={(e) => handleFeedbackChange(originalIndex, originalOptionIndex, e.target.value)}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </Card.Body>
                  </Accordion.Collapse>
                </Card>
              );
            })}
          </Accordion>
          <div className="mt-3">
            <Button onClick={handleGoBack} className="button-custom mr-2">
              Go Back
            </Button>
            <Button type="submit" className="button-custom mr-3">
              Save and Edit Report
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
};

export default SelectedRecommendations;
