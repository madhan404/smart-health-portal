import React, { useState, useEffect } from 'react'
import { 
  CreditCardIcon, 
  PlusIcon, 
  EyeIcon, 
  DownloadIcon, 
  FilterIcon,
  SearchIcon,
  CalendarIcon,
  UserIcon,
  DollarSignIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  ReceiptIcon
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const StaffBilling = () => {
  const [bills, setBills] = useState([])
  const [completedAppointments, setCompletedAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [showCreateBillModal, setShowCreateBillModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [billForm, setBillForm] = useState({
    items: [{ label: '', qty: 1, unitPaise: 0 }],
    taxPercent: 0
  })
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)

  useEffect(() => {
    fetchBills()
    fetchCompletedAppointments()
  }, [])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const response = await api.get('/staff/bills')
      setBills(response.data.data.bills)
    } catch (error) {
      toast.error('Failed to fetch bills')
      console.error('Error fetching bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedAppointments = async () => {
    try {
      setLoadingAppointments(true)
      const response = await api.get('/staff/appointments?status=completed')
      setCompletedAppointments(response.data.data.appointments)
    } catch (error) {
      toast.error('Failed to fetch completed appointments')
      console.error('Error fetching completed appointments:', error)
    } finally {
      setLoadingAppointments(false)
    }
  }

  const fetchPrescription = async (appointmentId) => {
    try {
      console.log('🔍 Fetching prescription for appointment:', appointmentId)
      const response = await api.get(`/staff/prescriptions/appointment/${appointmentId}`)
      console.log('✅ Prescription found:', response.data.data.prescription)
      return response.data.data.prescription
    } catch (error) {
      console.log('ℹ️ No prescription found for appointment:', appointmentId)
      console.error('Error details:', error)
      // Return null for appointments without prescriptions (this is normal)
      return null
    }
  }

  const updatePaymentMethod = async (billId, paymentMethod) => {
    try {
      await api.put(`/staff/bills/${billId}/payment`, { paymentMethod })
      toast.success('Payment method updated successfully')
      fetchBills()
    } catch (error) {
      toast.error('Failed to update payment method')
    }
  }

  const markBillAsPaid = async (billId) => {
    try {
      await api.put(`/staff/bills/${billId}/status`, { status: 'paid' })
      toast.success('Bill marked as paid successfully')
      fetchBills()
    } catch (error) {
      toast.error('Failed to mark bill as paid')
    }
  }

  const addBillItem = () => {
    setBillForm({
      ...billForm,
      items: [...billForm.items, { label: '', qty: 1, unitPaise: 0 }]
    })
  }

  const removeBillItem = (index) => {
    const items = billForm.items.filter((_, i) => i !== index)
    setBillForm({ ...billForm, items })
  }

  const updateBillItem = (index, field, value) => {
    const items = [...billForm.items]
    items[index][field] = value
    setBillForm({ ...billForm, items })
  }

  const calculateTotal = () => {
    const subtotal = billForm.items.reduce((sum, item) => sum + (item.qty * item.unitPaise), 0)
    const tax = Math.round(subtotal * billForm.taxPercent / 100)
    return subtotal + tax
  }

  const handleCreateBill = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post(`/staff/bills/${selectedAppointment._id}`, {
        items: billForm.items,
        taxPercent: billForm.taxPercent
      })
      toast.success('Bill created successfully')
      setShowCreateBillModal(false)
      setSelectedAppointment(null)
      setSelectedPrescription(null)
      setBillForm({ items: [{ label: '', qty: 1, unitPaise: 0 }], taxPercent: 0 })
      fetchBills()
      fetchCompletedAppointments()
    } catch (error) {
      toast.error('Failed to create bill')
      console.error('Error creating bill:', error)
    }
  }

  const openCreateBillModal = async (appointment) => {
    try {
      setSelectedAppointment(appointment)
      console.log('📋 Opening bill modal for appointment:', appointment._id)
      
      // Fetch prescription (this may return null if no prescription exists)
      const prescription = await fetchPrescription(appointment._id)
      setSelectedPrescription(prescription)
      
      // Show modal regardless of prescription status
      setShowCreateBillModal(true)
      
      if (!prescription) {
        console.log('ℹ️ No prescription found - bill can still be created')
        toast.info('No prescription found. You can still create a bill for services.')
        
        // Set default bill items for appointments without prescriptions
        setBillForm({
          items: [
            { label: 'Consultation Fee', qty: 1, unitPaise: 5000 }, // ₹50.00
            { label: 'Medical Services', qty: 1, unitPaise: 2500 }  // ₹25.00
          ],
          taxPercent: 0
        })
      } else {
        console.log('✅ Prescription loaded successfully')
        
        // Auto-populate bill items based on prescription medicines
        if (prescription.medicines && prescription.medicines.length > 0) {
          const prescriptionItems = prescription.medicines.map(medicine => ({
            label: `${medicine.name} (${medicine.dosage})`,
            qty: 1,
            unitPaise: 2500 // Default ₹25.00 per medicine
          }))
          
          // Add consultation fee as first item
          const billItems = [
            { label: 'Consultation Fee', qty: 1, unitPaise: 5000 }, // ₹50.00
            ...prescriptionItems
          ]
          
          setBillForm({
            items: billItems,
            taxPercent: 0
          })
          
          console.log('💊 Auto-populated bill items from prescription:', billItems)
          toast.success('Bill items auto-populated from prescription')
        } else {
          // Reset to default form for prescriptions without medicines
          setBillForm({
            items: [{ label: '', qty: 1, unitPaise: 0 }],
            taxPercent: 0
          })
        }
      }
    } catch (error) {
      console.error('❌ Error opening bill modal:', error)
      toast.error('Failed to open bill creation modal')
    }
  }

  // Helper functions for bill organization
  const getFilteredBills = () => {
    let filtered = bills

    if (searchTerm) {
      filtered = filtered.filter(bill => 
        bill.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.appointment?.date?.includes(searchTerm)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => bill.paymentStatus === statusFilter)
    }

    if (dateFilter) {
      filtered = filtered.filter(bill => bill.appointment?.date === dateFilter)
    }

    if (selectedPatient) {
      filtered = filtered.filter(bill => bill.patient?._id === selectedPatient)
    }

    return filtered
  }

  const getGeneratedBills = () => {
    return getFilteredBills().filter(bill => bill.paymentStatus === 'pending')
  }

  const getPaidBills = () => {
    return getFilteredBills().filter(bill => bill.paymentStatus === 'paid')
  }

  const getUniquePatients = () => {
    const patients = bills.map(bill => bill.patient).filter(Boolean)
    return [...new Map(patients.map(p => [p._id, p])).values()]
  }

  const getTotalAmount = (billList) => {
    return billList.reduce((sum, bill) => sum + bill.totalPaise, 0)
  }

  const formatCurrency = (paise) => {
    return `₹${(paise / 100).toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing Management</h1>
          <p className="text-gray-600">Create bills for completed appointments and manage payments</p>
        </div>
        <div className="flex space-x-2">
          {/* Removed test buttons for cleaner interface */}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ReceiptIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Bills</h3>
              <p className="text-2xl font-bold text-primary-600">{bills.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Pending Payment</h3>
              <p className="text-2xl font-bold text-yellow-600">{getGeneratedBills().length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Paid Bills</h3>
              <p className="text-2xl font-bold text-green-600">{getPaidBills().length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSignIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(getTotalAmount(getPaidBills()))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <SearchIcon className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by patient name or bill ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-64"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <FilterIcon className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4 text-gray-500" />
            <select
              value={selectedPatient || ''}
              onChange={(e) => setSelectedPatient(e.target.value || null)}
              className="input-field"
            >
              <option value="">All Patients</option>
              {getUniquePatients().map(patient => (
                <option key={patient._id} value={patient._id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Create Bill */}
        <div className="space-y-6">
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <PlusIcon className="h-5 w-5 mr-2 text-primary-600" />
                Create Bill
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Select a completed appointment to create a bill
              </p>
            </div>
            
            {loadingAppointments ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : completedAppointments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">No completed appointments</p>
                <p className="text-gray-500">Complete appointments first to create bills</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {completedAppointments.map((appointment) => (
                  <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {appointment.patient?.name}
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Date: {appointment.date} at {appointment.slot}</p>
                          <p>Email: {appointment.patient?.email}</p>
                          <p>Phone: {appointment.patient?.phone}</p>
                          {appointment.notes && <p>Notes: {appointment.notes}</p>}
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              💊 Bill Creation Ready
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openCreateBillModal(appointment)}
                          className="btn-primary text-sm"
                        >
                          <ReceiptIcon className="h-4 w-4 mr-1" />
                          Generate Bill
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Generated Bills & Paid Bills */}
        <div className="space-y-6">
          {/* Generated Bills (Pending Payment) */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-yellow-600" />
                Generated Bills
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Bills awaiting payment confirmation
              </p>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : getGeneratedBills().length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ReceiptIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">No generated bills</p>
                <p className="text-gray-500">Create bills to see them here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {getGeneratedBills().map((bill) => (
                  <BillCard 
                    key={bill._id} 
                    bill={bill} 
                    type="generated" 
                    onUpdatePayment={updatePaymentMethod}
                    onMarkAsPaid={markBillAsPaid}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Paid Bills */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                Paid Bills
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                View and manage completed payments
              </p>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : getPaidBills().length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">No paid bills yet</p>
                <p className="text-gray-500">Bills will appear here after payment</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {getPaidBills().map((bill) => (
                  <BillCard key={bill._id} bill={bill} type="paid" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Bill Modal */}
      {showCreateBillModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Bill for {selectedAppointment.patient?.name}</h3>
              <button
                onClick={() => setShowCreateBillModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Prescription Details */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-md font-medium text-gray-900">Prescription Details</h4>
                  {selectedAppointment && (
                    <button
                      onClick={async () => {
                        console.log('🔄 Refreshing prescription for appointment:', selectedAppointment._id)
                        const prescription = await fetchPrescription(selectedAppointment._id)
                        setSelectedPrescription(prescription)
                        if (prescription) {
                          toast.success('Prescription refreshed')
                        } else {
                          toast.success('No prescription found')
                        }
                      }}
                      className="btn-secondary text-xs"
                      title="Refresh prescription data"
                    >
                      🔄 Refresh
                    </button>
                  )}
                </div>
                
                {selectedPrescription ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <FileTextIcon className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Prescription #{selectedPrescription._id.slice(-6)}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Created:</span>
                          <span>{new Date(selectedPrescription.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Medicines:</span>
                          <span>{selectedPrescription.medicines?.length || 0} items</span>
                        </div>
                      </div>
                    </div>

                    {selectedPrescription.medicines && selectedPrescription.medicines.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900">Medicines:</h5>
                        <div className="space-y-2">
                          {selectedPrescription.medicines.map((medicine, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <div className="font-medium text-sm">{medicine.name}</div>
                              <div className="text-sm text-gray-600">
                                {medicine.dosage} - {medicine.duration}
                              </div>
                              {medicine.instructions && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {medicine.instructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPrescription.notes && (
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Doctor Notes:</h5>
                        <p className="text-sm text-gray-700">{selectedPrescription.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
                    <FileTextIcon className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                    <p className="text-lg font-medium text-amber-900 mb-2">No Prescription Found</p>
                    <p className="text-sm text-amber-700 mb-3">
                      This appointment doesn't have a prescription yet
                    </p>
                    <div className="bg-amber-100 p-3 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-800 font-medium">
                        💡 You can still create a bill for consultation fees, 
                        procedures, or other services even without a prescription.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Bill Creation Form */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 border-b pb-2">Bill Details</h4>
                
                {!selectedPrescription && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Creating Bill Without Prescription</p>
                        <p className="text-blue-700">
                          You can create bills for consultation fees, procedures, tests, or other medical services. 
                          Common items include: Consultation Fee, Lab Tests, Procedures, etc.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleCreateBill} className="space-y-4">
                  {/* Bill Items */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="text-sm font-medium text-gray-900">Bill Items</h5>
                      <button
                        type="button"
                        onClick={addBillItem}
                        className="btn-secondary text-xs"
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        Add Item
                      </button>
                    </div>

                    <div className="space-y-3">
                      {billForm.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Item description"
                            value={item.label}
                            onChange={(e) => updateBillItem(index, 'label', e.target.value)}
                            className="input-field flex-1 text-sm"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.qty}
                            onChange={(e) => updateBillItem(index, 'qty', parseInt(e.target.value))}
                            className="input-field w-16 text-sm"
                            min="1"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Price (₹)"
                            value={(item.unitPaise / 100).toFixed(2)}
                            onChange={(e) => updateBillItem(index, 'unitPaise', Math.round(parseFloat(e.target.value) * 100))}
                            className="input-field w-20 text-sm"
                            min="0"
                            step="0.01"
                            required
                          />
                          {billForm.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBillItem(index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tax */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Percentage
                    </label>
                    <input
                      type="number"
                      value={billForm.taxPercent}
                      onChange={(e) => setBillForm({ ...billForm, taxPercent: parseFloat(e.target.value) })}
                      className="input-field w-24 text-sm"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  {/* Total */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between text-lg font-medium">
                      <span>Total:</span>
                      <span>₹{(calculateTotal() / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateBillModal(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary text-sm">
                      Create Bill
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffBilling

// BillCard Component
const BillCard = ({ bill, onUpdatePayment, onMarkAsPaid, type }) => {
  const formatCurrency = (paise) => `₹${(paise / 100).toFixed(2)}`
  
  return (
    <div className="p-4 border-l-4 border-gray-200 hover:border-primary-300 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <UserIcon className="h-4 w-4 text-gray-500" />
            <h3 className="font-medium text-gray-900">{bill.patient?.name}</h3>
            <span className="text-xs text-gray-500">#{bill._id.slice(-6)}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CalendarIcon className="h-3 w-3" />
            <span>{bill.appointment?.date}</span>
            <span>•</span>
            <span>{bill.appointment?.slot}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(bill.totalPaise)}
          </div>
          <div className={`px-2 py-1 text-xs font-medium rounded-full ${
            type === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {type === 'paid' ? 'Paid' : 'Pending'}
          </div>
        </div>
      </div>

      {/* Bill Items Summary */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Items:</div>
        <div className="space-y-1">
          {bill.items.slice(0, 2).map((item, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="truncate">{item.label} x{item.qty}</span>
              <span>{formatCurrency(item.unitPaise * item.qty)}</span>
            </div>
          ))}
          {bill.items.length > 2 && (
            <div className="text-xs text-gray-500 text-center">
              +{bill.items.length - 2} more items
            </div>
          )}
        </div>
      </div>

      {/* Bill Summary */}
      <div className="bg-gray-50 rounded p-2 mb-3 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(bill.subtotalPaise)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>{formatCurrency(bill.taxPaise)}</span>
        </div>
        <div className="flex justify-between font-medium border-t pt-1">
          <span>Total:</span>
          <span>{formatCurrency(bill.totalPaise)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600">Payment:</span>
          <select
            value={bill.paymentMethod || 'pending'}
            onChange={(e) => onUpdatePayment && onUpdatePayment(bill._id, e.target.value)}
            className="input-field text-xs py-1"
            disabled={type === 'paid'}
          >
            <option value="pending">Pending</option>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          {type === 'generated' && bill.paymentMethod === 'cash' && (
            <button 
              onClick={() => onMarkAsPaid && onMarkAsPaid(bill._id)}
              className="btn-primary text-xs py-1 px-2"
            >
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Mark as Paid
            </button>
          )}
          
          {type === 'generated' && bill.paymentMethod === 'online' && (
            <div className="text-xs text-blue-600">
              Online Payment
            </div>
          )}
          
          {type === 'paid' && (
            <div className="text-xs text-green-600 flex items-center">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Completed
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
