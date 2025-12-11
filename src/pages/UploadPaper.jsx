import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as paperApi from '../api/papers'

export default function UploadPaper() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    contactNo: '',
    department: '',
    collegeName: '',
    paperTitle: '',
    paperAbstract: '',
    keywords: '',
    paperFile: null
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    setError('')
    
    if (file) {
      // Validate file type - only PDF or DOCX
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      const fileExtension = file.name.split('.').pop().toLowerCase()
      const isValidType = validTypes.includes(file.type) || ['pdf', 'docx', 'doc'].includes(fileExtension)
      
      if (!isValidType) {
        setError('Only PDF or DOCX files are supported. Please select a valid document.')
        event.target.value = ''
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        event.target.value = ''
        return
      }
      
      setFormData(prev => ({
        ...prev,
        paperFile: file
      }))
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Validation
    if (!formData.paperFile) {
      setError('Please upload your paper (PDF or DOCX format only)')
      return
    }

    setIsLoading(true)

    try {
      // Create FormData object for multipart/form-data
      const submitFormData = new FormData()
      submitFormData.append('name', formData.name.trim())
      submitFormData.append('email', formData.email.trim().toLowerCase())
      submitFormData.append('contactNo', formData.contactNo.trim())
      submitFormData.append('department', formData.department.trim())
      submitFormData.append('collegeName', formData.collegeName.trim())
      submitFormData.append('paperTitle', formData.paperTitle.trim())
      submitFormData.append('paperAbstract', formData.paperAbstract.trim())
      submitFormData.append('paperFile', formData.paperFile)

      const response = await paperApi.submitPaper(submitFormData)
      
      setSuccess(`Paper submitted successfully! Submission ID: ${response.id}`)
      
      // Reset form
      setFormData({
        name: '',
        email: user?.email || '',
        contactNo: '',
        department: '',
        collegeName: '',
        paperTitle: '',
        paperAbstract: '',
        keywords: '',
        paperFile: null
      })
      document.getElementById('paperFile').value = ''
      
      // Redirect to My Papers after 2 seconds
      setTimeout(() => {
        navigate('/my-papers')
      }, 2000)
      
    } catch (err) {
      console.error('Paper submission error:', err)
      setError(err.message || 'Failed to submit paper. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div id="dashboard">
      {/* Top Header */}
      <header className="dashboard-header">
        <button className={`sidebar-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h2>Upload Paper</h2>
        <div className="header-actions">
          <span>Welcome, {user?.name || user?.username}</span>
          <button onClick={() => { logout(); navigate('/login') }} className="btn-logout-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link to="/dashboard" className="nav-item">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/upload-paper" className="nav-item">
                Upload Paper
              </Link>
            </li>
            <li>
              <Link to="/my-papers" className="nav-item">
                My Papers
              </Link>
            </li>
            <li>
              <button 
                onClick={() => {
                  logout()
                  navigate('/login')
                }} 
                className="nav-item"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMenuOpen && <div className="sidebar-overlay" onClick={toggleMenu}></div>}

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content upload-paper-content">
          <header className="page-header">
            <div>
              <h1>Submit Your Paper</h1>
              <p>Fill in the details below to submit your research paper for review.</p>
            </div>
          </header>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <section className="upload-form-section">
            <form onSubmit={handleFormSubmit} className="paper-upload-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contactNo">Contact Number *</label>
                    <input
                      type="tel"
                      id="contactNo"
                      name="contactNo"
                      value={formData.contactNo}
                      onChange={handleInputChange}
                      placeholder="Enter your contact number"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="department">Department *</label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="Enter your department"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="collegeName">College/Institution Name *</label>
                  <input
                    type="text"
                    id="collegeName"
                    name="collegeName"
                    value={formData.collegeName}
                    onChange={handleInputChange}
                    placeholder="Enter your college or institution name"
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Paper Details</h3>
                <div className="form-group">
                  <label htmlFor="paperTitle">Paper Title *</label>
                  <input
                    type="text"
                    id="paperTitle"
                    name="paperTitle"
                    value={formData.paperTitle}
                    onChange={handleInputChange}
                    placeholder="Enter the title of your paper"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="keywords">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    id="keywords"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    placeholder="e.g., Machine Learning, AI, Data Science"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="paperAbstract">Paper Abstract *</label>
                  <textarea
                    id="paperAbstract"
                    name="paperAbstract"
                    value={formData.paperAbstract}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="Provide a brief abstract of your paper"
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="paperFile">Upload Paper (PDF or DOCX) *</label>
                  <input
                    type="file"
                    id="paperFile"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileUpload}
                    className="file-input"
                    required
                  />
                  <label htmlFor="paperFile" className="file-upload-btn">
                    {formData.paperFile ? (
                      <span className="file-selected">
                        📄 {formData.paperFile.name}
                      </span>
                    ) : (
                      <span>
                        📁 Choose PDF or DOCX File
                      </span>
                    )}
                  </label>
                  <small className="form-help">Supported formats: PDF, DOC, DOCX. Maximum file size: 10MB.</small>
                </div>
              </div>

              <div className="form-actions-bottom">
                <Link to="/dashboard" className="btn btn-secondary">
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Submitting...' : 'Submit Paper'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}
