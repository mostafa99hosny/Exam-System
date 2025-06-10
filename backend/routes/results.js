const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const resultController = require('../controllers/resultController');

router.get('/', auth, resultController.getAllResults);
router.post('/', auth, resultController.submitExam);
router.get('/my-results', auth, resultController.getMyResults);
router.get('/student/:studentId', auth, resultController.getResultsByStudent);
router.get('/exam/:examId', auth, resultController.getResultsByExam);

// Exam reset management routes
router.get('/student/:studentId/history', auth, resultController.getStudentExamHistory);
router.post('/reset-exam', auth, resultController.resetExamForStudent);
router.get('/failed-students', auth, resultController.getFailedStudents);

module.exports = router;