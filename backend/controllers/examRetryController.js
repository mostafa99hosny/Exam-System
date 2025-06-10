const ExamRetry = require('../models/ExamRetry');
const Result = require('../models/Result');
const User = require('../models/User');
const Exam = require('../models/Exam');

// Grant retry permission to a student
exports.grantRetry = async (req, res) => {
    const { studentId, examId, reason } = req.body;
    
    try {
        // Check if admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        
        // Check if student exists
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ msg: 'Student not found' });
        }
        
        // Check if exam exists
        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ msg: 'Exam not found' });
        }
        
        // Check if student has failed the exam
        const results = await Result.find({ studentId, examId }).sort({ submittedAt: -1 });
        if (results.length === 0) {
            return res.status(400).json({ msg: 'Student has not taken this exam yet' });
        }
        
        const latestResult = results[0];
        if (latestResult.isPassed) {
            return res.status(400).json({ msg: 'Student has already passed this exam' });
        }
        
        if (results.length >= 2) {
            return res.status(400).json({ msg: 'Student has already used their retry attempt' });
        }
        
        // Check if retry already granted
        const existingRetry = await ExamRetry.findOne({ studentId, examId });
        if (existingRetry) {
            return res.status(400).json({ msg: 'Retry permission already granted for this exam' });
        }
        
        // Grant retry
        const retry = new ExamRetry({
            studentId,
            examId,
            grantedBy: req.user.id,
            reason
        });
        
        await retry.save();
        
        // Populate the response
        const populatedRetry = await ExamRetry.findById(retry._id)
            .populate('studentId', 'username email')
            .populate('examId', 'title')
            .populate('grantedBy', 'username');
            
        res.json(populatedRetry);
    } catch (err) {
        console.error('Error granting retry:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get all retry permissions
exports.getAllRetries = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        
        const retries = await ExamRetry.find()
            .populate('studentId', 'username email')
            .populate('examId', 'title')
            .populate('grantedBy', 'username')
            .sort({ grantedAt: -1 });
            
        res.json(retries);
    } catch (err) {
        console.error('Error getting retries:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get retry permissions for a specific student
exports.getStudentRetries = async (req, res) => {
    try {
        const studentId = req.user.role === 'admin' ? req.params.studentId : req.user.id;
        
        const retries = await ExamRetry.find({ studentId })
            .populate('examId', 'title description')
            .populate('grantedBy', 'username')
            .sort({ grantedAt: -1 });
            
        res.json(retries);
    } catch (err) {
        console.error('Error getting student retries:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Check if student can retry an exam
exports.canRetryExam = async (req, res) => {
    const { examId } = req.params;

    try {
        // Check existing results
        const results = await Result.find({ studentId: req.user.id, examId })
            .sort({ attemptNumber: -1 });

        if (results.length === 0) {
            return res.json({ canRetry: true, reason: 'First attempt' });
        }

        // Check if maximum attempts reached (3 total)
        if (results.length >= 3) {
            return res.json({ canRetry: false, reason: 'Maximum attempts reached (3/3)' });
        }

        const latestResult = results[0]; // Latest result (sorted by attemptNumber desc)

        // If already passed, no retry needed
        if (latestResult.percentage >= 60) {
            return res.json({ canRetry: false, reason: 'Already passed' });
        }

        // If failed on first attempt, automatic retry allowed
        if (results.length === 1) {
            return res.json({ canRetry: true, reason: 'Automatic retry after first failure' });
        }

        // For subsequent attempts, check if admin granted retry permission
        const retry = await ExamRetry.findOne({
            studentId: req.user.id,
            examId,
            isUsed: false
        });

        if (!retry) {
            return res.json({
                canRetry: false,
                reason: 'Admin permission required for additional retry'
            });
        }

        res.json({
            canRetry: true,
            reason: 'Admin granted retry permission',
            retry
        });
    } catch (err) {
        console.error('Error checking retry permission:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Revoke retry permission
exports.revokeRetry = async (req, res) => {
    const { retryId } = req.params;
    
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        
        const retry = await ExamRetry.findById(retryId);
        if (!retry) {
            return res.status(404).json({ msg: 'Retry permission not found' });
        }
        
        if (retry.isUsed) {
            return res.status(400).json({ msg: 'Cannot revoke used retry permission' });
        }
        
        await ExamRetry.findByIdAndDelete(retryId);
        res.json({ msg: 'Retry permission revoked' });
    } catch (err) {
        console.error('Error revoking retry:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};
