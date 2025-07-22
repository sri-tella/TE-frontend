import React from 'react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import './home.css';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');

    if (role === 'OBSERVER') {
      navigate('/obshome');
    } else if (role === 'INSTRUCTOR') {
      navigate('/inshome');
    } else if (role === 'ADMIN') {
            navigate('/admhome');
    }
  }, [navigate]);

  return (
    <>
      <Header />
      <div className="home-container">
        <h1 className="home-heading">Welcome to Teaching Observation Application</h1>
        <h2>  Please choose your role: </h2>
        <div className="home-content">
          <Link to="/obshome" className="obslink">Observer</Link>
          <Link to="/inshome" className="inslink">Instructor</Link>
        </div>
      </div>
    </>
  );
};

export default Home;
