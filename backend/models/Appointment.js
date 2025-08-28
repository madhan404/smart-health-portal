import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  slot: {
    type: String,
    required: true,
    match: /^\d{2}:\d{2}-\d{2}:\d{2}$/
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_session', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  sessionStartTime: {
    type: Date
  },
  sessionEndTime: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to prevent double booking
appointmentSchema.index({ doctor: 1, date: 1, slot: 1 }, { 
  unique: true,
  partialFilterExpression: { 
    status: { $nin: ['cancelled'] } 
  }
});

export default mongoose.model('Appointment', appointmentSchema);