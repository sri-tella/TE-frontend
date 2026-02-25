import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import './obshome.css';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { classService, evaluationService } from '../../services/apiService';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const ObsHome = () => {
  const [activeClasses, setActiveClasses] = useState([]);
  const [archivedClasses, setArchivedClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = () => {
classService.fetchClasses()
      .then(response => {
        const allData = response.data;
        const active = allData.filter(item => !item.isArchived);
        const archived = allData.filter(item => item.isArchived);

        setActiveClasses(active);
        setArchivedClasses(archived);
      })
      .catch(error => {
        console.error("Error fetching classes:", error);
      });
  };

  const updateArchiveStatus = (classId, status) => {
classService.updateArchiveStatus(classId, status)
    .catch(err => console.error("Failed to update archive status", err));
  };

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

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    let sourceList = source.droppableId === 'active' ? activeClasses : archivedClasses;
    let destList = destination.droppableId === 'active' ? activeClasses : archivedClasses;

    const newSourceList = Array.from(sourceList);
    const newDestList = source.droppableId === destination.droppableId ? newSourceList : Array.from(destList);

    const [movedItem] = newSourceList.splice(source.index, 1);
    newDestList.splice(destination.index, 0, movedItem);

    if (source.droppableId === 'active' && destination.droppableId === 'archive') {
        setActiveClasses(newSourceList);
        setArchivedClasses(newDestList);
        if (movedItem.classId === selectedClassId) setSelectedClassId(null);
        
        updateArchiveStatus(movedItem.classId, true);

    } else if (source.droppableId === 'archive' && destination.droppableId === 'active') {
        setArchivedClasses(newSourceList);
        setActiveClasses(newDestList);
        
        updateArchiveStatus(movedItem.classId, false);

    } else {
        if (source.droppableId === 'active') setActiveClasses(newDestList);
        else setArchivedClasses(newDestList);
    }
  };

  const handleStartObservation = async () => {
    const observerEmail = localStorage.getItem("email");
    const instructorInfo = JSON.parse(localStorage.getItem("selectedInstructor"));

    if (!observerEmail || !instructorInfo) {
      alert("Missing observer or instructor data.");
      return;
    }

        try {
          const response = await evaluationService.startEvaluation(observerEmail, instructorInfo);
          localStorage.setItem("evaluationId", response.data.evaluation_id);
          
          // Clear previous session data
          localStorage.removeItem('savedResponses');
          localStorage.removeItem('selectedRecommendations');
          
          navigate('/Evaluate');
        } catch (error) {      console.error(error);
      alert("Failed to start evaluation.");
    }
  };

  const ClassCard = ({ info, index, isSelected, isClickable = true }) => (
    <Draggable draggableId={String(info.classId)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`class-card ${isSelected ? 'selected-card' : ''}`}
          onClick={() => isClickable && handleClassSelect(info)}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1,
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
                        isClickable={false}
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