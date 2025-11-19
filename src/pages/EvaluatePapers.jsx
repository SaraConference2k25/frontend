import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPapersByEvaluator } from '../api/papers'

export default function EvaluatePapers() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false)
  const [evaluationData, setEvaluationData] = useState({
    decision: 'accept',
    comments: '',
    score: ''
  })

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // State for papers assigned to this evaluator
  const [submittedPapers, setSubmittedPapers] = useState([])

  // Fetch papers assigned to this evaluator from backend
  useEffect(() => {
    async function loadPapers() {
      // Get evaluator ID - try user.id first, then user.username
      const evaluatorId = user?.id || user?.username || user?.userId
      
      if (!evaluatorId) {
        console.warn('⚠️ User not logged in or no user ID available')
        return
      }

      setLoading(true)
      try {
        console.log('📄 Fetching papers for evaluator:', evaluatorId)
        const papers = await getPapersByEvaluator(evaluatorId)
        console.log('✅ Papers loaded successfully:', papers)
        setSubmittedPapers(Array.isArray(papers) ? papers : [])
      } catch (error) {
        console.error('❌ Failed to load papers:', error)
        setSubmittedPapers([])
      } finally {
        setLoading(false)
      }
    }

    loadPapers()
  }, [user?.id, user?.username, user?.userId])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const openEvaluationModal = (paper) => {
    setSelectedPaper(paper)
    setShowEvaluationModal(true)
    setEvaluationData({
      decision: 'accept',
      comments: '',
      score: ''
    })
  }

  const closeEvaluationModal = () => {
    setShowEvaluationModal(false)
    setSelectedPaper(null)
    setEvaluationData({
      decision: 'accept',
      comments: '',
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

  const handleDecisionChange = (decision) => {
    setEvaluationData(prev => ({
      ...prev,
      decision
    }))
  }

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault()
    
    if (!evaluationData.comments.trim()) {
      alert('Please provide comments for your evaluation')
      return
    }

    setSubmittingEvaluation(true)
    try {
      const decisionMap = {
        accept: 'accepted',
        minor: 'accepted_with_changes',
        reject: 'rejected'
      }

      setSubmittedPapers(prev => 
        prev.map(paper => 
          paper.id === selectedPaper.id 
            ? { 
                ...paper, 
                status: decisionMap[evaluationData.decision],
                evaluation: {
                  decision: evaluationData.decision,
                  comments: evaluationData.comments,
                  score: evaluationData.score || 0,
                  evaluatedBy: user?.name || user?.username,
                  evaluatedDate: new Date().toISOString().split('T')[0]
                }
              }
            : paper
        )
      )

      alert('✅ Evaluation submitted successfully!')
      closeEvaluationModal()
    } catch (error) {
      console.error('Error submitting evaluation:', error)
      alert('Failed to submit evaluation. Please try again.')
    } finally {
      setSubmittingEvaluation(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || 'pending'
    const badges = {
      pending: 'status-pending',
      approved: 'status-approved', 
      rejected: 'status-rejected',
      accepted: 'status-approved',
      accepted_with_changes: 'status-warning',
      assigned: 'status-info',
      under_evaluation: 'status-info',
      completed: 'status-success',
      published: 'status-published',
      in_progress: 'status-info',
      submitted: 'status-warning',
      returned: 'status-warning'
    }
    
    if (badges[statusLower]) {
      return badges[statusLower]
    }
    
    return 'status-custom'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending Evaluation',
      ASSIGNED: 'Pending Evaluation',
      PENDING: 'Pending Evaluation',
      accepted: '✓ Accepted',
      accepted_with_changes: '◐ Accepted with Minor Changes',
      rejected: '✕ Rejected',
      ACCEPTED: '✓ Accepted',
      REJECTED: '✕ Rejected'
    }
    return labels[status] || status?.charAt(0).toUpperCase() + status?.slice(1)
  }

  // Papers are pending if they haven't been evaluated yet (status: pending, ASSIGNED, PENDING, under_evaluation, UNDER_EVALUATION)
  const pendingPapers = submittedPapers.filter(paper => {
    const status = paper.status?.toUpperCase() || ''
    return status === 'PENDING' || status === 'ASSIGNED' || status === 'UNDER_EVALUATION' || paper.status === 'pending' || paper.status === 'under_evaluation'
  })
  
  const evaluatedPapers = submittedPapers.filter(paper => {
    const status = paper.status?.toUpperCase() || ''
    return status === 'ACCEPTED' || status === 'REJECTED' || status === 'ACCEPTED_WITH_CHANGES' || 
           paper.status === 'accepted' || paper.status === 'rejected' || paper.status === 'accepted_with_changes'
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
        <div className="evaluation-modal-overlay" onClick={closeEvaluationModal}>
          <div className="evaluation-modal-modern" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <div className="modal-header-content">
                <div className="modal-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                  </svg>
                  Review Paper
                </div>
                <h3 className="modal-title">{selectedPaper?.paperTitle || selectedPaper?.title || 'Paper Evaluation'}</h3>
                <p className="modal-subtitle">Provide your expert assessment and feedback</p>
              </div>
              <button className="modal-close-btn" onClick={closeEvaluationModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body-modern">
              {selectedPaper && (
                <>
                  {/* Paper Details Grid */}
                  <div className="paper-details-grid">
                    <div className="detail-card">
                      <div className="detail-label">AUTHOR</div>
                      <div className="detail-value">{selectedPaper.name || selectedPaper.author || 'N/A'}</div>
                    </div>
                    <div className="detail-card">
                      <div className="detail-label">DEPARTMENT</div>
                      <div className="detail-value">{selectedPaper.department || 'N/A'}</div>
                    </div>
                    <div className="detail-card">
                      <div className="detail-label">COLLEGE</div>
                      <div className="detail-value">{selectedPaper.collegeName || selectedPaper.college || 'N/A'}</div>
                    </div>
                    <div className="detail-card">
                      <div className="detail-label">EMAIL</div>
                      <div className="detail-value">{selectedPaper.email || 'N/A'}</div>
                    </div>
                    <div className="detail-card">
                      <div className="detail-label">SUBMISSION DATE</div>
                      <div className="detail-value">
                        {selectedPaper.submittedAt ? new Date(selectedPaper.submittedAt).toLocaleDateString() : selectedPaper.submittedDate || 'N/A'}
                      </div>
                    </div>
                    <div className="detail-card">
                      <div className="detail-label">CONTACT</div>
                      <div className="detail-value">{selectedPaper.contactNo || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Abstract Section */}
                  {(selectedPaper.paperAbstract || selectedPaper.abstract) && (
                    <div className="abstract-section-modal">
                      <div className="abstract-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                        <span>ABSTRACT</span>
                      </div>
                      <p className="abstract-content">{selectedPaper.paperAbstract || selectedPaper.abstract}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="modal-action-buttons">
                    <button 
                      type="button"
                      className="modal-btn-primary"
                      onClick={() => {}}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                      </svg>
                      <span>Review Paper</span>
                    </button>
                    {selectedPaper.fileUrl && (
                      <a 
                        href={selectedPaper.fileUrl} 
                        download
                        className="modal-btn-secondary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        <span>Download</span>
                      </a>
                    )}
                  </div>

                  <div className="modal-divider"></div>

                  <form onSubmit={handleEvaluationSubmit} className="evaluation-form-modern">
                    {/* Decision Section */}
                    <div className="form-section">
                      <label className="form-label">Your Decision *</label>
                      <div className="decision-buttons">
                        <button
                          type="button"
                          className={`decision-btn decision-accept ${evaluationData.decision === 'accept' ? 'active' : ''}`}
                          onClick={() => handleDecisionChange('accept')}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          className={`decision-btn decision-minor ${evaluationData.decision === 'minor' ? 'active' : ''}`}
                          onClick={() => handleDecisionChange('minor')}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>
                          </svg>
                          <span>Minor Changes</span>
                        </button>
                        <button
                          type="button"
                          className={`decision-btn decision-reject ${evaluationData.decision === 'reject' ? 'active' : ''}`}
                          onClick={() => handleDecisionChange('reject')}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="form-section">
                      <label className="form-label" htmlFor="comments">Comments & Feedback *</label>
                      <textarea
                        id="comments"
                        name="comments"
                        value={evaluationData.comments}
                        onChange={handleInputChange}
                        className="form-textarea"
                        placeholder="Provide detailed feedback including strengths, weaknesses, and specific suggestions for improvement..."
                        rows="6"
                        required
                      />
                    </div>

                    {/* Score Section */}
                    <div className="form-section">
                      <label className="form-label" htmlFor="score">Score (0-100)</label>
                      <input
                        id="score"
                        type="number"
                        name="score"
                        value={evaluationData.score}
                        onChange={handleInputChange}
                        className="form-input"
                        min="0"
                        max="100"
                        placeholder="Optional: Enter a score from 0 to 100"
                      />
                    </div>

                    {/* Submit Actions */}
                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={closeEvaluationModal}
                        className="form-btn-cancel"
                        disabled={submittingEvaluation}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="form-btn-submit"
                        disabled={submittingEvaluation || !evaluationData.comments.trim()}
                      >
                        {submittingEvaluation ? (
                          <>
                            <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            <span>Submit Evaluation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="eval-modern-container">
          {/* Stunning Header with Glassmorphism */}
          <header className="eval-hero-header">
            <div className="eval-hero-background"></div>
            <div className="eval-hero-content">
              <div className="eval-hero-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                <span>Excellence in Review</span>
              </div>
              <h1 className="eval-hero-title">Paper Evaluation Center</h1>
              <p className="eval-hero-subtitle">Empowering academic excellence through expert peer review</p>
              <div className="eval-hero-stats">
                <div className="eval-stat-item">
                  <span className="eval-stat-number">{pendingPapers.length}</span>
                  <span className="eval-stat-label">Pending</span>
                </div>
                <div className="eval-stat-divider"></div>
                <div className="eval-stat-item">
                  <span className="eval-stat-number">{evaluatedPapers.length}</span>
                  <span className="eval-stat-label">Evaluated</span>
                </div>
                <div className="eval-stat-divider"></div>
                <div className="eval-stat-item">
                  <span className="eval-stat-number">{submittedPapers.length}</span>
                  <span className="eval-stat-label">Total</span>
                </div>
              </div>
            </div>
          </header>

          {/* Loading State - Modern Design */}
          {loading && (
            <div className="eval-loading-modern">
              <div className="eval-loading-animation">
                <div className="eval-loading-circle"></div>
                <div className="eval-loading-circle"></div>
                <div className="eval-loading-circle"></div>
              </div>
              <h3 className="eval-loading-title">Fetching Your Papers</h3>
              <p className="eval-loading-text">Please wait while we load your evaluation queue...</p>
            </div>
          )}

          {/* Papers Sections - Show only when not loading */}
          {!loading && (
            <>
              {/* Pending Papers Section - Modern Design */}
              <section className="eval-section-modern">
                <div className="eval-section-header">
                  <div className="eval-section-icon-wrapper">
                    <div className="eval-section-icon eval-icon-pending">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="eval-section-title-wrapper">
                    <h2 className="eval-section-title">Awaiting Your Expert Review</h2>
                    <p className="eval-section-description">Papers requiring your professional evaluation</p>
                  </div>
                  <div className="eval-count-badge eval-badge-pending">
                    <span className="eval-count-number">{pendingPapers.length}</span>
                    <span className="eval-count-text">pending</span>
                  </div>
                </div>
                
                {pendingPapers.length > 0 ? (
                  <div className="eval-cards-grid">
                    {pendingPapers.map((paper, index) => (
                      <div key={paper.id} className="eval-card-modern" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="eval-card-glow"></div>
                        <div className="eval-card-header">
                          <div className="eval-card-number">#{index + 1}</div>
                          <div className="eval-status-badge eval-status-pending">
                            <span className="eval-status-pulse"></span>
                            <span>Pending Review</span>
                          </div>
                        </div>
                        
                        <div className="paper-card-body-professional">
                          <div className="paper-info-grid-professional">
                            <div className="eval-pill">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                              </svg>
                              <span>{paper.collegeName || paper.college || 'N/A'}</span>
                            </div>
                            <div className="eval-pill">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                              </svg>
                              <span>{paper.email || 'N/A'}</span>
                            </div>
                            <div className="eval-pill">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                              </svg>
                              <span>{paper.submittedAt ? new Date(paper.submittedAt).toLocaleDateString() : paper.submittedDate || 'N/A'}</span>
                            </div>
                          </div>
                          
                          {(paper.paperAbstract || paper.abstract) && (
                            <div className="eval-abstract-preview">
                              <div className="eval-abstract-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                Abstract
                              </div>
                              <p className="eval-abstract-text">{(paper.paperAbstract || paper.abstract).slice(0, 150)}...</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="eval-card-actions">
                          <button 
                            onClick={() => openEvaluationModal(paper)}
                            className="eval-btn-primary"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                            </svg>
                            <span>Start Review</span>
                          </button>
                          {paper.fileUrl && (
                            <a 
                              href={paper.fileUrl} 
                              download 
                              className="eval-btn-secondary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                              </svg>
                              <span>Download</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="eval-empty-state">
                    <div className="eval-empty-icon">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                      </svg>
                    </div>
                    <h3 className="eval-empty-title">All Caught Up!</h3>
                    <p className="eval-empty-text">You have no pending papers to evaluate at the moment</p>
                  </div>
                )}
              </section>

              {/* Evaluated Papers Section - Modern Design */}
              {evaluatedPapers.length > 0 && (
                <section className="eval-section-modern eval-section-history">
                  <div className="eval-section-header">
                    <div className="eval-section-icon-wrapper">
                      <div className="eval-section-icon eval-icon-evaluated">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="eval-section-title-wrapper">
                      <h2 className="eval-section-title">Evaluation History</h2>
                      <p className="eval-section-description">Your completed reviews and decisions</p>
                    </div>
                    <div className="eval-count-badge eval-badge-evaluated">
                      <span className="eval-count-number">{evaluatedPapers.length}</span>
                      <span className="eval-count-text">evaluated</span>
                    </div>
                  </div>
                  
                  <div className="eval-cards-grid">
                    {evaluatedPapers.map((paper, index) => (
                      <div key={paper.id} className="eval-card-modern eval-card-evaluated" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="eval-card-glow"></div>
                        
                        <div className="eval-card-header">
                          <div className="eval-card-number">#{index + 1}</div>
                          <div className={`eval-status-badge ${
                            paper.status === 'accepted' || paper.status === 'ACCEPTED' ? 'eval-status-accepted' :
                            paper.status === 'accepted_with_changes' || paper.status === 'ACCEPTED_WITH_CHANGES' ? 'eval-status-minor' :
                            'eval-status-rejected'
                          }`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            <span>{getStatusLabel(paper.status)}</span>
                          </div>
                        </div>
                        
                        <div className="eval-card-body">
                          <h3 className="eval-paper-title">{paper.paperTitle || paper.title || 'Untitled Paper'}</h3>
                          
                          <div className="eval-author-section">
                            <div className="eval-author-avatar eval-author-avatar-success">
                              {(paper.name || paper.author || 'U')[0].toUpperCase()}
                            </div>
                            <div className="eval-author-info">
                              <p className="eval-author-name">{paper.name || paper.author || 'Unknown Author'}</p>
                              <p className="eval-author-dept">{paper.department || 'Department Not Specified'}</p>
                            </div>
                          </div>
                          
                          <div className="eval-decision-summary">
                            <div className="eval-decision-item">
                              <span className="eval-decision-label">Your Decision</span>
                              <span className="eval-decision-value">{getStatusLabel(paper.status)}</span>
                            </div>
                            {paper.evaluation?.score && (
                              <div className="eval-decision-item">
                                <span className="eval-decision-label">Score</span>
                                <span className="eval-decision-score">{paper.evaluation.score}/100</span>
                              </div>
                            )}
                            <div className="eval-decision-item">
                              <span className="eval-decision-label">Evaluated On</span>
                              <span className="eval-decision-date">
                                {paper.evaluation?.evaluatedDate || paper.evaluatedDate || 'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          {(paper.evaluation?.comments || paper.feedback) && (
                            <div className="eval-feedback-preview">
                              <div className="eval-feedback-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                                </svg>
                                Your Feedback
                              </div>
                              <p className="eval-feedback-text">{(paper.evaluation?.comments || paper.feedback).slice(0, 120)}...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      
      <style>{`
        /* ========================================
           STUNNING MODERN EVALUATE PAPERS DESIGN
           ======================================== */
        
        /* Container */
        .eval-modern-container {
          padding: 0;
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #fef3c7 100%);
          position: relative;
          overflow: hidden;
        }

        .eval-modern-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%236366f1" fill-opacity="0.03"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g></svg>');
          animation: backgroundScroll 30s linear infinite;
          pointer-events: none;
        }

        @keyframes backgroundScroll {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }

        /* Hero Header with Glassmorphism */
        .eval-hero-header {
          position: relative;
          padding: 4rem 3rem;
          margin-bottom: 3rem;
          overflow: hidden;
        }

        .eval-hero-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 2px solid rgba(99, 102, 241, 0.1);
          box-shadow: 0 4px 24px rgba(99, 102, 241, 0.08);
        }

        .eval-hero-content {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
          text-align: center;
        }

        .eval-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          border-radius: 50px;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          animation: badgePulse 2s ease-in-out infinite;
        }

        @keyframes badgePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px 10px rgba(99, 102, 241, 0); }
        }

        .eval-hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #1e293b 0%, #4f46e5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
          animation: titleSlideUp 0.8s ease-out;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        @keyframes titleSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .eval-hero-subtitle {
          font-size: 1.25rem;
          color: #64748b;
          margin-bottom: 2rem;
          animation: subtitleSlideUp 0.8s ease-out 0.2s both;
          font-weight: 500;
        }

        @keyframes subtitleSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .eval-hero-stats {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          animation: statsSlideUp 0.8s ease-out 0.4s both;
        }

        @keyframes statsSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .eval-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .eval-stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .eval-stat-label {
          font-size: 0.875rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .eval-stat-divider {
          width: 2px;
          height: 60px;
          background: linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.2), transparent);
        }

        /* Loading State */
        .eval-loading-modern {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
        }

        .eval-loading-animation {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .eval-loading-circle {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          animation: loadingBounce 1.4s ease-in-out infinite;
        }

        .eval-loading-circle:nth-child(1) { animation-delay: 0s; }
        .eval-loading-circle:nth-child(2) { animation-delay: 0.2s; }
        .eval-loading-circle:nth-child(3) { animation-delay: 0.4s; }

        @keyframes loadingBounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        .eval-loading-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .eval-loading-text {
          font-size: 1rem;
          color: #64748b;
        }

        /* Section Design */
        .eval-section-modern {
          max-width: 1400px;
          margin: 0 auto 3rem;
          padding: 0 3rem;
        }

        .eval-section-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding: 2rem;
          background: white;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 2px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: all 0.3s ease;
        }

        .eval-section-header:hover {
          border-color: #6366f1;
          box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.15), 0 10px 10px -5px rgba(99, 102, 241, 0.08);
          transform: translateY(-2px);
        }

        .eval-section-icon-wrapper {
          flex-shrink: 0;
        }

        .eval-section-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .eval-icon-pending {
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
          animation: iconPulse 2s ease-in-out infinite;
        }

        .eval-icon-evaluated {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        @keyframes iconPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          50% { box-shadow: 0 0 0 20px rgba(245, 158, 11, 0); }
        }

        .eval-section-icon svg {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .eval-section-title-wrapper {
          flex: 1;
        }

        .eval-section-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .eval-section-description {
          font-size: 0.95rem;
          color: #64748b;
        }

        .eval-count-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          min-width: 80px;
        }

        .eval-badge-pending {
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
        }

        .eval-badge-evaluated {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .eval-count-number {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .eval-count-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        /* Cards Grid */
        .eval-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 2rem;
        }

        /* Modern Card Design */
        .eval-card-modern {
          position: relative;
          background: white;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 24px;
          border: 2px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: cardFadeIn 0.6s ease-out both;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }

        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .eval-card-modern:hover {
          transform: translateY(-10px) scale(1.02);
          border-color: #6366f1;
          box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.2), 0 10px 10px -5px rgba(99, 102, 241, 0.15);
        }

        .eval-card-modern:hover .eval-card-glow {
          opacity: 1;
        }

        .eval-card-glow {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        /* Card Header */
        .eval-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
          border-bottom: 2px solid #e2e8f0;
        }

        .eval-card-number {
          font-size: 0.875rem;
          font-weight: 700;
          color: #6366f1;
          padding: 0.375rem 0.75rem;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        /* Status Badges */
        .eval-status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
        }

        .eval-status-pending {
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
        }

        .eval-status-accepted {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .eval-status-minor {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .eval-status-rejected {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .eval-status-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: white;
          animation: pulseDot 1.5s ease-in-out infinite;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        /* Card Body */
        .eval-card-body {
          padding: 2rem;
        }

        .eval-paper-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1.5rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Author Section */
        .eval-author-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .eval-author-section:hover {
          background: #f0f4ff;
          border-color: #c7d2fe;
          transform: translateX(5px);
        }

        .eval-author-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .eval-author-avatar-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .eval-author-info {
          flex: 1;
        }

        .eval-author-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .eval-author-dept {
          font-size: 0.875rem;
          color: #64748b;
        }

        /* Info Pills */
        .eval-info-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .eval-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 50px;
          font-size: 0.875rem;
          color: #475569;
          transition: all 0.3s ease;
        }

        .eval-pill:hover {
          background: #f0f4ff;
          border-color: #6366f1;
          transform: translateY(-2px);
          color: #4f46e5;
        }

        .eval-pill svg {
          flex-shrink: 0;
          color: #a855f7;
        }

        /* Abstract Preview */
        .eval-abstract-preview {
          padding: 1.25rem;
          background: #f0f4ff;
          border-left: 4px solid #6366f1;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
          border: 1px solid #c7d2fe;
          border-left-width: 4px;
        }

        .eval-abstract-preview:hover {
          background: #e0e7ff;
          border-left-width: 6px;
          box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.1);
        }

        .eval-abstract-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #a855f7;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .eval-abstract-text {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.6;
        }

        /* Decision Summary */
        .eval-decision-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .eval-decision-item {
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .eval-decision-item:hover {
          background: #f0f4ff;
          border-color: #6366f1;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.1);
        }

        .eval-decision-label {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .eval-decision-value {
          display: block;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .eval-decision-score {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .eval-decision-date {
          display: block;
          font-size: 0.875rem;
          color: #64748b;
        }

        /* Feedback Preview */
        .eval-feedback-preview {
          padding: 1.25rem;
          background: #f0fdf4;
          border-left: 4px solid #10b981;
          border-radius: 12px;
          transition: all 0.3s ease;
          border: 1px solid #bbf7d0;
          border-left-width: 4px;
        }

        .eval-feedback-preview:hover {
          background: #dcfce7;
          border-left-width: 6px;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1);
        }

        .eval-feedback-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #10b981;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .eval-feedback-text {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.6;
        }

        /* Card Actions */
        .eval-card-actions {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-top: 2px solid #e2e8f0;
        }

        .eval-btn-primary,
        .eval-btn-secondary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }

        .eval-btn-primary::before,
        .eval-btn-secondary::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .eval-btn-primary:hover::before,
        .eval-btn-secondary:hover::before {
          width: 300px;
          height: 300px;
        }

        .eval-btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
        }

        .eval-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
        }

        .eval-btn-secondary {
          background: white;
          color: #4f46e5;
          border: 2px solid #e2e8f0;
        }

        .eval-btn-secondary:hover {
          background: #f0f4ff;
          transform: translateY(-3px);
          border-color: #6366f1;
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.2);
        }

        .eval-btn-primary span,
        .eval-btn-secondary span {
          position: relative;
          z-index: 1;
        }

        .eval-btn-primary svg,
        .eval-btn-secondary svg {
          position: relative;
          z-index: 1;
        }

        /* Empty State */
        .eval-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          text-align: center;
        }

        .eval-empty-icon {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: #f0f4ff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          animation: emptyFloat 3s ease-in-out infinite;
          border: 2px solid #e2e8f0;
        }

        @keyframes emptyFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .eval-empty-icon svg {
          color: #c7d2fe;
        }

        .eval-empty-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.75rem;
        }

        .eval-empty-text {
          font-size: 1rem;
          color: #64748b;
          max-width: 400px;
        }

        /* Evaluated Card Variations */
        .eval-card-evaluated {
          border-color: #bbf7d0;
        }

        .eval-card-evaluated:hover {
          border-color: #10b981;
          box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.2), 0 10px 10px -5px rgba(16, 185, 129, 0.15);
        }

        .eval-card-evaluated .eval-card-header {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .eval-cards-grid {
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .eval-hero-title {
            font-size: 2.5rem;
          }

          .eval-hero-stats {
            flex-direction: column;
            gap: 1.5rem;
          }

          .eval-stat-divider {
            width: 60px;
            height: 1px;
          }

          .eval-section-modern {
            padding: 0 1.5rem;
          }

          .eval-cards-grid {
            grid-template-columns: 1fr;
          }

          .eval-section-header {
            flex-direction: column;
            text-align: center;
          }

          .eval-card-actions {
            flex-direction: column;
          }

          .eval-decision-summary {
            grid-template-columns: 1fr;
          }
        }

        /* ========================================
           MODERN EVALUATION MODAL STYLES
           ======================================== */
        
        .evaluation-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 2rem;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .evaluation-modal-modern {
          background: white;
          border-radius: 24px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: modalSlideUp 0.4s ease-out;
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header-modern {
          position: relative;
          padding: 2.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 24px 24px 0 0;
        }

        .modal-header-content {
          position: relative;
          z-index: 1;
        }

        .modal-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .modal-title {
          font-size: 2rem;
          font-weight: 800;
          color: white;
          margin: 0 0 0.5rem 0;
          line-height: 1.3;
        }

        .modal-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
        }

        .modal-close-btn {
          position: absolute;
          top: 2rem;
          right: 2rem;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .modal-body-modern {
          padding: 2.5rem;
        }

        .paper-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .detail-card {
          padding: 1.25rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .detail-card:hover {
          background: #f0f4ff;
          border-color: #c7d2fe;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.1);
        }

        .detail-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .detail-value {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          word-break: break-word;
        }

        .abstract-section-modal {
          padding: 1.5rem;
          background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
          border-radius: 16px;
          border: 2px solid #e0e7ff;
          margin-bottom: 2rem;
        }

        .abstract-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          color: #6366f1;
        }

        .abstract-header span {
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .abstract-content {
          font-size: 1rem;
          line-height: 1.7;
          color: #475569;
          margin: 0;
        }

        .modal-action-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .modal-btn-primary,
        .modal-btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-decoration: none;
        }

        .modal-btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
        }

        .modal-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
        }

        .modal-btn-secondary {
          background: white;
          color: #6366f1;
          border: 2px solid #e2e8f0;
        }

        .modal-btn-secondary:hover {
          background: #f0f4ff;
          border-color: #6366f1;
          transform: translateY(-3px);
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.2);
        }

        .modal-divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          margin: 2rem 0;
        }

        .evaluation-form-modern {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .form-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
        }

        .decision-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .decision-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.25rem 1rem;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .decision-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .decision-btn.active {
          border-width: 2px;
        }

        .decision-accept {
          color: #16a34a;
        }

        .decision-accept.active {
          background: #f0fdf4;
          border-color: #16a34a;
        }

        .decision-minor {
          color: #2563eb;
        }

        .decision-minor.active {
          background: #eff6ff;
          border-color: #2563eb;
        }

        .decision-reject {
          color: #dc2626;
        }

        .decision-reject.active {
          background: #fef2f2;
          border-color: #dc2626;
        }

        .form-textarea {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          font-family: inherit;
          resize: vertical;
          transition: all 0.3s ease;
          background: #f8fafc;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #6366f1;
          background: white;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-input {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.3s ease;
          background: #f8fafc;
        }

        .form-input:focus {
          outline: none;
          border-color: #6366f1;
          background: white;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .form-btn-cancel,
        .form-btn-submit {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .form-btn-cancel {
          background: white;
          color: #64748b;
          border: 2px solid #e2e8f0;
        }

        .form-btn-cancel:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .form-btn-submit {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
        }

        .form-btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
        }

        .form-btn-submit:disabled,
        .form-btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Modal Responsive */
        @media (max-width: 768px) {
          .evaluation-modal-overlay {
            padding: 1rem;
          }

          .evaluation-modal-modern {
            max-height: 95vh;
          }

          .modal-header-modern {
            padding: 2rem 1.5rem;
          }

          .modal-close-btn {
            top: 1.5rem;
            right: 1.5rem;
          }

          .modal-body-modern {
            padding: 1.5rem;
          }

          .paper-details-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .modal-action-buttons {
            grid-template-columns: 1fr;
          }

          .decision-buttons {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .form-btn-cancel,
          .form-btn-submit {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}
