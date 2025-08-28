import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorAppointments from './pages/DoctorAppointments'
import DoctorPatients from './pages/DoctorPatients'
import DoctorStaff from './pages/DoctorStaff'
import DoctorSettings from './pages/DoctorSettings'
import StaffDashboard from './pages/StaffDashboard'
import StaffAppointments from './pages/StaffAppointments'
import StaffBilling from './pages/StaffBilling'
import StaffReports from './pages/StaffReports'
import PatientDashboard from './pages/PatientDashboard'
import PatientBookAppointment from './pages/PatientBookAppointment'
import PatientAppointments from './pages/PatientAppointments'
import PatientPrescriptions from './pages/PatientPrescriptions'
import PatientBills from './pages/PatientBills'
import Layout from './components/Layout'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        {/* Doctor Routes */}
        {user.role === 'DOCTOR' && (
          <>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/patients" element={<DoctorPatients />} />
            <Route path="/doctor/staff" element={<DoctorStaff />} />
            <Route path="/doctor/settings" element={<DoctorSettings />} />
          </>
        )}
        
        {/* Staff Routes */}
        {user.role === 'STAFF' && (
          <>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/appointments" element={<StaffAppointments />} />
            <Route path="/staff/billing" element={<StaffBilling />} />
            <Route path="/staff/reports" element={<StaffReports />} />
          </>
        )}
        
        {/* Patient Routes */}
        {user.role === 'PATIENT' && (
          <>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/book" element={<PatientBookAppointment />} />
            <Route path="/patient/appointments" element={<PatientAppointments />} />
            <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
            <Route path="/patient/bills" element={<PatientBills />} />
          </>
        )}
        
        {/* Default Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            user.role === 'DOCTOR' ? <Navigate to="/doctor/dashboard" replace /> :
            user.role === 'STAFF' ? <Navigate to="/staff/dashboard" replace /> :
            user.role === 'PATIENT' ? <Navigate to="/patient/dashboard" replace /> :
            <Navigate to="/login" replace />
          } 
        />
        
        {/* Redirect root to appropriate dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch all other routes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App