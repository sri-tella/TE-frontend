import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/header';
import './home.css';

const Home = () => {
  return (
    <>
      <Header />
      <div className="home-container">
        <h1 className="home-heading">Welcome to Teaching Observation Application</h1>
        <h2>  Please choose your role: </h2>
        <div className="home-content">
          <Link to="/obshome" className="obslink">Observer</Link>
          <Link to="/InstructorIntro" className="inslink">Instructor</Link>
        </div>
      </div>
    </>
  );
};

export default Home;
