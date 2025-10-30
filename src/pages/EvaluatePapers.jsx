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

  // Helper: construct the public URL for a paper file.
  // Assumption: paper PDF files are placed in the project's `public/papers/` folder
  // and are served at `/papers/<fileName>` by the dev/build server.
  const getPaperUrl = (paper) => {
    if (!paper) return ''
    // prefer explicit fileName; fall back to sanitized title
    const fileName = paper.fileName || `${paper.title.replace(/\s+/g, '_')}.pdf`
    return `/papers/${fileName}`
  }

  // Open paper in a new tab/window for viewing
  const viewPaper = (paper) => {
    const url = getPaperUrl(paper)
    if (!url) {
      alert('Paper file not available')
      return
    }
    // Open in a new tab; letting browser handle PDF viewing
    window.open(url, '_blank', 'noopener')
  }

  // Download paper file
  const downloadPaper = async (paper) => {
    const url = getPaperUrl(paper)
    if (!url) {
      alert('Paper file not available')
      return
    }

    // Try a simple anchor download first (works for same-origin/public files)
    try {
      const link = document.createElement('a')
      link.href = url
      // provide a sensible filename when downloaded
      link.download = paper.fileName || `${paper.title}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      // fallback: fetch blob and create object URL
      try {
        const resp = await fetch(url)
        if (!resp.ok) throw new Error('Network response was not ok')
        const blob = await resp.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = paper.fileName || `${paper.title}.pdf`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(blobUrl)
      } catch (err2) {
        console.error('Download failed', err2)
        alert('Failed to download paper. Please try opening it and saving from the viewer.')
      }
    }
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

  // Track saved comment timestamps per paper
  const [savedComments, setSavedComments] = useState({})

  const handleSaveComments = (paperId) => {
    const comment = paperFeedback[paperId]
    if (!comment || comment.trim() === '') return

    // Update submittedPapers with the saved comment
    setSubmittedPapers(prev => (
      prev.map(p => p.id === paperId ? { ...p, feedback: comment, commentsSavedAt: new Date().toISOString() } : p)
    ))

    // Mark saved in local UI state
    setSavedComments(prev => ({ ...prev, [paperId]: new Date().toISOString() }))
  }

  const handleSubmitSelected = () => {
    // Submit all evaluated papers that have a decision selected
    const papersToSubmit = evaluatedPapers.filter(p => paperDecisions[p.id])
    if (papersToSubmit.length === 0) {
      alert('No evaluated papers have decisions to submit.')
      return
    }

    // Map decisions to new statuses
    const decisionToStatus = {
      'accept-minor': 'approved-minor',
      'accept-major': 'approved-major',
      'reject': 'rejected'
    }

    const ids = papersToSubmit.map(p => p.id)

    setSubmittedPapers(prev => (
      prev.map(p => {
        if (!ids.includes(p.id)) return p
        const decision = paperDecisions[p.id]
        const newStatus = decisionToStatus[decision] || p.status
        return {
          ...p,
          status: newStatus,
          feedback: paperFeedback[p.id] || p.feedback || '',
          evaluatedBy: user?.name || user?.username,
          evaluatedDate: new Date().toISOString().split('T')[0]
        }
      })
    ))

    alert(`Submitted ${ids.length} paper(s) successfully.`)
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
          
          {/* Pending Papers removed per request */}

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
                    <h3 onClick={() => toggleExpandPaper(paper.id)} style={{ margin: 0 }}>{paper.title}</h3>
                    <div className="header-right">
                      <button 
                        className="btn-view-paper btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          viewPaper(paper)
                        }}
                        title="View Paper"
                        aria-label={`View ${paper.title}`}
                        style={{ display: 'inline-flex', alignItems: 'center', padding: 6 }}
                      >
                        {/* Eye / view SVG (icon-only) */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className="btn-view-paper btn-secondary btn-icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadPaper(paper)
                        }}
                        title={`Download ${paper.title}`}
                        aria-label={`Download ${paper.title}`}
                        style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', padding: 6 }}
                      >
                        {/* Download SVG icon (icon-only) */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
                          <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 21H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
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
                          <h4>Comments</h4>
                          <textarea
                            className="feedback-textarea"
                            placeholder="Select a decision first to provide comments..."
                            disabled={!paperDecisions[paper.id]}
                            value={paperFeedback[paper.id] || paper.feedback || ''}
                            onChange={(e) => handleFeedbackChange(paper.id, e.target.value)}
                            rows="8"
                          />

                          <div className="form-actions" style={{ marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSaveComments(paper.id)}
                              disabled={
                                !paperDecisions[paper.id] || !(paperFeedback[paper.id] && paperFeedback[paper.id].trim().length > 0)
                              }
                              title="Save Comments"
                              style={{ padding: '6px 10px', fontSize: '0.85rem', minWidth: 72 }}
                            >
                              Save
                            </button>

                            {savedComments[paper.id] && (
                              <small style={{ marginTop: 6, color: 'var(--text-light)' }}>
                                Saved {new Date(savedComments[paper.id]).toLocaleString()}
                              </small>
                            )}
                          </div>
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
                                value="reject"
                                checked={paperDecisions[paper.id] === 'reject'}
                                onChange={(e) => handleDecisionChange(paper.id, e.target.value)}
                              />
                              <span>Reject</span>
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

            {/* Submit button for selected evaluated papers */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
              <button
                className="btn btn-primary"
                onClick={handleSubmitSelected}
                disabled={evaluatedPapers.filter(p => paperDecisions[p.id]).length === 0}
                title="Submit evaluated papers"
                style={{ padding: '8px 14px' }}
              >
                Submit
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}