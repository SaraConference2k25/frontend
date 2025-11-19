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
        console.log('📊 Papers count:', Array.isArray(papers) ? papers.length : 'Not an array')
        console.log('📋 First paper structure:', papers?.[0])
        setSubmittedPapers(Array.isArray(papers) ? papers : [])
      } catch (error) {
        console.error('❌ Failed to load papers:', error)
        alert('Failed to load papers: ' + (error.message || error))
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
          paper.paperId === selectedPaper.paperId 
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

  // Papers are pending if they haven't been evaluated yet
  const pendingPapers = submittedPapers.filter(paper => {
    const status = paper.status?.toLowerCase() || ''
    // Match any status that indicates pending evaluation
    const isPending = !status.includes('accept') && !status.includes('reject')
    console.log('📋 Paper:', paper.paperId, '| Status:', paper.status, '| Pending:', isPending)
    return isPending
  })
  console.log('✅ Total papers:', submittedPapers.length, '| Pending papers:', pendingPapers.length, '| Pending Papers:', pendingPapers)
  
  const evaluatedPapers = submittedPapers.filter(paper => {
    const status = paper.status?.toLowerCase() || ''
    // Match any status that indicates it's been evaluated
    return status.includes('accept') || status.includes('reject')
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
          <div className="evaluation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="evaluation-modal-header">
              <div>
                <h3>Evaluate Paper</h3>
                <p>Provide your expert review and recommendation</p>
              </div>
              <button className="evaluation-modal-close" onClick={closeEvaluationModal}>&times;</button>
            </div>
            
            <div className="evaluation-modal-body">
              {selectedPaper && (
                <>
                  <div className="paper-summary-box">
                    <div className="summary-item">
                      <div className="summary-label">Paper Title</div>
                      <div className="summary-value">{selectedPaper.paperTitle || selectedPaper.title || 'N/A'}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Author</div>
                      <div className="summary-value">{selectedPaper.name || selectedPaper.author || 'N/A'}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Department</div>
                      <div className="summary-value">{selectedPaper.department || 'N/A'}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Abstract</div>
                      <div className="summary-value">{(selectedPaper.paperAbstract || selectedPaper.abstract || 'N/A').substring(0, 200)}...</div>
                    </div>
                  </div>

                  <form onSubmit={handleEvaluationSubmit} className="evaluation-form">
                    {/* Decision Section */}
                    <div className="decision-section">
                      <div className="decision-label">Your Decision *</div>
                      <div className="decision-options">
                        <button
                          type="button"
                          className={`decision-button accept ${evaluationData.decision === 'accept' ? 'selected' : ''}`}
                          onClick={() => handleDecisionChange('accept')}
                        >
                          <span className="decision-icon">✓</span>
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          className={`decision-button minor ${evaluationData.decision === 'minor' ? 'selected' : ''}`}
                          onClick={() => handleDecisionChange('minor')}
                        >
                          <span className="decision-icon">◐</span>
                          <span>Minor Changes</span>
                        </button>
                        <button
                          type="button"
                          className={`decision-button reject ${evaluationData.decision === 'reject' ? 'selected' : ''}`}
                          onClick={() => handleDecisionChange('reject')}
                        >
                          <span className="decision-icon">✕</span>
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="comments-section">
                      <div className="comments-label">Comments & Feedback *</div>
                      <textarea
                        name="comments"
                        value={evaluationData.comments}
                        onChange={handleInputChange}
                        className="comments-textarea"
                        placeholder="Please provide detailed feedback for the author. Include specific suggestions for improvement, strengths of the paper, and areas that need revision..."
                        required
                      />
                    </div>

                    {/* Score Section */}
                    <div className="score-section">
                      <div className="score-label">Score (Optional)</div>
                      <input
                        type="number"
                        name="score"
                        value={evaluationData.score}
                        onChange={handleInputChange}
                        className="score-input"
                        min="0"
                        max="100"
                        placeholder="Enter score from 0 to 100"
                      />
                    </div>

                    {/* Actions */}
                    <div className="modal-actions">
                      <button
                        type="button"
                        onClick={closeEvaluationModal}
                        className="btn-cancel"
                        disabled={submittingEvaluation}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-submit"
                        disabled={submittingEvaluation || !evaluationData.comments.trim()}
                      >
                        {submittingEvaluation ? 'Submitting...' : 'Submit Evaluation'}
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
        <div className="evaluation-container">
          {/* Header */}
          <div className="evaluation-header">
            <h1>Paper Evaluation</h1>
            <p>Review and evaluate submitted papers. Provide constructive feedback to help authors improve their work.</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '2rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid #f0f0f0',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#2d3748', fontWeight: '600', marginBottom: '0.5rem' }}>Loading Papers</h3>
                <p style={{ margin: 0, color: '#718096', fontSize: '0.95rem' }}>Fetching papers assigned to you...</p>
              </div>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {/* Papers Sections - Show only when not loading */}
          {!loading && (
            <>
              {/* Pending Papers Section */}
              <section className="papers-section">
                <h2>
                  Pending Evaluations
                  <span className="section-badge">{pendingPapers.length}</span>
                </h2>
                
                {pendingPapers.length > 0 ? (
                  <div className="papers-grid">
                    {pendingPapers.map(paper => (
                      <div key={paper.paperId} className="paper-card">
                        <div className="paper-card-header">
                          <div className="paper-card-title">
                            <h3>{paper.paperTitle || paper.title || 'Untitled Paper'}</h3>
                            <div className="paper-meta">
                              <span>By {paper.name || paper.author || 'Unknown Author'}</span>
                            </div>
                          </div>
                          <span className="status-badge-modern pending">Pending Review</span>
                        </div>
                        
                        <div className="paper-card-body">
                          <div className="paper-details-grid">
                            <div className="paper-details-row">
                              <div className="paper-details-label">Author</div>
                              <div className="paper-details-value">{paper.name || paper.author || 'N/A'}</div>
                            </div>
                            
                            <div className="paper-details-row">
                              <div className="paper-details-label">Department</div>
                              <div className="paper-details-value">{paper.department || 'N/A'}</div>
                            </div>
                            
                            <div className="paper-details-row">
                              <div className="paper-details-label">College</div>
                              <div className="paper-details-value">{paper.collegeName || paper.college || 'N/A'}</div>
                            </div>
                            
                            <div className="paper-details-row">
                              <div className="paper-details-label">Email</div>
                              <div className="paper-details-value">{paper.email || 'N/A'}</div>
                            </div>
                            
                            <div className="paper-details-row">
                              <div className="paper-details-label">Submission Date</div>
                              <div className="paper-details-value">{paper.submittedAt ? new Date(paper.submittedAt).toLocaleDateString() : paper.submittedDate || 'N/A'}</div>
                            </div>
                            
                            <div className="paper-details-row">
                              <div className="paper-details-label">Contact</div>
                              <div className="paper-details-value">{paper.contactNo || 'N/A'}</div>
                            </div>
                          </div>
                          
                          <div className="paper-abstract-section">
                            <div className="paper-abstract-section-title">Abstract</div>
                            <div className="paper-abstract-box">
                              <p>{paper.paperAbstract || paper.abstract || 'No abstract available'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="paper-actions">
                          <button 
                            onClick={() => openEvaluationModal(paper)}
                            className="btn-evaluate"
                          >
                            Review Paper
                          </button>
                          <button className="btn-download">
                            Download PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-papers">
                    <p>No pending papers for evaluation at this time</p>
                  </div>
                )}
              </section>

              {/* Evaluated Papers Section */}
              {evaluatedPapers.length > 0 && (
                <section className="papers-section">
                  <h2>
                    Evaluation History
                    <span className="section-badge">{evaluatedPapers.length}</span>
                  </h2>
                  
                  <div className="papers-grid">
                    {evaluatedPapers.map(paper => (
                      <div key={paper.paperId} className="paper-card evaluated">
                        <div className="paper-card-header">
                          <div className="paper-card-title">
                            <h3>{paper.paperTitle || paper.title || 'Untitled Paper'}</h3>
                            <div className="paper-meta">
                              <span>By {paper.name || paper.author || 'Unknown Author'}</span>
                            </div>
                          </div>
                          <span className={`status-badge-modern ${
                            paper.status === 'accepted' || paper.status === 'ACCEPTED' ? 'accepted' :
                            paper.status === 'accepted_with_changes' || paper.status === 'ACCEPTED_WITH_CHANGES' ? 'minor' :
                            'rejected'
                          }`}>
                            {getStatusLabel(paper.status)}
                          </span>
                        </div>
                        
                        <div className="paper-card-body">
                          <div className="paper-details-grid">
                            <div className="paper-details-row">
                              <div className="paper-details-label">Author</div>
                              <div className="paper-details-value">{paper.name || paper.author || 'N/A'}</div>
                            </div>
                            
                            <div className="paper-details-row">
                              <div className="paper-details-label">Department</div>
                              <div className="paper-details-value">{paper.department || 'N/A'}</div>
                            </div>
                            
                            <div className="paper-details-row full">
                              <div className="paper-details-label">Your Decision</div>
                              <div className="paper-details-value" style={{ fontWeight: '700', color: '#059669' }}>
                                {getStatusLabel(paper.status)}
                              </div>
                            </div>
                            
                            {paper.evaluation?.score && (
                              <div className="paper-details-row">
                                <div className="paper-details-label">Score</div>
                                <div className="paper-details-value">{paper.evaluation.score}/100</div>
                              </div>
                            )}
                            
                            <div className="paper-details-row">
                              <div className="paper-details-label">Evaluation Date</div>
                              <div className="paper-details-value">
                                {paper.evaluation?.evaluatedDate || paper.evaluatedDate || 'N/A'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="paper-abstract-section">
                            <div className="paper-abstract-section-title">Your Feedback</div>
                            <div className="paper-abstract-box">
                              <p>{paper.evaluation?.comments || paper.feedback || 'No comments provided'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* DEBUG: Show all papers if none shown */}
          {!loading && submittedPapers.length > 0 && pendingPapers.length === 0 && evaluatedPapers.length === 0 && (
            <section className="papers-section">
              <h2>🔍 Debug: All Papers (No filters matched)</h2>
              <div className="papers-grid">
                {submittedPapers.map(paper => (
                  <div key={paper.paperId} className="paper-card">
                    <div className="paper-card-header">
                      <div className="paper-card-title">
                        <h3>{paper.paperTitle || paper.title || 'Paper ID: ' + paper.paperId}</h3>
                        <div className="paper-meta">
                          <span>Status: {paper.status} | Type: {typeof paper.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="paper-card-body">
                      <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '300px' }}>
                        {JSON.stringify(paper, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      
      <style>{`
        /* Modern Evaluate Papers Styles */
        .evaluation-container {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          padding: 2.5rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: calc(100vh - 80px);
        }

        .evaluation-header {
          background: linear-gradient(135deg, #4c3aa3 0%, #5a2d82 100%);
          color: white;
          padding: 3rem 2.5rem;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(76, 58, 163, 0.4);
          margin-bottom: 2rem;
        }

        .evaluation-header h1 {
          font-size: 2.5rem;
          margin: 0 0 0.5rem 0;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #ffffff;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .evaluation-header p {
          font-size: 1.1rem;
          margin: 0;
          opacity: 1;
          font-weight: 500;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .papers-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .papers-section h2 {
          font-size: 1.6rem;
          color: #1f2937;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .section-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          min-width: 40px;
          text-align: center;
        }

        .papers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2.5rem;
          width: 100%;
        }

        .paper-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 2px solid transparent;
          position: relative;
        }

        .paper-card:hover {
          box-shadow: 0 16px 40px rgba(102, 126, 234, 0.2);
          transform: translateY(-8px);
          border-color: #667eea;
        }

        .paper-card.evaluated {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-color: #06b6d4;
        }

        .paper-card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: stretch;
          gap: 1.2rem;
          min-height: auto;
        }

        .paper-card-title {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .paper-card-title h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          line-height: 1.4;
          word-break: break-word;
          color: #f5f7ff;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          letter-spacing: -0.3px;
    R    }

        .paper-meta {
          font-size: 0.9rem;
          font-weight: 500;
          opacity: 1;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: #e8ecff;
        }

        .paper-meta-icon {
          display: inline-block;
          font-size: 1rem;
        }

        .status-badge-modern {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.4rem 0.85rem;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          white-space: nowrap;
          flex-shrink: 0;
          align-self: flex-start;
        }

        .status-badge-modern.pending {
          background: rgba(255, 255, 255, 0.25);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .status-badge-modern.accepted {
          background: #10b981;
          color: white;
        }

        .status-badge-modern.minor {
          background: #f59e0b;
          color: white;
        }

        .status-badge-modern.rejected {
          background: #ef4444;
          color: white;
        }

        .paper-card-body {
          padding: 1.75rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          background: white;
        }

        .paper-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          background: linear-gradient(135deg, #f0f4ff 0%, #f8fafc 100%);
          padding: 1.75rem;
          border-radius: 12px;
          border: 2px solid #e0e7ff;
        }

        .paper-details-row {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .paper-details-row.full {
          grid-column: 1 / -1;
        }

        .paper-details-label {
          font-size: 0.7rem;
          font-weight: 900;
          color: #667eea;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .paper-details-value {
          font-size: 0.95rem;
          color: #1f2937;
          line-height: 1.6;
          font-weight: 600;
        }

        .paper-abstract-section {
          background: linear-gradient(135deg, #fafbfc 0%, #f3f6f9 100%);
          padding: 1.5rem;
          border-radius: 12px;
          border-left: 4px solid #667eea;
          margin-top: auto;
          border: 2px solid #e0e7ff;
        }

        .paper-abstract-section-title {
          font-size: 0.75rem;
          font-weight: 800;
          color: #667eea;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 0.75rem;
        }

        .paper-abstract-box {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .paper-abstract-box p {
          margin: 0;
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.6;
        }

        .paper-actions {
          display: flex;
          gap: 0.8rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-top: 2px solid #e2e8f0;
        }

        .btn-evaluate {
          flex: 1;
          padding: 0.85rem 1.2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-evaluate:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-evaluate:active {
          transform: translateY(0);
        }

        .btn-download {
          flex: 1;
          padding: 0.85rem 1.2rem;
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-download:hover {
          background: #667eea;
          color: white;
          transform: translateY(-2px);
        }

        .no-papers {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }

        .no-papers p {
          margin: 0;
          font-size: 1.1rem;
          color: #6b7280;
          font-weight: 500;
        }

        /* Modern Modal Styles */
        .evaluation-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .evaluation-modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .evaluation-modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 16px 16px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .evaluation-modal-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .evaluation-modal-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 0.95rem;
        }

        .evaluation-modal-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          padding: 0;
          flex-shrink: 0;
        }

        .evaluation-modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .evaluation-modal-body {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .paper-summary-box {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          margin-bottom: 1rem;
        }

        .summary-item:last-child {
          margin-bottom: 0;
        }

        .summary-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #667eea;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-value {
          font-size: 0.95rem;
          color: #1f2937;
          font-weight: 500;
        }

        .decision-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .decision-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .decision-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .decision-button {
          padding: 1rem;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          text-align: center;
        }

        .decision-button.accept {
          border-color: #10b981;
          background: #f0fdf4;
          color: #059669;
        }

        .decision-button.accept.selected {
          background: #10b981;
          color: white;
          border-color: #10b981;
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
        }

        .decision-button.minor {
          border-color: #f59e0b;
          background: #fffbeb;
          color: #d97706;
        }

        .decision-button.minor.selected {
          background: #f59e0b;
          color: white;
          border-color: #f59e0b;
          box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3);
        }

        .decision-button.reject {
          border-color: #ef4444;
          background: #fef2f2;
          color: #dc2626;
        }

        .decision-button.reject.selected {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
        }

        .decision-button:hover {
          transform: translateY(-2px);
        }

        .decision-icon {
          font-size: 1.5rem;
        }

        .comments-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .comments-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .comments-textarea {
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          font-size: 0.95rem;
          resize: vertical;
          min-height: 120px;
          transition: all 0.3s ease;
        }

        .comments-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .score-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .score-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .score-input {
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .score-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn-cancel {
          flex: 1;
          padding: 0.75rem 1.5rem;
          background: #f3f4f6;
          color: #374151;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-cancel:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        .btn-submit {
          flex: 1;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }

        .btn-submit:active {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .evaluation-container {
            padding: 1.5rem;
          }

          .evaluation-header {
            padding: 2rem 1.5rem;
          }

          .evaluation-header h1 {
            font-size: 1.8rem;
          }

          .papers-grid {
            grid-template-columns: 1fr;
          }

          .decision-options {
            grid-template-columns: 1fr;
          }

          .evaluation-modal-body {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}