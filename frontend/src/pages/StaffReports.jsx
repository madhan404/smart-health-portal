import React, { useState, useEffect } from 'react'
import { FileTextIcon, CalendarIcon, TrendingUpIcon, UsersIcon, DollarSignIcon } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

const StaffReports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState('week')
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    fetchReports()
  }, [dateRange, customStartDate, customEndDate])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const { start, end } = getDateRangeDates()
      const response = await api.get(`/staff/reports?startDate=${start}&endDate=${end}`)
      setReports(response.data.data.report?.appointments || [])
    } catch (error) {
      toast.error('Failed to fetch reports')
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRangeDates = () => {
    const today = new Date()
    switch (dateRange) {
      case 'today':
        return { start: format(today, 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') }
      case 'week':
        return { start: format(subDays(today, 7), 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') }
      case 'month':
        return { start: format(startOfMonth(today), 'yyyy-MM-dd'), end: format(endOfMonth(today), 'yyyy-MM-dd') }
      case 'custom':
        return { start: customStartDate, end: customEndDate }
      default:
        return { start: format(subDays(today, 7), 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') }
    }
  }

  const generateReport = async (reportType) => {
    try {
      const { start, end } = getDateRangeDates()
      // This would generate a report based on the type and date range
      toast.success(`${reportType} report generated successfully`)
    } catch (error) {
      toast.error('Failed to generate report')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and view clinic reports</p>
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="card p-6">
        <div className="flex items-center space-x-4 mb-4">
          <label className="text-sm font-medium text-gray-700">Date Range:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field w-32"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Patients</h3>
              <p className="text-2xl font-bold text-primary-600">0</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Appointments</h3>
              <p className="text-2xl font-bold text-warning-600">0</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSignIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Revenue</h3>
              <p className="text-2xl font-bold text-success-600">₹0</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUpIcon className="h-8 w-8 text-info-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Growth</h3>
              <p className="text-2xl font-bold text-info-600">0%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Generate Reports</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <UsersIcon className="h-6 w-6 text-primary-600" />
                <h3 className="font-medium text-gray-900">Patient Report</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Detailed patient statistics and demographics
              </p>
              <button
                onClick={() => generateReport('Patient')}
                className="btn-primary w-full"
              >
                Generate
              </button>
            </div>

            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <CalendarIcon className="h-6 w-6 text-warning-600" />
                <h3 className="font-medium text-gray-900">Appointment Report</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Appointment statistics and scheduling analysis
              </p>
              <button
                onClick={() => generateReport('Appointment')}
                className="btn-primary w-full"
              >
                Generate
              </button>
            </div>

            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <DollarSignIcon className="h-6 w-6 text-success-600" />
                <h3 className="font-medium text-gray-900">Financial Report</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Revenue, billing, and financial analysis
              </p>
              <button
                onClick={() => generateReport('Financial')}
                className="btn-primary w-full"
              >
                Generate
              </button>
            </div>

            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <TrendingUpIcon className="h-6 w-6 text-info-600" />
                <h3 className="font-medium text-gray-900">Performance Report</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Clinic performance and efficiency metrics
              </p>
              <button
                onClick={() => generateReport('Performance')}
                className="btn-primary w-full"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Reports List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Generated Reports ({reports.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">No reports generated yet</p>
            <p className="text-gray-500">Generate your first report using the options above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reports.map((appointment) => (
              <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      Appointment with {appointment.patient?.name || 'Unknown Patient'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Date: {appointment.date} | Slot: {appointment.slot} | Status: {appointment.status}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="btn-secondary text-sm">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
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

export default StaffReports
