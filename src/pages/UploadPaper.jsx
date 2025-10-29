import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function UploadPaper() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNo: '',
    department: '',
    collegeName: '',
    paperTitle: '',
    paperAbstract: '',
    keywords: '',
    paperFile: null
  })

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
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({
        ...prev,
        paperFile: file
      }))
    } else {
      alert('Please select a PDF file only')
    }
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    alert('Paper submission successful!')
    // Reset form
    setFormData({
      name: '',
      email: '',
      contactNo: '',
      department: '',
      collegeName: '',
      paperTitle: '',
      paperAbstract: '',
      keywords: '',
      paperFile: null
    })
    // Redirect to dashboard
    navigate('/dashboard')
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
                  <label htmlFor="paperFile">Upload Paper (PDF) *</label>
                  <input
                    type="file"
                    id="paperFile"
                    accept=".pdf"
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
                        📁 Choose PDF File
                      </span>
                    )}
                  </label>
                  <small className="form-help">Maximum file size: 10MB. Only PDF format is accepted.</small>
                </div>
              </div>

              <div className="form-actions-bottom">
                <Link to="/dashboard" className="btn btn-secondary">
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary">
                  Submit Paper
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}
