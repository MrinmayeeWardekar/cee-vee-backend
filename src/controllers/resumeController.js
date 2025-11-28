const Resume = require('../models/resume');
const { parseResume } = require('../utils/resumeParser');
const path = require('path');
const fs = require('fs');

// @desc    Upload and parse resume
// @route   POST /api/resume/upload
exports.uploadResume = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const { filename, path: filePath, mimetype } = req.file;
    const fileType = mimetype === 'application/pdf' ? 'pdf' : 'docx';

    // Parse the resume
    const { extractedText, parsedData } = await parseResume(filePath, fileType);

    // Save resume data to MongoDB
    const resume = await Resume.create({
      userId: req.user.id,
      fileName: filename,
      filePath: filePath,
      fileType: fileType,
      extractedText: extractedText,
      parsedData: parsedData
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        fileType: resume.fileType,
        parsedData: resume.parsedData,
        uploadedAt: resume.uploadedAt
      }
    });
  } catch (error) {
    // Delete file if processing failed
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all resumes for logged-in user
// @route   GET /api/resume/my-resumes
exports.getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .select('-extractedText') // Don't send full text in list
      .sort('-uploadedAt');

    res.status(200).json({
      success: true,
      count: resumes.length,
      resumes: resumes
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single resume by ID
// @route   GET /api/resume/:id
exports.getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.status(200).json({
      success: true,
      resume: resume
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete resume
// @route   DELETE /api/resume/:id
exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Delete file from disk
    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }

    // Delete from database
    await Resume.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};