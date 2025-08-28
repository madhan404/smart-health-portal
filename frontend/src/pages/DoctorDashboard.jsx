import React, { useState, useEffect } from 'react'
import { 
  CalendarIcon, 
  UsersIcon, 
  ClockIcon, 
  PlusIcon,
  EditIcon,
  EyeIcon,
  XIcon
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [appointments, setAppointments] = useState([])
  const [availability, setAvailability] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [loading, setLoading] = useState(false)

  // Prescription form state
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicines: [{ name: '', dosage: '', frequency: '', durationDays: '', notes: '' }],
    notes: ''
  })

  // Availability form state - start with empty slots
  const [availabilityForm, setAvailabilityForm] = useState([
    { day: 'Mon', slots: [] },
    { day: 'Tue', slots: [] },
    { day: 'Wed', slots: [] },
    { day: 'Thu', slots: [] },
    { day: 'Fri', slots: [] },
    { day: 'Sat', slots: [] },
    { day: 'Sun', slots: [] }
  ])

  const [newSlot, setNewSlot] = useState({ day: 'Mon', startTime: '09:00', endTime: '09:30' })

  useEffect(() => {
    // Debug: Check authentication status
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    console.log('🔐 Auth Debug:', { token: !!token, role, tokenLength: token?.length })
    
    fetchAppointments()
    fetchAvailability()
  }, [selectedDate])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/doctor/appointments?date=${selectedDate}`)
      console.log('📅 Appointments response:', response.data)
      console.log('👥 Appointments data:', response.data.data.appointments)
      
      // Check if patient data is populated
      const appointments = response.data.data.appointments || []
      appointments.forEach((apt, index) => {
        console.log(`📋 Appointment ${index}:`, {
          id: apt._id,
          patient: apt.patient,
          hasPatient: !!apt.patient,
          patientName: apt.patient?.name,
          patientEmail: apt.patient?.email
        })
      })
      
      setAppointments(appointments)
    } catch (error) {
      console.error('❌ Error fetching appointments:', error)
      toast.error('Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailability = async () => {
    try {
      console.log('🔍 Fetching current availability...')
      const response = await api.get('/doctor/availability')
      console.log('✅ Current availability response:', response.data)
      
      if (response.data.data && response.data.data.availability) {
        const savedAvailability = response.data.data.availability
        console.log('📋 Saved availability data:', savedAvailability)
        
        // Create new form structure with saved data
        const updatedForm = [
          { day: 'Mon', slots: [] },
          { day: 'Tue', slots: [] },
          { day: 'Wed', slots: [] },
          { day: 'Thu', slots: [] },
          { day: 'Fri', slots: [] },
          { day: 'Sat', slots: [] },
          { day: 'Sun', slots: [] }
        ]
        
        // Populate with saved data
        savedAvailability.forEach(savedDay => {
          const dayIndex = updatedForm.findIndex(d => d.day === savedDay.day)
          if (dayIndex !== -1) {
            updatedForm[dayIndex].slots = [...savedDay.slots]
          }
        })
        
        setAvailabilityForm(updatedForm)
        console.log('🔄 Updated availability form:', updatedForm)
        toast.success('Availability loaded successfully')
      } else {
        console.log('ℹ️ No saved availability found, starting with empty form')
        toast.info('No saved availability found')
      }
    } catch (error) {
      console.error('❌ Error fetching availability:', error)
      toast.error('Failed to load availability')
      // Keep empty availability form
    }
  }

  const handleSaveAvailability = async () => {
    try {
      setLoading(true)
      
      // Filter out days with no slots to avoid validation errors
      const availabilityToSave = availabilityForm.filter(day => day.slots.length > 0)
      
      console.log('💾 Saving availability:', availabilityToSave)
      
      if (availabilityToSave.length === 0) {
        toast.error('Please add at least one time slot before saving')
        return
      }
      
      // Validate each time slot before saving
      const validationErrors = []
      availabilityToSave.forEach(day => {
        day.slots.forEach(slot => {
          const [startTime, endTime] = slot.split('-')
          if (startTime >= endTime) {
            validationErrors.push(`Invalid slot ${slot} for ${day.day}: end time must be after start time`)
          }
        })
      })
      
      if (validationErrors.length > 0) {
        console.error('❌ Validation errors:', validationErrors)
        toast.error('Some time slots are invalid. Please check and fix them.')
        return
      }
      
      const response = await api.put('/doctor/availability', { availability: availabilityToSave })
      console.log('✅ Availability saved successfully:', response.data)
      
      // Update the local state with the saved data
      if (response.data.data && response.data.data.availability) {
        setAvailabilityForm(response.data.data.availability)
        console.log('🔄 Updated local state with saved availability')
      }
      
      toast.success('Availability updated successfully')
      setShowAvailabilityModal(false)
      
      // Refresh availability to ensure consistency
      setTimeout(() => {
        fetchAvailability()
      }, 500)
    } catch (error) {
      console.error('❌ Availability update error:', error.response?.data || error)
      const errorMessage = error.response?.data?.error?.message || 'Failed to update availability'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const startAppointmentSession = async (appointment) => {
    try {
      setLoading(true)
      await api.put(`/doctor/appointments/${appointment._id}/status`, { 
        status: 'in_session',
        sessionStartTime: new Date().toISOString()
      })
      toast.success('Appointment session started')
      fetchAppointments()
    } catch (error) {
      console.error('Error starting session:', error)
      toast.error('Failed to start appointment session')
    } finally {
      setLoading(false)
    }
  }

  const endAppointmentSession = async (appointment) => {
    try {
      setLoading(true)
      await api.put(`/doctor/appointments/${appointment._id}/status`, { 
        status: 'completed',
        sessionEndTime: new Date().toISOString()
      })
      toast.success('Appointment session ended')
      fetchAppointments()
    } catch (error) {
      console.error('Error ending session:', error)
      toast.error('Failed to end appointment session')
    } finally {
      setLoading(false)
    }
  }

  const addSlot = () => {
    // Validate time inputs
    if (!newSlot.startTime || !newSlot.endTime) {
      toast.error('Please select both start and end times')
      return
    }

    // Convert times to comparable values for validation
    const startTime = newSlot.startTime
    const endTime = newSlot.endTime
    
    // Check if end time is after start time
    if (startTime >= endTime) {
      toast.error('End time must be after start time')
      return
    }

    // Check if time slot is at least 15 minutes
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1])
    const duration = endMinutes - startMinutes
    
    if (duration < 15) {
      toast.error('Time slot must be at least 15 minutes')
      return
    }

    const slot = `${startTime}-${endTime}`
    const dayIndex = availabilityForm.findIndex(d => d.day === newSlot.day)
    
    console.log('🔍 Adding slot:', {
      day: newSlot.day,
      startTime,
      endTime,
      slot,
      dayIndex,
      existingSlots: availabilityForm[dayIndex].slots
    })
    
    if (dayIndex === -1) {
      console.error('❌ Day not found:', newSlot.day)
      toast.error('Invalid day selected')
      return
    }
    
    if (!availabilityForm[dayIndex].slots.includes(slot)) {
      // Create a completely new array to ensure state update
      const updated = availabilityForm.map((day, index) => {
        if (index === dayIndex) {
          return {
            ...day,
            slots: [...day.slots, slot].sort()
          }
        }
        return day
      })
      
      setAvailabilityForm(updated)
      
      console.log('✅ Slot added successfully:', slot)
      console.log('🔄 Updated form state:', updated)
      toast.success(`Time slot ${slot} added for ${newSlot.day}`)
    } else {
      console.log('⚠️ Slot already exists:', slot)
      toast.error('This time slot already exists')
    }
    
    // Reset to default times but keep the same day
    setNewSlot({ day: newSlot.day, startTime: '09:00', endTime: '09:30' })
  }

  const removeSlot = (day, slot) => {
    const dayIndex = availabilityForm.findIndex(d => d.day === day)
    
    if (dayIndex === -1) {
      console.error('❌ Day not found for removal:', day)
      toast.error('Invalid day selected')
      return
    }
    
    console.log('🗑️ Removing slot:', { day, slot, dayIndex })
    
    // Create a completely new array to ensure state update
    const updated = availabilityForm.map((d, index) => {
      if (index === dayIndex) {
        const filteredSlots = d.slots.filter(s => s !== slot)
        console.log(`📋 ${day} slots after removal:`, filteredSlots)
        return {
          ...d,
          slots: filteredSlots
        }
      }
      return d
    })
    
    setAvailabilityForm(updated)
    console.log('✅ Slot removed successfully:', slot)
    toast.success(`Time slot ${slot} removed from ${day}`)
  }

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post(`/doctor/prescriptions/${selectedAppointment._id}`, prescriptionForm)
      toast.success('Prescription created successfully')
      setShowPrescriptionModal(false)
      setPrescriptionForm({
        medicines: [{ name: '', dosage: '', frequency: '', durationDays: '', notes: '' }],
        notes: ''
      })
      fetchAppointments()
    } catch (error) {
      toast.error('Failed to create prescription')
    } finally {
      setLoading(false)
    }
  }

  const addMedicine = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: [...prescriptionForm.medicines, { name: '', dosage: '', frequency: '', durationDays: '', notes: '' }]
    })
  }

  const removeMedicine = (index) => {
    const medicines = prescriptionForm.medicines.filter((_, i) => i !== index)
    setPrescriptionForm({ ...prescriptionForm, medicines })
  }

  const updateMedicine = (index, field, value) => {
    const medicines = [...prescriptionForm.medicines]
    medicines[index][field] = value
    setPrescriptionForm({ ...prescriptionForm, medicines })
  }

  // Stats calculation - only show active appointments (not completed)
  const todayAppointments = appointments.filter(apt => apt.date === selectedDate && apt.status !== 'completed')
  const pendingCount = todayAppointments.filter(apt => apt.status === 'pending').length
  const confirmedCount = todayAppointments.filter(apt => apt.status === 'confirmed').length
  const inSessionCount = todayAppointments.filter(apt => apt.status === 'in_session').length
  const activeCount = todayAppointments.filter(apt => apt.status === 'pending' || apt.status === 'confirmed' || apt.status === 'in_session').length

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending'
      case 'confirmed': return 'status-confirmed'
      case 'in_session': return 'status-in-session'
      case 'completed': return 'status-completed'
      case 'cancelled': return 'status-cancelled'
      case 'no_show': return 'status-no_show'
      default: return 'status-pending'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600">Manage active appointments and patient sessions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAvailabilityModal(true)}
            className="btn-secondary"
          >
            <EditIcon className="h-4 w-4 mr-2" />
            Set Availability
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Today's Appointments</h3>
              <p className="text-2xl font-bold text-primary-600">{todayAppointments.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Pending</h3>
              <p className="text-2xl font-bold text-warning-600">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Confirmed</h3>
              <p className="text-2xl font-bold text-primary-600">{confirmedCount}</p>
              <p className="text-xs text-gray-500 mt-1">Ready to start session</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">In Session</h3>
              <p className="text-2xl font-bold text-blue-600">{inSessionCount}</p>
              <p className="text-xs text-gray-500 mt-1">Ready for prescription</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Active</h3>
              <p className="text-2xl font-bold text-success-600">{activeCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Info */}
      <div className="card p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Dashboard Focus: Active Appointments Only</p>
            <p className="text-blue-700">
              This dashboard shows only pending, confirmed, and in-session appointments. 
              Completed appointments are hidden to focus on patients requiring attention.
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Info */}
      <div className="card p-4 bg-green-50 border border-green-200">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <div className="text-sm text-green-800">
            <p className="font-medium">Prescription Workflow: Session Required</p>
            <p className="text-green-700">
              Prescriptions can only be created after starting a patient session. 
              Workflow: Confirm → Start Session → Prescribe → End Session → Complete.
            </p>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="card p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field w-auto"
          />
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              className="btn-secondary text-sm"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
              className="btn-secondary text-sm"
            >
              Tomorrow
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Active Appointments for {format(new Date(selectedDate), 'MMMM dd, yyyy')} ({todayAppointments.length})
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                Pending: {pendingCount}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                Confirmed: {confirmedCount}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                In Session: {inSessionCount}
              </span>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : todayAppointments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No active appointments found for selected date
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {todayAppointments.map((appointment) => (
              <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {appointment.patient?.name}
                      </h3>
                      <span className={`status-badge ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>Time: {appointment.slot}</p>
                      <p>Email: {appointment.patient?.email}</p>
                      <p>Phone: {appointment.patient?.phone}</p>
                      {appointment.notes && <p>Notes: {appointment.notes}</p>}
                      {appointment.status === 'in_session' && (
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            💊 Ready for Prescription
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {appointment.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => startAppointmentSession(appointment)}
                          className="btn-success text-sm"
                        >
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Start Session
                        </button>
                        <button
                          disabled
                          className="btn-primary text-sm opacity-50 cursor-not-allowed"
                          title="Start session first to create prescription"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Prescribe
                        </button>
                      </>
                    )}
                    {appointment.status === 'in_session' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setShowPrescriptionModal(true)
                          }}
                          className="btn-primary text-sm"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Prescribe
                        </button>
                        <button
                          onClick={() => endAppointmentSession(appointment)}
                          className="btn-warning text-sm"
                        >
                          <ClockIcon className="h-4 w-4 mr-1" />
                          End Session
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedAppointment(appointment)
                        setShowAppointmentDetailsModal(true)
                      }}
                      className="btn-secondary text-sm"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Set Availability</h3>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Add New Slot */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-900">Add Time Slot</h4>
                  <button
                    onClick={fetchAvailability}
                    className="btn-secondary text-xs"
                    title="Refresh availability data"
                  >
                    🔄 Refresh
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={newSlot.day}
                    onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                    className="input-field w-32"
                  >
                    {availabilityForm.map(day => (
                      <option key={day.day} value={day.day}>{day.day}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="input-field w-32"
                    step="900"
                    min="00:00"
                    max="23:59"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="input-field w-32"
                    step="900"
                    min="00:00"
                    max="23:59"
                  />
                  <button onClick={addSlot} className="btn-primary">
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Current Availability */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availabilityForm.map((day) => (
                  <div key={day.day} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">{day.day}</h4>
                      {day.slots.length > 0 && (
                        <button
                          onClick={() => {
                            console.log(`🗑️ Clearing all slots for ${day.day}`)
                            const updated = availabilityForm.map(d => {
                              if (d.day === day.day) {
                                return { ...d, slots: [] }
                              }
                              return d
                            })
                            setAvailabilityForm(updated)
                            console.log('✅ Cleared slots for', day.day)
                            toast.success(`Cleared all slots for ${day.day}`)
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                          title="Clear all slots for this day"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {day.slots.length === 0 ? (
                      <p className="text-gray-500 text-sm">No slots available</p>
                    ) : (
                      <div className="space-y-1">
                        {day.slots.map((slot, index) => (
                          <div key={index} className="flex items-center justify-between bg-primary-50 rounded px-2 py-1">
                            <span className="text-sm text-primary-700">{slot}</span>
                            <button
                              onClick={() => removeSlot(day.day, slot)}
                              className="text-error-500 hover:text-error-700"
                              title="Remove this time slot"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      {day.slots.length} slot{day.slots.length !== 1 ? 's' : ''} configured
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all availability? This will clear all time slots.')) {
                      const resetForm = availabilityForm.map(day => ({ ...day, slots: [] }))
                      setAvailabilityForm(resetForm)
                      toast.success('All availability reset')
                      console.log('🔄 Reset availability form')
                    }
                  }}
                  className="btn-danger text-sm"
                  title="Reset all availability to empty"
                >
                  Reset All
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAvailabilityModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAvailability}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Saving...' : 'Save Availability'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Create Prescription for {selectedAppointment?.patient?.name}
              </h3>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handlePrescriptionSubmit} className="space-y-6">
              {/* Medicines */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-900">Medicines</h4>
                  <button
                    type="button"
                    onClick={addMedicine}
                    className="btn-secondary text-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Medicine
                  </button>
                </div>

                <div className="space-y-4">
                  {prescriptionForm.medicines.map((medicine, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="text-sm font-medium text-gray-900">Medicine {index + 1}</h5>
                        {prescriptionForm.medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedicine(index)}
                            className="text-error-500 hover:text-error-700"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Medicine Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={medicine.name}
                            onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                            className="input-field text-sm"
                            placeholder="e.g., Amoxicillin"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Dosage *
                          </label>
                          <input
                            type="text"
                            required
                            value={medicine.dosage}
                            onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                            className="input-field text-sm"
                            placeholder="e.g., 500mg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Frequency *
                          </label>
                          <input
                            type="text"
                            required
                            value={medicine.frequency}
                            onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                            className="input-field text-sm"
                            placeholder="e.g., 3 times daily"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Duration (days) *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={medicine.durationDays}
                            onChange={(e) => updateMedicine(index, 'durationDays', e.target.value)}
                            className="input-field text-sm"
                            placeholder="7"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={medicine.notes}
                          onChange={(e) => updateMedicine(index, 'notes', e.target.value)}
                          className="input-field text-sm"
                          placeholder="e.g., Take with food"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  General Notes
                </label>
                <textarea
                  value={prescriptionForm.notes}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Additional instructions or notes"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Creating...' : 'Create Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showAppointmentDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
              <button
                onClick={() => setShowAppointmentDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Patient Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Patient Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedAppointment.patient?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedAppointment.patient?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedAppointment.patient?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                      {selectedAppointment.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Appointment Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Appointment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{format(new Date(selectedAppointment.date), 'MMMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time Slot</p>
                    <p className="font-medium">{selectedAppointment.slot}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">{format(new Date(selectedAppointment.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium">{format(new Date(selectedAppointment.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Notes</h4>
                  <p className="text-gray-700">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowAppointmentDetailsModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                {selectedAppointment.status === 'confirmed' && (
                  <button
                    onClick={() => {
                      setShowAppointmentDetailsModal(false)
                      setShowPrescriptionModal(true)
                    }}
                    className="btn-primary"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Prescription
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorDashboard