import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sampleEvaluators } from '../data/sampleData'
import { createEvaluator, getEvaluators } from '../api/evaluators'

const createEmptyEvaluatorForm = () => ({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  department: ''
})

export default function AdminEvaluators() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [selectedEvaluator, setSelectedEvaluator] = useState(null)
  const [evaluators, setEvaluators] = useState(sampleEvaluators)
  const [newEvaluator, setNewEvaluator] = useState(createEmptyEvaluatorForm())
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Load evaluators from backend on component mount
  useEffect(() => {
    loadEvaluators()
  }, [])

  // Filter evaluators based on search query and status
  const filteredEvaluators = evaluators.filter(evaluator => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = !query || [
      evaluator.name || '',
      evaluator.email || '',
      evaluator.username || '',
      evaluator.department || ''
    ].some(field => field.toLowerCase().includes(query))

    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && evaluator.workload > 0) ||
      (filterStatus === 'available' && evaluator.workload === 0)

    return matchesSearch && matchesStatus
  })

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const openCreateModal = () => {
    setShowCreateModal(true)
    setNewEvaluator(createEmptyEvaluatorForm())
    setPasswordVisibility({ password: false, confirmPassword: false })
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewEvaluator(prev => ({
      ...prev,
      [name]: value
    }))
  }

    const handleCreateEvaluator = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!newEvaluator.email || !newEvaluator.email.trim()) {
      alert('Email is required')
      return
    }

    if (!newEvaluator.username || !newEvaluator.username.trim()) {
      alert('Username is required')
      return
    }

    if (!newEvaluator.password || !newEvaluator.password.trim()) {
      alert('Password is required')
      return
    }

    const confirmCreate = window.confirm(
      `Create new evaluator?\n\n` +
      `Email: ${newEvaluator.email}\n` +
      `Username: ${newEvaluator.username}\n` +
      `Department: ${newEvaluator.department || 'Not specified'}\n\n` +
      `This will grant access to the evaluation system.`
    )

    if (!confirmCreate) {
      return
    }

    try {
      // Call backend API to create evaluator
      console.log('📤 Sending to backend:', {
        email: newEvaluator.email,
        username: newEvaluator.username,
        password: '***',
        department: newEvaluator.department
      })

      const response = await createEvaluator({
        email: newEvaluator.email,
        username: newEvaluator.username,
        password: newEvaluator.password,
        department: newEvaluator.department
      })

      console.log('✅ Evaluator created successfully:', response)

      // Add new evaluator to local list
      const baseName = (newEvaluator.username || '').trim() || (newEvaluator.email ? newEvaluator.email.split('@')[0] : '').trim()
      const displayName = baseName || `Evaluator ${evaluators.length + 1}`

      const evaluator = {
        id: response.id || evaluators.length + 1,
        name: response.name || displayName,
        email: response.email || newEvaluator.email,
        username: response.username || newEvaluator.username,
        password: '••••••••', // Don't store actual password
        expertise: response.expertise || [],
        department: response.department || newEvaluator.department,
        workload: response.workload || 0,
        role: 'evaluator',
        ...response
      }

      setEvaluators(prev => [...prev, evaluator])
      setNewEvaluator(createEmptyEvaluatorForm())
      setPasswordVisibility({ password: false, confirmPassword: false })
      
      alert(`Evaluator ${evaluator.name} created successfully!`)
      closeCreateModal()
      
      // Reload evaluators from backend to get latest list
      loadEvaluators()
    } catch (err) {
      console.error('❌ Error creating evaluator:', err)
      alert(`Error creating evaluator: ${err.message}`)
    }
  }

  const loadEvaluators = async () => {
    setIsLoading(true)
    try {
      const response = await getEvaluators()
      const evaluatorsList = Array.isArray(response) ? response : response.data || []
      
      const formattedEvaluators = evaluatorsList.map(evaluator => ({
        id: evaluator.id,
        name: evaluator.name || evaluator.username || 'Unknown',
        email: evaluator.email,
        username: evaluator.username || '',
        password: '••••••••',
        expertise: evaluator.expertise || [],
        department: evaluator.department || '',
        workload: evaluator.workload || 0,
        role: 'evaluator',
        ...evaluator
      }))
      
      setEvaluators(formattedEvaluators)
      console.log('✅ Evaluators loaded successfully')
    } catch (err) {
      console.error('❌ Error loading evaluators:', err)
      setEvaluators(sampleEvaluators)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEvaluator = (id) => {
    const evaluatorToDelete = evaluators.find(e => e.id === id)
    
    if (!evaluatorToDelete) return

    const confirmDelete = window.confirm(
      `⚠️ WARNING: Delete Evaluator Account\n\n` +
      `You are about to permanently delete:\n\n` +
      `Name: ${evaluatorToDelete.name}\n` +
      `Email: ${evaluatorToDelete.email}\n` +
      `Username: ${evaluatorToDelete.username}\n` +
      `Current Workload: ${evaluatorToDelete.workload} paper(s)\n\n` +
      `This action CANNOT be undone. All associated data will be permanently removed.\n\n` +
      `Are you absolutely sure you want to proceed?`
    )

    if (confirmDelete) {
      setEvaluators(prev => prev.filter(evaluator => evaluator.id !== id))
      alert(`Evaluator "${evaluatorToDelete.name}" has been deleted successfully.`)
    }
  }

  const handleViewCredentials = (evaluator) => {
    setSelectedEvaluator(evaluator)
    setShowCredentialsModal(true)
  }

  const closeCredentialsModal = () => {
    setShowCredentialsModal(false)
    setSelectedEvaluator(null)
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
        <h2>Manage Evaluators</h2>
        <div className="header-actions">
          <span>Welcome, {user?.name || user?.username} (Admin)</span>
          <button onClick={handleLogout} className="btn-logout-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Admin Panel</h3>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link to="/admin-dashboard" className="nav-item">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin-papers" className="nav-item">
                Manage Papers
              </Link>
            </li>
            <li>
              <Link to="/admin-evaluators" className="nav-item">
                Evaluators
              </Link>
            </li>
            <li>
              <button onClick={handleLogout} className="nav-item">
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMenuOpen && <div className="sidebar-overlay" onClick={toggleMenu}></div>}

      {/* Loading Screen */}
      {isLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(4px)', zIndex: 9999 }}>
          <div style={{ textAlign: 'center' }}>
            {/* Spinner */}
            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 2rem' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', animation: 'spin 1s linear infinite', transformOrigin: 'center' }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="#667eea" strokeWidth="8" strokeDasharray="70 220" strokeDashoffset="0" />
              </svg>
              <style>
                {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
              </style>
            </div>
            <h2 style={{ color: '#333', fontSize: '1.3rem', fontWeight: '700', margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>
              Loading Evaluators
            </h2>
            <p style={{ color: '#999', fontSize: '0.95rem', margin: 0 }}>
              Please wait while we fetch the evaluator list...
            </p>
          </div>
        </div>
      )}

      {/* View Credentials Modal */}
      {showCredentialsModal && selectedEvaluator && (
        <div className="modal-overlay-professional" onClick={closeCredentialsModal}>
          <div className="credentials-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="credentials-modal-header">
              <h3>Evaluator Credentials</h3>
              <button className="modal-close-btn" onClick={closeCredentialsModal}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="credentials-modal-body">
              <div className="credentials-info-row">
                <span className="credentials-info-label">Evaluator Name</span>
                <span className="credentials-info-value">{selectedEvaluator.name}</span>
              </div>
              <div className="credentials-info-row">
                <span className="credentials-info-label">Email</span>
                <span className="credentials-info-value">{selectedEvaluator.email}</span>
              </div>
              <div className="credentials-divider"></div>
              <div className="credentials-info-row">
                <span className="credentials-info-label">Username</span>
                <span className="credentials-info-value credentials-value-highlight">{selectedEvaluator.username || '—'}</span>
              </div>
              <div className="credentials-info-row">
                <span className="credentials-info-label">Password</span>
                <span className="credentials-info-value credentials-value-highlight">{selectedEvaluator.password || '—'}</span>
              </div>
            </div>
            <div className="credentials-modal-footer">
              <button onClick={closeCredentialsModal} className="btn-modal-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Evaluator Modal */}
      {showCreateModal && (
        <div className="modal-overlay-professional" onClick={closeCreateModal}>
          <div className="modal-professional evaluator-modal-professional" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-professional modal-header-centered">
              <div className="modal-title-section-centered">
                <h3>Create New Evaluator</h3>
                <p className="modal-subtitle">Add a new evaluator account to the system</p>
              </div>
              <button className="modal-close-btn modal-close-absolute" onClick={closeCreateModal}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body-professional">
              <form className="evaluator-form-professional" onSubmit={handleCreateEvaluator}>
                <div className="form-section">
                  <h4 className="form-section-title">Account Information</h4>
                  <div className="form-row-professional">
                    <div className="form-group-professional">
                      <label htmlFor="email" className="form-label-professional">
                        Email Address <span className="required-indicator">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={newEvaluator.email}
                        onChange={handleInputChange}
                        placeholder="evaluator@institution.edu"
                        className="form-input-professional"
                        required
                      />
                    </div>
                    <div className="form-group-professional">
                      <label htmlFor="username" className="form-label-professional">
                        Username <span className="required-indicator">*</span>
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={newEvaluator.username}
                        onChange={handleInputChange}
                        placeholder="Enter username"
                        className="form-input-professional"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4 className="form-section-title">Security Credentials</h4>
                  <div className="form-row-professional">
                    <div className="form-group-professional">
                      <label htmlFor="password" className="form-label-professional">
                        Password <span className="required-indicator">*</span>
                      </label>
                      <div className="password-input-wrapper">
                        <input
                          type={passwordVisibility.password ? 'text' : 'password'}
                          id="password"
                          name="password"
                          value={newEvaluator.password}
                          onChange={handleInputChange}
                          placeholder="Enter secure password"
                          className="form-input-professional"
                          required
                        />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() =>
                          setPasswordVisibility(prev => ({
                            ...prev,
                            password: !prev.password
                          }))
                        }
                        aria-label={passwordVisibility.password ? 'Hide password' : 'Show password'}
                      >
                        {passwordVisibility.password ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5 0-9.27-3.11-11-7.5a11.78 11.78 0 0 1 5-5.94" />
                            <path d="M1 1l22 22" />
                            <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2.05 12C3.2 7.61 7.21 4 12 4s8.8 3.61 9.95 8c-1.15 4.39-5.16 8-9.95 8s-8.8-3.61-9.95-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                      </div>
                    </div>
                    <div className="form-group-professional">
                      <label htmlFor="confirmPassword" className="form-label-professional">
                        Confirm Password <span className="required-indicator">*</span>
                      </label>
                      <div className="password-input-wrapper">
                        <input
                          type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={newEvaluator.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Re-enter password"
                          className="form-input-professional"
                          required
                        />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() =>
                          setPasswordVisibility(prev => ({
                            ...prev,
                            confirmPassword: !prev.confirmPassword
                          }))
                        }
                        aria-label={passwordVisibility.confirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {passwordVisibility.confirmPassword ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5 0-9.27-3.11-11-7.5a11.78 11.78 0 0 1 5-5.94" />
                            <path d="M1 1l22 22" />
                            <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2.05 12C3.2 7.61 7.21 4 12 4s8.8 3.61 9.95 8c-1.15 4.39-5.16 8-9.95 8s-8.8-3.61-9.95-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4 className="form-section-title">Additional Information</h4>
                  <div className="form-row-professional">
                    <div className="form-group-professional full-width">
                      <label htmlFor="department" className="form-label-professional">
                        Department
                      </label>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        value={newEvaluator.department}
                        onChange={handleInputChange}
                        placeholder="e.g., Computer Science, Engineering"
                        className="form-input-professional"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-actions-professional">
                  <button type="button" onClick={closeCreateModal} className="btn-modal-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Create Evaluator
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content admin-evaluators-content">
          <header className="page-header-modern">
            <div className="page-header-content">
              <div className="page-title-section">
                <h1>Evaluator Management</h1>
                <p className="page-subtitle">Manage evaluator accounts and monitor workload distribution</p>
              </div>
              <button onClick={openCreateModal} className="btn btn-primary btn-create-evaluator">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Create Evaluator
              </button>
            </div>
          </header>

          {/* Stats Overview */}
          <div className="evaluators-stats-bar">
            <div className="stat-item">
              <span className="stat-label">Total Evaluators</span>
              <span className="stat-value">{evaluators.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active</span>
              <span className="stat-value stat-active">{evaluators.filter(e => e.workload > 0).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Available</span>
              <span className="stat-value stat-available">{evaluators.filter(e => e.workload === 0).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Workload</span>
              <span className="stat-value">{evaluators.reduce((sum, e) => sum + e.workload, 0)} papers</span>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center', padding: '1.5rem', backgroundColor: '#fafbfc', borderRadius: '8px' }}>
            {/* Search Box */}
            <div style={{ flex: '1', minWidth: '300px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '12px', color: '#999', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, username, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  padding: '0.65rem 12px 0.65rem 40px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Status Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#666' }}>Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '0.65rem 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <option value="all">All Evaluators</option>
                <option value="active">Active</option>
                <option value="available">Available</option>
              </select>
            </div>
          </div>

          {/* Evaluators Table */}
          <section className="evaluators-table-section">
            <div className="table-container">
              <table className="evaluators-table">
                <thead>
                  <tr>
                    <th>Evaluator</th>
                    <th>Credentials</th>
                    <th>Department</th>
                    <th className="text-center">Workload</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvaluators.map(evaluator => (
                    <tr key={evaluator.id} className="evaluator-row">
                      <td>
                        <div className="evaluator-info">
                          <div className="evaluator-avatar-small">
                            {(evaluator.name || evaluator.username || evaluator.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="evaluator-details">
                            <div className="evaluator-name">{evaluator.name}</div>
                            <div className="evaluator-email">{evaluator.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="credentials-cell">
                          <div className="credential-row">
                            <span className="credential-label">Username:</span>
                            <span className="credential-value">••••••••</span>
                          </div>
                          <div className="credential-row">
                            <span className="credential-label">Password:</span>
                            <span className="credential-value credential-password">••••••••</span>
                          </div>
                          <button
                            className="btn-view-credentials"
                            onClick={() => handleViewCredentials(evaluator)}
                            title="View credentials"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2.05 12C3.2 7.61 7.21 4 12 4s8.8 3.61 9.95 8c-1.15 4.39-5.16 8-9.95 8s-8.8-3.61-9.95-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            View
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="department-badge">{evaluator.department || 'Not Assigned'}</span>
                      </td>
                      <td className="text-center">
                        <span className="workload-indicator">{evaluator.workload}</span>
                      </td>
                      <td className="text-center">
                        <span className={`status-indicator ${evaluator.workload > 0 ? 'status-busy' : 'status-available'}`}>
                          {evaluator.workload > 0 ? 'Active' : 'Available'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons">
                          <button className="btn-action btn-edit" title="Edit Evaluator">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteEvaluator(evaluator.id)}
                            className="btn-action btn-delete" 
                            title="Delete Evaluator"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
