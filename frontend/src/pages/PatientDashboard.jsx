import React, { useState, useEffect } from 'react'
import { 
  CalendarIcon, 
  FileTextIcon, 
  CreditCardIcon,
  PlusIcon,
  XIcon,
  ClockIcon,
  UserIcon
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [bills, setBills] = useState([])
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    doctorId: '',
    date: '',
    slot: ''
  })
  const [availableSlots, setAvailableSlots] = useState([])

  useEffect(() => {
    fetchProfile()
    fetchDoctors()
  }, [])

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments()
    } else if (activeTab === 'prescriptions') {
      fetchPrescriptions()
    } else if (activeTab === 'bills') {
      fetchBills()
    }
  }, [activeTab])

  useEffect(() => {
    if (bookingForm.doctorId && bookingForm.date) {
      calculateAvailableSlots()
    }
  }, [bookingForm.doctorId, bookingForm.date])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/patient/me')
      setProfile(response.data.data)
    } catch (error) {
      toast.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/patient/appointments')
      setAppointments(response.data.data.appointments)
    } catch (error) {
      toast.error('Failed to fetch appointments')
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/patient/doctors')
      setDoctors(response.data.data.doctors)
    } catch (error) {
      toast.error('Failed to fetch doctors')
    }
  }

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get('/patient/prescriptions')
      setPrescriptions(response.data.data.prescriptions)
    } catch (error) {
      toast.error('Failed to fetch prescriptions')
    }
  }

  const fetchBills = async () => {
    try {
      const response = await api.get('/patient/bills')
      setBills(response.data.data.bills)
    } catch (error) {
      toast.error('Failed to fetch bills')
    }
  }

  const calculateAvailableSlots = () => {
    const doctor = doctors.find(d => d._id === bookingForm.doctorId)
    if (!doctor) return

    const selectedDate = new Date(bookingForm.date)
    const weekday = selectedDate.toLocaleDateString('en-US', { weekday: 'short' })
    
    const dayAvailability = doctor.availability?.find(avail => avail.day === weekday)
    setAvailableSlots(dayAvailability?.slots || [])
  }

  const handleBookAppointment = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post('/patient/appointments', bookingForm)
      toast.success('Appointment booked successfully!')
      setShowBookingModal(false)
      setBookingForm({ doctorId: '', date: '', slot: '' })
      fetchProfile() // Refresh to show new appointment
    } catch (error) {
      toast.error('Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return
    
    try {
      await api.delete(`/patient/appointments/${appointmentId}`)
      toast.success('Appointment cancelled')
      fetchAppointments()
      fetchProfile()
    } catch (error) {
      toast.error('Failed to cancel appointment')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending'
      case 'confirmed': return 'status-confirmed'
      case 'completed': return 'status-completed'
      case 'cancelled': return 'status-cancelled'
      case 'no_show': return 'status-no_show'
      default: return 'status-pending'
    }
  }

  const formatCurrency = (paise) => `₹${(paise / 100).toFixed(2)}`

  // Get today's date for minimum booking date
  const today = format(new Date(), 'yyyy-MM-dd')

  const TabButton = ({ tab, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">Manage your healthcare appointments and records</p>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Book Appointment
        </button>
      </div>

      {/* Quick Stats */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Appointments</h3>
                <p className="text-2xl font-bold text-primary-600">
                  {profile.patient.appointments?.filter(apt => 
                    new Date(apt.date) >= new Date() && apt.status !== 'cancelled'
                  ).length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileTextIcon className="h-8 w-8 text-secondary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Prescriptions</h3>
                <p className="text-2xl font-bold text-secondary-600">
                  {profile.prescriptions?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCardIcon className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Pending Bills</h3>
                <p className="text-2xl font-bold text-warning-600">
                  {profile.bills?.filter(bill => bill.status === 'unpaid').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <TabButton tab="overview" label="Overview" icon={UserIcon} />
        <TabButton tab="appointments" label="Appointments" icon={CalendarIcon} />
        <TabButton tab="prescriptions" label="Prescriptions" icon={FileTextIcon} />
        <TabButton tab="bills" label="Bills" icon={CreditCardIcon} />
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Appointments */}
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
              </div>
              <div className="p-6">
                {profile.patient.appointments?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No appointments yet</p>
                ) : (
                  <div className="space-y-4">
                    {profile.patient.appointments.slice(0, 3).map((appointment) => (
                      <div key={appointment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            Dr. {appointment.doctor?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(appointment.date), 'MMM dd, yyyy')} at {appointment.slot}
                          </p>
                        </div>
                        <span className={`status-badge ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Prescriptions */}
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Prescriptions</h2>
              </div>
              <div className="p-6">
                {profile.prescriptions?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No prescriptions yet</p>
                ) : (
                  <div className="space-y-4">
                    {profile.prescriptions.slice(0, 3).map((prescription) => (
                      <div key={prescription._id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">
                          Dr. {prescription.doctor?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {prescription.medicines.length} medicine(s) prescribed
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">My Appointments</h2>
            </div>
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No appointments found
                <div className="mt-4">
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="btn-primary"
                  >
                    Book Your First Appointment
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <div key={appointment._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            Dr. {appointment.doctor?.name}
                          </h3>
                          <span className={`status-badge ${getStatusColor(appointment.status)}`}>
                            {appointment.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          <p>Specialization: {appointment.doctor?.specialization}</p>
                          <p>Date: {format(new Date(appointment.date), 'MMMM dd, yyyy')}</p>
                          <p>Time: {appointment.slot}</p>
                          {appointment.notes && <p>Notes: {appointment.notes}</p>}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                          <button
                            onClick={() => cancelAppointment(appointment._id)}
                            className="btn-danger text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">My Prescriptions</h2>
            </div>
            {prescriptions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No prescriptions found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {prescriptions.map((prescription) => (
                  <div key={prescription._id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            Dr. {prescription.doctor?.name}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Medicines:</h4>
                          {prescription.medicines.map((medicine, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">Medicine:</span> {medicine.name}
                                </div>
                                <div>
                                  <span className="font-medium">Dosage:</span> {medicine.dosage}
                                </div>
                                <div>
                                  <span className="font-medium">Frequency:</span> {medicine.frequency}
                                </div>
                                <div>
                                  <span className="font-medium">Duration:</span> {medicine.durationDays} days
                                </div>
                              </div>
                              {medicine.notes && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">Notes:</span> {medicine.notes}
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {prescription.notes && (
                            <div className="mt-3">
                              <span className="font-medium text-gray-900">Additional Notes:</span>
                              <p className="text-gray-600 mt-1">{prescription.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bills' && (
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">My Bills</h2>
            </div>
            {bills.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No bills found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {bills.map((bill) => (
                  <div key={bill._id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            Bill #{bill._id.slice(-6)}
                          </h3>
                          <span className={`status-badge ${
                            bill.status === 'paid' ? 'status-completed' : 
                            bill.status === 'unpaid' ? 'status-pending' : 'status-cancelled'
                          }`}>
                            {bill.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>Date: {format(new Date(bill.issuedAt), 'MMM dd, yyyy')}</p>
                          <p>Appointment: {format(new Date(bill.appointment.date), 'MMM dd, yyyy')} at {bill.appointment.slot}</p>
                        </div>

                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                          <div className="space-y-1">
                            {bill.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.label} x {item.qty}</span>
                                <span>{formatCurrency(item.qty * item.unitPaise)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex justify-between text-sm">
                              <span>Subtotal:</span>
                              <span>{formatCurrency(bill.subtotalPaise)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Tax:</span>
                              <span>{formatCurrency(bill.taxPaise)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>Total:</span>
                              <span>{formatCurrency(bill.totalPaise)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Book Appointment</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Doctor
                </label>
                <select
                  required
                  value={bookingForm.doctorId}
                  onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value, slot: '' })}
                  className="input-field"
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value, slot: '' })}
                  className="input-field"
                />
              </div>

              {availableSlots.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Time Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBookingForm({ ...bookingForm, slot })}
                        className={`p-2 text-sm border rounded-lg transition-colors ${
                          bookingForm.slot === slot
                            ? 'bg-primary-50 border-primary-200 text-primary-700'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bookingForm.doctorId && bookingForm.date && availableSlots.length === 0 && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  No available slots for selected date. Please choose another date.
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !bookingForm.slot}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientDashboard