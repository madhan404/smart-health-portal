import React, { useState, useEffect } from 'react'
import { FileTextIcon, CalendarIcon, UserIcon, PillIcon } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/patient/prescriptions')
      setPrescriptions(response.data.data.prescriptions)
    } catch (error) {
      toast.error('Failed to fetch prescriptions')
    } finally {
      setLoading(false)
    }
  }

  const sortedPrescriptions = prescriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600">View your medical prescriptions</p>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Prescriptions ({prescriptions.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">No prescriptions yet</p>
            <p className="text-gray-500">Prescriptions will appear here after your appointments</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedPrescriptions.map((prescription) => (
              <div key={prescription._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        Dr. {prescription.doctor?.name}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {prescription.doctor?.specialization}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span>Prescribed: {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                      {prescription.appointment && (
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span>Appointment: {format(new Date(prescription.appointment.date), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </div>

                    {/* Medicines */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Medicines:</h4>
                      <div className="space-y-2">
                        {prescription.medicines.map((medicine, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <PillIcon className="h-4 w-4 text-primary-600" />
                              <span className="font-medium text-gray-900">{medicine.name}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                              <div><strong>Dosage:</strong> {medicine.dosage}</div>
                              <div><strong>Frequency:</strong> {medicine.frequency}</div>
                              <div><strong>Duration:</strong> {medicine.durationDays} days</div>
                            </div>
                            {medicine.notes && (
                              <div className="mt-2 text-sm text-gray-600">
                                <strong>Notes:</strong> {medicine.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* General Notes */}
                    {prescription.notes && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">General Instructions:</h4>
                        <p className="text-sm text-gray-700">{prescription.notes}</p>
                      </div>
                    )}
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

export default PatientPrescriptions
