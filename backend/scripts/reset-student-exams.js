const mongoose = require('mongoose');
const Result = require('../models/Result');
const ExamRetry = require('../models/ExamRetry');
const User = require('../models/User');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/exam-system');
    console.log('MongoDB connected for reset script');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Reset all exams for a specific student
const resetStudentExams = async (studentEmail) => {
  try {
    console.log(`🔄 Starting exam reset for student: ${studentEmail}`);
    
    // Find the student by email
    const student = await User.findOne({ email: studentEmail });
    if (!student) {
      console.error(`❌ Student with email ${studentEmail} not found`);
      return;
    }
    
    console.log(`✅ Found student: ${student.username} (ID: ${student._id})`);
    
    // Delete all exam results for this student
    const deletedResults = await Result.deleteMany({ studentId: student._id });
    console.log(`🗑️  Deleted ${deletedResults.deletedCount} exam results`);
    
    // Delete all exam retry permissions for this student
    const deletedRetries = await ExamRetry.deleteMany({ studentId: student._id });
    console.log(`🗑️  Deleted ${deletedRetries.deletedCount} retry permissions`);
    
    console.log(`🎉 Successfully reset all exams for ${student.username}`);
    console.log(`📝 Student can now take all exams again from the beginning`);
    
  } catch (error) {
    console.error('❌ Error resetting student exams:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  // Reset exams for the specified student
  const studentEmail = 'mostafa99@gmail.com';
  await resetStudentExams(studentEmail);
  
  // Close the database connection
  await mongoose.connection.close();
  console.log('📊 Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('Script execution error:', error);
  process.exit(1);
});
