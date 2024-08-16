import './App.css';
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route} from "react-router-dom";
import Home from "./pages/Navbar/home";
import Reports from "./pages/Navbar/reports";
import Help from "./pages/Navbar/help";
import IntroForm from "./pages/Evaluation/intro";
import MainForm from "./pages/Evaluation/mainform";
import Rec from "./pages/Evaluation/rec";
import ReportViewer from './pages/Evaluation/reportviewer';
import SelectedRecommendations from "./pages/Evaluation/recommendations";
import ReviewRecommendations from "./pages/Evaluation/reviewrecommendations";
import Login from "./pages/Login/login";
import Signup from "./pages/Login/register"

function App() {

const [evaluation, setEvaluation] = useState({
    observer: {},
    instructor: {},
    classInfo: {},
    sections: [
      { title: "1. Specific Activities", options: [
        { section_id: 1, description: "Students giving fact responses" },
        { section_id: 2, description: "Instructor and/or students producing a lot of information" },
        { section_id: 3, description: "Students form their own groups, with some left out, not inclusive or functioning well" },
        { section_id: 4, description: "Long lecture/students distracted/few students participating"},
        { section_id: 5, description: "Some students not contributing/some dominating"},
        { section_id: 6, description: "Class ends w/o recap or reinforcing main points"},
        { section_id: 7, description: "Students not all participating in activities and/or not enjoying"},
        { section_id: 8, description: "Discussion activities not eliciting robust or critical responses"},
        { section_id: 9, description: "Lecture dominates, especially as instructor demonstration of skills"},
        { section_id: 10, description: "Lack of indication of student understanding/seeming confusion toward end of class"},
        { section_id: 11, description: "Lecture dominates/apparent confusion/students quiet"},
        { section_id: 12, description: "Lack of indication of student understanding/Students not all participating in activities and/or not enjoying"},
        {section_id: 13, description: "Students appear off task or unengaged, few or no students volunteer to answer instructor questions"}
      ] },
      { title: "2. Student-Instructor Interactions", options: [
          { section_id: 14, description: "Lecture dominates, with lots of facts, no indication of student comprehension" },
          { section_id: 15, description: "A few students dominate discussion, many not speaking/students distracted" },
          { section_id: 16, description: "Instructor asks questions that leave little room for student explanation or error" },
          { section_id: 17, description: "Lecture dominates, with lots of facts, no indication of student comprehension" },
          { section_id: 18, description: "Few students dominate, many not speaking/instructor moves on after single response" },
          { section_id: 19, description: "Little indication of student understanding/a few “bright” students dominate" },
          { section_id: 20, description: "Students offered unsupported or erroneous claims, instructor quickly affirmed or corrected student responses"},
          { section_id: 21, description: "Instructor answers his/her own question, gives students many hints to get correct answer"}
      ] },
      { title: "3. Content Focused Instructor Choices", options: [
        { section_id: 22, description: "Learning activities had unclear or tenuous connection to learning objectives"},
        { section_id: 23, description: "Most questions are fact-focused/memory" },
        { section_id: 24, description: "Little or no time spent correcting errors or misunderstandings" },
        { section_id: 25, description: "Lecture dominates, especially with fact- based content" },
        { section_id: 26, description: "Students confused or uncooperative/an activity is abrupt or novel" },
        { section_id: 27, description: "Instructor identifies correct and incorrect answers but offer little help for improvement" },
        { section_id: 28, description: "Class ends abruptly, class ends early, class session incorporated many disparate ideas" },
        { section_id: 29, description: "Student understanding is not clear, misunderstandings possible" },
        { section_id: 30, description: "Class session rife with facts, disconnected, meaning or import of material not explicit" }
      ] },
      { title: "4. Expectations for Student Behavior", options: [
        { section_id: 31, description: "Students packing up before class end"},
        { section_id: 32, description: "Students tardy"},
        { section_id: 33, description: "Little participation"}
      ] },
      { title: "5. Pacing", options: [
        { section_id: 34, description: "Class starts with no explicit plan, no hook, no connection to course trajectory"},
        { section_id: 35, description: "Facts dominate, students are confused or show no indication of deep understanding"},
        { section_id: 36, description: "Pace of speech or activities increases"},
        { section_id: 37, description: "Students doing single activity for more than 30 mins"},
        { section_id: 38, description: "students appear confused about what is expected of them or why they are being asked to do something"},
        { section_id: 39, description: "Class starts with no explicit plan, no hook, no connection to course trajectory; students appear confused about what is expected of them or why they are being asked to do something"}
      ] },
      { title: "6. Affect", options: [
        { section_id: 40, description: "Instructor clearly reading off notes, not speaking extemporaneously"},
        { section_id: 41, description: "Instructor not interacting with students before class, focused on preparing and setting up"},
        { section_id: 42, description: "Instructor disregards or ignores student confusion or struggles"},
        { section_id: 43, description: "Instructor presentation is unenthusiastic, little variation in tone, gestures, or expressions"},
        { section_id: 44, description: "Instructor offers little room for student ideas or disagreement, presents information without logic or rationale"}
      ] },
      { title: "7. Speech & Delivery", options: [
        { section_id: 45, description: "Instructor remains in one physical location"},
        { section_id: 46, description: "Instructor presents crucial information only once, without repeating or rephrasing"},
        { section_id: 47, description: "Instructor often responds immediately to students contributions that were complex or hard to hear"},
        { section_id: 48, description: "Instructor speech is fast, difficult to understand"},
        { section_id: 49, description: "Instructor speech is hard to hear"},
        { section_id: 50, description: "Instructor uses unnecessary or excessive technical terms"},
        { section_id: 51, description: "Instructor speaks in monotone"}
      ] },
      { title: "8. Visuals & PPT", options: [
       { section_id: 52, description: "PowerPoints slides begin with course logistics or content"},
       { section_id: 53, description: "Students struggle to take notes based on PowerPoint, or students write only verbatim"},
       { section_id: 54, description: "PowerPoint slides are text and graphic only; lecture using PowerPoint is long (more than 15 minutes)"},
       { section_id: 55, description: "PowerPoint slides often have more than 20 words per slide; or significant extraneous information"},
       { section_id: 56, description: "Images and texts are overlapping, making it hard to see or read"},
       { section_id: 57, description: "Slides use “traditional” method: a Title/topic heading with elaboration details in body"},
       { section_id: 58, description: "Instructor does not use projector, white board, or doc cam when these tools could help present or organize material"},
       { section_id: 59, description: "Visual presentation of material is confusing or indiscriminate"}
      ] }
    ],
    responses: []
  });

  const handleNextStep = (stepData) => {
    setEvaluation({ ...evaluation, ...stepData });
  };

  const saveSection = (response) => {
    setEvaluation({ ...evaluation, responses: response });
  };

  const completeEvaluation = () => {
    // Save evaluation to backend
    console.log("Evaluation submitted:", evaluation);
  };

  return (
    <BrowserRouter>
        <Routes>
           <Route path="/home" element={<Home />} />
           <Route path="/" element={<Login />} />
           <Route path="/signup" element={<Signup />} />
           <Route path="/reports" element={<Reports />} />
           <Route path="/viewReport" element={<ReportViewer />} />
           <Route path="/help" element={<Help />} />
           <Route path="/EvaluationIntro" element={<IntroForm nextStep={(data) => handleNextStep(data)} />} />
           <Route path="/Evaluate" element={<MainForm sections={evaluation.sections} saveSection={saveSection} />} />
           <Route path="/SelectedRecommendations" element={<SelectedRecommendations evaluation={evaluation} />} />
           <Route path="/ReviewRecommendations" element={<ReviewRecommendations completeEvaluation={completeEvaluation} />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
