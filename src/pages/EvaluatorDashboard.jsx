import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function EvaluatorDashboard() {
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
        <h2>Evaluator Dashboard</h2>
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
              <Link to="/evaluate-papers" className="nav-item">
                Evaluate Papers
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
          <header>
            <h1>Welcome to Evaluator Dashboard</h1>
            <p>Review and evaluate submitted papers from participants. Your expertise helps maintain academic excellence.</p>
          </header>
          
          <div className="evaluator-cards">
            <div className="eval-card">
              <div className="card-icon">📝</div>
              <h3>Evaluate Papers</h3>
              <p>Review submitted papers and provide feedback. Accept or reject submissions based on quality and relevance.</p>
              <Link to="/evaluate-papers" className="btn btn-primary">
                Start Evaluation
              </Link>
            </div>
            
            <div className="eval-card">
              <div className="card-icon">📊</div>
              <h3>Evaluation Statistics</h3>
              <p>View your evaluation history and statistics. Track approved and rejected papers.</p>
              <button className="btn btn-secondary" disabled>
                Coming Soon
              </button>
            </div>
            
            <div className="eval-card">
              <div className="card-icon">⚙️</div>
              <h3>Settings</h3>
              <p>Configure evaluation criteria and preferences for paper review process.</p>
              <button className="btn btn-secondary" disabled>
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}