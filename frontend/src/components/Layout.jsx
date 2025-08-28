import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  UserIcon, 
  LogOutIcon, 
  HeartIcon,
  CalendarIcon,
  UsersIcon,
  FileTextIcon,
  CreditCardIcon,
  SettingsIcon
} from 'lucide-react'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navigation = {
    DOCTOR: [
      { name: 'Dashboard', icon: HeartIcon, path: '/doctor/dashboard' },
      { name: 'Appointments', icon: CalendarIcon, path: '/doctor/appointments' },
      { name: 'Patients', icon: UsersIcon, path: '/doctor/patients' },
      { name: 'Staff', icon: UsersIcon, path: '/doctor/staff' },
      { name: 'Settings', icon: SettingsIcon, path: '/doctor/settings' },
    ],
    STAFF: [
      { name: 'Dashboard', icon: HeartIcon, path: '/staff/dashboard' },
      { name: 'Appointments', icon: CalendarIcon, path: '/staff/appointments' },
      { name: 'Billing', icon: CreditCardIcon, path: '/staff/billing' },
      { name: 'Reports', icon: FileTextIcon, path: '/staff/reports' },
    ],
    PATIENT: [
      { name: 'Dashboard', icon: HeartIcon, path: '/patient/dashboard' },
      { name: 'Book Appointment', icon: CalendarIcon, path: '/patient/book' },
      { name: 'My Appointments', icon: CalendarIcon, path: '/patient/appointments' },
      { name: 'Prescriptions', icon: FileTextIcon, path: '/patient/prescriptions' },
      { name: 'Bills', icon: CreditCardIcon, path: '/patient/bills' },
    ]
  }

  const currentNav = navigation[user?.role] || []

  const handleNavigation = (path) => {
    navigate(path)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <HeartIcon className="h-8 w-8 text-primary-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">HealthCare</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <UserIcon className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 font-medium">
                  {user?.role?.charAt(0) + user?.role?.slice(1).toLowerCase()}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOutIcon className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              {currentNav.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout