import express from 'express';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { availabilityValidation, validateRequest } from '../middleware/validation.js';
import { body } from 'express-validator';
import Staff from '../models/Staff.js'; // Added import for Staff

const router = express.Router();

// Get availability
router.get('/availability', [
  requireAuth,
  requireRole(['DOCTOR'])
], async (req, res) => {
  try {
    console.log('🔍 Fetching availability for doctor:', req.user._id);
    
    const doctor = await Doctor.findById(req.user._id).select('availability');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found' }
      });
    }

    console.log('✅ Doctor availability found:', doctor.availability);
    
    res.json({
      success: true,
      data: { 
        availability: doctor.availability || [],
        message: 'Availability retrieved successfully'
      }
    });
  } catch (error) {
    console.error('❌ Error fetching availability:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch availability' }
    });
  }
});

// Set availability
router.put('/availability', [
  requireAuth,
  requireRole(['DOCTOR']),
  availabilityValidation,
  validateRequest
], async (req, res) => {
  try {
    const { availability } = req.body;

    // Additional validation: ensure we have valid data
    if (!availability || !Array.isArray(availability) || availability.length === 0) {
      return res.status(422).json({
        success: false,
        error: { 
          code: 'INVALID_DATA', 
          message: 'Availability data is required and must be a non-empty array'
        }
      });
    }

    // Validate no overlapping slots within each day
    for (const dayAvailability of availability) {
      if (!dayAvailability.slots || !Array.isArray(dayAvailability.slots) || dayAvailability.slots.length === 0) {
        return res.status(422).json({
          success: false,
          error: { 
            code: 'INVALID_SLOTS', 
            message: `No time slots provided for ${dayAvailability.day}`
          }
        });
      }

      const slots = dayAvailability.slots;
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const [start1, end1] = slots[i].split('-');
          const [start2, end2] = slots[j].split('-');
          
          if ((start1 < end2 && end1 > start2)) {
            return res.status(422).json({
              success: false,
              error: { 
                code: 'SLOT_OVERLAP', 
                message: `Overlapping slots found on ${dayAvailability.day}`,
                details: [{ slots: [slots[i], slots[j]] }]
              }
            });
          }
        }
      }
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.user._id, 
      { availability },
      { new: true, runValidators: true }
    );

    console.log('✅ Availability updated successfully for doctor:', req.user._id);
    console.log('📋 Updated availability:', updatedDoctor.availability);

    res.json({
      success: true,
      data: { 
        message: 'Availability updated successfully',
        availability: updatedDoctor.availability
      }
    });
  } catch (error) {
    console.error('Availability update error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update availability' }
    });
  }
});

// Get appointments
router.get('/appointments', [
  requireAuth,
  requireRole(['DOCTOR'])
], async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { doctor: req.user._id };
    
    if (date) {
      filter.date = date;
    }

    console.log('🔍 Doctor fetching appointments for doctor:', req.user._id);
    console.log('📅 Date filter:', date);
    console.log('👤 User object:', { _id: req.user._id, name: req.user.name, email: req.user.email });

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone')
      .sort({ date: 1, slot: 1 });

    console.log('📋 Found appointments:', appointments.length);
    console.log('👥 Sample appointment:', appointments[0]);

    // Check if patient data is populated
    appointments.forEach((apt, index) => {
      console.log(`📋 Appointment ${index}:`, {
        id: apt._id,
        patient: apt.patient,
        hasPatient: !!apt.patient,
        patientName: apt.patient?.name,
        patientEmail: apt.patient?.email
      });
    });

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    console.error('❌ Doctor appointments error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch appointments' }
    });
  }
});

