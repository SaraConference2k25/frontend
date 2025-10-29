import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
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
        <div className="dashboard-content">
          <header>
            <h1>Welcome to Your Dashboard</h1>
            <p>Your personalized hub for academic excellence, campus activities, and institutional resources.</p>
          </header>
          
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>📄</h3>
              <p>Submitted Papers</p>
              <h2>3</h2>
            </div>
            <div className="stat-card">
              <h3>⏳</h3>
              <p>Under Review</p>
              <h2>1</h2>
            </div>
            <div className="stat-card">
              <h3>✅</h3>
              <p>Completed</p>
              <h2>1</h2>
            </div>
            <div className="stat-card">
              <h3>⌛</h3>
              <p>Pending</p>
              <h2>1</h2>
            </div>
          </div>

          <div className="dashboard-actions">
            <Link to="/upload-paper" className="btn btn-primary">Submit New Paper</Link>
            <Link to="/my-papers" className="btn btn-secondary">View My Papers</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
