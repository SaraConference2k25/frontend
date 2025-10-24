import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isLoading, canAccessDashboard } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // For dashboard access, specifically check participant role
  if (location.pathname === '/dashboard' && !canAccessDashboard()) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <h2>Access Denied</h2>
          <p>Only registered participants can access the dashboard.</p>
          <p>Your current role: <strong>{user.role}</strong></p>
          <button onClick={() => window.history.back()} className="btn">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // If a specific role is required and user doesn't have it
  if (requiredRole && user.role?.toLowerCase() !== requiredRole?.toLowerCase()) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <h2>Insufficient Permissions</h2>
          <p>You don't have permission to access this page.</p>
          <p>Required role: <strong>{requiredRole}</strong></p>
          <p>Your role: <strong>{user.role}</strong></p>
          <button onClick={() => window.history.back()} className="btn">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute