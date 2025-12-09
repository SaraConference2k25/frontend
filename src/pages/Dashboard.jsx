import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../index.css'

export default function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Dashboard stats
  const dashboardStats = {
    totalPapers: 3,
    submittedPapers: 2,
    pendingReview: 1,
    acceptedPapers: 0
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
        <h2>Participant Dashboard</h2>
        <div className="header-actions">
          <span>Welcome, {user?.name || user?.username} (Participant)</span>
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
              <button onClick={handleLogout} className="nav-item">
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
        <div className="dashboard-content admin-evaluators-content">
          <header className="page-header-modern">
            <div className="page-header-content">
              <div className="page-title-section">
                <h1>Saranathan Research Portal</h1>
                <p className="page-subtitle">Manage your paper submissions, track reviews, and stay updated with conference updates</p>
              </div>
            </div>
          </header>

          {/* Stats Overview */}
          <div className="evaluators-stats-bar dashboard-stats-bar">
            <div className="stat-item">
              <span className="stat-label">Total Papers</span>
              <span className="stat-value">{dashboardStats.totalPapers}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Submitted</span>
              <span className="stat-value">{dashboardStats.submittedPapers}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pending Review</span>
              <span className="stat-value">{dashboardStats.pendingReview}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Accepted</span>
              <span className="stat-value">{dashboardStats.acceptedPapers}</span>
            </div>
          </div>

          {/* Management Actions */}
          <section className="table-section-professional management-cards-section">
            <div className="management-cards-grid">
              <Link to="/upload-paper" className="management-card-modern">
                <div className="management-card-icon papers-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <div className="management-card-content">
                  <h3>Submit New Paper</h3>
                  <p>Upload and submit your research paper for conference review</p>
                  <div className="management-card-stat">
                    <span className="stat-text">Ready to submit your work</span>
                  </div>
                </div>
                <div className="management-card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </Link>

              <Link to="/my-papers" className="management-card-modern">
                <div className="management-card-icon evaluators-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div className="management-card-content">
                  <h3>My Papers</h3>
                  <p>View and track the status of your submitted papers</p>
                  <div className="management-card-stat">
                    <span className="stat-number">{dashboardStats.totalPapers}</span>
                    <span className="stat-text">papers submitted</span>
                  </div>
                </div>
                <div className="management-card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
