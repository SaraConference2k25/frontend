import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../index.css'

export default function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  // Store announcements and events (ready for database integration later)
  const [dashboardData] = useState({
    announcements: [
      '📄 Paper submission deadline extended to Nov 10, 2025.',
      '🏫 Research Symposium scheduled for Dec 2, 2025.',
      '🔔 New evaluation criteria announced for 2025 submissions.'
    ],
    events: [
      '🧠 AI Workshop - Oct 30 to Nov 2, 2025',
      '💡 Innovation Week - Nov 5 to Nov 10, 2025',
      '🎤 Guest Lecture on Data Ethics - Nov 12, 2025'
    ]
  })

  return (
    <div id="dashboard">
      {/* Top Header */}
      <header className="dashboard-header">
        <button
          className={`sidebar-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h2>Dashboard</h2>
        <div className="header-actions">
          <span>Welcome, {user?.username || user?.email}</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li><Link to="/dashboard" className="nav-item">Dashboard</Link></li>
            <li><Link to="/upload-paper" className="nav-item">Upload Paper</Link></li>
            <li><Link to="/my-papers" className="nav-item">My Papers</Link></li>
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
<<<<<<< HEAD
        <div className="dashboard-content">
          <header>
            <h1>Welcome back, {user?.username || 'User'}! 👋</h1>
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
=======
        <div className="dashboard-content my-papers-content">
          <header className="page-header">
            <div className="page-header-text">
              <h1
                style={{
                  color: '#5a67d8',
                  fontSize: '2rem',
                  fontWeight: 900,
                  textAlign: 'center',
                  margin: '0 0 2rem 0',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                Dashboard Overview
              </h1>
              <p>Stay updated with your research activities and campus updates.</p>
            </div>
          </header>

          {/* Dashboard Info Section */}
          <section className="dashboard-info-section">
            {/* User Info */}
            <div className="dashboard-info-card">
              <h2 className="info-title">👤 User Information</h2>
              <p><strong>Name:</strong> {user?.name || user?.username}</p>
              <p><strong>Email:</strong> {user?.email || 'user@example.com'}</p>
              <p><strong>Department:</strong> Computer Science</p>
              <p><strong>College:</strong> MIT College of Engineering</p>
            </div>

            {/* Announcements */}
            <div className="dashboard-info-card">
              <h2 className="info-title">📢 Upcoming Announcements</h2>
              <div className="scroll-box">
                <div className="scroll-content">
                  {dashboardData.announcements.map((a, i) => (
                    <p key={i}>{a}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Events */}
            <div className="dashboard-info-card">
              <h2 className="info-title">🎓 Ongoing Events</h2>
              <div className="scroll-box">
                <div className="scroll-content">
                  {dashboardData.events.map((e, i) => (
                    <p key={i}>{e}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>
>>>>>>> origin/feat/participant-managepapers
        </div>
      </main>
    </div>
  )
}
