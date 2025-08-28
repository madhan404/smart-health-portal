import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    
    if (token && role) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser({ role })
    }
    
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, role } = response.data.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('role', role)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser({ role })
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Login failed' 
      }
    }
  }

  const register = async (userData, role) => {
    try {
      const endpoint = role === 'PATIENT' ? '/auth/register/patient' :
                     role === 'DOCTOR' ? '/auth/register/doctor' :
                     '/auth/register/staff'
      
      const response = await api.post(endpoint, userData)
      const { token } = response.data.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('role', role)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser({ role })
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}