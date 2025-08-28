import jwt from 'jsonwebtoken';
import Doctor from '../models/Doctor.js';
import Staff from '../models/Staff.js';
import Patient from '../models/Patient.js';

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'Access token is required' }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (decoded.role === 'DOCTOR') {
      user = await Doctor.findById(decoded._id);
    } else if (decoded.role === 'STAFF') {
      user = await Staff.findById(decoded._id).populate('doctor');
    } else if (decoded.role === 'PATIENT') {
      user = await Patient.findById(decoded._id);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Token is invalid' }
      });
    }

    req.user = user;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_ERROR', message: 'Token verification failed' }
    });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Access denied' }
      });
    }
    next();
  };
};

export const requireSelfOrStaffDoctor = async (req, res, next) => {
  if (req.userRole === 'PATIENT') {
    // Patients can only access their own data
    if (req.user._id.toString() !== req.params.patientId) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Can only access your own data' }
      });
    }
  } else if (req.userRole === 'STAFF') {
    // Staff can only access patients of their doctor
    const Patient = (await import('../models/Patient.js')).default;
    const patient = await Patient.findById(req.params.patientId);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient not found' }
      });
    }
    
    // Check if patient has appointments with staff's doctor
    const Appointment = (await import('../models/Appointment.js')).default;
    const hasAppointment = await Appointment.findOne({
      patient: patient._id,
      doctor: req.user.doctor._id
    });
    
    if (!hasAppointment) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Patient is not under your doctor' }
      });
    }
  }
  
  next();
};