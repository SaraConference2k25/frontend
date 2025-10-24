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
      // Call backend API - expects email field
      const response = await authApi.login({ 
        email: username, // Backend uses email field
        password 
      })
      
      // Backend returns: { message, email, role? }
      if (response && response.email) {
        const userSession = {
          email: response.email,
          role: role, // Use role selected from frontend
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
      // Call backend API - expects { email, password, role }
      const response = await authApi.register({
        email: userData.email,
        password: userData.password,
        role: userData.role || 'PARTICIPANT' // Default to participant
      })
      
      // Backend returns: { message, success }
      if (response && response.success) {
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
    return user && user.role?.toLowerCase() === requiredRole?.toLowerCase()
  }

  const canAccessDashboard = () => {
    const hasAccess = user && user.role?.toLowerCase() === 'participant'
    console.log('🔐 Dashboard access check:', { 
      userRole: user?.role, 
      normalized: user?.role?.toLowerCase(), 
      hasAccess 
    })
    return hasAccess
  }

  const canAccessEvaluatorDashboard = () => {
    return user && user.role?.toLowerCase() === 'evaluator'
  }

  const canAccessAdminDashboard = () => {
    return user && user.role?.toLowerCase() === 'admin'
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
    canAccessAdminDashboard
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}