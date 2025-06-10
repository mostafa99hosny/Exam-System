const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const resultController = require('../controllers/resultController');

router.get('/', auth, resultController.getAllResults);
router.post('/', auth, resultController.submitExam);
router.get('/student/:studentId', auth, resultController.getResultsByStudent);
router.get('/exam/:examId', auth, resultController.getResultsByExam);

module.exports = router;