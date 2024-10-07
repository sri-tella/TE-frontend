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
        <div className="home-content">
          <Link to="/EvaluationIntro" className="start-evaluation-link">Start New Observation</Link>
        </div>
      </div>
    </>
  );
};

export default Home;
