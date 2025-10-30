import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MyPapers() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Sample data for demonstration
  const [myPapers] = useState([
    {
      id: 1,
      title: 'Deep Learning Applications in Healthcare',
      author: 'John Doe',
      department: 'Computer Science',
      college: 'MIT College of Engineering',
      submittedDate: '2025-10-15',
      status: 'under_evaluation',
      keywords: ['Deep Learning', 'Healthcare', 'AI'],
      abstract: 'This paper explores the various applications of deep learning in the healthcare sector...'
    },
    {
      id: 2,
      title: 'Blockchain Technology for Secure Data Storage',
      author: 'John Doe',
      department: 'Computer Science',
      college: 'MIT College of Engineering',
      submittedDate: '2025-10-10',
      status: 'completed',
      keywords: ['Blockchain', 'Security', 'Data Storage'],
      abstract: 'An analysis of blockchain technology and its implementation for secure data storage...',
      evaluationScore: 85,
      evaluatorFeedback: 'Excellent work! The paper demonstrates a clear understanding of blockchain technology.'
    },
    {
      id: 3,
      title: 'IoT Systems in Smart Cities',
      author: 'John Doe',
      department: 'Computer Science',
      college: 'MIT College of Engineering',
      submittedDate: '2025-10-05',
      status: 'pending_assignment',
      keywords: ['IoT', 'Smart Cities', 'Technology'],
      abstract: 'This research discusses the integration of IoT systems in developing smart city infrastructure...'
    }
  ])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending_assignment: { class: 'status-warning', text: 'Pending Assignment' },
      under_evaluation: { class: 'status-info', text: 'Under Evaluation' },
      completed: { class: 'status-success', text: 'Completed' },
      published: { class: 'status-published', text: 'Published' },
      rejected: { class: 'status-rejected', text: 'Rejected' }
    }
    return badges[status] || { class: 'status-pending', text: 'Unknown' }
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
        <h2>My Papers</h2>
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
        <div className="dashboard-content my-papers-content">
          <header className="page-header">
            <div>
              <h1>My Submitted Papers</h1>
              <p>View and track the status of your submitted research papers.</p>
            </div>
            <Link to="/upload-paper" className="btn btn-primary btn-sm">
              + Submit New Paper
            </Link>
          </header>

          {/* Papers List */}
          <section className="my-papers-section">
            {myPapers.length === 0 ? (
              <div className="no-papers">
                <h3>No Papers Submitted Yet</h3>
                <p>You haven't submitted any papers yet. Click the button above to submit your first paper!</p>
                <Link to="/upload-paper" className="btn btn-primary">
                  Submit Your First Paper
                </Link>
              </div>
            ) : (
              <div className="papers-list">
                {myPapers.map(paper => {
                  const statusInfo = getStatusBadge(paper.status)
                  return (
                    <div key={paper.id} className="my-paper-card">
                      <div className="paper-card-header">
                        <div className="paper-header-left">
                          <h3>{paper.title}</h3>
                          <div className="paper-meta-info">
                            <span className="paper-id">Paper #{paper.id}</span>
                            <span className="paper-date">Submitted: {paper.submittedDate}</span>
                          </div>
                        </div>
                        <span className={`status-badge ${statusInfo.class}`}>
                          {statusInfo.text}
                        </span>
                      </div>

                      <div className="paper-card-body">
                        <div className="paper-info-grid">
                          <div className="info-item">
                            <span className="info-label">Author:</span>
                            <span className="info-value">{paper.author}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Department:</span>
                            <span className="info-value">{paper.department}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">College:</span>
                            <span className="info-value">{paper.college}</span>
                          </div>
                        </div>

                        <div className="paper-keywords-section">
                          <span className="info-label">Keywords:</span>
                          <div className="keywords-list">
                            {paper.keywords.map((keyword, index) => (
                              <span key={index} className="keyword-tag">{keyword}</span>
                            ))}
                          </div>
                        </div>

                        <div className="paper-abstract">
                          <span className="info-label">Abstract:</span>
                          <p>{paper.abstract}</p>
                        </div>

                        {paper.status === 'completed' && (
                          <div className="evaluation-results">
                            <h4>Evaluation Results</h4>
                            <div className="evaluation-score">
                              <span className="score-label">Score:</span>
                              <span className="score-value">{paper.evaluationScore}/100</span>
                            </div>
                            {paper.evaluatorFeedback && (
                              <div className="evaluator-feedback">
                                <span className="feedback-label">Evaluator Feedback:</span>
                                <p>{paper.evaluatorFeedback}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="paper-card-actions">
                        <button className="btn-icon" title="View Details">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          View
                        </button>
                        <button className="btn-icon" title="Download PDF">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
