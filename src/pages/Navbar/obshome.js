import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import './obshome.css';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';

const ObsHome = () => {
  const [classInfoList, setClassInfoList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/classes/with-instructors`)
      .then(response => {
        setClassInfoList(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  const handleRowClick = (info) => {
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
      const evaluationId = response.data.evaluation_id;

      localStorage.setItem("evaluationId", evaluationId);

      navigate('/Evaluate');
    } catch (error) {
      console.error(error);
      alert("Failed to start evaluation.");
    }
  };

  return (
    <>
      <Header />
      <div className="obs-container">
        <div className="obs-card">
          <h1 className="obs-heading">Teaching Evaluation</h1>
          <p className="obs-subtext">
            Select an instructor and class from the list below to begin.
          </p>

          <div className="table-responsive">
            <table className="obs-table">
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Course Title</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {classInfoList.map((info) => (
                  <tr
                    key={info.classId}
                    onClick={() => handleRowClick(info)}
                    className={selectedClassId === info.classId ? 'selected-row' : ''}
                  >
                    <td>{info.instructorFirstName}</td>
                    <td>{info.instructorLastName}</td>
                    <td>{info.instructorEmail}</td>
                    <td>{info.title}</td>
                    <td>{info.description}</td>
                  </tr>
                ))}
                {classInfoList.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>No classes found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button
            className="btn obs-button text-center"
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