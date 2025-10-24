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
        <div className="dashboard-content admin-papers-content">
          <header>
            <h1>Paper Management</h1>
            <p>Assign evaluators to submitted papers and monitor evaluation progress.</p>
          </header>

          {/* Filter Section */}
          <section className="filter-section">
            <div className="filter-controls">
              <label htmlFor="status-filter">Filter by Status:</label>
              <select 
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="status-filter"
              >
                <option value="all">All Papers ({papers.length})</option>
                <option value="pending_assignment">Pending Assignment ({papers.filter(p => p.status === 'pending_assignment').length})</option>
                <option value="under_evaluation">Under Evaluation ({papers.filter(p => p.status === 'under_evaluation').length})</option>
                <option value="completed">Completed ({papers.filter(p => p.status === 'completed').length})</option>
              </select>
            </div>
          </section>

          {/* Papers Table */}
          <section className="papers-section">
            <div className="papers-table-container">
              <table className="papers-table admin-papers-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Paper Title</th>
                    <th>Author & Department</th>
                    <th>Keywords</th>
                    <th>Status</th>
                    <th>Assigned Evaluator</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPapers.map(paper => {
                    const statusInfo = getStatusBadge(paper.status)
                    return (
                      <tr key={paper.id} className="paper-row">
                        <td className="paper-id">#{paper.id}</td>
                        <td className="paper-title">
                          <div className="title-content">
                            <h4>{paper.title}</h4>
                            <div className="paper-meta">
                              <span>{paper.college}</span>
                              <span>Submitted: {paper.submittedDate}</span>
                            </div>
                          </div>
                        </td>
                        <td className="paper-author">
                          <div className="author-info">
                            <strong>{paper.author}</strong>
                            <small>{paper.department}</small>
                          </div>
                        </td>
                        <td className="paper-keywords">
                          <div className="keywords-list">
                            {paper.keywords.map((keyword, index) => (
                              <span key={index} className="keyword-tag">{keyword}</span>
                            ))}
                          </div>
                        </td>
                        <td className="paper-status">
                          <span className={`status-badge ${statusInfo.class}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="assigned-evaluator">
                          {paper.evaluatorName ? (
                            <div className="evaluator-assigned">
                              <strong>{paper.evaluatorName}</strong>
                              {paper.assignedDate && (
                                <small>Assigned: {paper.assignedDate}</small>
                              )}
                            </div>
                          ) : (
                            <span className="no-evaluator">Not assigned</span>
                          )}
                        </td>
                        <td className="paper-actions">
                          {paper.status === 'pending_assignment' ? (
                            <button 
                              onClick={() => openAssignModal(paper)}
                              className="btn btn-primary btn-xs"
                            >
                              Assign
                            </button>
                          ) : paper.status === 'completed' ? (
                            <div className="completed-actions">
                              <span className="evaluation-result">
                                Score: {paper.score}/100
                              </span>
                              <button className="btn btn-secondary btn-sm">
                                View Details
                              </button>
                            </div>
                          ) : (
                            <span className="status-text">In Progress</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}