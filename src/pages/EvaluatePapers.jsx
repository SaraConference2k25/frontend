import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPapersByEvaluator, updatePaperStatus, evaluatePaper, saveReviewComments } from '../api/papers'
import { samplePapers } from '../data/sampleData'

export default function EvaluatePapers() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [expandedPapers, setExpandedPapers] = useState({})
  const [paperDecisions, setPaperDecisions] = useState({})
  const [paperFeedback, setPaperFeedback] = useState({})
  const [savedComments, setSavedComments] = useState({})
  const [initialComments, setInitialComments] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [submittedPapers, setSubmittedPapers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date-newest')

  const [evaluationData, setEvaluationData] = useState({
    status: '',
    feedback: '',
    score: ''
  })

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Load papers assigned to this evaluator from backend
  useEffect(() => {
    if (!user?.username) {
      console.log('No username, using sample data')
      setSubmittedPapers(samplePapers)
      setIsLoading(false)
      return
    }

    const loadPapers = async () => {
      try {
        console.log('Fetching papers for evaluator:', user.username)
        const papers = await getPapersByEvaluator(user.username)
        console.log('Papers loaded from backend:', papers)
        setSubmittedPapers(Array.isArray(papers) ? papers : [])
        
        // Load saved comments and decisions from papers
        const feedbackState = {}
        const commentsState = {}
        const decisionsState = {}
        const initialCommentsState = {}
        
        papers.forEach(paper => {
          const paperId = paper.paperId || paper.id
          
          // Load existing evaluator comments
          if (paper.evaluatorComments) {
            // Store initial comments separately to prevent override
            initialCommentsState[paperId] = paper.evaluatorComments
            feedbackState[paperId] = paper.evaluatorComments
            commentsState[paperId] = paper.updatedAt ? new Date(paper.updatedAt).toLocaleString() : new Date().toLocaleString()
          }
          
          // Load saved decision from toggleStatus field
          if (paper.toggleStatus) {
            // Normalize toggleStatus to match radio button values
            let normalizedDecision = String(paper.toggleStatus).toLowerCase().trim()
            
            // Map various formats to radio button values
            if (normalizedDecision === 'accept_minor' || normalizedDecision === 'acceptminor') {
              normalizedDecision = 'accept-minor'
            } else if (normalizedDecision === 'accept_major' || normalizedDecision === 'acceptmajor') {
              normalizedDecision = 'accept-major'
            } else if (normalizedDecision === 'rejected' || normalizedDecision === 'reject') {
              normalizedDecision = 'reject'
            }
            
            console.log(`📝 Loaded decision for ${paperId}: ${paper.toggleStatus} -> ${normalizedDecision}`)
            decisionsState[paperId] = normalizedDecision
            
            // Also mark as saved if not already marked
            if (!commentsState[paperId]) {
              commentsState[paperId] = paper.updatedAt ? new Date(paper.updatedAt).toLocaleString() : new Date().toLocaleString()
            }
          }
        })
        
        console.log('📋 Loaded decisions:', decisionsState)
        setPaperFeedback(feedbackState)
        setSavedComments(commentsState)
        setPaperDecisions(decisionsState)
        setInitialComments(initialCommentsState)
      } catch (error) {
        console.error('Failed to load papers:', error)
        // Fallback to sample data
        setSubmittedPapers(samplePapers)
      } finally {
        setIsLoading(false)
      }
    }

    loadPapers()
  }, [user?.username])

  // Helper to normalize paper fields from backend
  const normalizePaper = (paper) => ({
    ...paper,
    id: paper.paperId || paper.id,
    title: paper.paperTitle || paper.title,
    abstract: paper.paperAbstract || paper.abstract,
    author: paper.name || paper.author,
    fileName: paper.paperFileName || paper.fileName,
    fileUrl: paper.paperFileUrl || paper.fileUrl,
    department: paper.department || paper.department
  })

  // Normalize all papers
  const normalizedPapers = submittedPapers.map(normalizePaper)

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

  // Helper: get the file URL for a paper
  const getPaperUrl = (paper) => {
    if (!paper) return ''
    // Use the fileUrl from backend first, then fall back to fileName
    if (paper.fileUrl) return paper.fileUrl
    if (paper.paperFileUrl) return paper.paperFileUrl
    if (paper.fileName) return `/papers/${paper.fileName}`
    return ''
  }

  // Open paper in Google Docs Viewer
  const viewPaper = (paper) => {
    const url = getPaperUrl(paper)
    if (!url) {
      alert('Paper file not available')
      return
    }
    // Use Google's online PDF viewer
    const googleViewerUrl = `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(url)}`
    window.open(googleViewerUrl, '_blank', 'noopener')
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

  const handleSaveComments = async (paperId) => {
    const comments = paperFeedback[paperId] || ''
    const decision = paperDecisions[paperId]

    if (!comments.trim()) {
      alert('Please enter comments before saving')
      return
    }

    if (!decision) {
      alert('Please select an evaluation decision before saving')
      return
    }

    try {
      console.log(`📝 Saving review for paper ${paperId}: decision=${decision}, comments=${comments}`)
      // Call backend API to save review comments with decision as toggleStatus
      await saveReviewComments(paperId, comments, decision)
      
      // Update submittedPapers with the saved comment
      setSubmittedPapers(prev => (
        prev.map(p => (p.paperId || p.id) === paperId ? { ...p, feedback: comments, evaluatorComments: comments, commentsSavedAt: new Date().toISOString() } : p)
      ))

      // Mark saved in local UI state with current timestamp
      setSavedComments(prev => ({ ...prev, [paperId]: new Date().toLocaleString() }))
      
      console.log('✅ Review saved successfully')
      alert('Review saved successfully!')
    } catch (error) {
      console.error('Error saving comments:', error)
      alert('Error saving review: ' + error.message)
    }
  }

  const handleSubmitPaperEvaluation = async (paper) => {
    try {
      const paperId = paper.paperId || paper.id
      const decision = paperDecisions[paperId]
      const feedback = paperFeedback[paperId]

      if (!decision || !feedback || feedback.trim().length === 0) {
        alert('Please select a decision and provide comments before submitting.')
        return
      }

      // Map frontend decision to backend status
      const statusMap = {
        'accept-minor': 'ACCEPTED',
        'accept-major': 'ACCEPTED',
        'reject': 'REJECTED'
      }
      const backendStatus = statusMap[decision] || decision

      // Prepare evaluation data
      const evaluation = {
        paperId: paperId,
        status: backendStatus,
        evaluatorComments: feedback,
        evaluator: {
          userId: user.id || user.userId,
          username: user.username
        }
      }

      console.log('📤 Submitting paper evaluation:', evaluation)

      // Call backend to submit evaluation
      const response = await evaluatePaper(evaluation)
      console.log('✅ Evaluation submitted:', response)

      // Update local state
      setSubmittedPapers(prev =>
        prev.map(p => {
          const isSelected = (p.paperId || p.id) === paperId
          return isSelected
            ? {
                ...p,
                status: backendStatus,
                feedback: feedback,
                evaluatedBy: user.name || user.username,
                evaluatedDate: new Date().toISOString().split('T')[0]
              }
            : p
        })
      )

      // Clear decision and feedback for this paper
      setPaperDecisions(prev => {
        const updated = { ...prev }
        delete updated[paperId]
        return updated
      })
      setPaperFeedback(prev => {
        const updated = { ...prev }
        delete updated[paperId]
        return updated
      })

      alert('Paper evaluation submitted successfully!')
      toggleExpandPaper(paperId) // Collapse the paper after submission
    } catch (error) {
      console.error('❌ Error submitting evaluation:', error)
      alert('Failed to submit evaluation. Please try again.')
    }
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
    setSelectedPaper(normalizePaper(paper))
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

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault()
    
    if (!evaluationData.status || !evaluationData.feedback) {
      alert('Please provide both status and feedback')
      return
    }

    try {
      // Map frontend status to backend status
      const statusMap = {
        'approved': 'ACCEPTED',
        'rejected': 'REJECTED'
      }
      const backendStatus = statusMap[evaluationData.status] || evaluationData.status
      
      // Get paper ID (handle both paperId and id fields)
      const paperId = selectedPaper.paperId || selectedPaper.id
      
      // Prepare evaluation data for backend
      const evaluation = {
        paperId: paperId,
        status: backendStatus,
        evaluatorComments: evaluationData.feedback,
        evaluator: {
          userId: user.id || user.userId,
          username: user.username
        }
      }
      
      console.log('Submitting evaluation for paper:', paperId, 'Data:', evaluation)
      
      // Call backend to submit evaluation
      const response = await evaluatePaper(evaluation)
      console.log('Evaluation response:', response)

      // Update local state
      setSubmittedPapers(prev => 
        prev.map(paper => {
          const isSelected = (paper.paperId || paper.id) === paperId
          return isSelected
            ? { 
                ...paper, 
                status: backendStatus,
                feedback: evaluationData.feedback,
                score: evaluationData.score,
                evaluatedBy: user.name || user.username,
                evaluatedDate: new Date().toISOString().split('T')[0]
              }
            : paper
        })
      )

      alert(`Paper ${evaluationData.status} successfully!`)
      closeEvaluationModal()
    } catch (error) {
      console.error('Error submitting evaluation:', error)
      alert('Failed to submit evaluation. Please try again.')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'status-pending',
      approved: 'status-approved', 
      rejected: 'status-rejected'
    }
    return badges[status] || 'status-pending'
  }

  const pendingPapers = normalizedPapers.filter(paper => {
    const status = (paper.status || '').toUpperCase()
    // Show papers that are pending assignment or under review
    return status === 'PENDING_ASSIGNMENT' || status === 'UNDER_REVIEW'
  })
  const evaluatedPapers = normalizedPapers.filter(paper => {
    const status = (paper.status || '').toUpperCase()
    // Show papers that are completed (ACCEPTED or REJECTED)
    return status === 'ACCEPTED' || status === 'REJECTED'
  })
  
  // Combine pending and evaluated papers for display (since UI only shows evaluatedPapers)
  const allDisplayPapers = [...pendingPapers, ...evaluatedPapers]

  // Apply search and sort filters
  const applyFilters = (papers) => {
    // Search filter
    let filtered = papers.filter(paper => {
      const query = searchQuery.toLowerCase()
      return !query || 
        (paper.title && paper.title.toLowerCase().includes(query)) ||
        (paper.author && paper.author.toLowerCase().includes(query)) ||
        (paper.department && paper.department.toLowerCase().includes(query))
    })

    // Sort
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'date-newest':
          return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
        case 'date-oldest':
          return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0)
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '')
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '')
        case 'author-asc':
          return (a.author || '').localeCompare(b.author || '')
        case 'author-desc':
          return (b.author || '').localeCompare(a.author || '')
        default:
          return 0
      }
    })

    return filtered
  }

  const filteredPendingPapers = applyFilters(pendingPapers)
  const filteredEvaluatedPapers = applyFilters(evaluatedPapers)
  const filteredDisplayPapers = applyFilters(allDisplayPapers)

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
          <button onClick={handleLogout} className="btn-logout-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>Logout</span>
          </button>
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

          {isLoading ? (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(4px)', zIndex: 9999 }}>
              <div style={{ textAlign: 'center' }}>
                {/* Spinner */}
                <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 2rem' }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', animation: 'spin 1s linear infinite', transformOrigin: 'center' }}>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#667eea" strokeWidth="8" strokeDasharray="70 220" strokeDashoffset="0" />
                  </svg>
                  <style>
                    {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
                  </style>
                </div>
                <h2 style={{ color: '#333', fontSize: '1.3rem', fontWeight: '700', margin: '0 0 0.5rem 0', letterSpacing: '-0.5px' }}>
                  Loading...
                </h2>
              </div>
            </div>
          ) : submittedPapers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>No papers assigned to you yet.</p>
            </div>
          ) : (
            <>
            
            {/* Search and Filter Bar */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center', padding: '1.5rem', backgroundColor: '#fafbfc', borderRadius: '8px' }}>
              {/* Search Box */}
              <div style={{ flex: '1', minWidth: '300px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '12px', color: '#999', pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search by title, author, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '12px',
                    padding: '0.65rem 12px 0.65rem 40px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Sort Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#666' }}>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.65rem 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <option value="date-newest">Newest First</option>
                  <option value="date-oldest">Oldest First</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                  <option value="author-asc">Author (A-Z)</option>
                  <option value="author-desc">Author (Z-A)</option>
                </select>
              </div>
            </div>
          
          {/* Pending Papers removed per request */}

          {/* Evaluated Papers Section */}
          <section className="papers-section">
            <h2>Recently Evaluated ({filteredDisplayPapers.length})</h2>
            <div className="papers-grid">
              {filteredDisplayPapers.map(paper => (
                <div 
                  key={paper.id} 
                  className={`paper-card evaluated ${expandedPapers[paper.id] ? 'expanded' : ''}`}
                >
                  <div className="paper-header">
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ flex: 1 }}>
                        <h3 onClick={() => toggleExpandPaper(paper.id)} style={{ margin: 0, marginBottom: '0.5rem' }}>{paper.title}</h3>
                        <div style={{ fontSize: '0.8rem', color: '#999', display: 'flex', gap: '2rem' }}>
                          <span>ID: <strong style={{ color: '#333' }}>{paper.id}</strong></span>
                          <span>Author: <strong style={{ color: '#333' }}>{paper.author}</strong></span>
                        </div>
                      </div>
                    </div>
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
                      <span className="expand-icon" onClick={() => toggleExpandPaper(paper.id)} style={{ display: 'inline-block', width: '1.8rem', height: '1.8rem', textAlign: 'center', lineHeight: '1.8rem', flexShrink: 0 }}>
                        {expandedPapers[paper.id] ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                  {expandedPapers[paper.id] && (
                    <div className="paper-expanded-content" onClick={(e) => e.stopPropagation()}>
                      {/* Paper Details Section */}
                      <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', borderLeft: '4px solid #667eea' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#2d3748', fontSize: '1.2rem', fontFamily: 'Roboto, sans-serif', fontWeight: '600', textAlign: 'left' }}>Paper Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', fontSize: '0.3rem', fontFamily: 'Roboto, sans-serif' }}>
                          <div style={{ textAlign: 'left' }}>
                            <p style={{ margin: '0.2rem 0', fontSize: '1.1rem',color: '#666', fontFamily: 'Roboto, sans-serif' }}><strong>Paper ID:</strong> {paper.id}</p>
                            <p style={{ margin: '0.2rem 0', fontSize: '1.1rem', color: '#666', fontFamily: 'Roboto, sans-serif' }}><strong>Title:</strong> {paper.title}</p>
                            <p style={{ margin: '0.2rem 0', fontSize: '1.1rem', color: '#666', fontFamily: 'Roboto, sans-serif' }}><strong>Author:</strong> {paper.author}</p>
                            <p style={{ margin: '0.2rem 0', fontSize: '1.1rem', color: '#666', fontFamily: 'Roboto, sans-serif' }}><strong>Email:</strong> {paper.email}</p>
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <p style={{ margin: '0.2rem 0', fontSize: '1.1rem',color: '#666', fontFamily: 'Roboto, sans-serif' }}><strong>Contact No:</strong> {paper.contactNo || 'N/A'}</p>
                            <p style={{ margin: '0.2rem 0', fontSize: '1.1rem',color: '#666', fontFamily: 'Roboto, sans-serif' }}><strong>Department:</strong> {paper.department}</p>
                            <p style={{ margin: '0.2rem 0', fontSize: '1.1rem',color: '#666', fontFamily: 'Roboto, sans-serif' }}><strong>College:</strong> {paper.collegeName || 'N/A'}</p>
                            <p style={{ margin: '0.2rem 0', fontSize: '1.1rem',color: '#666', fontFamily: 'Roboto, sans-serif' }}><strong>Submitted:</strong> {paper.submittedAt ? new Date(paper.submittedAt).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #e2e8f0' }}>
                          <p style={{ margin: '0.2rem 0', color: '#666', fontSize: '1.2rem', fontFamily: 'Roboto, sans-serif', fontWeight: '600', textAlign: 'left' }}><strong>Abstract:</strong></p>
                          <p style={{ margin: '0.2rem 0', color: '#555', lineHeight: '1.5', fontStyle: 'italic', fontSize: '1.1rem', fontFamily: 'Roboto, sans-serif', textAlign: 'left' }}>{paper.abstract}</p>
                        </div>
                      </div>

                      <div className="evaluation-section">
                        <div className="feedback-section">
                          <h4>Comments</h4>
                          <textarea
                            className="feedback-textarea"
                            placeholder="Select a decision first to provide comments..."
                            disabled={!paperDecisions[paper.id]}
                            value={paperFeedback.hasOwnProperty(paper.id) ? paperFeedback[paper.id] : (initialComments[paper.id] || '')}
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

                        {/* Submit button for individual paper */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleSubmitPaperEvaluation(paper)}
                            disabled={!paperDecisions[paper.id] || !(paperFeedback[paper.id] && paperFeedback[paper.id].trim().length > 0)}
                            title="Submit this paper's evaluation"
                            style={{ padding: '8px 24px', fontSize: '0.95rem', minWidth: 120 }}
                          >
                            Submit
                          </button>
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
            </>
          )}
        </div>
      </main>
    </div>
  )
}