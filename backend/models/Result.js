const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selectedAnswer: Number,
        isCorrect: { type: Boolean, default: false },
        marksAwarded: { type: Number, default: 0 }
    }],
    score: { type: Number, required: true }, // Total marks obtained
    totalMarks: { type: Number, required: true }, // Total possible marks
    percentage: { type: Number, required: true }, // Calculated percentage
    isPassed: { type: Boolean, default: false }, // Whether student passed (>= 60%)
    attemptNumber: { type: Number, default: 1 }, // Which attempt this is (1 or 2)
    submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Result', resultSchema);