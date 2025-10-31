import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardStats, recentActivities } from '../data/sampleData'

export default function AdminDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
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
        <h2>Admin Dashboard</h2>
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

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content admin-evaluators-content">
          <header className="page-header-modern">
            <div className="page-header-content">
              <div className="page-title-section">
                <h1>Conference Management Dashboard</h1>
                <p className="page-subtitle">Monitor submissions, manage evaluations, and oversee the review process</p>
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
              <span className="stat-label">Pending Assignment</span>
              <span className="stat-value">{dashboardStats.pendingAssignment}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Under Evaluation</span>
              <span className="stat-value">{dashboardStats.underEvaluation}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Evaluators</span>
              <span className="stat-value">{dashboardStats.totalEvaluators}</span>
            </div>
          </div>

          {/* Management Actions */}
          <section className="table-section-professional management-cards-section">
            <div className="management-cards-grid">
              <Link to="/admin-papers" className="management-card-modern">
                <div className="management-card-icon papers-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div className="management-card-content">
                  <h3>Paper Management</h3>
                  <p>Assign evaluators and track paper status</p>
                  <div className="management-card-stat">
                    <span className="stat-number">{dashboardStats.pendingAssignment}</span>
                    <span className="stat-text">pending assignments</span>
                  </div>
                </div>
                <div className="management-card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </Link>

              <Link to="/admin-evaluators" className="management-card-modern">
                <div className="management-card-icon evaluators-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <div className="management-card-content">
                  <h3>Evaluator Management</h3>
                  <p>View evaluator workload and performance</p>
                  <div className="management-card-stat">
                    <span className="stat-number">{dashboardStats.totalEvaluators}</span>
                    <span className="stat-text">total evaluators</span>
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