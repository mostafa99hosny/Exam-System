const mongoose = require('mongoose');

const examRetrySchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin who granted retry
    reason: { type: String, required: true }, // Reason for retry
    isUsed: { type: Boolean, default: false }, // Whether retry has been used
    grantedAt: { type: Date, default: Date.now },
    usedAt: { type: Date },
});

// Ensure one retry per student per exam
examRetrySchema.index({ studentId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model('ExamRetry', examRetrySchema);
