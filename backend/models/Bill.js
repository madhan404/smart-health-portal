import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  items: [{
    label: {
      type: String,
      required: true,
      trim: true
    },
    qty: {
      type: Number,
      required: true,
      min: 1
    },
    unitPaise: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  subtotalPaise: {
    type: Number,
    required: true,
    min: 0
  },
  taxPaise: {
    type: Number,
    required: true,
    min: 0
  },
  totalPaise: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'void'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['pending', 'cash', 'online'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('Bill', billSchema);