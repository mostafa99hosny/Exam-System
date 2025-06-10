const Result = require('../models/Result');
const Question = require('../models/Question');

exports.submitExam = async (req, res) => {
    const { examId, answers } = req.body;
    try {
        let score = 0;
        for (let answer of answers) {
            const question = await Question.findById(answer.questionId);
            if (question && answer.selectedAnswer === question.correctAnswer) {
                score += question.marks;
            }
        }
        const result = new Result({
            studentId: req.user.id,
            examId,
            answers,
            score,
        });
        await result.save();
        res.json(result);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.getResultsByStudent = async (req, res) => {
    try {
        const results = await Result.find({ studentId: req.params.studentId }).populate('examId', 'title');
        res.json(results);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.getResultsByExam = async (req, res) => {
    try {
        const results = await Result.find({ examId: req.params.examId }).populate('studentId', 'username');
        res.json(results);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.getMyResults = async (req, res) => {
    try {
        const results = await Result.find({ studentId: req.user.id })
            .populate('studentId', 'username email')
            .populate('examId', 'title description duration')
            .sort({ submittedAt: -1 });
        res.json(results);
    } catch (err) {
        console.error('Error getting my results:', err);
        res.status(500).send('Server error');
    }
};

exports.getAllResults = async (req, res) => {
    try {
        const results = await Result.find()
            .populate('studentId', 'username email')
            .populate('examId', 'title description duration')
            .sort({ submittedAt: -1 });
        res.json(results);
    } catch (err) {
        console.error('Error getting all results:', err);
        res.status(500).send('Server error');
    }
};