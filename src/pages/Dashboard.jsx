import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleUploadClick = () => {
    setShowUploadModal(true)
    setIsMenuOpen(false)
  }

  const closeUploadModal = () => {
    setShowUploadModal(false)
  }

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNo: '',
    department: '',
    collegeName: '',
    paperTitle: '',
    paperAbstract: '',
    paperFile: null
  })

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
      paperFile: null
    })
    closeUploadModal()
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
        <h2>Dashboard</h2>
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
              <Link to="/" className="nav-item">
                Home
              </Link>
            </li>
            <li>
              <button onClick={handleUploadClick} className="nav-item">
                Upload
              </button>
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

      {/* Upload Form Modal */}
      {showUploadModal && (
        <div className="upload-modal-overlay" onClick={closeUploadModal}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Paper</h3>
              <button className="close-btn" onClick={closeUploadModal}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleFormSubmit} className="upload-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
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
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="collegeName">College Name *</label>
                  <input
                    type="text"
                    id="collegeName"
                    name="collegeName"
                    value={formData.collegeName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="paperTitle">Paper Title *</label>
                  <input
                    type="text"
                    id="paperTitle"
                    name="paperTitle"
                    value={formData.paperTitle}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="paperAbstract">Paper Abstract *</label>
                  <textarea
                    id="paperAbstract"
                    name="paperAbstract"
                    value={formData.paperAbstract}
                    onChange={handleInputChange}
                    rows="4"
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="paperFile">Paper (PDF File) *</label>
                  <input
                    type="file"
                    id="paperFile"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="file-input"
                    required
                  />
                  <label htmlFor="paperFile" className="file-upload-btn">
                    {formData.paperFile ? formData.paperFile.name : 'Choose PDF File'}
                  </label>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={closeUploadModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Paper
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
        <header>
          <h1>Welcome to Your Dashboard</h1>
          <p>Your personalized hub for academic excellence, campus activities, and institutional resources.</p>
        </header>
        
        <div className="dashboard-actions">
          <Link to="/" className="btn">Return to Home</Link>
        </div>
        </div>
      </main>
    </div>
  )
}
