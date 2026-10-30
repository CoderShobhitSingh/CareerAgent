const mongoose = require('mongoose');

async function connectToDB(){
   const mongoUri = process.env.MONGO_URI || process.env.mongoURI;

   if (!mongoUri) {
    throw new Error('MongoDB connection string is missing. Set MONGO_URI in the environment.');
   }
   await mongoose.connect(mongoUri);
   console.log('Connected to MongoDB');
} 

module.exports = connectToDB;