const express = require('express');
   const cors = require('cors');
   const connectDB = require('./config/db');
   const authRoutes = require('./routes/auth');
   const examRoutes = require('./routes/exams');
   const questionRoutes = require('./routes/questions');
   const resultRoutes = require('./routes/results');

   const app = express();

   // Connect to MongoDB
   connectDB();

   // Middleware
   app.use(cors());
   app.use(express.json());

   // Routes
   app.use('/api/auth', authRoutes);
   app.use('/api/exams', examRoutes);
   app.use('/api/questions', questionRoutes);
   app.use('/api/results', resultRoutes);

   const PORT = process.env.PORT || 5000;
   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));