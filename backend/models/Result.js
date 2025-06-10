// Result model for MongoDB using Mongoose
const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    answers: [{ questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }, selectedAnswer: Number }],
    score: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Result', resultSchema); 