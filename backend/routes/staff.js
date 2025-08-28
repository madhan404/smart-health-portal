import express from 'express';
import Appointment from '../models/Appointment.js';
import Bill from '../models/Bill.js';
import Prescription from '../models/Prescription.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { body } from "express-validator";               // body comes from express-validator
import { validateRequest } from "../middleware/validation.js"; // custom middleware


const router = express.Router();

// Get appointments for staff's doctor
router.get('/appointments', [
  requireAuth,
  requireRole(['STAFF'])
], async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { doctor: req.user.doctor._id };
    
    if (date) {
      filter.date = date;
    }

    console.log('🔍 Staff fetching appointments for doctor:', req.user.doctor._id);
    console.log('📅 Date filter:', date);

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone')
      .sort({ date: 1, slot: 1 });

    console.log('📋 Found appointments:', appointments.length);
    console.log('👥 Sample appointment:', appointments[0]);

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    console.error('❌ Staff appointments error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch appointments' }
    });
  }
});

// Update appointment status
router.put('/appointments/:id/status', [
  requireAuth,
  requireRole(['STAFF']),
  body('status')
    .isIn(['pending', 'confirmed', 'in_session', 'completed', 'cancelled', 'no_show'])
    .withMessage('Invalid status'),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Verify appointment belongs to staff's doctor
    const appointment = await Appointment.findOne({
      _id: id,
      doctor: req.user.doctor._id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Appointment not found or not authorized' }
      });
    }

    // Status transition validation
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_session', 'no_show', 'cancelled'],
      'in_session': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': [],
      'no_show': []
    };

    if (!validTransitions[appointment.status].includes(status)) {
      return res.status(422).json({
        success: false,
        error: { 
          code: 'INVALID_TRANSITION', 
          message: `Cannot change status from ${appointment.status} to ${status}` 
        }
      });
    }

    appointment.status = status;
    await appointment.save();

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update appointment status' }
    });
  }
});

// Get appointment details for staff
router.get('/appointments/:appointmentId', [
  requireAuth,
  requireRole(['STAFF'])
], async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Appointment not found' }
      });
    }

    // Check if appointment belongs to staff's doctor
    if (appointment.doctor._id.toString() !== req.user.doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Not authorized to view this appointment' }
      });
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch appointment details' }
    });
  }
});

// Get prescription by appointment ID for staff (MUST come before /:prescriptionId)
router.get('/prescriptions/appointment/:appointmentId', [
  requireAuth,
  requireRole(['STAFF'])
], async (req, res) => {
  try {
    const { appointmentId } = req.params;
    console.log('🔍 Staff fetching prescription for appointment:', appointmentId);
    
    const Prescription = (await import('../models/Prescription.js')).default;
    
    const prescription = await Prescription.findOne({ appointment: appointmentId })
      .populate('patient', 'name email phone')
      .populate('appointment', 'date slot status')
      .populate('doctor', 'name email specialization');

    if (!prescription) {
      console.log('ℹ️ No prescription found for appointment:', appointmentId);
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No prescription found for this appointment' }
      });
    }

    // Check if prescription belongs to staff's doctor
    if (prescription.doctor._id.toString() !== req.user.doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Not authorized to view this prescription' }
      });
    }

    console.log('✅ Prescription found for appointment:', prescription._id);
    res.json({
      success: true,
      data: { prescription }
    });
  } catch (error) {
    console.error('❌ Error fetching prescription by appointment:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch prescription details' }
    });
  }
});

// Get prescriptions for staff's doctor
router.get('/prescriptions', [
  requireAuth,
  requireRole(['STAFF'])
], async (req, res) => {
  try {
    console.log('🔍 Staff fetching prescriptions for doctor:', req.user.doctor._id);
    
    const Prescription = (await import('../models/Prescription.js')).default;
    
    const prescriptions = await Prescription.find({ doctor: req.user.doctor._id })
      .populate('patient', 'name email phone')
      .populate('appointment', 'date slot status')
      .sort({ createdAt: -1 });

    console.log('💊 Found prescriptions:', prescriptions.length);
    console.log('📋 Sample prescription:', prescriptions[0]);

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

// Get prescription details for staff
router.get('/prescriptions/:prescriptionId', [
  requireAuth,
  requireRole(['STAFF'])
], async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const Prescription = (await import('../models/Prescription.js')).default;
    
    const prescription = await Prescription.findById(prescriptionId)
      .populate('patient', 'name email phone')
      .populate('appointment', 'date slot status')
      .populate('doctor', 'name email specialization');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Prescription not found' }
      });
    }

    // Check if prescription belongs to staff's doctor
    if (prescription.doctor._id.toString() !== req.user.doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Not authorized to view this prescription' }
      });
    }

    res.json({
      success: true,
      data: { prescription }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch prescription details' }
    });
  }
});



