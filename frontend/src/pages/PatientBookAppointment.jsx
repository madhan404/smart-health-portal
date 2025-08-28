import React, { useState, useEffect } from 'react'
import { CalendarIcon, ClockIcon, UserIcon, PlusIcon } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'

const PatientBookAppointment = () => {
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loading, setLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState([])

  useEffect(() => {
    fetchDoctors()
  }, [])

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedDoctor, selectedDate])

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const response = await api.get('/patient/doctors')
      setDoctors(response.data.data.doctors)
    } catch (error) {
      toast.error('Failed to fetch doctors')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    try {
      // This would fetch available slots for the selected doctor and date
      // For now, we'll show placeholder slots
      const slots = ['09:00-09:30', '09:30-10:00', '10:00-10:30', '10:30-11:00']
      setAvailableSlots(slots)
    } catch (error) {
      toast.error('Failed to fetch available slots')
    }
  }

  const handleBookAppointment = async (e) => {
    e.preventDefault()
    
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please select doctor, date, and slot')
      return
    }

    try {
      setLoading(true)
      await api.post('/patient/appointments', {
        doctorId: selectedDoctor._id,
        date: selectedDate,
        slot: selectedSlot
      })
      
      toast.success('Appointment booked successfully!')
      
      // Reset form
      setSelectedDoctor(null)
      setSelectedDate('')
      setSelectedSlot('')
      setAvailableSlots([])
    } catch (error) {
      toast.error('Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  const getMinDate = () => {
    return format(addDays(new Date(), 1), 'yyyy-MM-dd')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-600">Schedule an appointment with a doctor</p>
        </div>
      </div>

      {/* Booking Form */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Appointment Details</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleBookAppointment} className="space-y-6">
            {/* Doctor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Doctor
              </label>
              <select
                value={selectedDoctor?._id || ''}
                onChange={(e) => {
                  const doctor = doctors.find(d => d._id === e.target.value)
                  setSelectedDoctor(doctor)
                  setSelectedDate('')
                  setSelectedSlot('')
                }}
                className="input-field w-full"
                required
              >
                <option value="">Choose a doctor...</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                className="input-field w-full"
                required
                disabled={!selectedDoctor}
              />
              <p className="text-sm text-gray-500 mt-1">
                Appointments can be booked from tomorrow onwards
              </p>
            </div>

            {/* Slot Selection */}
            {selectedDate && availableSlots.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time Slot
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        selectedSlot === slot
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-300 hover:border-primary-300'
                      }`}
                    >
                      <ClockIcon className="h-4 w-4 mx-auto mb-1" />
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !selectedDoctor || !selectedDate || !selectedSlot}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Booking...
                  </div>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Book Appointment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Selected Doctor Info */}
      {selectedDoctor && (
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Doctor</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <UserIcon className="h-12 w-12 text-primary-600" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  Dr. {selectedDoctor.name}
                </h4>
                <p className="text-gray-600">{selectedDoctor.specialization}</p>
                {selectedDoctor.availability && (
                  <p className="text-sm text-gray-500 mt-1">
                    Available: {selectedDoctor.availability.map(avail => avail.day).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Summary */}
      {selectedDoctor && selectedDate && selectedSlot && (
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Summary</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor:</span>
                <span className="font-medium">Dr. {selectedDoctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{selectedSlot}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientBookAppointment
