const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const cleanUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_inventory_db';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    const countBefore = await User.countDocuments();
    console.log(`Found ${countBefore} user document(s) in MongoDB.`);

    const result = await User.deleteMany({});
    console.log(`Successfully cleaned user data! Removed ${result.deletedCount} user(s).`);

    process.exit(0);
  } catch (err) {
    console.error('Error cleaning user data:', err);
    process.exit(1);
  }
};

cleanUsers();
