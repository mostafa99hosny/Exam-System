const Question = require('../models/Question');
const Exam = require('../models/Exam');

exports.createQuestion = async (req, res) => {
    const { examId, text, options, correctAnswer, marks } = req.body;
    try {
        const exam = await Exam.findById(examId);
        if (!exam || exam.createdBy.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const question = new Question({ examId, text, options, correctAnswer, marks });
        await question.save();
        exam.questions.push(question._id);
        await exam.save();
        res.json(question);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.updateQuestion = async (req, res) => {
    const { text, options, correctAnswer, marks } = req.body;
    try {
        let question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ msg: 'Question not found' });
        const exam = await Exam.findById(question.examId);
        if (!exam || exam.createdBy.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        question.text = text || question.text;
        question.options = options || question.options;
        question.correctAnswer = correctAnswer !== undefined ? correctAnswer : question.correctAnswer;
        question.marks = marks || question.marks;
        await question.save();
        res.json(question);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        let question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ msg: 'Question not found' });
        const exam = await Exam.findById(question.examId);
        if (!exam || exam.createdBy.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await Question.findByIdAndDelete(req.params.id);
        await Exam.findByIdAndUpdate(question.examId, { $pull: { questions: question._id } });
        res.json({ msg: 'Question removed' });
    } catch (err) {
        console.error('Error deleting question:', err);
        res.status(500).send('Server error');
    }
};

exports.getQuestionsByExam = async (req, res) => {
    try {
        const questions = await Question.find({ examId: req.params.examId });
        res.json(questions);
    } catch (err) {
        res.status(500).send('Server error');
    }
};