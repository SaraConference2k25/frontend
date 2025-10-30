import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sampleEvaluators, samplePapers } from '../data/sampleData'

export default function AdminPapers() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Use shared sample data
  const evaluators = sampleEvaluators
  const [papers, setPapers] = useState(samplePapers)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const openAssignModal = (paper) => {
    setSelectedPaper(paper)
    setShowAssignModal(true)
  }

  const closeAssignModal = () => {
    setShowAssignModal(false)
    setSelectedPaper(null)
  }

  const assignEvaluator = (evaluatorId) => {
    const evaluator = evaluators.find(e => e.id === evaluatorId)
    
    setPapers(prev => 
      prev.map(paper => 
        paper.id === selectedPaper.id 
          ? { 
              ...paper, 
              status: 'under_evaluation',
              evaluatorId: evaluatorId,
              evaluatorName: evaluator.name,
              assignedDate: new Date().toISOString().split('T')[0]
            }
          : paper
      )
    )

    alert(`Paper assigned to ${evaluator.name} successfully!`)
    closeAssignModal()
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

  const getRecommendedEvaluators = (paperKeywords) => {
    return evaluators
      .map(evaluator => {
        const matchCount = evaluator.expertise.filter(skill => 
          paperKeywords.some(keyword => 
            skill.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(skill.toLowerCase())
          )
        ).length
        return { ...evaluator, matchScore: matchCount }
      })
      .sort((a, b) => b.matchScore - a.matchScore || a.workload - b.workload)
  }

  const filteredPapers = papers.filter(paper => {
    if (filterStatus === 'all') return true
    return paper.status === filterStatus
  })

  return (
    <div id="dashboard">
      {/* Top Header */}
      <header className="dashboard-header">
        <button className={`sidebar-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h2>Manage Papers</h2>
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

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="upload-modal-overlay" onClick={closeAssignModal}>
          <div className="upload-modal assignment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Evaluator</h3>
              <button className="close-btn" onClick={closeAssignModal}>&times;</button>
            </div>
            <div className="modal-body">
              {selectedPaper && (
                <div className="paper-details">
                  <h4>{selectedPaper.title}</h4>
                  <p><strong>Author:</strong> {selectedPaper.author}</p>
                  <p><strong>Department:</strong> {selectedPaper.department}</p>
                  <p><strong>Keywords:</strong> {selectedPaper.keywords.join(', ')}</p>
                </div>
              )}
              
              <div className="evaluator-selection">
                <h4>Recommended Evaluators</h4>
                <div className="evaluators-list">
                  {getRecommendedEvaluators(selectedPaper?.keywords || []).map(evaluator => (
                    <div key={evaluator.id} className="evaluator-card">
                      <div className="evaluator-info">
                        <h5>{evaluator.name}</h5>
                        <p><strong>Expertise:</strong> {evaluator.expertise.join(', ')}</p>
                        <p><strong>Current Workload:</strong> {evaluator.workload} papers</p>
                        {evaluator.matchScore > 0 && (
                          <span className="match-indicator">
                            {evaluator.matchScore} keyword match{evaluator.matchScore > 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => assignEvaluator(evaluator.id)}
                        className="btn btn-primary btn-assign"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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
                <h1>Paper Management</h1>
                <p className="page-subtitle">Assign evaluators to submitted papers and monitor evaluation progress</p>
              </div>
              <div className="filter-controls-modern">
                <label htmlFor="status-filter" className="filter-label">Status:</label>
                <select 
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="status-filter-modern"
                >
                  <option value="all">All Papers</option>
                  <option value="pending_assignment">Pending Assignment</option>
                  <option value="under_evaluation">Under Evaluation</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </header>

          {/* Stats Overview */}
          <div className="evaluators-stats-bar">
            <div className="stat-item">
              <span className="stat-label">Total Papers</span>
              <span className="stat-value">{papers.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pending Assignment</span>
              <span className="stat-value">{papers.filter(p => p.status === 'pending_assignment').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Under Evaluation</span>
              <span className="stat-value">{papers.filter(p => p.status === 'under_evaluation').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{papers.filter(p => p.status === 'completed').length}</span>
            </div>
          </div>

          {/* Papers Table */}
          <section className="table-section-professional">
            {filteredPapers.length > 0 ? (
              <div className="table-wrapper-professional" style={{ overflowX: 'auto' }}>
                <table className="evaluator-table-professional papers-table-professional" style={{ minWidth: '1200px' }}>
                  <thead>
                    <tr>
                      <th>Paper ID</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Department</th>
                      <th>Submitted</th>
                      <th>Keywords</th>
                      <th>Evaluator</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPapers.map(paper => {
                      const statusInfo = getStatusBadge(paper.status)
                      return (
                        <tr key={paper.id}>
                          <td data-label="Paper ID">#{paper.id}</td>
                          <td data-label="Title" className="paper-title-cell">
                            <div className="paper-title-content">
                              {paper.title}
                            </div>
                          </td>
                          <td data-label="Author">{paper.author}</td>
                          <td data-label="Department">{paper.department}</td>
                          <td data-label="Submitted">{paper.submittedDate}</td>
                          <td data-label="Keywords">
                            <div className="keywords-cell">
                              {paper.keywords.slice(0, 3).map((keyword, index) => (
                                <span key={index} className="keyword-badge">{keyword}</span>
                              ))}
                              {paper.keywords.length > 3 && (
                                <span className="keyword-more">+{paper.keywords.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td data-label="Evaluator">
                            {paper.evaluatorName ? (
                              <div className="evaluator-info-cell">
                                <span className="evaluator-name">{paper.evaluatorName}</span>
                                {paper.assignedDate && (
                                  <small className="assigned-date">{paper.assignedDate}</small>
                                )}
                              </div>
                            ) : (
                              <span className="no-evaluator-badge">Not assigned</span>
                            )}
                          </td>
                          <td data-label="Status">
                            <span className={`status-badge-modern status-${paper.status}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td data-label="Actions" className="actions-cell">
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button 
                                onClick={() => openAssignModal(paper)}
                                className="action-btn assign-btn-modern"
                                title={paper.evaluatorName ? "Manage Evaluator" : "Assign Evaluator"}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                                </svg>
                                {paper.evaluatorName ? 'Manage' : 'Assign'}
                              </button>
                              <button 
                                className="action-btn view-btn-modern"
                                title="View Details"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No papers found matching the selected status.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}