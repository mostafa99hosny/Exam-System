// Question model for MongoDB using Mongoose
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    text: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: Number, required: true }, 
    marks: { type: Number, required: true },
});

module.exports = mongoose.model('Question', questionSchema);