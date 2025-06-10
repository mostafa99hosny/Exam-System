const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const examRetryController = require('../controllers/examRetryController');

// Grant retry permission (admin only)
router.post('/grant', auth, examRetryController.grantRetry);

// Get all retry permissions (admin only)
router.get('/', auth, examRetryController.getAllRetries);

// Get retry permissions for a specific student
router.get('/student/:studentId', auth, examRetryController.getStudentRetries);

// Get my retry permissions
router.get('/my-retries', auth, examRetryController.getStudentRetries);

// Check if can retry specific exam
router.get('/can-retry/:examId', auth, examRetryController.canRetryExam);

// Revoke retry permission (admin only)
router.delete('/:retryId', auth, examRetryController.revokeRetry);

module.exports = router;
