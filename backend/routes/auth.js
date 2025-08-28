import express from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator'; // ✅ FIXED: import body

import Doctor from '../models/Doctor.js';
import Staff from '../models/Staff.js';
import Patient from '../models/Patient.js';

import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  registerValidation,
  loginValidation,
  validateRequest
} from '../middleware/validation.js';

const router = express.Router();

// 🔹 Generate JWT
const generateToken = (user, role) => {
  return jwt.sign(
    { _id: user._id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" } // fallback
  );
};

// 🔹 Register Patient
router.post(
  '/register/patient',
  [
    ...registerValidation,
    body('phone')
      .matches(/^\d{10,15}$/)
      .withMessage('Phone must be 10-15 digits'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;

      const existingUser = await Patient.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email already registered' }
        });
      }

      const patient = new Patient({ name, email, password, phone });
      await patient.save();

      const token = generateToken(patient, 'PATIENT');

      res.status(201).json({
        success: true,
        data: {
          user: {
            _id: patient._id,
            name: patient.name,
            email: patient.email,
            role: 'PATIENT'
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Registration failed' }
      });
    }
  }
);

// 🔹 Register Doctor
router.post(
  '/register/doctor',
  [
    ...registerValidation,
    body('specialization')
      .trim()
      .notEmpty()
      .withMessage('Specialization is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { name, email, password, specialization } = req.body;

      const existingUser = await Doctor.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email already registered' }
        });
      }

      const doctor = new Doctor({ name, email, password, specialization });
      await doctor.save();

      const token = generateToken(doctor, 'DOCTOR');

      res.status(201).json({
        success: true,
        data: {
          user: {
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            role: 'DOCTOR'
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Registration failed' }
      });
    }
  }
);

// 🔹 Register Staff (Doctor only)
router.post(
  '/register/staff',
  [
    requireAuth,
    requireRole(['DOCTOR']),
    ...registerValidation,
    validateRequest
  ],
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await Staff.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email already registered' }
        });
      }

      const staff = new Staff({
        name,
        email,
        password,
        doctor: req.user._id
      });
      await staff.save();

      // Link staff to doctor
      await Doctor.findByIdAndUpdate(req.user._id, {
        $push: { staff: staff._id }
      });

      const token = generateToken(staff, 'STAFF');

      res.status(201).json({
        success: true,
        data: {
          user: {
            _id: staff._id,
            name: staff.name,
            email: staff.email,
            role: 'STAFF'
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Staff registration failed' }
      });
    }
  }
);

// 🔹 Login (any role)
router.post('/login', [loginValidation, validateRequest], async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = null;
    let role = null;

    // Try Doctor
    user = await Doctor.findOne({ email }).select('+password');
    if (user) role = 'DOCTOR';

    // Try Staff
    if (!user) {
      user = await Staff.findOne({ email }).select('+password');
      if (user) role = 'STAFF';
    }

    // Try Patient
    if (!user) {
      user = await Patient.findOne({ email }).select('+password');
      if (user) role = 'PATIENT';
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const token = generateToken(user, role);

    res.json({
      success: true,
      data: { token, role }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Login failed' }
    });
  }
});

export default router;
