import React, { useState, useEffect } from 'react'
import { CalendarIcon, ClockIcon, UserIcon, PhoneIcon, MailIcon, EditIcon, EyeIcon, PlusIcon, XIcon } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const StaffAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showAllDates, setShowAllDates] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] = useState(false)
  const [showBillingModal, setShowBillingModal] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate, showAllDates])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      let url = '/staff/appointments'
      
      if (!showAllDates && selectedDate) {
        url += `?date=${selectedDate}`
      }
      
      const response = await api.get(url)
      setAppointments(response.data.data.appointments)
    } catch (error) {
      toast.error('Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await api.put(`/staff/appointments/${appointmentId}/status`, { status: newStatus })
      toast.success('Appointment status updated successfully')
      fetchAppointments()
    } catch (error) {
      toast.error('Failed to update appointment status')
    }
  }





  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'in_session': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'no_show': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusOptions = (currentStatus) => {
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_session', 'no_show', 'cancelled'],
      'in_session': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': [],
      'no_show': []
    }
    return validTransitions[currentStatus] || []
  }

  const filteredAppointments = appointments.filter(appointment => {
    if (statusFilter === 'all') return true
    return appointment.status === statusFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage appointments for your doctor</p>
        </div>
        <div className="flex space-x-2">
          {/* Removed test button for cleaner interface */}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-4 mb-4">
          <label className="text-sm font-medium text-gray-700">Date Filter:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field w-auto"
            disabled={showAllDates}
          />
          <button
            onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
            className="btn-secondary text-sm"
            disabled={showAllDates}
          >
            Today
          </button>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showAllDates}
              onChange={(e) => setShowAllDates(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Show all dates</span>
          </label>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_session">In Session</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
          <button
            onClick={fetchAppointments}
            className="btn-primary text-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {showAllDates ? 'All Appointments' : `Appointments for ${format(new Date(selectedDate), 'MMMM dd, yyyy')}`}
            {statusFilter !== 'all' && ` - ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
            {' '}({filteredAppointments.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {showAllDates 
              ? 'No appointments found' 
              : `No appointments found for ${format(new Date(selectedDate), 'MMMM dd, yyyy')}`
            }
            {statusFilter !== 'all' && ` with status "${statusFilter}"`}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {appointment.patient?.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span>{appointment.slot}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span>{format(new Date(appointment.date), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MailIcon className="h-4 w-4 text-gray-400" />
                        <span>{appointment.patient?.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        <span>{appointment.patient?.phone}</span>
                      </div>
                    </div>
                    
                    {appointment.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <select
                      value={appointment.status}
                      onChange={(e) => updateAppointmentStatus(appointment._id, e.target.value)}
                      className="input-field text-sm"
                      disabled={getStatusOptions(appointment.status).length === 0}
                    >
                      <option value={appointment.status}>{appointment.status.replace('_', ' ')}</option>
                      {getStatusOptions(appointment.status).map(status => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    
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

              </div>
            </div>
          </div>
        </div>
      )}



      {/* Billing Modal */}
      {showBillingModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Bill</h3>
              <button
                onClick={() => setShowBillingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Patient Info */}
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
                </div>
              </div>



              {/* Bill Items Form */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Bill Items</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Consultation Fee
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field w-full"
                        placeholder="0.00"
                        defaultValue="50.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Medicine Cost
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field w-full"
                        placeholder="0.00"
                        defaultValue="25.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Other Charges
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field w-full"
                        placeholder="0.00"
                        defaultValue="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="input-field w-full"
                      rows="3"
                      placeholder="Additional notes for the bill..."
                    />
                  </div>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-blue-900 mb-3">Bill Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">₹75.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18%):</span>
                    <span className="font-medium">₹13.50</span>
                  </div>
                  <div className="flex justify-between text-blue-900 font-semibold">
                    <span>Total:</span>
                    <span>₹88.50</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowBillingModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement bill creation
                    toast.success('Bill created successfully!')
                    setShowBillingModal(false)
                  }}
                  className="btn-primary"
                >
                  Generate Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffAppointments
