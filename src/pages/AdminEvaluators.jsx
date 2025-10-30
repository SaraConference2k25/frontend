import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sampleEvaluators } from '../data/sampleData'

export default function AdminEvaluators() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [evaluators, setEvaluators] = useState(sampleEvaluators)
  const [newEvaluator, setNewEvaluator] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    expertise: '',
    department: ''
  })
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const openCreateModal = () => {
    setShowCreateModal(true)
    setNewEvaluator({
      name: '',
      email: '',
      username: '',
      password: '',
      expertise: '',
      department: ''
    })
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

  const handleCreateEvaluator = (e) => {
    e.preventDefault()
    
    // Validate form
    if (!newEvaluator.name || !newEvaluator.email || !newEvaluator.username || !newEvaluator.password) {
      alert('Please fill in all required fields')
      return
    }

    // Create expertise array from comma-separated string
    const expertiseArray = newEvaluator.expertise
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)

    // Create new evaluator object
    const evaluator = {
      id: evaluators.length + 1,
      name: newEvaluator.name,
      email: newEvaluator.email,
      username: newEvaluator.username,
      password: newEvaluator.password,
      expertise: expertiseArray,
      department: newEvaluator.department,
      workload: 0,
      role: 'evaluator'
    }

    // Add to evaluators list
    setEvaluators(prev => [...prev, evaluator])
    
    alert(`Evaluator ${evaluator.name} created successfully!`)
    closeCreateModal()
  }

  const handleDeleteEvaluator = (id) => {
    if (window.confirm('Are you sure you want to delete this evaluator?')) {
      setEvaluators(prev => prev.filter(evaluator => evaluator.id !== id))
      alert('Evaluator deleted successfully!')
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
        <h2>Manage Evaluators</h2>
        <div className="header-actions">
          <span>Welcome, {user?.name || user?.username} (Admin)</span>
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

      {/* Create Evaluator Modal */}
      {showCreateModal && (
        <div className="upload-modal-overlay" onClick={closeCreateModal}>
          <div className="upload-modal evaluator-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Evaluator</h3>
              <button className="close-btn" onClick={closeCreateModal}>&times;</button>
            </div>
            <div className="modal-body">
              <form className="evaluator-form" onSubmit={handleCreateEvaluator}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={newEvaluator.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={newEvaluator.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="username">Username *</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={newEvaluator.username}
                      onChange={handleInputChange}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <input
                      type="text"
                      id="password"
                      name="password"
                      value={newEvaluator.password}
                      onChange={handleInputChange}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={newEvaluator.department}
                    onChange={handleInputChange}
                    placeholder="Enter department"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expertise">Expertise Areas (comma-separated)</label>
                  <input
                    type="text"
                    id="expertise"
                    name="expertise"
                    value={newEvaluator.expertise}
                    onChange={handleInputChange}
                    placeholder="e.g., Machine Learning, AI, Data Science"
                  />
                </div>

                <div className="form-actions">
                  <button type="button" onClick={closeCreateModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
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
          <header className="page-header">
            <div>
              <h1>Evaluator Management</h1>
              <p>Create, view, and manage evaluators for paper review process.</p>
            </div>
            <button onClick={openCreateModal} className="btn btn-primary btn-sm">
              + Create
            </button>
          </header>

          {/* Evaluators Grid */}
          <section className="evaluators-section">
            <h2>All Evaluators ({evaluators.length})</h2>
            <div className="evaluators-grid">
              {evaluators.map(evaluator => (
                <div key={evaluator.id} className="evaluator-card-large">
                  <div className="evaluator-card-header">
                    <div className="evaluator-avatar">
                      {evaluator.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="evaluator-card-info">
                      <h3>{evaluator.name}</h3>
                      <p className="evaluator-email">{evaluator.email}</p>
                    </div>
                  </div>
                  
                  <div className="evaluator-card-body">
                    <div className="info-row">
                      <span className="info-label">Username:</span>
                      <span className="info-value">{evaluator.username || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Department:</span>
                      <span className="info-value">{evaluator.department || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Current Workload:</span>
                      <span className="info-value">{evaluator.workload} papers</span>
                    </div>
                    
                    <div className="expertise-section">
                      <span className="info-label">Expertise:</span>
                      <div className="expertise-tags">
                        {evaluator.expertise.map((skill, index) => (
                          <span key={index} className="expertise-tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="evaluator-card-actions">
                    <button className="btn btn-secondary btn-sm">
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteEvaluator(evaluator.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
