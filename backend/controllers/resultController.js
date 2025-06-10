const Result = require('../models/Result');
const Question = require('../models/Question');
const ExamRetry = require('../models/ExamRetry');

exports.submitExam = async (req, res) => {
    const { examId, answers } = req.body;
    try {
        console.log('Submitting exam:', { examId, answersCount: answers.length });

        // First, get ALL questions for this exam to calculate total marks correctly
        const allQuestions = await Question.find({ examId });
        console.log(`Found ${allQuestions.length} questions for exam ${examId}`);

        // Calculate total possible marks from ALL questions in the exam
        const totalMarks = allQuestions.reduce((sum, question) => {
            return sum + (Number(question.marks) || 0);
        }, 0);

        console.log(`Total possible marks for exam: ${totalMarks}`);

        let score = 0;
        const processedAnswers = [];

        // Process each submitted answer
        for (let answer of answers) {
            const question = allQuestions.find(q => q._id.toString() === answer.questionId);
            if (question) {
                const questionMarks = Number(question.marks) || 0;
                const isCorrect = Number(answer.selectedAnswer) === Number(question.correctAnswer);
                const marksAwarded = isCorrect ? questionMarks : 0;
                score += marksAwarded;

                processedAnswers.push({
                    questionId: answer.questionId,
                    selectedAnswer: Number(answer.selectedAnswer),
                    isCorrect: isCorrect,
                    marksAwarded: marksAwarded
                });

                console.log(`Question ${question._id}: ${isCorrect ? 'Correct' : 'Incorrect'} - ${marksAwarded}/${questionMarks} marks`);
            } else {
                console.warn(`Question not found in exam: ${answer.questionId}`);
                // Still add the answer but with 0 marks
                processedAnswers.push({
                    questionId: answer.questionId,
                    selectedAnswer: Number(answer.selectedAnswer),
                    isCorrect: false,
                    marksAwarded: 0
                });
            }
        }

        // Calculate percentage (round to 2 decimal places)
        const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;

        // Determine if student passed (60% or higher)
        const isPassed = percentage >= 60;

        // Check if this is a retry attempt
        const existingResults = await Result.find({ studentId: req.user.id, examId });
        const attemptNumber = existingResults.length + 1;

        // If this is a retry, mark the retry as used
        if (attemptNumber > 1) {
            await ExamRetry.findOneAndUpdate(
                { studentId: req.user.id, examId, isUsed: false },
                { isUsed: true, usedAt: new Date() }
            );
        }

        console.log(`Final calculation: ${score}/${totalMarks} marks = ${percentage}% (${isPassed ? 'PASSED' : 'FAILED'}) - Attempt ${attemptNumber}`);

        const result = new Result({
            studentId: req.user.id,
            examId,
            answers: processedAnswers,
            score,
            totalMarks,
            percentage,
            isPassed,
            attemptNumber,
        });

        await result.save();

        // Populate the result before sending response
        const populatedResult = await Result.findById(result._id)
            .populate('studentId', 'username email')
            .populate('examId', 'title description duration');

        console.log('Result saved successfully:', {
            score: populatedResult.score,
            totalMarks: populatedResult.totalMarks,
            percentage: populatedResult.percentage
        });

        res.json(populatedResult);
    } catch (err) {
        console.error('Error submitting exam:', err);
        res.status(500).json({ msg: 'Server error while submitting exam' });
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

// Get student's exam history for reset management
exports.getStudentExamHistory = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Admin access required' });
        }

        // Get all results for the student
        const results = await Result.find({ studentId })
            .populate('examId', 'title description duration')
            .sort({ submittedAt: -1 });

        // Group results by exam and get attempt counts
        const examHistory = {};

        results.forEach(result => {
            const examId = result.examId._id.toString();
            if (!examHistory[examId]) {
                examHistory[examId] = {
                    exam: result.examId,
                    attempts: [],
                    totalAttempts: 0,
                    bestScore: 0,
                    lastAttempt: null,
                    canReset: false,
                    hasFailed: false
                };
            }

            examHistory[examId].attempts.push({
                _id: result._id,
                score: result.score,
                totalMarks: result.totalMarks,
                percentage: result.percentage,
                submittedAt: result.submittedAt,
                attemptNumber: result.attemptNumber || 1
            });

            examHistory[examId].totalAttempts++;
            examHistory[examId].bestScore = Math.max(examHistory[examId].bestScore, result.percentage);
            examHistory[examId].lastAttempt = result.submittedAt;

            // Check if student has failed (< 60%)
            if (result.percentage < 60) {
                examHistory[examId].hasFailed = true;
            }

            // Can reset if failed and has less than 3 attempts
            if (examHistory[examId].hasFailed && examHistory[examId].totalAttempts < 3) {
                examHistory[examId].canReset = true;
            }
        });

        const historyArray = Object.values(examHistory);
        res.json(historyArray);
    } catch (error) {
        console.error('Error fetching student history:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Reset exam for student (allow retake)
exports.resetExamForStudent = async (req, res) => {
    try {
        const { studentId, examId, reason } = req.body;

        if (!studentId || !examId) {
            return res.status(400).json({ msg: 'Student ID and Exam ID are required' });
        }

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Admin access required' });
        }

        // Get student's results for this exam
        const existingResults = await Result.find({
            studentId,
            examId
        }).sort({ attemptNumber: -1 });

        if (existingResults.length === 0) {
            return res.status(404).json({ msg: 'No exam attempts found for this student' });
        }

        // Check if student failed (< 60%)
        const hasFailed = existingResults.some(result => result.percentage < 60);
        if (!hasFailed) {
            return res.status(400).json({ msg: 'Cannot reset exam - student has not failed' });
        }

        // Check attempt limit (max 3 total attempts)
        if (existingResults.length >= 3) {
            return res.status(400).json({ msg: 'Maximum attempt limit reached (3 attempts)' });
        }

        // Check if there's already an active retry permission
        const existingRetry = await ExamRetry.findOne({
            studentId,
            examId,
            isUsed: false
        });

        if (existingRetry) {
            return res.status(400).json({ msg: 'Student already has an active retry permission for this exam' });
        }

        // Create exam reset record
        const examReset = new ExamRetry({
            studentId,
            examId,
            reason: reason || 'Admin reset - failed exam',
            grantedBy: req.user.id,
            isUsed: false,
            grantedAt: new Date()
        });

        await examReset.save();

        // Populate the response
        await examReset.populate('studentId', 'username email');
        await examReset.populate('examId', 'title description');
        await examReset.populate('grantedBy', 'username');

        res.json({
            msg: 'Exam reset granted successfully',
            reset: examReset,
            attemptsUsed: existingResults.length,
            attemptsRemaining: 3 - existingResults.length
        });
    } catch (error) {
        console.error('Error resetting exam:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get all failed students who can have exam resets
exports.getFailedStudents = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Admin access required' });
        }

        // Get all results where percentage < 60
        const failedResults = await Result.find({ percentage: { $lt: 60 } })
            .populate('studentId', 'username email')
            .populate('examId', 'title description')
            .sort({ submittedAt: -1 });

        // Group by student and exam
        const failedStudents = {};

        failedResults.forEach(result => {
            const studentId = result.studentId._id.toString();
            const examId = result.examId._id.toString();

            if (!failedStudents[studentId]) {
                failedStudents[studentId] = {
                    student: result.studentId,
                    failedExams: {}
                };
            }

            if (!failedStudents[studentId].failedExams[examId]) {
                failedStudents[studentId].failedExams[examId] = {
                    exam: result.examId,
                    attempts: [],
                    canReset: false,
                    totalAttempts: 0
                };
            }

            failedStudents[studentId].failedExams[examId].attempts.push({
                score: result.score,
                percentage: result.percentage,
                submittedAt: result.submittedAt,
                attemptNumber: result.attemptNumber || 1
            });

            failedStudents[studentId].failedExams[examId].totalAttempts++;

            // Can reset if less than 3 attempts
            const attemptCount = failedStudents[studentId].failedExams[examId].totalAttempts;
            failedStudents[studentId].failedExams[examId].canReset = attemptCount < 3;
        });

        // Convert to array format and filter only students with resettable exams
        const result = Object.values(failedStudents)
            .map(student => ({
                ...student,
                failedExams: Object.values(student.failedExams)
            }))
            .filter(student => student.failedExams.some(exam => exam.canReset));

        res.json(result);
    } catch (error) {
        console.error('Error fetching failed students:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};