// Get bills for staff's doctor
router.get('/bills', [
  requireAuth,
  requireRole(['STAFF'])
], async (req, res) => {
  try {
    console.log('🔍 Staff fetching bills for doctor:', req.user.doctor._id);
    
    const Bill = (await import('../models/Bill.js')).default;
    
    const bills = await Bill.find({})
      .populate('patient', 'name email phone')
      .populate({
        path: 'appointment',
        select: 'date slot doctor',
        populate: {
          path: 'doctor',
          select: 'name email'
        }
      })
      .populate('prescription')
      .sort({ createdAt: -1 });

    console.log('💰 Found bills:', bills.length);
    console.log('📋 Sample bill:', bills[0]);

    // Filter bills for staff's doctor
    const filteredBills = bills.filter(bill => {
      if (!bill.appointment || !bill.appointment.doctor) {
        console.log('⚠️ Bill missing appointment or doctor:', bill._id);
        return false;
      }
      return bill.appointment.doctor._id.toString() === req.user.doctor._id.toString();
    });

    console.log('✅ Filtered bills for staff doctor:', filteredBills.length);

    res.json({
      success: true,
      data: { bills: filteredBills }
    });
  } catch (error) {
    console.error('❌ Staff bills error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch bills' }
    });
  }
});

// Create bill
router.post('/bills/:appointmentId', [
  requireAuth,
  requireRole(['STAFF']),
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.label').trim().notEmpty().withMessage('Item label is required'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPaise').isInt({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('taxPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax percent must be 0-100'),
  validateRequest
], async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { items, taxPercent = 0 } = req.body;
    
    console.log('💰 Staff creating bill for appointment:', appointmentId);
    console.log('📋 Bill items:', items);
    console.log('💸 Tax percent:', taxPercent);

    // Verify appointment belongs to staff's doctor
    console.log('🔍 Looking for appointment:', appointmentId, 'for doctor:', req.user.doctor._id);
    
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: req.user.doctor._id
    });

    if (!appointment) {
      console.log('❌ Appointment not found or not authorized');
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Appointment not found or not authorized' }
      });
    }
    
    console.log('✅ Appointment found:', appointment._id, 'Patient:', appointment.patient);

    // Check if bill already exists (idempotency)
    console.log('🔍 Checking for existing bill...');
    const existingBill = await Bill.findOne({ appointment: appointmentId });
    if (existingBill) {
      console.log('❌ Bill already exists for appointment:', appointmentId);
      return res.status(409).json({
        success: false,
        error: { code: 'BILL_EXISTS', message: 'Bill already exists for this appointment' }
      });
    }
    console.log('✅ No existing bill found, proceeding with creation...');

    // Calculate totals
    const subtotalPaise = items.reduce((sum, item) => sum + (item.qty * item.unitPaise), 0);
    const taxPaise = Math.round(subtotalPaise * taxPercent / 100);
    const totalPaise = subtotalPaise + taxPaise;

    // Get prescription if exists
    const prescription = await Prescription.findOne({ appointment: appointmentId });

    const bill = new Bill({
      patient: appointment.patient,
      appointment: appointmentId,
      prescription: prescription?._id,
      items,
      subtotalPaise,
      taxPaise,
      totalPaise
    });

    await bill.save();

    res.status(201).json({
      success: true,
      data: { bill }
    });
  } catch (error) {
    console.error('❌ Staff create bill error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create bill' }
    });
  }
});



// Update bill payment method and status
router.put('/bills/:billId/payment', [
  requireAuth,
  requireRole(['STAFF']),
  body('paymentMethod').isIn(['cash', 'online']).withMessage('Payment method must be cash or online'),
  validateRequest
], async (req, res) => {
  try {
    const { billId } = req.params;
    const { paymentMethod } = req.body;

    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Bill not found' }
      });
    }

    bill.paymentMethod = paymentMethod;
    
    if (paymentMethod === 'cash') {
      bill.paymentStatus = 'paid';
      bill.status = 'paid';
      bill.paidAt = new Date();
    } else if (paymentMethod === 'online') {
      bill.paymentStatus = 'pending';
      bill.status = 'unpaid';
    }

    await bill.save();

    res.json({
      success: true,
      data: { bill }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update bill payment' }
    });
  }
});

// Test bills route (development only)
router.get('/test-bills', [
  requireAuth,
  requireRole(['STAFF'])
], async (req, res) => {
  try {
    console.log('🧪 Testing bills route for staff');
    console.log('👤 Staff user:', req.user._id);
    console.log('🏥 Staff doctor:', req.user.doctor._id);
    
    const Bill = (await import('../models/Bill.js')).default;
    const totalBills = await Bill.countDocuments({});
    
    res.json({
      success: true,
      data: { 
        message: 'Bills route test successful',
        totalBills,
        staffDoctor: req.user.doctor._id
      }
    });
  } catch (error) {
    console.error('❌ Bills test route error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TEST_ERROR', message: error.message }
    });
  }
});

// Generate reports
router.get('/reports', [
  requireAuth,
  requireRole(['STAFF'])
], async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    // Get date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let reportData = {};

    if (type === 'appointments' || !type) {
      const appointments = await Appointment.find({
        doctor: req.user.doctor._id,
        date: { $gte: start, $lte: end }
      }).populate('patient', 'name');
      
      reportData.appointments = appointments;
    }

    if (type === 'billing' || !type) {
      const bills = await Bill.find({
        createdAt: { $gte: start, $lte: end }
      }).populate('patient', 'name');
      
      reportData.bills = bills;
      reportData.totalRevenue = bills.reduce((sum, bill) => sum + bill.totalPaise, 0);
    }

    res.json({
      success: true,
      data: { report: reportData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to generate report' }
    });
  }
});

export default router;