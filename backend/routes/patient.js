import express from 'express';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import Bill from '../models/Bill.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { appointmentValidation, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Get patient profile with recent data
router.get('/me', [
  requireAuth,
  requireRole(['PATIENT'])
], async (req, res) => {
  try {
    const patient = await Patient.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'appointments',
        populate: { path: 'doctor', select: 'name specialization' },
        options: { limit: 10, sort: { createdAt: -1 } }
      });

    const prescriptions = await Prescription.find({ patient: req.user._id })
      .populate('doctor', 'name specialization')
      .populate('appointment', 'date slot status')
      .limit(10)
      .sort({ createdAt: -1 });

    const bills = await Bill.find({ patient: req.user._id })
      .populate('appointment', 'date slot')
      .limit(10)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        patient,
        prescriptions,
        bills
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch profile' }
    });
  }
});

// Book appointment
router.post('/appointments', [
  requireAuth,
  requireRole(['PATIENT']),
  appointmentValidation,
  validateRequest
], async (req, res) => {
  try {
    const { doctorId, date, slot } = req.body;

    // Validate date is not in the past
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return res.status(422).json({
        success: false,
        error: { code: 'INVALID_DATE', message: 'Cannot book appointment in the past' }
      });
    }

    // Get doctor and verify slot availability
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found' }
      });
    }

    // Check if slot exists in doctor's availability
    const weekday = appointmentDate.toLocaleDateString('en-US', { weekday: 'short' });
    const dayAvailability = doctor.availability.find(avail => avail.day === weekday);

    if (!dayAvailability || !dayAvailability.slots.includes(slot)) {
      return res.status(422).json({
        success: false,
        error: { 
          code: 'INVALID_SLOT', 
          message: 'Selected slot is not available for this doctor on this day' 
        }
      });
    }

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date,
      slot,
      status: { $nin: ['cancelled'] }
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        error: { code: 'SLOT_TAKEN', message: 'This slot is already booked' }
      });
    }

    // Check if patient already has appointment at this time
    const patientConflict = await Appointment.findOne({
      patient: req.user._id,
      date,
      slot,
      status: { $nin: ['cancelled'] }
    });

    if (patientConflict) {
      return res.status(409).json({
        success: false,
        error: { code: 'PATIENT_CONFLICT', message: 'You already have an appointment at this time' }
      });
    }

    const appointment = new Appointment({
      patient: req.user._id,
      doctor: doctorId,
      date,
      slot
    });

    await appointment.save();

    // Add appointment to patient's appointments array
    await Patient.findByIdAndUpdate(req.user._id, {
      $push: { appointments: appointment._id }
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name specialization');

    res.status(201).json({
      success: true,
      data: { appointment: populatedAppointment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to book appointment' }
    });
  }
});

// Get patient's appointments
router.get('/appointments', [
  requireAuth,
  requireRole(['PATIENT'])
], async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = { patient: req.user._id };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const appointments = await Appointment.find(filter)
      .populate('doctor', 'name specialization')
      .sort({ date: -1, slot: -1 });

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch appointments' }
    });
  }
});

// Cancel appointment
router.delete('/appointments/:id', [
  requireAuth,
  requireRole(['PATIENT'])
], async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Appointment not found' }
      });
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(422).json({
        success: false,
        error: { 
          code: 'CANNOT_CANCEL', 
          message: 'Cannot cancel appointment with current status' 
        }
      });
    }

    // Check if appointment is in the past
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return res.status(422).json({
        success: false,
        error: { code: 'PAST_APPOINTMENT', message: 'Cannot cancel past appointments' }
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to cancel appointment' }
    });
  }
});

// Get patient's prescriptions
router.get('/prescriptions', [
  requireAuth,
  requireRole(['PATIENT'])
], async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.user._id })
      .populate('doctor', 'name specialization')
      .populate('appointment', 'date slot status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { prescriptions }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch prescriptions' }
    });
  }
});

// Get patient's bills
router.get('/bills', [
  requireAuth,
  requireRole(['PATIENT'])
], async (req, res) => {
  try {
    const bills = await Bill.find({ patient: req.user._id })
      .populate('appointment', 'date slot')
      .populate('prescription')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { bills }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch bills' }
    });
  }
});

// Pay bill online
router.post('/bills/:billId/pay', [
  requireAuth,
  requireRole(['PATIENT'])
], async (req, res) => {
  try {
    const { billId } = req.params;
    const { paymentMethod = 'online' } = req.body;

    const bill = await Bill.findOne({
      _id: billId,
      patient: req.user._id
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Bill not found' }
      });
    }

    if (bill.paymentStatus === 'paid') {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_PAID', message: 'Bill is already paid' }
      });
    }

    // Simulate payment processing
    // In a real app, this would integrate with a payment gateway
    bill.paymentMethod = paymentMethod;
    bill.paymentStatus = 'paid';
    bill.status = 'paid';
    bill.paidAt = new Date();

    await bill.save();

    res.json({
      success: true,
      data: { 
        bill,
        message: 'Payment successful! Your bill has been paid.'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to process payment' }
    });
  }
});

// Get all doctors for booking
router.get('/doctors', [
  requireAuth,
  requireRole(['PATIENT'])
], async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .select('name specialization availability')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { doctors }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch doctors' }
    });
  }
});

export default router;