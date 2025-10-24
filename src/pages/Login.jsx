import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import baImage from '../assets/ba.jpg'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const from = location.state?.from?.pathname || getDefaultRoute(role)

  function getDefaultRoute(userRole) {
    switch(userRole) {
      case 'participant':
        return '/dashboard'
      case 'evaluator':
        return '/evaluator-dashboard'
      case 'admin':
        return '/admin-dashboard' // For future use
      default:
        return '/'
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!username || !password || !role) {
      setError('Please fill in all fields and select a role.')
      return
    }

    setIsLoading(true)

    try {
      const result = login({ username, password, role })
      
      if (result.success) {
        // Redirect based on user role
        const redirectPath = getDefaultRoute(role)
        navigate(redirectPath, { replace: true })
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-panel">
        <div className="auth-form-wrapper">
          <div className="form-header">
            <h2>Welcome Back!</h2>
            <p>Sign in to access your personalized college portal experience.</p>
            {error && <div className="error-message">{error}</div>}
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-control">
              <label>Username or Email</label>
              <input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Enter your username or email" 
                required 
              />
            </div>
            <div className="form-control">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter your password" 
                  required 
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="form-control">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} required>
                <option value="" disabled>Select your role</option>
                <option value="admin">Administrator</option>
                <option value="evaluator">Evaluator</option>
                <option value="participant">Participant</option>
              </select>
            </div>
            <button className="btn" type="submit" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In to Portal'}
            </button>
            <p className="form-footer">
              New to our portal? <Link to="/register">Create Account</Link>
            </p>
          </form>
        </div>
      </div>
      <div className="auth-showcase">
        <div className="showcase-content">
          <h3>Saranathan College of Engineering</h3>
          <p>"Excellence in Engineering Education & Innovation"</p>
          <img src={baImage} alt="College Campus" />
        </div>
      </div>
    </div>
  )
}
