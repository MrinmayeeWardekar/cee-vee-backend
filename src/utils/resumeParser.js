const mammoth = require('mammoth');
const fs = require('fs');
const PDFParser = require('pdf2json');

// Extract text from PDF using pdf2json
const parsePDF = async (filePath) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', (errData) => {
      reject(new Error('Failed to parse PDF: ' + errData.parserError));
    });

    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        let fullText = '';
        
        // Extract text from all pages
        if (pdfData.Pages) {
          pdfData.Pages.forEach(page => {
            if (page.Texts) {
              page.Texts.forEach(text => {
                if (text.R) {
                  text.R.forEach(r => {
                    if (r.T) {
                      fullText += decodeURIComponent(r.T) + ' ';
                    }
                  });
                }
              });
            }
          });
        }
        
        resolve(fullText);
      } catch (error) {
        reject(new Error('Failed to extract text: ' + error.message));
      }
    });

    pdfParser.loadPDF(filePath);
  });
};

// Extract text from DOCX
const parseDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error('Failed to parse DOCX: ' + error.message);
  }
};

// Main parser function
const parseResume = async (filePath, fileType) => {
  let extractedText = '';

  if (fileType === 'pdf') {
    extractedText = await parsePDF(filePath);
  } else if (fileType === 'docx') {
    extractedText = await parseDOCX(filePath);
  }

  // Basic parsing logic
  const parsedData = {
    name: extractName(extractedText),
    email: extractEmail(extractedText),
    phone: extractPhone(extractedText),
    skills: extractSkills(extractedText),
    education: [],
    experience: []
  };

  return { extractedText, parsedData };
};

// Helper functions for extraction
const extractEmail = (text) => {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const match = text.match(emailRegex);
  return match ? match[0] : '';
};

const extractPhone = (text) => {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : '';
};

const extractName = (text) => {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  return lines[0] ? lines[0].trim() : '';
};

const extractSkills = (text) => {
  const skillKeywords = [
    'JavaScript', 'Python', 'React', 'Node.js', 'MongoDB', 'SQL', 
    'Java', 'C++', 'HTML', 'CSS', 'TypeScript', 'Express', 'Docker',
    'AWS', 'Git', 'REST API', 'GraphQL', 'Angular', 'Vue'
  ];
  const foundSkills = [];
  
  skillKeywords.forEach(skill => {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });
  
  return foundSkills;
};

module.exports = { parseResume };