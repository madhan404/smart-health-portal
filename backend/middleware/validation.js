import { body, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.param,
          rule: err.msg,
          message: `${err.param}: ${err.msg}`
        }))
      }
    });
  }
  next();
};

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number')
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const appointmentValidation = [
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  body('slot').matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/).withMessage('Slot must be in HH:MM-HH:MM format')
];

export const availabilityValidation = [
  body('availability')
    .isArray({ min: 1 })
    .withMessage('Availability must be an array with at least one day'),
  body('availability.*.day')
    .isIn(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    .withMessage('Day must be a valid weekday (Mon, Tue, Wed, Thu, Fri, Sat, Sun)'),
  body('availability.*.slots')
    .isArray({ min: 1 })
    .withMessage('Each day must have at least one time slot'),
  body('availability.*.slots.*')
    .matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
    .withMessage('Each slot must be in HH:MM-HH:MM format (e.g., 09:00-09:30)')
];