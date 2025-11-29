const Resume = require('../models/resume');

// Simple rule-based chatbot responses
exports.chat = async (req, res) => {
  try {
    const { message, resumeId } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a message' 
      });
    }

    let response = '';

    // Get resume data if resumeId provided
    let resumeData = null;
    if (resumeId) {
      resumeData = await Resume.findOne({
        _id: resumeId,
        userId: userId
      });
    }

    const userMessage = message.toLowerCase().trim();

    // ===== RESUME-SPECIFIC QUESTIONS =====
    if (resumeData) {
      // Skills questions
      if (userMessage.includes('skill') || userMessage.includes('expertise') || userMessage.includes('proficiency')) {
        const skills = resumeData.parsedData?.skills || [];
        if (skills.length > 0) {
          response = `Based on the resume, this candidate has expertise in: ${skills.join(', ')}.`;
        } else {
          response = 'I couldn\'t extract specific skills from the resume. Please review the resume directly.';
        }
      }
      
      // Email questions
      else if (userMessage.includes('email') || userMessage.includes('contact') || userMessage.includes('reach')) {
        const email = resumeData.parsedData?.email || 'Not found in resume';
        response = `The email address from the resume is: ${email}`;
      }

      // Phone questions
      else if (userMessage.includes('phone') || userMessage.includes('call') || userMessage.includes('number')) {
        const phone = resumeData.parsedData?.phone || 'Not found in resume';
        response = `The phone number from the resume is: ${phone}`;
      }

      // Name questions
      else if (userMessage.includes('name') || userMessage.includes('who is')) {
        const name = resumeData.parsedData?.name || 'Not found in resume';
        response = `According to the resume, the candidate\'s name is: ${name}`;
      }

      // Experience questions
      else if (userMessage.includes('experience') || userMessage.includes('work') || userMessage.includes('job')) {
        response = 'I can see the resume contains work experience. Please review the full resume for detailed job descriptions and duration.';
      }

      // Education questions
      else if (userMessage.includes('education') || userMessage.includes('degree') || userMessage.includes('university')) {
        response = 'The resume contains education information. Please review the education section for details about degrees and institutions.';
      }

      // Summary questions
      else if (userMessage.includes('summary') || userMessage.includes('overview') || userMessage.includes('candidate profile')) {
        const skills = resumeData.parsedData?.skills || [];
        const skillsText = skills.length > 0 ? ` Key skills include: ${skills.slice(0, 3).join(', ')}.` : '';
        response = `This resume shows a professional with relevant experience.${skillsText}`;
      }
    }

    // ===== GENERAL ADVICE QUESTIONS =====
    if (!response) {
      if (userMessage.includes('improve') || userMessage.includes('better') || userMessage.includes('enhance')) {
        response = 'To improve a resume: 1) Add quantifiable achievements, 2) Include relevant keywords, 3) Keep it concise (1 page), 4) Use action verbs, 5) Proofread for errors.';
      }
      
      else if (userMessage.includes('format') || userMessage.includes('structure') || userMessage.includes('layout')) {
        response = 'A good resume format includes: Contact info at top, Professional summary, Work experience (with accomplishments), Education, and Skills section. Use consistent formatting and clear headings.';
      }

      else if (userMessage.includes('length') || userMessage.includes('how long')) {
        response = 'Keep your resume to 1 page if you have less than 5 years experience, and 1-2 pages if you have more experience. Recruiters spend only 6 seconds on each resume!';
      }

      else if (userMessage.includes('keyword') || userMessage.includes('ats') || userMessage.includes('applicant tracking')) {
        response = 'Use relevant keywords from job descriptions in your resume. This helps get past Applicant Tracking Systems (ATS). Match your skills and experience to what the job posting asks for.';
      }

      else if (userMessage.includes('cover letter')) {
        response = 'A cover letter should be 3-4 paragraphs. Paragraph 1: Why you\'re interested. Paragraph 2-3: Your relevant skills and achievements. Paragraph 4: Call to action and closing.';
      }

      else if (userMessage.includes('achievement') || userMessage.includes('accomplishment')) {
        response = 'Include specific, quantifiable achievements. Instead of "responsible for sales", write "Increased sales by 25% in Q3 2023". Use numbers, percentages, and results.';
      }

      else if (userMessage.includes('skill') || userMessage.includes('expertise')) {
        response = 'List both technical and soft skills. Technical: Programming languages, tools, software. Soft: Communication, leadership, teamwork. Prioritize skills relevant to the job.';
      }

      else if (userMessage.includes('experience')) {
        response = 'Use the STAR method: Situation, Task, Action, Result. For example: "Led a team of 5 (Situation) to redesign the website (Task) using React (Action), resulting in 40% faster load time (Result)."';
      }

      else if (userMessage.includes('education')) {
        response = 'Include your degree, major, university, and graduation year. Add relevant coursework, projects, or honors if still a student or recent graduate. You can omit GPA if it\'s below 3.5.';
      }

      else if (userMessage.includes('gap') || userMessage.includes('employment gap')) {
        response = 'Employment gaps don\'t need to be a problem. You can briefly explain them (e.g., "Pursued professional development" or "Personal reasons"). Focus on what you learned or accomplished during that time.';
      }

      else if (userMessage.includes('objective') || userMessage.includes('summary')) {
        response = 'A professional summary is a 2-3 line overview of your experience and goals. Example: "Experienced Full Stack Developer with 5 years expertise in React and Node.js. Seeking roles in innovative tech companies."';
      }
    }

    // ===== DEFAULT RESPONSE =====
    if (!response) {
      response = 'I can help you with: 1) Questions about an uploaded resume, 2) Resume improvement tips, 3) Resume formatting advice, 4) Career guidance. What would you like to know?';
    }

    // Send response
    res.status(200).json({
      success: true,
      message: response,
      timestamp: new Date()
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};