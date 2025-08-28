import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from '../models/Doctor.js';
import Staff from '../models/Staff.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import Bill from '../models/Bill.js';
import connectDB from '../config/database.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Doctor.deleteMany({});
    await Staff.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await Prescription.deleteMany({});
    await Bill.deleteMany({});

    // Create Doctor
    const doctor = new Doctor({
      name: 'Dr. Sarah Wilson',
      email: 'sarah.wilson@clinic.com',
      password: 'password123',
      specialization: 'General Medicine',
      availability: [
        {
          day: 'Mon',
          slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00', '12:00-12:30', '12:30-13:00']
        },
        {
          day: 'Tue',
          slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00', '12:00-12:30', '12:30-13:00']
        },
        {
          day: 'Wed',
          slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00', '12:00-12:30', '12:30-13:00']
        },
        {
          day: 'Thu',
          slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00', '12:00-12:30', '12:30-13:00']
        },
        {
          day: 'Fri',
          slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00', '12:00-12:30', '12:30-13:00']
        },
        {
          day: 'Sat',
          slots: ['10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00']
        }
      ]
    });
    await doctor.save();

    // Create Staff
    const staff = new Staff({
      name: 'Emily Johnson',
      email: 'emily.johnson@clinic.com',
      password: 'password123',
      doctor: doctor._id
    });
    await staff.save();

    // Update doctor with staff
    doctor.staff.push(staff._id);
    await doctor.save();

    // Create Patients
    const patient1 = new Patient({
      name: 'John Smith',
      email: 'john.smith@email.com',
      password: 'password123',
      phone: '1234567890'
    });
    await patient1.save();

    const patient2 = new Patient({
      name: 'Maria Garcia',
      email: 'maria.garcia@email.com',
      password: 'password123',
      phone: '0987654321'
    });
    await patient2.save();

    // Create future appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    const appointment1 = new Appointment({
      patient: patient1._id,
      doctor: doctor._id,
      date: tomorrowStr,
      slot: '10:00-10:30',
      status: 'pending'
    });
    await appointment1.save();

    const appointment2 = new Appointment({
      patient: patient2._id,
      doctor: doctor._id,
      date: dayAfterStr,
      slot: '11:00-11:30',
      status: 'confirmed'
    });
    await appointment2.save();

    // Create a completed appointment with prescription and bill
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const completedAppointment = new Appointment({
      patient: patient1._id,
      doctor: doctor._id,
      date: yesterdayStr,
      slot: '10:30-11:00',
      status: 'completed'
    });
    await completedAppointment.save();

    // Create prescription
    const prescription = new Prescription({
      patient: patient1._id,
      doctor: doctor._id,
      appointment: completedAppointment._id,
      medicines: [
        {
          name: 'Amoxicillin',
          dosage: '500mg',
          frequency: '3 times daily',
          durationDays: 7,
          notes: 'Take with food'
        },
        {
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: 'As needed',
          durationDays: 3,
          notes: 'For pain relief'
        }
      ],
      notes: 'Complete the full course of antibiotics'
    });
    await prescription.save();

    // Create bill
    const bill = new Bill({
      patient: patient1._id,
      appointment: completedAppointment._id,
      prescription: prescription._id,
      items: [
        { label: 'Consultation Fee', qty: 1, unitPaise: 50000 }, // ₹500
        { label: 'Medicine Cost', qty: 1, unitPaise: 30000 }     // ₹300
      ],
      subtotalPaise: 80000, // ₹800
      taxPaise: 14400,      // 18% tax = ₹144
      totalPaise: 94400     // ₹944
    });
    await bill.save();

    // Update patient appointments
    patient1.appointments.push(appointment1._id, completedAppointment._id);
    patient2.appointments.push(appointment2._id);
    await patient1.save();
    await patient2.save();

    console.log('Database seeded successfully!');
    console.log('\nTest Accounts:');
    console.log('Doctor: sarah.wilson@clinic.com / password123');
    console.log('Staff: emily.johnson@clinic.com / password123');
    console.log('Patient 1: john.smith@email.com / password123');
    console.log('Patient 2: maria.garcia@email.com / password123');

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
};

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedDatabase();
  process.exit(0);
}