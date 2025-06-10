const Exam = require('../models/Exam');

exports.getExams = async (req, res) => {
    try {
        const exams = await Exam.find().populate('createdBy', 'username');
        res.json(exams);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.createExam = async (req, res) => {
    console.log('Request body:', req.body);
    const { title, description, duration } = req.body;
    try {
        const exam = new Exam({
            title,
            description,
            duration,
            createdBy: req.user.id,
        });
        await exam.save();
        res.json(exam);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

exports.updateExam = async (req, res) => {
    const { title, description, duration } = req.body;
    try {
        let exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });
        if (exam.createdBy.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        exam.title = title || exam.title;
        exam.description = description || exam.description;
        exam.duration = duration || exam.duration;
        await exam.save();
        res.json(exam);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.deleteExam = async (req, res) => {
    try {
        let exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });
        if (exam.createdBy.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await Exam.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Exam removed' });
    } catch (err) {
        console.error('Error deleting exam:', err);
        res.status(500).send('Server error');
    }
};