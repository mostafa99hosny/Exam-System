const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const examController = require('../controllers/examController');

router.get('/', auth, examController.getExams);
router.post('/', auth, examController.createExam);
router.put('/:id', auth, examController.updateExam);
router.delete('/:id', auth, examController.deleteExam);

module.exports = router;