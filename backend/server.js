import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

// Routes
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctor.js';
import staffRoutes from './routes/staff.js';
import patientRoutes from './routes/patient.js';

dotenv.config();

const app = express();

// Connect to database (optional for development)
if (process.env.NODE_ENV !== 'test') {
  connectDB().catch(err => {
    console.log('⚠️  Database connection failed, but server will continue...');
    console.log('💡 To use database features, install MongoDB and ensure it\'s running');
    console.log('💡 Or set NODE_ENV=test to skip database connection');
  });
}

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP
//   message: {
//     success: false,
//     error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later' },
//   },
// });
// app.use(limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/patient', patientRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'OK', timestamp: new Date().toISOString() },
  });
});

// Seed route (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/dev/seed', async (req, res) => {
    try {
      const { seedDatabase } = await import('./scripts/seed.js');
      await seedDatabase();

      res.json({
        success: true,
        data: { message: 'Database seeded successfully' },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'SEED_ERROR', message: 'Failed to seed database' },
      });
    }
  });

  // Debug route to check database contents
  app.get('/dev/debug', async (req, res) => {
    try {
      const Doctor = (await import('./models/Doctor.js')).default;
      const Patient = (await import('./models/Patient.js')).default;
      const Appointment = (await import('./models/Appointment.js')).default;

      const doctors = await Doctor.find({}).select('name email _id');
      const patients = await Patient.find({}).select('name email _id');
      const appointments = await Appointment.find({}).select('patient doctor _id');

      // Check for appointments with invalid references
      const appointmentsWithInvalidRefs = appointments.filter(apt => 
        !apt.patient || !apt.doctor
      );

      res.json({
        success: true,
        data: {
          doctors,
          patients,
          appointments,
          appointmentsWithInvalidRefs,
          doctorCount: doctors.length,
          patientCount: patients.length,
          appointmentCount: appointments.length,
          invalidRefsCount: appointmentsWithInvalidRefs.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'DEBUG_ERROR', message: error.message }
      });
    }
  });

  // Test route to check specific doctor's patients
  app.get('/dev/test-doctor/:doctorId', async (req, res) => {
    try {
      const { doctorId } = req.params;
      const Appointment = (await import('./models/Appointment.js')).default;
      const Patient = (await import('./models/Patient.js')).default;

      const appointments = await Appointment.find({ doctor: doctorId })
        .populate('patient', 'name email phone')
        .lean();

      const patientMap = new Map();
      appointments.forEach(apt => {
        if (apt.patient && apt.patient._id) {
          patientMap.set(apt.patient._id.toString(), apt.patient);
        }
      });

      const patients = Array.from(patientMap.values());

      res.json({
        success: true,
        data: {
          doctorId,
          appointments: appointments.length,
          patients: patients.length,
          patientList: patients
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'TEST_ERROR', message: error.message }
      });
    }
  });

  // Route to check current user authentication
  app.get('/dev/me', async (req, res) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: { code: 'NO_TOKEN', message: 'No token provided' }
        });
      }

      const jwt = (await import('jsonwebtoken')).default;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      res.json({
        success: true,
        data: {
          decoded,
          message: 'Token decoded successfully'
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_ERROR', message: error.message }
      });
    }
  });

  // Route to test appointments without authentication (for debugging)
  app.get('/dev/appointments/:doctorId', async (req, res) => {
    try {
      const { doctorId } = req.params;
      const Appointment = (await import('./models/Appointment.js')).default;

      const appointments = await Appointment.find({ doctor: doctorId })
        .populate('patient', 'name email phone')
        .lean();

      res.json({
        success: true,
        data: {
          doctorId,
          appointments: appointments.length,
          appointments: appointments
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'TEST_ERROR', message: error.message }
      });
    }
  });

  // Route to get all patients without authentication (for debugging)
  app.get('/dev/patients', async (req, res) => {
    try {
      const Patient = (await import('./models/Patient.js')).default;
      
      const patients = await Patient.find({}).select('name email phone').lean();

      res.json({
        success: true,
        data: { 
          patients,
          count: patients.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'TEST_ERROR', message: error.message }
      });
    }
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong!' },
  });
});

// 404 handler (✅ FIXED)
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
