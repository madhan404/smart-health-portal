import React, { useState, useEffect } from 'react'
import { UsersIcon, MailIcon, PhoneIcon, CalendarIcon, EyeIcon } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const DoctorPatients = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [patientAppointments, setPatientAppointments] = useState([])
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching patients from /doctor/patients...')
      
      const response = await api.get('/doctor/patients')
      console.log('📡 Full API response:', response.data)
      
      // Ensure we have valid data and filter out any null/undefined patients
      const patientsData = response.data?.data?.patients || []
      console.log('👥 Raw patients data:', patientsData)
      
      const validPatients = patientsData.filter(patient => 
        patient && 
        typeof patient === 'object' && 
        patient._id && 
        patient.name && 
        patient.email
      )
      
      console.log('✅ Valid patients after filtering:', validPatients)
      setPatients(validPatients)
      
      if (patientsData.length !== validPatients.length) {
        console.warn(`⚠️ Filtered out ${patientsData.length - validPatients.length} invalid patient records`)
      }

      // If no patients found, try to get all patients as fallback
      if (validPatients.length === 0) {
        console.log('🔄 No patients found, trying fallback...')
        try {
          const fallbackResponse = await api.get('/dev/patients')
          const fallbackPatients = fallbackResponse.data?.data?.patients || []
          console.log('🔄 Fallback patients:', fallbackPatients)
          
          if (fallbackPatients.length > 0) {
            setPatients(fallbackPatients)
            toast.info('Showing all patients (fallback mode)')
          }
        } catch (fallbackError) {
          console.log('❌ Fallback also failed:', fallbackError)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching patients:', error.response?.data || error)
      toast.error('Failed to fetch patients')
      setPatients([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient && 
    (patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     patient.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const viewPatientProfile = async (patient) => {
    try {
      setSelectedPatient(patient)
      setShowProfileModal(true)
      
      // TODO: In the future, you can fetch additional patient details here
      // const response = await api.get(`/doctor/patients/${patient._id}/details`)
      // setSelectedPatient({ ...patient, ...response.data.data })
    } catch (error) {
      console.error('Error fetching patient details:', error)
      toast.error('Failed to load patient details')
    }
  }

  const viewPatientAppointments = async (patient) => {
    try {
      setSelectedPatient(patient)
      setShowAppointmentsModal(true)
      
      // Fetch patient's appointments
      const response = await api.get(`/doctor/appointments?patientId=${patient._id}`)
      setPatientAppointments(response.data?.data?.appointments || [])
    } catch (error) {
      console.error('Error fetching patient appointments:', error)
      toast.error('Failed to load patient appointments')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">View and manage your patient list</p>
        </div>
        <div className="flex space-x-2">
          {/* Removed test and debug buttons for cleaner interface */}
        </div>
      </div>

      {/* Search */}
      <div className="card p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search patients</label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search patients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UsersIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Patient List ({filteredPatients.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No patients found matching your search' : 'No patients found'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => {
              // Additional safety check to ensure patient is valid
              if (!patient || !patient._id || !patient.name || !patient.email) {
                return null; // Skip rendering invalid patients
              }
              
              return (
                <div key={patient._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {patient.name}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <MailIcon className="h-4 w-4 text-gray-400" />
                          <span>{patient.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                          <span>{patient.phone || 'No phone'}</span>
                        </div>
                      </div>
                    </div>
                    
                                         <div className="flex space-x-2">
                       <button 
                         onClick={() => viewPatientProfile(patient)}
                         className="btn-secondary text-sm"
                       >
                         <EyeIcon className="h-4 w-4 mr-1" />
                         View Profile
                       </button>
                       <button 
                         onClick={() => viewPatientAppointments(patient)}
                         className="btn-primary text-sm"
                       >
                         <CalendarIcon className="h-4 w-4 mr-1" />
                         Appointments
                       </button>
                     </div>
                  </div>
                </div>
              );
            })}
                     </div>
         )}
       </div>

       {/* Patient Profile Modal */}
       {showProfileModal && selectedPatient && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">Patient Profile</h3>
               <button
                 onClick={() => setShowProfileModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="space-y-6">
               {/* Basic Information */}
               <div className="bg-gray-50 rounded-lg p-4">
                 <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm text-gray-600">Full Name</p>
                     <p className="font-medium">{selectedPatient.name}</p>
                   </div>
                   <div>
                     <p className="text-sm text-gray-600">Email Address</p>
                     <p className="font-medium">{selectedPatient.email}</p>
                   </div>
                   <div>
                     <p className="text-sm text-gray-600">Phone Number</p>
                     <p className="font-medium">{selectedPatient.phone || 'Not provided'}</p>
                   </div>
                   <div>
                     <p className="text-sm text-gray-600">Patient ID</p>
                     <p className="font-medium text-sm font-mono">{selectedPatient._id}</p>
                   </div>
                 </div>
               </div>

               {/* Contact Information */}
               <div className="bg-gray-50 rounded-lg p-4">
                 <h4 className="text-md font-medium text-gray-900 mb-3">Contact Details</h4>
                 <div className="space-y-3">
                   <div className="flex items-center space-x-3">
                     <MailIcon className="h-5 w-5 text-gray-400" />
                     <span className="text-gray-700">{selectedPatient.email}</span>
                   </div>
                   <div className="flex items-center space-x-3">
                     <PhoneIcon className="h-5 w-5 text-gray-400" />
                     <span className="text-gray-700">{selectedPatient.phone || 'No phone number available'}</span>
                   </div>
                 </div>
               </div>

               {/* Additional Information */}
               {selectedPatient.address && (
                 <div className="bg-gray-50 rounded-lg p-4">
                   <h4 className="text-md font-medium text-gray-900 mb-3">Address</h4>
                   <p className="text-gray-700">{selectedPatient.address}</p>
                 </div>
               )}

               {selectedPatient.dateOfBirth && (
                 <div className="bg-gray-50 rounded-lg p-4">
                   <h4 className="text-md font-medium text-gray-900 mb-3">Date of Birth</h4>
                   <p className="text-gray-700">{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
                 </div>
               )}

               {/* Actions */}
               <div className="flex justify-end space-x-3 pt-4">
                 <button
                   onClick={() => setShowProfileModal(false)}
                   className="btn-secondary"
                 >
                   Close
                 </button>
                 <button
                   onClick={() => {
                     setShowProfileModal(false)
                     viewPatientAppointments(selectedPatient)
                   }}
                   className="btn-primary"
                 >
                   View Appointments
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Patient Appointments Modal */}
       {showAppointmentsModal && selectedPatient && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">
                 Appointments for {selectedPatient.name}
               </h3>
               <button
                 onClick={() => setShowAppointmentsModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="space-y-4">
               {patientAppointments.length === 0 ? (
                 <div className="text-center py-8">
                   <p className="text-gray-500">No appointments found for this patient</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {patientAppointments.map((appointment) => (
                     <div key={appointment._id} className="bg-gray-50 rounded-lg p-4">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                           <p className="text-sm text-gray-600">Date</p>
                           <p className="font-medium">
                             {new Date(appointment.date).toLocaleDateString()}
                           </p>
                         </div>
                         <div>
                           <p className="text-sm text-gray-600">Time</p>
                           <p className="font-medium">{appointment.slot}</p>
                         </div>
                         <div>
                           <p className="text-sm text-gray-600">Status</p>
                           <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                             appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                             appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                             appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                             'bg-gray-100 text-gray-800'
                           }`}>
                             {appointment.status.replace('_', ' ')}
                           </span>
                         </div>
                       </div>
                       {appointment.notes && (
                         <div className="mt-3">
                           <p className="text-sm text-gray-600">Notes</p>
                           <p className="text-sm text-gray-700">{appointment.notes}</p>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               )}

               {/* Actions */}
               <div className="flex justify-end space-x-3 pt-4">
                 <button
                   onClick={() => setShowAppointmentsModal(false)}
                   className="btn-secondary"
                 >
                   Close
                 </button>
                 <button
                   onClick={() => {
                     setShowAppointmentsModal(false)
                     setShowProfileModal(true)
                   }}
                   className="btn-primary"
                 >
                   Back to Profile
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   )
 }

export default DoctorPatients
