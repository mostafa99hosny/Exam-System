const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const questionController = require('../controllers/questionController');

router.post('/', auth, questionController.createQuestion);
router.put('/:id', auth, questionController.updateQuestion);
router.delete('/:id', auth, questionController.deleteQuestion);
router.get('/exam/:examId', auth, questionController.getQuestionsByExam);

module.exports = router;