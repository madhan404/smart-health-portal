import axios from 'axios'
import toast from 'react-hot-toast'

const baseURL = import.meta.env.DEV
  ? '/api'           
  : import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL,
  timeout: 10000,
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      window.location.href = '/login'
    }
    
    // Show error toast for non-auth errors
    if (error.response?.status !== 401) {
      const message = error.response?.data?.error?.message || 'Something went wrong'
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default api