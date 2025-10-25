// config/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // loads .env variables


const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
  } catch (error) {
    console.log('Database connection error:', error);
  }
};

module.exports = connectToDb;
