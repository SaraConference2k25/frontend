import React, { createContext, useContext, useState, useEffect } from 'react'
import * as authApi from '../api/auth'

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
  const [isLoading, setIsLoading] = useState(true)

  // Mock database of registered users
  const registeredUsers = [
    // Participants/Students
    {
      id: 1,
      username: 'participant1',
      email: 'participant1@example.com',
      password: 'password123',
      role: 'participant',
      name: 'John Doe',
      department: 'Computer Science',
      college: 'Saranathan College of Engineering'
    },
    {
      id: 2,
      username: 'student1',
      email: 'student1@saranathan.edu',
      password: 'student123',
      role: 'participant',
      name: 'Alice Johnson',
      department: 'Information Technology',
      college: 'Saranathan College of Engineering'
    },
    {
      id: 3,
      username: 'researcher1',
      email: 'researcher1@mit.edu',
      password: 'research123',
      role: 'participant',
      name: 'Dr. Robert Chen',
      department: 'Artificial Intelligence',
      college: 'MIT Chennai'
    },
    
    // Admin
    {
      id: 4,
      username: 'admin',
      email: 'admin@saranathan.edu',
      password: 'admin123',
      role: 'admin',
      name: 'Admin User',
      department: 'Administration',
      college: 'Saranathan College of Engineering'
    },
    
    // Evaluators
    {
      id: 5,
      username: 'evaluator1',
      email: 'sarah.wilson@saranathan.edu',
      password: 'eval123',
      role: 'evaluator',
      name: 'Dr. Sarah Wilson',
      department: 'Computer Science',
      expertise: ['AI', 'Machine Learning', 'Healthcare', 'Data Science']
    },
    {
      id: 6,
      username: 'evaluator2',
      email: 'kumar.singh@saranathan.edu',
      password: 'eval123',
      role: 'evaluator',
      name: 'Prof. Kumar Singh',
      department: 'Cybersecurity',
      expertise: ['Cybersecurity', 'Cloud Computing', 'Networks', 'Blockchain']
    },
    {
      id: 7,
      username: 'evaluator3',
      email: 'anita.sharma@saranathan.edu',
      password: 'eval123',
      role: 'evaluator',
      name: 'Dr. Anita Sharma',
      department: 'Mechanical Engineering',
      expertise: ['Robotics', 'Manufacturing', 'Automation', 'Industry 4.0']
    },
    {
      id: 8,
      username: 'evaluator4',
      email: 'priya.nair@saranathan.edu',
      password: 'eval123',
      role: 'evaluator',
      name: 'Dr. Priya Nair',
      department: 'Electronics',
      expertise: ['Telecommunications', '5G', 'Wireless Networks', 'Signal Processing']
    },
    {
      id: 9,
      username: 'evaluator5',
      email: 'raj.patel@saranathan.edu',
      password: 'eval123',
      role: 'evaluator',
      name: 'Prof. Raj Patel',
      department: 'Agricultural Engineering',
      expertise: ['IoT', 'Agriculture', 'Sensors', 'Smart Farming']
    }
  ]

  // Check if user is logged in on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (credentials) => {
    const { username, password, role } = credentials
    
    try {
      // Call backend API - expects email, password, and requestedRole
      const response = await authApi.login({ 
        email: username, // Backend uses email field
        password,
        role // Send the requested role to backend
      })
      
      // Backend returns: { message, email, role }
      if (response && response.email) {
        const userSession = {
          email: response.email,
          role: response.role || role, // Use role from backend response or fallback to requested role
          loginTime: new Date().toISOString()
        }
        
        console.log('✅ Login successful:', { email: userSession.email, role: userSession.role })
        
        setUser(userSession)
        localStorage.setItem('user', JSON.stringify(userSession))
        return { success: true, user: userSession }
      } else {
        return { success: false, error: response.message || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message || 'Invalid credentials' }
    }
  }

  const register = async (userData) => {
    try {
      // Ensure role is always set to PARTICIPANT
      const registrationData = {
        username: userData.fullName, // Backend expects username field
        email: userData.email,
        password: userData.password,
        role: 'PARTICIPANT' // Always PARTICIPANT for registration PARTICIPANT
      }
      
      console.log('📤 Sending registration data:', { ...registrationData, password: '***' })
      
      // Call backend API - expects { username, email, password, role }
      const response = await authApi.register(registrationData)
      
      console.log('📥 Backend register response:', response)
      
      // Backend returns: { message, success }
      // Check for success in multiple ways to be robust
      if (response && (response.success === true || response.message?.toLowerCase().includes('success'))) {
        return { success: true, message: response.message || 'Registration successful! Please login.' }
      } else {
        return { success: false, error: response.message || 'Registration failed' }
      }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, error: error.message || 'Registration failed' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const isAuthenticated = () => {
    return user !== null
  }

  const hasRole = (requiredRole) => {
    return user && user.role === requiredRole
  }

  const canAccessDashboard = () => {
    return user && user.role === 'participant'
  }

  const canAccessEvaluatorDashboard = () => {
    return user && user.role === 'evaluator'
  }

  const canAccessAdminDashboard = () => {
    return user && user.role === 'admin'
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
    canAccessDashboard,
    canAccessEvaluatorDashboard,
    canAccessAdminDashboard,
    registeredUsers // For demo purposes
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}