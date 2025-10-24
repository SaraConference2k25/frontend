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
              <Link to="/admin-reports" className="nav-item">
                Reports
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
        <div className="dashboard-content">
          <header className="admin-header">
            <h1>Conference Management Dashboard</h1>
            <p>Monitor submissions, manage evaluations, and oversee the review process.</p>
          </header>

          {/* Management Actions */}
          <section className="management-section">
            <h2>Management</h2>
            <div className="management-grid">
              <Link to="/admin-papers" className="management-item">
                <h3>Paper Management</h3>
                <p>Assign evaluators and track paper status</p>
                <div className="management-info">{dashboardStats.pendingAssignment} pending assignments</div>
              </Link>

              <Link to="/admin-evaluators" className="management-item">
                <h3>Evaluator Management</h3>
                <p>View evaluator workload and performance</p>
                <div className="management-info">{dashboardStats.totalEvaluators} total evaluators</div>
              </Link>

              <Link to="/admin-reports" className="management-item">
                <h3>Reports & Analytics</h3>
                <p>Generate reports and view system statistics</p>
                <div className="management-info">View detailed reports</div>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}