import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import '../Navbar/home.css';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';

const ObsHome = () => {
  const [classInfoList, setClassInfoList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/classes/with-instructors`)
      .then(response => {
        console.log("Fetched class info with instructors:", response.data);
        setClassInfoList(response.data);
      })
      .catch(error => {
        console.error("Error fetching class and instructor data:", error);
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
      // Fetch observerId using the email
      const observerRes = await axios.get(`${API_BASE_URL}/api/observers/email/${observerEmail}`);
      const observerId = observerRes.data.observer_id;

      // Create Evaluation
      const startDate = new Date().toISOString().split('T')[0]; // today
      const evaluationPayload = {
        observerId,
        instructorId: instructorInfo.instructorId,
        classId: instructorInfo.classId,
        date: startDate
      };

      const response = await axios.post(`${API_BASE_URL}/api/evaluations/start`, evaluationPayload);
      const evaluationId = response.data.evaluation_id;

      // Store evaluationId in localStorage for use throughout the session
      localStorage.setItem("evaluationId", evaluationId);

      navigate('/Evaluate');
    } catch (error) {
      console.error("Failed to start evaluation:", error);
      alert("Failed to start evaluation. Please try again.");
    }
  };

  return (
    <>
      <Header />
      <div className="home-container">
        <h1 className="home-heading">Welcome to Teaching Evaluation Application</h1>
        <h3 className="instruction-text">
          Please select an instructor and class to begin evaluation:
        </h3>

        <table className="instructor-table">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Course Title</th>
              <th>Course Description</th>
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
          </tbody>
        </table>

        <button
          className="start-evaluation-link"
          disabled={!selectedClassId}
          onClick={handleStartObservation}
        >
          Start Evaluation
        </button>
      </div>
    </>
  );
};

export default ObsHome;
