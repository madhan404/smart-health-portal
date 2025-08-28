import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/doctor_appointment';
    
    if (!process.env.MONGO_URI) {
      console.warn('⚠️  MONGO_URI not found in environment variables, using default localhost connection');
    }
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.log('💡 Make sure MongoDB is running and accessible');
    console.log('💡 You can set MONGO_URI in a .env file or environment variable');
    process.exit(1);
  }
};

export default connectDB;