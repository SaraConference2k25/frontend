import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { samplePapers } from '../data/sampleData'
import * as papersApi from '../api/papers'
import '../index.css'

export default function EvaluatePapers() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [evaluationData, setEvaluationData] = useState({
    status: '',
    feedback: '',
    score: ''
  })
  const [allPapers, setAllPapers] = useState([])
  const [displayedPapers, setDisplayedPapers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const PAPERS_PER_PAGE = 10
  const pageRef = useRef(0)
  const observerTarget = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Fetch papers from backend on mount
  useEffect(() => {
    fetchAssignedPapers()
  }, [user])

  const fetchAssignedPapers = async () => {
    try {
      setIsLoading(true)
      console.log('📥 Fetching papers for evaluator:', user?.username)
      
      const allPapersData = await papersApi.getAllPapers()
      console.log('📊 All papers from backend:', allPapersData)
      
      // Normalize papers - add missing fields
      const normalizedPapers = Array.isArray(allPapersData) ? allPapersData.map((p, index) => ({
        id: p.id || index + 1,
        title: p.paperTitle || 'Untitled',
        author: p.name || 'Unknown Author',
        department: p.department || 'Not Specified',
        submittedDate: p.submittedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        abstract: p.paperAbstract || p.abstract || 'No abstract provided',
        college: p.collegeName || 'Not Specified',
        status: p.status || 'pending',
        evaluatorName: p.evaluatorName || p.assignedEvaluator,
        evaluatorId: p.evaluatorId,
        ...p
      })) : []
      
      // Filter papers assigned to this evaluator
      const assignedPapers = normalizedPapers.filter(paper => 
        paper.evaluatorName === user?.username ||
        paper.evaluatorId === user?.id ||
        paper.evaluatorName === user?.email ||
        paper.assignedEvaluator === user?.username ||
        (paper.evaluatorName && user?.username && 
          paper.evaluatorName.toLowerCase().includes(user.username.toLowerCase())) ||
        (user?.username && paper.evaluatorName && 
          user.username.toLowerCase().includes(paper.evaluatorName.toLowerCase()))
      )
      
      console.log('📋 Papers assigned to', user?.username + ':', assignedPapers)
      setAllPapers(assignedPapers)
      pageRef.current = 0
      loadMorePapers(assignedPapers, 0)
    } catch (err) {
      console.error('❌ Error loading papers:', err)
      // Fallback to sample data
      const filtered = samplePapers.filter(paper => 
        paper.assignedEvaluator === user?.username || 
        (user?.username === 'evaluator1' && [1, 2, 3, 4, 5, 6].includes(paper.id)) ||
        (user?.username === 'evaluator2' && [7, 8, 9, 10].includes(paper.id)) ||
        (user?.username === 'evaluator3' && [11, 12].includes(paper.id))
      )
      setAllPapers(filtered)
      pageRef.current = 0
      loadMorePapers(filtered, 0)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMorePapers = useCallback((papers, page) => {
    const filteredPapers = papers.filter(paper => {
      const matchesStatus = filterStatus === 'all' || paper.status === filterStatus
      const matchesSearch = searchTerm === '' || 
        paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.author.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesStatus && matchesSearch
    })

    const start = page * PAPERS_PER_PAGE
    const end = start + PAPERS_PER_PAGE
    const newPapers = filteredPapers.slice(start, end)
    
    setDisplayedPapers(prev => [...prev, ...newPapers])
    setHasMore(end < filteredPapers.length)
  }, [filterStatus, searchTerm])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          setIsLoadingMore(true)
          pageRef.current += 1
          setTimeout(() => {
            loadMorePapers(allPapers, pageRef.current)
            setIsLoadingMore(false)
          }, 500)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore, isLoadingMore, isLoading, allPapers, loadMorePapers])

  // Reset pagination when filters change
  useEffect(() => {
    pageRef.current = 0
    setDisplayedPapers([])
    loadMorePapers(allPapers, 0)
  }, [filterStatus, searchTerm, allPapers, loadMorePapers])

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

    // Update displayed papers
    setDisplayedPapers(prev => 
      prev.map(paper => 
        paper.id === selectedPaper.id 
          ? { 
              ...paper, 
              status: evaluationData.status,
              feedback: evaluationData.feedback,
              score: evaluationData.score,
              evaluatedBy: user?.name || user?.username,
              evaluatedDate: new Date().toISOString().split('T')[0]
            }
          : paper
      )
    )

    // Also update in allPapers
    setAllPapers(prev =>
      prev.map(paper =>
        paper.id === selectedPaper.id
          ? {
              ...paper,
              status: evaluationData.status,
              feedback: evaluationData.feedback,
              score: evaluationData.score,
              evaluatedBy: user?.name || user?.username,
              evaluatedDate: new Date().toISOString().split('T')[0]
            }
          : paper
      )
    )

    alert(`Paper ${evaluationData.status} successfully!`)
    closeEvaluationModal()
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#F59E0B',
      approved: '#10B981',
      rejected: '#EF4444'
    }
    return colors[status] || '#F59E0B'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected'
    }
    return labels[status] || 'Pending Review'
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
        <h2>Evaluate Papers</h2>
        <div className="header-actions">
          <span>Welcome, {user?.username}</span>
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

      {/* Evaluation Modal - Premium Modern Design */}
      {showEvaluationModal && selectedPaper && (
        <div className="modal-overlay-premium" onClick={closeEvaluationModal}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            {/* Gradient Header */}
            <div className="premium-modal-header">
              <div className="header-gradient"></div>
              <button className="premium-close-btn" onClick={closeEvaluationModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <div className="header-content">
                <h2>Evaluate Paper</h2>
                <p className="paper-title-modal">{selectedPaper.title}</p>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="premium-modal-body">
              {/* Paper Information Card */}
              <div className="paper-info-card">
                <div className="info-grid">
                  <div className="info-box">
                    <span className="info-icon">👤</span>
                    <div>
                      <p className="info-label">Author</p>
                      <p className="info-content">{selectedPaper.author}</p>
                    </div>
                  </div>
                  <div className="info-box">
                    <span className="info-icon">🏢</span>
                    <div>
                      <p className="info-label">Department</p>
                      <p className="info-content">{selectedPaper.department}</p>
                    </div>
                  </div>
                  <div className="info-box">
                    <span className="info-icon">🎓</span>
                    <div>
                      <p className="info-label">College</p>
                      <p className="info-content">{selectedPaper.college}</p>
                    </div>
                  </div>
                </div>

                <div className="abstract-box">
                  <p className="abstract-label">📄 Abstract</p>
                  <p className="abstract-content">{selectedPaper.abstract}</p>
                </div>
              </div>

              {/* Evaluation Form */}
              <form onSubmit={handleEvaluationSubmit} className="premium-form">
                {/* Decision Section with 3 Options */}
                <div className="form-section">
                  <label className="section-label">Your Evaluation Decision *</label>
                  <p className="section-description">Choose the appropriate evaluation status</p>
                  
                  <div className="decision-grid-three">
                    {/* Accept with Minor Changes */}
                    <button
                      type="button"
                      className={`decision-option minor ${evaluationData.status === 'minor_changes' ? 'active' : ''}`}
                      onClick={() => setEvaluationData(prev => ({ ...prev, status: 'minor_changes' }))}
                    >
                      <div className="decision-icon">✓</div>
                      <div className="decision-text">
                        <div className="decision-title">Minor Changes</div>
                        <div className="decision-desc">Accept with minor revisions</div>
                      </div>
                      {evaluationData.status === 'minor_changes' && <div className="check-mark">✓</div>}
                    </button>

                    {/* Accept with Major Changes */}
                    <button
                      type="button"
                      className={`decision-option major ${evaluationData.status === 'major_changes' ? 'active' : ''}`}
                      onClick={() => setEvaluationData(prev => ({ ...prev, status: 'major_changes' }))}
                    >
                      <div className="decision-icon">⚠</div>
                      <div className="decision-text">
                        <div className="decision-title">Major Changes</div>
                        <div className="decision-desc">Accept with major revisions</div>
                      </div>
                      {evaluationData.status === 'major_changes' && <div className="check-mark">✓</div>}
                    </button>

                    {/* Reject */}
                    <button
                      type="button"
                      className={`decision-option reject ${evaluationData.status === 'rejected' ? 'active' : ''}`}
                      onClick={() => setEvaluationData(prev => ({ ...prev, status: 'rejected' }))}
                    >
                      <div className="decision-icon">✕</div>
                      <div className="decision-text">
                        <div className="decision-title">Reject</div>
                        <div className="decision-desc">Decline paper submission</div>
                      </div>
                      {evaluationData.status === 'rejected' && <div className="check-mark">✓</div>}
                    </button>
                  </div>
                </div>

                {/* Score Section */}
                <div className="form-section">
                  <label htmlFor="score" className="section-label">Score (Optional)</label>
                  <div className="score-container">
                    <input
                      type="number"
                      id="score"
                      name="score"
                      min="0"
                      max="100"
                      value={evaluationData.score}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="score-input-premium"
                    />
                    <span className="score-unit">/100</span>
                  </div>
                </div>

                {/* Feedback Section */}
                <div className="form-section">
                  <label htmlFor="feedback" className="section-label">Feedback & Comments *</label>
                  <p className="section-description">Provide constructive feedback for the author</p>
                  <div className="feedback-wrapper">
                    <textarea
                      id="feedback"
                      name="feedback"
                      value={evaluationData.feedback}
                      onChange={handleInputChange}
                      rows="6"
                      placeholder="Share your detailed feedback and suggestions..."
                      className="feedback-textarea-premium"
                      required
                    ></textarea>
                    <div className="char-counter">{evaluationData.feedback.length} / 2000</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="form-actions-premium">
                  <button type="button" onClick={closeEvaluationModal} className="btn-secondary-premium">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary-premium" 
                    disabled={!evaluationData.status || !evaluationData.feedback}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
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
        <div className="evaluation-page">
          {/* Header Section */}
          <div className="evaluation-header">
            <div className="header-content">
              <h1>📋 Paper Evaluation</h1>
              <p>Review and provide constructive feedback on assigned papers</p>
            </div>
            <div className="header-stats">
              <div className="stat-card">
                <div className="stat-number">{displayedPapers.filter(p => p.status === 'pending').length}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{displayedPapers.filter(p => p.status !== 'pending').length}</div>
                <div className="stat-label">Evaluated</div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="search-filter-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search papers by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-box">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Papers</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading papers...</p>
            </div>
          ) : displayedPapers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h2>No Papers Found</h2>
              <p>
                {searchTerm ? 'Try adjusting your search terms' : 'No papers assigned to you yet'}
              </p>
            </div>
          ) : (
            <>
              {/* Papers Grid with Infinite Scroll */}
              <div className="papers-container">
                {displayedPapers.map((paper, index) => (
                  <div key={`${paper.id}-${index}`} className="paper-card-modern">
                    {/* Status Indicator */}
                    <div className="status-indicator" style={{ backgroundColor: getStatusColor(paper.status) }}></div>

                    {/* Card Header */}
                    <div className="card-header-modern">
                      <div className="title-section">
                        <h3 className="paper-title">{paper.title}</h3>
                        <span className="status-badge-modern" style={{ backgroundColor: getStatusColor(paper.status), color: 'white' }}>
                          {getStatusLabel(paper.status)}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-body-modern">
                      <div className="paper-meta">
                        <div className="meta-item">
                          <span className="meta-icon">👤</span>
                          <div>
                            <p className="meta-label">Author</p>
                            <p className="meta-value">{paper.author}</p>
                          </div>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">🏢</span>
                          <div>
                            <p className="meta-label">Department</p>
                            <p className="meta-value">{paper.department}</p>
                          </div>
                        </div>
                      </div>

                      <div className="paper-meta">
                        <div className="meta-item">
                          <span className="meta-icon">🎓</span>
                          <div>
                            <p className="meta-label">College</p>
                            <p className="meta-value">{paper.college}</p>
                          </div>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">📅</span>
                          <div>
                            <p className="meta-label">Submitted</p>
                            <p className="meta-value">{paper.submittedDate}</p>
                          </div>
                        </div>
                      </div>

                      <div className="abstract-section">
                        <p className="abstract-label">Abstract</p>
                        <p className="abstract-text">{paper.abstract.substring(0, 200)}...</p>
                      </div>

                      {paper.feedback && (
                        <div className="feedback-section">
                          <p className="feedback-label">Your Feedback</p>
                          <p className="feedback-text">{paper.feedback.substring(0, 150)}...</p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="card-footer-modern">
                      {paper.status === 'pending' ? (
                        <button 
                          onClick={() => openEvaluationModal(paper)}
                          className="btn-evaluate"
                        >
                          ✏️ Evaluate
                        </button>
                      ) : (
                        <button 
                          onClick={() => openEvaluationModal(paper)}
                          className="btn-evaluate-secondary"
                        >
                          👁️ View Evaluation
                        </button>
                      )}
                      <button className="btn-download">
                        ⬇️ Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Infinite Scroll Trigger */}
              <div ref={observerTarget} className="scroll-trigger">
                {isLoadingMore && (
                  <div className="loading-more">
                    <div className="spinner-small"></div>
                    <p>Loading more papers...</p>
                  </div>
                )}
              </div>

              {!hasMore && displayedPapers.length > 0 && (
                <div className="end-message">
                  <p>✓ You've reached the end of the list</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modern CSS Styles */}
      <style>{`
        .evaluation-page {
          padding: 2rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }

        .evaluation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 2rem;
        }

        .header-content h1 {
          font-size: 2.5rem;
          color: var(--primary-color);
          margin: 0 0 0.5rem 0;
          font-weight: 700;
        }

        .header-content p {
          color: var(--text-light);
          font-size: 1rem;
          margin: 0;
        }

        .header-stats {
          display: flex;
          gap: 1rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem 2rem;
          border-radius: var(--border-radius-sm);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          text-align: center;
          min-width: 120px;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary-color);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-light);
          margin-top: 0.5rem;
        }

        .search-filter-section {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 250px;
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1.25rem;
          border: 2px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          font-size: 0.95rem;
          transition: var(--transition);
          background: white;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .filter-box {
          min-width: 180px;
        }

        .filter-select {
          width: 100%;
          padding: 0.875rem 1.25rem;
          border: 2px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          font-size: 0.95rem;
          background: white;
          cursor: pointer;
          transition: var(--transition);
        }

        .filter-select:hover {
          border-color: var(--primary-color);
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .papers-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
          .papers-container {
            grid-template-columns: 1fr;
          }
        }

        .paper-card-modern {
          background: white;
          border-radius: var(--border-radius);
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          transition: var(--transition);
          display: flex;
          flex-direction: column;
          border-left: 5px solid var(--primary-color);
        }

        .paper-card-modern:hover {
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
          transform: translateY(-4px);
        }

        .status-indicator {
          height: 4px;
          width: 100%;
        }

        .card-header-modern {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .title-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .paper-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-color);
          margin: 0;
          line-height: 1.4;
          flex: 1;
        }

        .status-badge-modern {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .card-body-modern {
          padding: 1.5rem;
          flex: 1;
        }

        .paper-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .meta-item {
          display: flex;
          gap: 0.75rem;
        }

        .meta-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .meta-label {
          font-size: 0.75rem;
          color: var(--text-light);
          text-transform: uppercase;
          font-weight: 600;
          margin: 0;
        }

        .meta-value {
          font-size: 0.95rem;
          color: var(--text-color);
          margin: 0.25rem 0 0 0;
          font-weight: 500;
          word-break: break-word;
        }

        .abstract-section {
          margin: 1.5rem 0;
          padding: 1rem;
          background: var(--light-gray);
          border-radius: var(--border-radius-sm);
        }

        .abstract-label {
          font-size: 0.75rem;
          color: var(--text-light);
          text-transform: uppercase;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .abstract-text {
          font-size: 0.9rem;
          color: var(--text-color);
          margin: 0;
          line-height: 1.5;
        }

        .feedback-section {
          margin: 1rem 0;
          padding: 1rem;
          background: #f0f7ff;
          border-radius: var(--border-radius-sm);
          border-left: 3px solid var(--primary-color);
        }

        .feedback-label {
          font-size: 0.75rem;
          color: var(--primary-color);
          text-transform: uppercase;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .feedback-text {
          font-size: 0.9rem;
          color: var(--text-color);
          margin: 0;
          line-height: 1.5;
        }

        .card-footer-modern {
          padding: 1.5rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          gap: 1rem;
        }

        .btn-evaluate, .btn-evaluate-secondary, .btn-download {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: var(--border-radius-sm);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .btn-evaluate {
          background: var(--primary-color);
          color: white;
        }

        .btn-evaluate:hover {
          background: var(--primary-color-hover);
          transform: scale(1.02);
        }

        .btn-evaluate-secondary {
          background: var(--light-gray);
          color: var(--text-color);
        }

        .btn-evaluate-secondary:hover {
          background: var(--border-color);
        }

        .btn-download {
          background: white;
          color: var(--primary-color);
          border: 2px solid var(--primary-color);
        }

        .btn-download:hover {
          background: var(--light-gray);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          gap: 1rem;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid var(--border-color);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: var(--border-radius);
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-state h2 {
          color: var(--text-color);
          margin: 0 0 0.5rem 0;
        }

        .empty-state p {
          color: var(--text-light);
          margin: 0;
        }

        .scroll-trigger {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-more {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-light);
        }

        .spinner-small {
          width: 30px;
          height: 30px;
          border: 3px solid var(--border-color);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .end-message {
          text-align: center;
          padding: 2rem;
          color: var(--success-color);
          font-weight: 600;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modern-modal {
          background: white;
          border-radius: var(--border-radius);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--box-shadow-lg);
        }

        .modal-header-modern {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 2rem;
          border-bottom: 1px solid var(--border-color);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .modal-header-modern h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .modal-subtitle {
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          font-size: 0.95rem;
          word-break: break-word;
        }

        .modal-close {
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
          padding: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }

        .modal-close:hover {
          transform: rotate(90deg);
        }

        .modal-content-modern {
          padding: 2rem;
        }

        .paper-info-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: var(--light-gray);
          border-radius: var(--border-radius-sm);
        }

        .info-item {
          margin-bottom: 1.25rem;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        /* Premium Modal Styles */
        .modal-overlay-premium {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeInOverlay 0.3s ease-out;
        }

        @keyframes fadeInOverlay {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .premium-modal {
          background: white;
          border-radius: 24px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUpModal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        @keyframes slideUpModal {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .premium-modal-header {
          position: relative;
          padding: 2rem;
          color: white;
          overflow: hidden;
        }

        .header-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          z-index: 1;
        }

        .premium-modal-header > * {
          position: relative;
          z-index: 2;
        }

        .premium-close-btn {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 3;
        }

        .premium-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .header-content {
          margin: 0;
        }

        .premium-modal-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 0.75rem 0;
          letter-spacing: -0.5px;
        }

        .paper-title-modal {
          font-size: 1rem;
          margin: 0;
          opacity: 0.95;
          line-height: 1.5;
          word-break: break-word;
        }

        .premium-modal-body {
          padding: 2.5rem;
        }

        /* Paper Info Card */
        .paper-info-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2.5rem;
          border: 1px solid rgba(102, 126, 234, 0.1);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 600px) {
          .info-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        .info-box {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .info-icon {
          font-size: 1.75rem;
          flex-shrink: 0;
          line-height: 1;
        }

        .info-box p {
          margin: 0;
        }

        .info-label {
          font-size: 0.75rem;
          color: #667eea;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }

        .info-content {
          font-size: 0.95rem;
          color: #2d3748;
          font-weight: 600;
          word-break: break-word;
        }

        .abstract-box {
          padding-top: 1.5rem;
          border-top: 1px solid rgba(102, 126, 234, 0.15);
        }

        .abstract-label {
          font-size: 0.85rem;
          color: #667eea;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 0.75rem 0;
        }

        .abstract-content {
          font-size: 0.95rem;
          color: #2d3748;
          line-height: 1.6;
          margin: 0;
          max-height: 120px;
          overflow-y: auto;
        }

        /* Form Styles */
        .premium-form {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .section-label {
          font-size: 1rem;
          font-weight: 700;
          color: #2d3748;
          letter-spacing: -0.3px;
          margin: 0;
        }

        .section-description {
          font-size: 0.9rem;
          color: #718096;
          margin: 0;
        }

        /* Decision Grid - 3 Options */
        .decision-grid-three {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        @media (max-width: 600px) {
          .decision-grid-three {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
        }

        .decision-option {
          position: relative;
          padding: 1.5rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          background: white;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.75rem;
        }

        .decision-option:hover {
          border-color: #cbd5e0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        /* Minor Changes - Green */
        .decision-option.minor {
          color: #48bb78;
        }

        .decision-option.minor.active {
          background: linear-gradient(135deg, #f0fdf4 0%, #dbeafe 100%);
          border-color: #48bb78;
          box-shadow: 0 0 20px rgba(72, 187, 120, 0.3);
        }

        /* Major Changes - Orange/Yellow */
        .decision-option.major {
          color: #ed8936;
        }

        .decision-option.major.active {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border-color: #ed8936;
          box-shadow: 0 0 20px rgba(237, 137, 54, 0.3);
        }

        /* Reject - Red */
        .decision-option.reject {
          color: #f56565;
        }

        .decision-option.reject.active {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border-color: #f56565;
          box-shadow: 0 0 20px rgba(245, 101, 101, 0.3);
        }

        .decision-icon {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
        }

        .decision-text {
          flex: 1;
        }

        .decision-title {
          font-size: 0.95rem;
          font-weight: 700;
          margin: 0;
        }

        .decision-desc {
          font-size: 0.8rem;
          color: #718096;
          margin-top: 0.25rem;
        }

        .check-mark {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 24px;
          height: 24px;
          background: currentColor;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }

        /* Score Input */
        .score-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .score-input-premium {
          flex: 1;
          padding: 0.875rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          background: white;
        }

        .score-input-premium:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .score-unit {
          font-size: 0.95rem;
          color: #718096;
          font-weight: 600;
        }

        /* Feedback Textarea */
        .feedback-wrapper {
          position: relative;
        }

        .feedback-textarea-premium {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-family: inherit;
          font-size: 0.95rem;
          color: #2d3748;
          resize: none;
          transition: all 0.3s ease;
          background: white;
          line-height: 1.6;
        }

        .feedback-textarea-premium:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .feedback-textarea-premium::placeholder {
          color: #cbd5e0;
        }

        .char-counter {
          margin-top: 0.75rem;
          font-size: 0.8rem;
          color: #a0aec0;
          text-align: right;
        }

        /* Form Actions */
        .form-actions-premium {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
        }

        @media (max-width: 600px) {
          .form-actions-premium {
            grid-template-columns: 1fr;
          }
        }

        .btn-secondary-premium, .btn-primary-premium {
          padding: 0.95rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          letter-spacing: -0.3px;
        }

        .btn-secondary-premium {
          background: #f7fafc;
          color: #2d3748;
          border: 2px solid #e2e8f0;
        }

        .btn-secondary-premium:hover:not(:disabled) {
          background: #edf2f7;
          border-color: #cbd5e0;
          transform: translateY(-2px);
        }

        .btn-primary-premium {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-primary-premium:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
        }

        .btn-primary-premium:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary-premium:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-secondary-premium svg, .btn-primary-premium svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .premium-modal {
            border-radius: 16px;
            max-height: 95vh;
          }

          .premium-modal-body {
            padding: 1.5rem;
          }

          .paper-info-card {
            padding: 1.5rem;
          }

          .info-grid {
            gap: 1rem;
          }

          .premium-modal-header {
            padding: 1.5rem;
          }

          .premium-modal-header h2 {
            font-size: 1.5rem;
          }

          .paper-title-modal {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  )
}