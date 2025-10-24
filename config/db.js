// config/db.js
const mongoose = require('mongoose');

const connectToDb = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/final_year_project');
    console.log('Connected to DB');
  } catch (error) {
    console.log('Database connection error:', error);
  }
};

module.exports = connectToDb;
