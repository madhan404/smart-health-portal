import React, { useState, useEffect } from 'react'
import { 
  CalendarIcon, 
  UsersIcon, 
  ClockIcon, 
  CheckIcon,
  XIcon
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'

const StaffDashboard = () => {
  const [appointments, setAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/staff/appointments?date=${selectedDate}`)
      setAppointments(response.data.data.appointments)
    } catch (error) {
      toast.error('Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await api.put(`/staff/appointments/${appointmentId}/status`, { status })
      toast.success(`Appointment ${status}`)
      fetchAppointments()
    } catch (error) {
      toast.error('Failed to update appointment status')
    }
  }



  // Stats calculation - exclude completed appointments
  const todayAppointments = appointments.filter(apt => apt.date === selectedDate && apt.status !== 'completed')
  const pendingCount = todayAppointments.filter(apt => apt.status === 'pending').length
  const confirmedCount = todayAppointments.filter(apt => apt.status === 'confirmed').length
  const activeCount = todayAppointments.filter(apt => apt.status === 'pending' || apt.status === 'confirmed').length

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

  const getStatusActions = (appointment) => {
    switch (appointment.status) {
      case 'pending':
        return (
          <>
            <button
              onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
              className="btn-primary text-sm"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Confirm
            </button>
            <button
              onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
              className="btn-danger text-sm"
            >
              <XIcon className="h-4 w-4 mr-1" />
              Cancel
            </button>
          </>
        )
      case 'confirmed':
        return (
          <>
            <button
              onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
              className="btn-primary text-sm"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Complete
            </button>
            <button
              onClick={() => updateAppointmentStatus(appointment._id, 'no_show')}
              className="btn-secondary text-sm"
            >
              No Show
            </button>
            <button
              onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
              className="btn-danger text-sm"
            >
              <XIcon className="h-4 w-4 mr-1" />
              Cancel
            </button>
          </>
        )
      case 'completed':
        return null
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600">Manage booking approvals and appointment completion</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <h2 className="text-lg font-semibold text-gray-900">
            Active Appointments for {format(new Date(selectedDate), 'MMMM dd, yyyy')} ({appointments.filter(apt => apt.status !== 'completed').length})
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : appointments.filter(apt => apt.status !== 'completed').length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No active appointments found for selected date
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {appointments.filter(apt => apt.status !== 'completed').map((appointment) => (
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
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {getStatusActions(appointment)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  )
}

export default StaffDashboard