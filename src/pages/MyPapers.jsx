import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as paperApi from '../api/papers'
import '../index.css'


export default function MyPapers() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [expandedPapers, setExpandedPapers] = useState({})
  const [myPapers, setMyPapers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Fetch papers from backend
  useEffect(() => {
    fetchMyPapers()
  }, [user?.email])

  const fetchMyPapers = async () => {
    if (!user?.email) {
      setError('User email not found')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError('')
      console.log('📥 Fetching papers for email:', user.email)
      const papers = await paperApi.getPapersByEmail(user.email)
      console.log('✅ Received papers:', papers)
      setMyPapers(papers || [])
    } catch (err) {
      console.error('❌ Error fetching papers:', err)
      setError('Failed to load papers: ' + err.message)
      setMyPapers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (paperId, fileName, paper) => {
    try {
      console.log('📥 Attempting to download paper ID:', paperId)
      console.log('📥 Paper data:', paper)
      
      // Check if paper has a direct file URL (Azure Blob URL)
      if (paper?.paperFileUrl) {
        const fileUrl = paper.paperFileUrl
        console.log('✅ Using direct file URL:', fileUrl)
        
        // Open in new tab or trigger download
        const a = document.createElement('a')
        a.href = fileUrl
        a.download = fileName || paper.paperFileName || 'paper.pdf'
        a.target = '_blank' // Open in new tab if download doesn't work
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        console.log('✅ Download initiated from URL')
        return
      }
      
      // Fallback: Try backend download endpoint
      console.log('📥 No direct URL found, trying backend endpoint...')
      const { blob, filename } = await paperApi.downloadPaper(paperId)
      
      console.log('✅ Received blob:', { 
        size: blob.size, 
        type: blob.type 
      })
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || fileName || 'paper.pdf'
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      
      console.log('✅ Paper download initiated:', filename)
    } catch (err) {
      console.error('❌ Error downloading paper:', err)
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack
      })
      alert('Failed to download paper: ' + err.message)
    }
  }

  const handleDelete = async (paperId) => {
    if (!window.confirm('Are you sure you want to delete this paper?')) {
      return
    }

    try {
      await paperApi.deletePaper(paperId)
      alert('Paper deleted successfully')
      fetchMyPapers() // Refresh list
    } catch (err) {
      console.error('❌ Error deleting paper:', err)
      alert('Failed to delete paper: ' + err.message)
    }
  }

  const [activeFilter, setActiveFilter] = useState('all')

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleExpandPaper = (paperId) => {
    setExpandedPapers(prev => ({
      ...prev,
      [paperId]: !prev[paperId]
    }))
  }

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || 'pending_assignment'
    const badges = {
      pending_assignment: { class: 'status-warning', text: 'Pending Assignment' },
      under_evaluation: { class: 'status-info', text: 'Under Evaluation' },
      completed: { class: 'status-success', text: 'Completed' },
      published: { class: 'status-published', text: 'Published' },
      rejected: { class: 'status-rejected', text: 'Rejected' },
      assigned: { class: 'status-info', text: 'Assigned' },
      in_progress: { class: 'status-info', text: 'In Progress' },
      submitted: { class: 'status-warning', text: 'Submitted' },
      approved: { class: 'status-success', text: 'Approved' },
      returned: { class: 'status-warning', text: 'Returned' }
    }
    
    // If status exists in badges, return the mapped value
    if (badges[statusLower]) {
      return badges[statusLower]
    }
    
    // Otherwise, format the status text dynamically from the received status
    const formattedText = status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    
    return { class: 'status-custom', text: formattedText }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const statusCounts = myPapers.reduce((acc, paper) => {
    const status = paper.status || 'pending_assignment'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const completedPapers = myPapers.filter(
    paper => paper.status === 'completed' && typeof paper.evaluationScore === 'number'
  )

  const averageScore = completedPapers.length
    ? Math.round(
        completedPapers.reduce((total, paper) => total + paper.evaluationScore, 0) /
          completedPapers.length
      )
    : null

  const latestSubmissionDate = myPapers.reduce((latest, paper) => {
    const submittedDate = paper.submittedAt || paper.submittedDate
    if (!submittedDate) return latest
    if (!latest) return submittedDate
    return new Date(submittedDate) > new Date(latest)
      ? submittedDate
      : latest
  }, null)

  const statusFilters = [
    { value: 'all', label: 'All Papers', count: myPapers.length },
    { value: 'pending_assignment', label: 'Pending Assignment', count: statusCounts['pending_assignment'] || 0 },
    { value: 'completed', label: 'Completed', count: statusCounts['completed'] || 0 },
  ]

  const filteredPapers = activeFilter === 'all'
    ? myPapers
    : myPapers.filter(paper => (paper.status || 'pending_assignment') === activeFilter)

  const hasFilteredResults = filteredPapers.length > 0

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
        <div className="dashboard-content my-papers-content">
          <header className="page-header-compact">
            <div className="page-header-text">
              <h1 className="page-title-professional">My Submitted Papers</h1>
              <p className="page-subtitle-compact">View and track the status of your submitted research papers</p>
            </div>
            <Link to="/upload-paper" className="btn-submit-compact">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Submit New Paper
            </Link>
          </header>

          {error && <div className="error-message">{error}</div>}

          {/* Papers List */}
          <section className="my-papers-section">
            {isLoading ? (
              <div className="loading-screen">
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Loading your papers...</p>
                </div>
              </div>
            ) : myPapers.length === 0 ? (
              <div className="no-papers">
                <h3>No Papers Submitted Yet</h3>
                <p>You haven't submitted any papers yet. Click the button above to submit your first paper!</p>
                <Link to="/upload-paper" className="btn btn-primary">
                  Submit Your First Paper
                </Link>
              </div>
            ) : (
              <>

                <div className="status-filter-bar">
                  {statusFilters.map(filter => (
                    <button
                      key={filter.value}
                      type="button"
                      className={`filter-pill ${activeFilter === filter.value ? 'active' : ''}`}
                      onClick={() => setActiveFilter(filter.value)}
                    >
                      <span>{filter.label}</span>
                      <strong>{filter.count}</strong>
                    </button>
                  ))}
                </div>

                {!hasFilteredResults ? (
                  <div className="no-papers filtered-state">
                    <h3>No papers in this view</h3>
                    <p>Try selecting a different status to see additional submissions.</p>
                  </div>
                ) : (
                  <div className="papers-list">
                    {filteredPapers.map(paper => {
                      const statusInfo = getStatusBadge(paper.status || 'pending_assignment')
                      return (
                        <div
                          key={paper.id}
                          className={`my-paper-card ${expandedPapers[paper.id] ? 'expanded' : ''}`}
                        >
                          <div className="paper-card-header" onClick={() => toggleExpandPaper(paper.id)}>
                            <div className="paper-header-left">
                              <h3>{paper.paperTitle || paper.title}</h3>
                              <div className="paper-header-meta">
                                <span>#{paper.id.toString().padStart(3, '0')}</span>
                                <span>Submitted {formatDate(paper.submittedAt || paper.submittedDate)}</span>
                              </div>
                            </div>
                            <div className="header-right">
                              <button
                                className="btn-view-paper"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownload(paper.id, paper.paperFileName, paper)
                                }}
                                title="Download Paper"
                              >
                                Download
                              </button>
                              <span className={`status-badge ${statusInfo.class}`}>
                                {statusInfo.text}
                              </span>
                              <span className={`expand-icon ${expandedPapers[paper.id] ? 'expanded' : ''}`}>
                                ▶
                              </span>
                            </div>
                          </div>

                          {expandedPapers[paper.id] && (
                            <div className="paper-card-body-expanded">
                              <div className="paper-meta-info-expanded">
                                <div className="meta-block">
                                  <span className="meta-label">Paper ID</span>
                                  <span className="meta-value">#{paper.id.toString().padStart(3, '0')}</span>
                                </div>
                                <div className="meta-block">
                                  <span className="meta-label">Submitted</span>
                                  <span className="meta-value">{formatDate(paper.submittedAt || paper.submittedDate)}</span>
                                </div>
                                <div className="meta-block">
                                  <span className="meta-label">Current Status</span>
                                  <span className="meta-value">{statusInfo.text}</span>
                                </div>
                                <div className="meta-block">
                                  <span className="meta-label">Phone Number</span>
                                  <span className="meta-value">{paper.contactNo || paper.phoneNumber}</span>
                                </div>
                              </div>

                              <div className="paper-info-grid">
                                <div className="info-item">
                                  <span className="info-label">Author</span>
                                  <span className="info-value">{paper.name || paper.author}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Department</span>
                                  <span className="info-value">{paper.department}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">College</span>
                                  <span className="info-value">{paper.collegeName || paper.college}</span>
                                </div>
                              </div>

                              <div className="paper-abstract">
                                <span className="info-label">Abstract</span>
                                <p>{paper.paperAbstract || paper.abstract}</p>
                              </div>

                              <div className="paper-file-info">
                                <span className="info-label">File:</span>
                                <span className="info-value">{paper.paperFileName}</span>
                              </div>

                              {paper.status === 'completed' && (
                                <div className="evaluation-results">
                                  <h4>Evaluation Results</h4>
                                  <div className="evaluation-score">
                                    <span className="score-label">Score</span>
                                    <span className="score-value">{paper.evaluationScore}/100</span>
                                  </div>
                                  {paper.evaluatorFeedback && (
                                    <div className="evaluator-feedback">
                                      <span className="feedback-label">Evaluator Feedback</span>
                                      <p>{paper.evaluatorFeedback}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="paper-card-actions">
                                <button 
                                  className="btn-icon" 
                                  title="Download PDF"
                                  onClick={() => handleDownload(paper.id, paper.paperFileName, paper)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                  </svg>
                                  Download
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
    </div>
  )
}