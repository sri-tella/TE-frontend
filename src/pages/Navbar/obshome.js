import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import './obshome.css';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
// Библиотека для перетаскивания
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const ObsHome = () => {
  const [activeClasses, setActiveClasses] = useState([]);
  const [archivedClasses, setArchivedClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const navigate = useNavigate();

  // --- 1. ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = () => {
    axios.get(`${API_BASE_URL}/api/classes/with-instructors`)
      .then(response => {
        const allData = response.data;
        
        // Фильтруем: если isArchived = true -> в архив, иначе -> в активные
        // (Это поле isArchived мы добавили в Java контроллере)
        const active = allData.filter(item => !item.isArchived);
        const archived = allData.filter(item => item.isArchived);

        setActiveClasses(active);
        setArchivedClasses(archived);
      })
      .catch(error => {
        console.error("Error fetching classes:", error);
      });
  };

  // --- 2. СОХРАНЕНИЕ НА СЕРВЕР ---
  const updateArchiveStatus = (classId, status) => {
    // Отправляем true/false на наш новый эндпоинт
    axios.put(`${API_BASE_URL}/api/classes/${classId}/archive`, status, {
        headers: { 'Content-Type': 'application/json' }
    })
    .catch(err => console.error("Failed to update archive status", err));
  };

  // Выбор класса (клик по карточке)
  const handleClassSelect = (info) => {
    setSelectedClassId(info.classId);
    localStorage.setItem("selectedInstructor", JSON.stringify({
      instructorId: info.instructorId,
      instructorEmail: info.instructorEmail,
      instructorFirstName: info.instructorFirstName,
      instructorLastName: info.instructorLastName,
      classId: info.classId,
      courseTitle: info.title,
      courseDescription: info.description
    }));
  };

  // --- 3. ЛОГИКА ПЕРЕТАСКИВАНИЯ ---
  const onDragEnd = (result) => {
    const { source, destination } = result;

    // Если бросили мимо или вернули на то же место
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Определяем, откуда и куда тащим
    let sourceList = source.droppableId === 'active' ? activeClasses : archivedClasses;
    let destList = destination.droppableId === 'active' ? activeClasses : archivedClasses;

    // Копируем массивы
    const newSourceList = Array.from(sourceList);
    const newDestList = source.droppableId === destination.droppableId ? newSourceList : Array.from(destList);

    // Перемещаем элемент
    const [movedItem] = newSourceList.splice(source.index, 1);
    newDestList.splice(destination.index, 0, movedItem);

    // Обновляем состояние React и отправляем запрос на сервер
    if (source.droppableId === 'active' && destination.droppableId === 'archive') {
        // -> В АРХИВ
        setActiveClasses(newSourceList);
        setArchivedClasses(newDestList);
        if (movedItem.classId === selectedClassId) setSelectedClassId(null); // Снимаем выделение
        
        updateArchiveStatus(movedItem.classId, true); // Сохраняем в БД

    } else if (source.droppableId === 'archive' && destination.droppableId === 'active') {
        // -> В АКТИВНЫЕ
        setArchivedClasses(newSourceList);
        setActiveClasses(newDestList);
        
        updateArchiveStatus(movedItem.classId, false); // Сохраняем в БД

    } else {
        // Перестановка внутри одной колонки (сортировка)
        if (source.droppableId === 'active') setActiveClasses(newDestList);
        else setArchivedClasses(newDestList);
    }
  };

  // Кнопка "Начать оценку"
  const handleStartObservation = async () => {
    const observerEmail = localStorage.getItem("email");
    const instructorInfo = JSON.parse(localStorage.getItem("selectedInstructor"));

    if (!observerEmail || !instructorInfo) {
      alert("Missing observer or instructor data.");
      return;
    }

    try {
      const observerRes = await axios.get(`${API_BASE_URL}/api/observers/email/${observerEmail}`);
      const observerId = observerRes.data.observer_id;
      const startDate = new Date().toISOString().split('T')[0];
      
      const evaluationPayload = {
        observerId,
        instructorId: instructorInfo.instructorId,
        classId: instructorInfo.classId,
        date: startDate
      };

      const response = await axios.post(`${API_BASE_URL}/api/evaluations/start`, evaluationPayload);
      localStorage.setItem("evaluationId", response.data.evaluation_id);
      navigate('/Evaluate');
    } catch (error) {
      console.error(error);
      alert("Failed to start evaluation.");
    }
  };

  // Компонент карточки
  const ClassCard = ({ info, index, isSelected, isClickable = true }) => (
    <Draggable draggableId={String(info.classId)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`class-card ${isSelected ? 'selected-card' : ''}`}
          // ВАЖНО: Если isClickable ложь, функция выбора не сработает
          onClick={() => isClickable && handleClassSelect(info)}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1,
            // Если нельзя кликнуть — курсор обычный, иначе — рука
            cursor: isClickable ? 'pointer' : 'default'
          }}
        >
          <div className="card-header">
            <strong>{info.title}</strong>
          </div>
          <div className="card-body">
            <span className="instructor-name">{info.instructorFirstName} {info.instructorLastName}</span>
            <small>{info.instructorEmail}</small>
            <p>{info.description}</p>
          </div>
        </div>
      )}
    </Draggable>
  );

  return (
    <>
      <Header />
      <div className="obs-container">
        <h1 className="obs-heading">Teaching Evaluation</h1>
        
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="dnd-container">
            
            {/* Левая колонка: Активные */}
            <div className="dnd-column">
              <h3>Available Classes</h3>
              <Droppable droppableId="active">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`class-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {activeClasses.map((info, index) => (
                      <ClassCard 
                        key={info.classId} 
                        info={info} 
                        index={index} 
                        isSelected={selectedClassId === info.classId}
                      />
                    ))}
                    {provided.placeholder}
                    {activeClasses.length === 0 && <p className="empty-msg">No active classes</p>}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Правая колонка: Архив */}
            <div className="dnd-column archive-column">
              <h3>Archive 🗑️</h3>
              <Droppable droppableId="archive">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`class-list archive-list ${snapshot.isDraggingOver ? 'dragging-over-archive' : ''}`}
                  >
                    {archivedClasses.map((info, index) => (
                      <ClassCard 
                        key={info.classId} 
                        info={info} 
                        index={index} 
                        isSelected={false} 
                        isClickable={false} /* <--- ДОБАВИТЬ ВОТ ЭТО */
                      />
                    ))}
                    {provided.placeholder}
                    {archivedClasses.length === 0 && <p className="empty-msg">Drop here to archive</p>}
                  </div>
                )}
              </Droppable>
            </div>

          </div>
        </DragDropContext>

        <div className="actions-area">
            <button
            className="btn obs-button"
            disabled={!selectedClassId}
            onClick={handleStartObservation}
            >
            Start Evaluation
            </button>
        </div>
      </div>
    </>
  );
};

export default ObsHome;