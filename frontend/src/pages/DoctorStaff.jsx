import React, { useState, useEffect } from 'react'
import { UsersIcon, MailIcon, PlusIcon, EditIcon, TrashIcon } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const DoctorStaff = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'nurse',
    specialization: '',
    password: ''
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const response = await api.get('/doctor/staff')
      setStaff(response.data.data.staff)
    } catch (error) {
      toast.error('Failed to fetch staff')
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'nurse',
      specialization: '',
      password: ''
    })
  }

  const handleAddStaff = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/doctor/staff', formData)
      toast.success('Staff member added successfully')
      setShowAddModal(false)
      resetForm()
      fetchStaff()
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to add staff member')
      console.error('Error adding staff:', error)
    }
  }

  const handleEditStaff = async (e) => {
    e.preventDefault()
    try {
      const response = await api.put(`/doctor/staff/${selectedStaff._id}`, formData)
      toast.success('Staff member updated successfully')
      setShowEditModal(false)
      resetForm()
      setSelectedStaff(null)
      fetchStaff()
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to update staff member')
      console.error('Error updating staff:', error)
    }
  }

  const handleDeleteStaff = async () => {
    try {
      await api.delete(`/doctor/staff/${selectedStaff._id}`)
      toast.success('Staff member removed successfully')
      setShowDeleteModal(false)
      setSelectedStaff(null)
      fetchStaff()
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to remove staff member')
      console.error('Error removing staff:', error)
    }
  }

  const openEditModal = (member) => {
    setSelectedStaff(member)
    setFormData({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'nurse',
      specialization: member.specialization || ''
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (member) => {
    setSelectedStaff(member)
    setShowDeleteModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage your clinic staff members</p>
        </div>
        <button 
          onClick={() => {
            resetForm()
            setShowAddModal(true)
          }}
          className="btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Staff Member
        </button>
      </div>

      {/* Staff List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Staff Members ({staff.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">No staff members yet</p>
            <p className="text-gray-500">Get started by adding your first staff member</p>
            <button className="btn-primary mt-4">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Staff Member
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {staff.map((member) => (
              <div key={member._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {member.name}
                      </h3>
                    </div>
                    
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                       <div className="flex items-center space-x-2">
                         <MailIcon className="h-4 w-4 text-gray-400" />
                         <span>{member.email}</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <span className="text-gray-400">📱</span>
                         <span>{member.phone || 'No phone'}</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <span className="text-gray-400">👤</span>
                         <span className="capitalize">{member.role || 'nurse'}</span>
                       </div>
                       {member.specialization && (
                         <div className="flex items-center space-x-2">
                           <span className="text-gray-400">🏥</span>
                           <span>{member.specialization}</span>
                         </div>
                       )}
                     </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openEditModal(member)}
                      className="btn-secondary text-sm"
                    >
                      <EditIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button 
                      onClick={() => openDeleteModal(member)}
                      className="btn-error text-sm"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
                     </div>
         )}
       </div>

       {/* Add Staff Modal */}
       {showAddModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">Add Staff Member</h3>
               <button
                 onClick={() => {
                   setShowAddModal(false)
                   resetForm()
                 }}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <form onSubmit={handleAddStaff} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Full Name *
                   </label>
                   <input
                     type="text"
                     required
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     className="input-field w-full"
                     placeholder="Enter full name"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Email Address *
                   </label>
                   <input
                     type="email"
                     required
                     value={formData.email}
                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                     className="input-field w-full"
                     placeholder="Enter email address"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Phone Number
                   </label>
                   <input
                     type="tel"
                     value={formData.phone}
                     onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                     className="input-field w-full"
                     placeholder="Enter phone number"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Role *
                   </label>
                   <select
                     required
                     value={formData.role}
                     onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                     className="input-field w-full"
                   >
                     <option value="nurse">Nurse</option>
                     <option value="receptionist">Receptionist</option>
                     <option value="technician">Technician</option>
                     <option value="assistant">Medical Assistant</option>
                     <option value="other">Other</option>
                   </select>
                 </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Specialization
                 </label>
                 <input
                   type="text"
                   value={formData.specialization}
                   onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                   className="input-field w-full"
                   placeholder="Enter specialization (optional)"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Password *
                 </label>
                 <input
                   type="password"
                   required
                   value={formData.password}
                   onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                   className="input-field w-full"
                   placeholder="Enter password (min 6 characters)"
                   minLength={6}
                 />
               </div>

               <div className="flex justify-end space-x-3 pt-4">
                 <button
                   type="button"
                   onClick={() => {
                     setShowAddModal(false)
                     resetForm()
                   }}
                   className="btn-secondary"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="btn-primary"
                 >
                   Add Staff Member
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

       {/* Edit Staff Modal */}
       {showEditModal && selectedStaff && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">Edit Staff Member</h3>
               <button
                 onClick={() => {
                   setShowEditModal(false)
                   resetForm()
                   setSelectedStaff(null)
                 }}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <form onSubmit={handleEditStaff} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Full Name *
                   </label>
                   <input
                     type="text"
                     required
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     className="input-field w-full"
                     placeholder="Enter full name"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Email Address *
                   </label>
                   <input
                     type="email"
                     required
                     value={formData.email}
                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                     className="input-field w-full"
                     placeholder="Enter email address"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Phone Number
                   </label>
                   <input
                     type="tel"
                     value={formData.phone}
                     onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                     className="input-field w-full"
                     placeholder="Enter phone number"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Role *
                   </label>
                   <select
                     required
                     value={formData.role}
                     onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                     className="input-field w-full"
                   >
                     <option value="nurse">Nurse</option>
                     <option value="receptionist">Receptionist</option>
                     <option value="technician">Technician</option>
                     <option value="assistant">Medical Assistant</option>
                     <option value="other">Other</option>
                   </select>
                 </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Specialization
                 </label>
                 <input
                   type="text"
                   value={formData.specialization}
                   onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                   className="input-field w-full"
                   placeholder="Enter specialization (optional)"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Password
                 </label>
                 <input
                   type="password"
                   value={formData.password}
                   onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                   className="input-field w-full"
                   placeholder="Leave blank to keep current password"
                   minLength={6}
                 />
                 <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
               </div>

               <div className="flex justify-end space-x-3 pt-4">
                 <button
                   type="button"
                   onClick={() => {
                     setShowEditModal(false)
                     resetForm()
                     setSelectedStaff(null)
                   }}
                   className="btn-secondary"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="btn-primary"
                 >
                   Update Staff Member
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

       {/* Delete Confirmation Modal */}
       {showDeleteModal && selectedStaff && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">Remove Staff Member</h3>
               <button
                 onClick={() => {
                   setShowDeleteModal(false)
                   setSelectedStaff(null)
                 }}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="space-y-4">
               <p className="text-gray-700">
                 Are you sure you want to remove <strong>{selectedStaff.name}</strong> from your staff?
               </p>
               <p className="text-sm text-gray-500">
                 This action cannot be undone. The staff member will lose access to the system.
               </p>

               <div className="flex justify-end space-x-3 pt-4">
                 <button
                   onClick={() => {
                     setShowDeleteModal(false)
                     setSelectedStaff(null)
                   }}
                   className="btn-secondary"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleDeleteStaff}
                   className="btn-error"
                 >
                   Remove Staff Member
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   )
 }

export default DoctorStaff
