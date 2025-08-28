import React, { useState, useEffect } from 'react'
import { CreditCardIcon, CalendarIcon, DownloadIcon, EyeIcon } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const PatientBills = () => {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const response = await api.get('/patient/bills')
      setBills(response.data.data.bills)
    } catch (error) {
      toast.error('Failed to fetch bills')
      console.error('Error fetching bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const payBill = async (billId) => {
    try {
      await api.post(`/patient/bills/${billId}/pay`)
      toast.success('Payment successful!')
      fetchBills()
    } catch (error) {
      toast.error('Payment failed')
    }
  }

  const sortedBills = bills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const downloadBill = (billId) => {
    // This would typically download the bill as PDF
    toast.success('Bill download started')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600">View and manage your medical bills</p>
        </div>
      </div>

      {/* Bills Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-8 w-8 text-primary-600" />
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
              <CreditCardIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Amount</h3>
              <p className="text-2xl font-bold text-success-600">
                ₹{bills.reduce((sum, bill) => sum + (bill.totalPaise / 100), 0).toFixed(2)}
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
              <h3 className="text-lg font-medium text-gray-900">Pending Amount</h3>
              <p className="text-2xl font-bold text-warning-600">
                ₹{bills.reduce((sum, bill) => sum + (bill.totalPaise / 100), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Bill History ({bills.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : bills.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">No bills yet</p>
            <p className="text-gray-500">Bills will appear here after your appointments</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedBills.map((bill) => (
              <div key={bill._id} className="p-6 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Bill for {format(new Date(bill.createdAt), 'MMM dd, yyyy')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Appointment: {bill.appointment?.date} at {bill.appointment?.slot}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      ₹{(bill.totalPaise / 100).toFixed(2)}
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      bill.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bill.paymentStatus}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {bill.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.label} x{item.qty}</span>
                      <span>₹{(item.unitPaise * item.qty / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{(bill.subtotalPaise / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span>₹{(bill.taxPaise / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>₹{(bill.totalPaise / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Payment Method: {bill.paymentMethod || 'pending'}
                  </div>
                  
                  {bill.paymentStatus === 'pending' && (
                    <button
                      onClick={() => payBill(bill._id)}
                      className="btn-primary"
                    >
                      Pay Now
                    </button>
                  )}
                  
                  {bill.paymentStatus === 'paid' && (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Paid on {format(new Date(bill.paidAt), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientBills
