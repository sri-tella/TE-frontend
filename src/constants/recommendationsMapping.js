const recommendationsMapping = {
  "Specific Activities": {
    "Students giving mostly fact responses": ["Ask students to make connections"],
    "Instructor and/or students producing a lot of information": ["Ask students to paraphrase or summarize"],
    "Students form their own groups, with some left out, not inclusive or functioning well": ["Assign groups"],
    "Long lecture with students distracted, or few students participating": ["Brief Writing Exercises"],
    "Group work with some students not contributing or some dominating": ["Change student roles during activities"],
    "Students not all participating in activities and/or not enjoying": ["Enhance activities with alternative technology"],
    "Discussion activities not eliciting robust or critical responses": ["Fishbowl exercise"],
    "Lecture dominates, especially as instructor demonstration of skills": ["Give practice time"],
    "Lecture dominates with apparent confusion or students quiet": ["Peer to peer teaching"],
    "Students not all participating in activities": ["Think-pair-share"],
    "Students appear off task or unengaged, few or no students volunteer to answer instructor questions": ["Use polling or voting"]
  },
  "Student-Instructor Interactions": {
    "Lecture dominates with no indication of student comprehension": ["Ask more questions"],
    "A few students dominate whole class discussion": ["Cold Calling"],
    "Instructor asks questions that leave little room for student explanation or error": ["Give less info when asking students for answers"],
    "Instructor moves on after single response": ["Solicit multiple responses"],
    "Little indication of student understanding with a few bright students dominating": ["Solicit questions from students"],
    "Students offered unsupported or erroneous claims": ["Use Socratic method"],
    "Instructor answers his/her own question, gives students many hints to get correct answer": ["Wait for students to generate responses"],
  },
  "Content Focused Instructor Choices": {
    "Learning activities had unclear or tenuous connection to learning objectives": ["Align activities with learning objective"],
    "Most instructor questions are fact focused": ["Ask students higher-order thinking questions"],
    "Students confused or uncooperative or an activity is abrupt or novel": ["Explain to students reasons for activity"],
    "Instructor identifies correct and incorrect answers but offer little help for improvement": ["Give specific suggestions for improvement"],
    "Class ends abruptly, class ends early, class session incorporated many disparate ideas": ["Include a summary"],
    "Class session rife with facts, disconnected, meaning or import of material not explicit": ["Make materials relatable or contextualized"]
  },
  "Expectations for Student Behavior": {
    "Students packing up before class end": ["Discourage packing up early"],
    "Students tardy": ["Discourage tardiness"],
    "Little participation": ["Encourage or incentivize participation"]
  },
  "Pacing": {
    "Class ends without recap or reinforcing main points": ["End class with low stakes assessment"],
    "Lack of indication of student understanding or seeming confusion toward the end of class": ["Muddiest point"],
    "Class starts with no explicit plan, no hook, no connection to course trajectory": ["Be intentional in how you start class"],
    "Pace of speech or activities increases": ["Don’t rush at the end"],
    "Students doing single activity for more than 30 mins": ["Give breaks"],
    "students appear confused about what is expected of them or why they are being asked to do something": ["Make explicit verbal transitions"],
    "Class starts with no explicit plan, no hook, no connection to course trajectory; students appear confused about what is expected of them or why they are being asked to do something": ["Share plans for class"]
  },
  "Affect": {
    "Instructor clearly reading off notes, not speaking extemporaneously": ["Don’t read off notes"],
    "Instructor not interacting with students before class, focused on preparing and setting up": ["Make small talk before class"],
    "Instructor disregards or ignores student confusion or struggles": ["Show empathy"],
    "Instructor presentation is unenthusiastic, little variation in tone, gestures, or expressions": ["Show excitement for material"],
    "Instructor offers little room for student ideas or disagreement, presents information without logic or rationale": ["Take less authoritative role"]
  },
  "Speech & Delivery": {
    "Instructor remains in one physical location": ["Move around the room"],
    "Instructor presents crucial information only once, without repeating or rephrasing": ["Repeat yourself"],
    "Instructor often responds immediately to students contributions that were complex or hard to hear": ["Repeat or summarize student comments/questions"],
    "Instructor speech is fast, difficult to understand": ["Slow down speech"],
    "Instructor speech is hard to hear": ["Speak more loudly"],
    "Instructor uses unnecessary or excessive technical terms": ["Speak more clearly"],
    "Instructor speaks in monotone": ["Vary delivery of speech"]
  },
  "Visuals & PPT": {
    "PowerPoints slides begin with course logistics or content": ["Add organization slide to PPT"],
    "Students struggle to take notes based on PowerPoint, or students write only verbatim": ["Consider how PPT is used by students"],
    "PowerPoint slides are text and graphic only; lecture using PowerPoint is long (more than 15 minutes)": ["Incorporate outside resources (e.g., videos)"],
    "PowerPoint slides often have more than 20 words per slide; or significant extraneous information": ["Reduce extra information on PPT slides"],
    "Images and texts are overlapping, making it hard to see or read": ["Separate text from Images on slides"],
    "Slides use “traditional” method: a Title/topic heading with elaboration details in body": ["Use Assertion- Evidence method"],
    "Instructor does not use projector, white board, or doc cam when these tools could help present or organize material": [],
    "Visual presentation of material is confusing or indiscriminate": ["Use available presentation methods"]
  },
};

export default recommendationsMapping;