// Get patients
router.get('/patients', [
  requireAuth,
  requireRole(['DOCTOR'])
], async (req, res) => {
  try {
    console.log('🔍 Fetching patients for doctor:', req.user._id);
    console.log('👤 User object:', { _id: req.user._id, name: req.user.name, email: req.user.email });
    
    // Get patients from doctor's appointments
    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate('patient', 'name email phone')
      .lean();

    console.log('📅 Found appointments:', appointments.length);
    console.log('📋 Sample appointment:', appointments[0]);

    // Extract unique patients from appointments
    const patientMap = new Map();
    appointments.forEach(apt => {
      console.log('🔍 Processing appointment:', apt._id, 'Patient:', apt.patient);
      if (apt.patient && apt.patient._id) {
        patientMap.set(apt.patient._id.toString(), apt.patient);
      } else {
        console.warn('⚠️ Appointment has no valid patient:', apt._id);
      }
    });

    let patients = Array.from(patientMap.values());
    console.log('👥 Unique patients from appointments:', patients.length);

    // If no patients from appointments, get all patients (for development/testing)
    if (patients.length === 0 && process.env.NODE_ENV === 'development') {
      console.log('🔄 No patients from appointments, fetching all patients...');
      const Patient = (await import('../models/Patient.js')).default;
      const allPatients = await Patient.find({}).select('name email phone').lean();
      patients = allPatients;
      console.log('👥 All patients found:', allPatients.length);
    }

    // Additional debugging: check if we have any appointments at all
    const allAppointments = await Appointment.find({}).lean();
    console.log('📊 Total appointments in database:', allAppointments.length);
    
    // Check if there are any appointments with this doctor
    const doctorAppointments = await Appointment.find({ doctor: req.user._id }).lean();
    console.log('👨‍⚕️ Appointments for this doctor:', doctorAppointments.length);
    
    // Check if there are any patients at all
    const Patient = (await import('../models/Patient.js')).default;
    const totalPatients = await Patient.countDocuments();
    console.log('👥 Total patients in database:', totalPatients);

    console.log('✅ Final patients data:', patients);
    res.json({
      success: true,
      data: { patients }
    });
  } catch (error) {
    console.error('❌ Error fetching patients:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch patients' }
    });
  }
});

// Get staff
router.get('/staff', [
  requireAuth,
  requireRole(['DOCTOR'])
], async (req, res) => {
  try {
    const staff = await Staff.find({ doctor: req.user._id })
      .select('name email');

    res.json({
      success: true,
      data: { staff }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch staff' }
    });
  }
});

// Add staff member
router.post('/staff', [
  requireAuth,
  requireRole(['DOCTOR']),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('role').optional().isIn(['nurse', 'receptionist', 'technician', 'assistant', 'other']),
  body('specialization').optional().trim(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest
], async (req, res) => {
  try {
    const { name, email, phone, role, specialization, password } = req.body;

    // Check if staff already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'Staff member with this email already exists' }
      });
    }

    const staff = new Staff({
      name,
      email,
      phone,
      role,
      specialization,
      password,
      doctor: req.user._id
    });

    await staff.save();

    // Link staff to doctor
    await Doctor.findByIdAndUpdate(req.user._id, {
      $push: { staff: staff._id }
    });

    res.status(201).json({
      success: true,
      data: { 
        message: 'Staff member added successfully',
        staff: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          role: staff.role,
          specialization: staff.specialization
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to add staff member' }
    });
  }
});

// Update staff member
router.put('/staff/:staffId', [
  requireAuth,
  requireRole(['DOCTOR']),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('role').optional().isIn(['nurse', 'receptionist', 'technician', 'assistant', 'other']),
  body('specialization').optional().trim(),
  validateRequest
], async (req, res) => {
  try {
    const { staffId } = req.params;
    const { name, email, phone, role, specialization } = req.body;

    // Verify staff belongs to this doctor
    const staff = await Staff.findOne({ _id: staffId, doctor: req.user._id });
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Staff member not found or not authorized' }
      });
    }

    // Check if email is already taken by another staff member
    const existingStaff = await Staff.findOne({ 
      email, 
      _id: { $ne: staffId },
      doctor: req.user._id 
    });
    if (existingStaff) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'Email is already taken by another staff member' }
      });
    }

    staff.name = name;
    staff.email = email;
    staff.phone = phone;
    staff.role = role;
    staff.specialization = specialization;
    
    // Only update password if a new one is provided
    if (req.body.password && req.body.password.trim()) {
      staff.password = req.body.password;
    }
    
    await staff.save();

    res.json({
      success: true,
      data: { 
        message: 'Staff member updated successfully',
        staff: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          role: staff.role,
          specialization: staff.specialization
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update staff member' }
    });
  }
});

