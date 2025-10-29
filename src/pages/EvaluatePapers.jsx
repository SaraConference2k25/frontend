import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { samplePapers } from '../data/sampleData'

export default function EvaluatePapers() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [expandedPapers, setExpandedPapers] = useState({})
  const [paperDecisions, setPaperDecisions] = useState({})
  const [paperFeedback, setPaperFeedback] = useState({})
  const [evaluationData, setEvaluationData] = useState({
    status: '',
    feedback: '',
    score: ''
  })

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Filter papers assigned to this evaluator
  const [submittedPapers, setSubmittedPapers] = useState(
    samplePapers.filter(paper => 
      paper.assignedEvaluator === user?.username || 
      (user?.username === 'evaluator1' && [1, 2, 3, 4, 5, 6].includes(paper.id)) ||
      (user?.username === 'evaluator2' && [7, 8, 9, 10].includes(paper.id)) ||
      (user?.username === 'evaluator3' && [11, 12].includes(paper.id))
    )
  )

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleExpandPaper = (paperId) => {
    setExpandedPapers(prev => ({
      ...prev,
      [paperId]: !prev[paperId]
    }))
  }

  const handleDecisionChange = (paperId, decision) => {
    setPaperDecisions(prev => ({
      ...prev,
      [paperId]: decision
    }))
  }

  const handleFeedbackChange = (paperId, feedback) => {
    setPaperFeedback(prev => ({
      ...prev,
      [paperId]: feedback
    }))
  }

  const openEvaluationModal = (paper) => {
    setSelectedPaper(paper)
    setShowEvaluationModal(true)
    setEvaluationData({
      status: '',
      feedback: '',
      score: ''
    })
  }

  const closeEvaluationModal = () => {
    setShowEvaluationModal(false)
    setSelectedPaper(null)
    setEvaluationData({
      status: '',
      feedback: '',
      score: ''
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEvaluationData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEvaluationSubmit = (e) => {
    e.preventDefault()
    
    if (!evaluationData.status || !evaluationData.feedback) {
      alert('Please provide both status and feedback')
      return
    }

    // Update paper status
    setSubmittedPapers(prev => 
      prev.map(paper => 
        paper.id === selectedPaper.id 
          ? { 
              ...paper, 
              status: evaluationData.status,
              feedback: evaluationData.feedback,
              score: evaluationData.score,
              evaluatedBy: user.name,
              evaluatedDate: new Date().toISOString().split('T')[0]
            }
          : paper
      )
    )

    alert(`Paper ${evaluationData.status} successfully!`)
    closeEvaluationModal()
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'status-pending',
      approved: 'status-approved', 
      rejected: 'status-rejected'
    }
    return badges[status] || 'status-pending'
  }

  const pendingPapers = submittedPapers.filter(paper => paper.status === 'pending')
  const evaluatedPapers = submittedPapers.filter(paper => paper.status !== 'pending')

  return (
    <div id="dashboard">
      {/* Top Header */}
      <header className="dashboard-header">
        <button className={`sidebar-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h2>Evaluate Papers</h2>
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
              <Link to="/evaluator-dashboard" className="nav-item">
                Dashboard
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

      {/* Evaluation Modal */}
      {showEvaluationModal && (
        <div className="upload-modal-overlay" onClick={closeEvaluationModal}>
          <div className="upload-modal evaluation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Evaluate Paper</h3>
              <button className="close-btn" onClick={closeEvaluationModal}>&times;</button>
            </div>
            <div className="modal-body">
              {selectedPaper && (
                <div className="paper-details">
                  <h4>{selectedPaper.title}</h4>
                  <p><strong>Author:</strong> {selectedPaper.author}</p>
                  <p><strong>Department:</strong> {selectedPaper.department}</p>
                  <p><strong>Abstract:</strong> {selectedPaper.abstract}</p>
                </div>
              )}
              
              <form onSubmit={handleEvaluationSubmit} className="evaluation-form">
                <div className="form-group">
                  <label htmlFor="status">Evaluation Decision *</label>
                  <select
                    id="status"
                    name="status"
                    value={evaluationData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Decision</option>
                    <option value="approved">Approve Paper</option>
                    <option value="rejected">Reject Paper</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="score">Score (Optional)</label>
                  <input
                    type="number"
                    id="score"
                    name="score"
                    min="0"
                    max="100"
                    value={evaluationData.score}
                    onChange={handleInputChange}
                    placeholder="Score out of 100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="feedback">Feedback/Comments *</label>
                  <textarea
                    id="feedback"
                    name="feedback"
                    value={evaluationData.feedback}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Provide detailed feedback for the author..."
                    required
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={closeEvaluationModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Evaluation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content evaluation-content">
          <header>
            <h1>Paper Evaluation</h1>
            <p>Review and evaluate submitted papers. Provide constructive feedback to help authors improve their work.</p>
          </header>
          
          {/* Pending Papers Section */}
          <section className="papers-section">
            <h2>Pending Evaluations ({pendingPapers.length})</h2>
            <div className="papers-grid">
              {pendingPapers.map(paper => (
                <div key={paper.id} className="paper-card">
                  <div className="paper-header">
                    <h3>{paper.title}</h3>
                    <span className={`status-badge ${getStatusBadge(paper.status)}`}>
                      {paper.status.charAt(0).toUpperCase() + paper.status.slice(1)}
                    </span>
                  </div>
                  <div className="paper-info">
                    <p><strong>Author:</strong> {paper.author}</p>
                    <p><strong>Department:</strong> {paper.department}</p>
                    <p><strong>College:</strong> {paper.college}</p>
                    <p><strong>Submitted:</strong> {paper.submittedDate}</p>
                  </div>
                  <div className="paper-abstract">
                    <p>{paper.abstract.substring(0, 150)}...</p>
                  </div>
                  <div className="paper-actions">
                    <button 
                      onClick={() => openEvaluationModal(paper)}
                      className="btn btn-primary"
                    >
                      Evaluate Paper
                    </button>
                    <button className="btn btn-secondary">
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {pendingPapers.length === 0 && (
              <div className="no-papers">
                <p>No pending papers for evaluation.</p>
              </div>
            )}
          </section>

          {/* Evaluated Papers Section */}
          <section className="papers-section">
            <h2>Recently Evaluated ({evaluatedPapers.length})</h2>
            <div className="papers-grid">
              {evaluatedPapers.map(paper => (
                <div 
                  key={paper.id} 
                  className={`paper-card evaluated ${expandedPapers[paper.id] ? 'expanded' : ''}`}
                >
                  <div className="paper-header">
                    <h3 onClick={() => toggleExpandPaper(paper.id)}>{paper.title}</h3>
                    <div className="header-right">
                      <button 
                        className="btn-view-paper"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Opening paper PDF...');
                        }}
                        title="View Paper"
                      >
                        View
                      </button>
                      <span className={`status-badge ${getStatusBadge(paper.status)}`}>
                        {paper.status.charAt(0).toUpperCase() + paper.status.slice(1)}
                      </span>
                      <span className="expand-icon" onClick={() => toggleExpandPaper(paper.id)}>
                        {expandedPapers[paper.id] ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                  {expandedPapers[paper.id] && (
                    <div className="paper-expanded-content" onClick={(e) => e.stopPropagation()}>
                      <div className="evaluation-section">
                        <div className="feedback-section">
                          <h4>Feedback</h4>
                          <textarea
                            className="feedback-textarea"
                            placeholder="Select a decision first to provide feedback..."
                            disabled={!paperDecisions[paper.id]}
                            value={paperFeedback[paper.id] || paper.feedback || ''}
                            onChange={(e) => handleFeedbackChange(paper.id, e.target.value)}
                            rows="8"
                          />
                        </div>
                        
                        <div className="decision-section">
                          <h4>Evaluation Decision</h4>
                          <div className="radio-group">
                            <label className="radio-label">
                              <input
                                type="radio"
                                name={`decision-${paper.id}`}
                                value="accept-minor"
                                checked={paperDecisions[paper.id] === 'accept-minor'}
                                onChange={(e) => handleDecisionChange(paper.id, e.target.value)}
                              />
                              <span>Accept with minor changes</span>
                            </label>
                            <label className="radio-label">
                              <input
                                type="radio"
                                name={`decision-${paper.id}`}
                                value="accept-major"
                                checked={paperDecisions[paper.id] === 'accept-major'}
                                onChange={(e) => handleDecisionChange(paper.id, e.target.value)}
                              />
                              <span>Accept with major changes</span>
                            </label>
                            <label className="radio-label">
                              <input
                                type="radio"
                                name={`decision-${paper.id}`}
                                value="decline"
                                checked={paperDecisions[paper.id] === 'decline'}
                                onChange={(e) => handleDecisionChange(paper.id, e.target.value)}
                              />
                              <span>Decline</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {paper.evaluatedBy && (
                        <div className="evaluation-meta">
                          <p><strong>Evaluated by:</strong> {paper.evaluatedBy}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}