import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import baImage from '../assets/ba.jpg'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setIsLoading(true)

    try {
      const result = await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      })
      
      console.log('Registration result:', result)
      
      if (result.success) {
        setSuccess(result.message || 'Registration successful! Redirecting to login...')
        setIsLoading(false)
        // Redirect to login page after showing success message
        setTimeout(() => {
          console.log('Redirecting to login page...')
          navigate('/login', { replace: true })
        }, 1500)
      } else {
        setError(result.error || 'Registration failed')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Registration failed. Please try again.')
      setIsLoading(false)
    }
  }

  function backButton(){
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <div className="auth-panel">
        <div className="auth-form-wrapper">
          <div classname="testing">
          <button class="back-btn" data-tooltip="Back" onClick={backButton}>←</button>
          </div>
          <div className="form-header">
            <h2>Join Our Community</h2>
            <p>Create your account and become part of our academic excellence journey.</p>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-control">
              <label>Full Name</label>
              <input 
                name="fullName"
                value={formData.fullName} 
                onChange={handleInputChange} 
                placeholder="Enter your full name" 
                required 
              />
            </div>
            <div className="form-control">
              <label>Email</label>
              <input 
                name="email"
                type="email"
                value={formData.email} 
                onChange={handleInputChange} 
                placeholder="Enter your email address" 
                required 
              />
            </div>
            <div className="form-control">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  placeholder="Create a strong password (min 6 characters)" 
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
              <label>Confirm Password</label>
              <div className="password-input-wrapper">
                <input 
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"} 
                  value={formData.confirmPassword} 
                  onChange={handleInputChange} 
                  placeholder="Confirm your password" 
                  required 
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
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
            <button className="btn" type="submit" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create My Account'}
            </button>
            <p className="form-footer">
              Already part of our community? <Link to="/login">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
      <div className="auth-showcase">
        <div className="showcase-content">
          <h3>Saranathan College of Engineering</h3>
          <p>"Innovation • Excellence • Future Leaders"</p>
          <img src={baImage} alt="College Community" />
        </div>
      </div>
    </div>
  )
}