// Delete staff member
router.delete('/staff/:staffId', [
  requireAuth,
  requireRole(['DOCTOR'])
], async (req, res) => {
  try {
    const { staffId } = req.params;

    // Verify staff belongs to this doctor
    const staff = await Staff.findOne({ _id: staffId, doctor: req.user._id });
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Staff member not found or not authorized' }
      });
    }

    // Remove staff from doctor's staff array
    await Doctor.findByIdAndUpdate(req.user._id, {
      $pull: { staff: staffId }
    });

    // Delete the staff member
    await Staff.findByIdAndDelete(staffId);

    res.json({
      success: true,
      data: { message: 'Staff member deleted successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete staff member' }
    });
  }
});

// Create prescription
router.post('/prescriptions/:appointmentId', [
  requireAuth,
  requireRole(['DOCTOR']),
  body('medicines').isArray().withMessage('Medicines must be an array'),
  body('medicines.*.name').trim().notEmpty().withMessage('Medicine name is required'),
  body('medicines.*.dosage').trim().notEmpty().withMessage('Dosage is required'),
  body('medicines.*.frequency').trim().notEmpty().withMessage('Frequency is required'),
  body('medicines.*.durationDays').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
  validateRequest
], async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { medicines, notes } = req.body;

    // Verify appointment belongs to doctor
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Appointment not found or not authorized' }
      });
    }

    // Check if prescription already exists
    const existingPrescription = await Prescription.findOne({ appointment: appointmentId });
    if (existingPrescription) {
      return res.status(409).json({
        success: false,
        error: { code: 'PRESCRIPTION_EXISTS', message: 'Prescription already exists for this appointment' }
      });
    }

    const prescription = new Prescription({
      patient: appointment.patient,
      doctor: req.user._id,
      appointment: appointmentId,
      medicines,
      notes
    });

    await prescription.save();

    res.status(201).json({
      success: true,
      data: { prescription }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create prescription' }
    });
  }
});

// Get prescriptions
router.get('/prescriptions', [
  requireAuth,
  requireRole(['DOCTOR'])
], async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctor: req.user._id })
      .populate('patient', 'name email')
      .populate('appointment', 'date slot')
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

// Get appointment details
router.get('/appointments/:appointmentId', [
  requireAuth,
  requireRole(['DOCTOR'])
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

    // Check if appointment belongs to this doctor
    if (appointment.doctor._id.toString() !== req.user._id.toString()) {
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

// Update appointment status
router.put('/appointments/:appointmentId/status', [
  requireAuth,
  requireRole(['DOCTOR']),
  body('status').isIn(['pending', 'confirmed', 'in_session', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status'),
  validateRequest
], async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, sessionStartTime, sessionEndTime } = req.body;
    
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Appointment not found' }
      });
    }

    // Check if appointment belongs to this doctor
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Not authorized to update this appointment' }
      });
    }

    // Update appointment status
    appointment.status = status;
    
    // Add session timing if provided
    if (sessionStartTime) {
      appointment.sessionStartTime = sessionStartTime;
    }
    if (sessionEndTime) {
      appointment.sessionEndTime = sessionEndTime;
    }

    await appointment.save();

    res.json({
      success: true,
      data: { 
        message: 'Appointment status updated successfully',
        appointment: {
          _id: appointment._id,
          status: appointment.status,
          sessionStartTime: appointment.sessionStartTime,
          sessionEndTime: appointment.sessionEndTime
        }
      }
    });
  } catch (error) {
    console.error('Appointment status update error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update appointment status' }
    });
  }
});

export default router;