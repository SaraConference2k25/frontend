import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sampleEvaluators, samplePapers } from '../data/sampleData'
import { getAllPapers, assignEvaluatorToPaper } from '../api/papers'
import { getEvaluators } from '../api/evaluators'

export default function AdminPapers() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [papers, setPapers] = useState(samplePapers)
  const [evaluators, setEvaluators] = useState(sampleEvaluators)
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  // Infinite scroll state
  const [displayedCount, setDisplayedCount] = useState(20)
  const tableRef = React.useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Memoize filtered papers early - needed for infinite scroll effect
  const filteredPapers = useMemo(() => {
    return (Array.isArray(papers) ? papers : []).filter(paper => {
      if (filterStatus === 'all') return true
      return paper.status === filterStatus
    })
  }, [papers, filterStatus])

  useEffect(() => {
    // load papers and evaluators from backend if available
    async function load() {
      setLoading(true)
      try {
        console.log('🔍 Loading papers and evaluators from backend...')
        const paperPromise = getAllPapers()
        const evaluatorPromise = getEvaluators()
        
        const [paperData, evaluatorData] = await Promise.allSettled([paperPromise, evaluatorPromise])
        
        console.log('📄 Paper data status:', paperData.status)
        if (paperData.status === 'fulfilled') {
          console.log('✅ Papers loaded:', paperData.value)
          setPapers(paperData.value)
        } else {
          console.log('❌ Papers failed:', paperData.reason)
        }
        
        console.log('👤 Evaluator data status:', evaluatorData.status)
        if (evaluatorData.status === 'fulfilled') {
          console.log('✅ Evaluators loaded:', evaluatorData.value)
          setEvaluators(evaluatorData.value)
        } else {
          console.log('❌ Evaluators failed:', evaluatorData.reason)
        }
      } catch (e) {
        console.error('Error loading data', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && displayedCount < filteredPapers.length && !loading) {
        setDisplayedCount(prev => Math.min(prev + 20, filteredPapers.length))
      }
    }, { threshold: 0.1 })

    const sentinel = tableRef.current?.querySelector('[data-sentinel]')
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => {
      if (sentinel) observer.unobserve(sentinel)
    }
  }, [displayedCount, filteredPapers.length, loading])

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

  const assignEvaluator = async (evaluatorId) => {
    // assign single paper (from modal)
    if (!selectedPaper) return
    setLoading(true)
    try {
      await assignEvaluatorToPaper(selectedPaper.id, evaluatorId)
      // update local state
      const evaluator = evaluators.find(e => e.id === evaluatorId) || { name: 'Evaluator' }
      setPapers(prev => prev.map(paper => paper.id === selectedPaper.id ? ({
        ...paper,
        status: 'under_evaluation',
        evaluatorId,
        evaluatorName: evaluator.name,
        assignedDate: new Date().toISOString().split('T')[0]
      }) : paper))
      alert(`Paper assigned to ${evaluator.name} successfully!`)
      closeAssignModal()
    } catch (e) {
      console.error('Assignment failed', e)
      alert('Failed to assign evaluator: ' + (e.message || e))
    } finally {
      setLoading(false)
    }
  }

  // Assign using modal for per-paper selection
  const assignUsingSelectedEvaluator = async (paper) => {
    if (!paper) return
    openAssignModal(paper)
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
    const keywords = Array.isArray(paperKeywords) ? paperKeywords : []
    return evaluators
      .map(evaluator => {
        const expertise = Array.isArray(evaluator.expertise) ? evaluator.expertise : []
        const matchCount = expertise.filter(skill => 
          keywords.some(keyword => 
            skill.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(skill.toLowerCase())
          )
        ).length
        return { ...evaluator, matchScore: matchCount }
      })
      .sort((a, b) => b.matchScore - a.matchScore || (a.workload || 0) - (b.workload || 0))
  }

  // Memoize visible papers for infinite scroll
  const visiblePapers = useMemo(() => {
    return filteredPapers.slice(0, displayedCount)
  }, [filteredPapers, displayedCount])

  // Memoize stats to avoid recalculation
  const stats = useMemo(() => ({
    total: papers.length,
    pending: papers.filter(p => p.status === 'pending_assignment').length,
    underEvaluation: papers.filter(p => p.status === 'under_evaluation').length,
    completed: papers.filter(p => p.status === 'completed').length
  }), [papers])

  return (
    <div id="dashboard">
      <style>{`
        /* Responsive improvements for AdminPapers */
        @media (max-width: 1200px) {
          .page-header-content {
            flex-direction: column;
            gap: 1rem;
          }
          .filter-controls-modern {
            flex-wrap: wrap;
          }
        }
        
        @media (max-width: 768px) {
          .page-title-section h1 {
            font-size: 1.8rem;
          }
          .page-title-section p {
            font-size: 0.9rem;
          }
          .filter-controls-modern {
            flex-direction: column;
            gap: 0.75rem;
          }
          .filter-controls-modern label {
            width: 100%;
          }
          .filter-controls-modern select {
            width: 100%;
          }
          .filter-controls-modern > div {
            flex-direction: column;
            width: 100%;
            margin-left: 0 !important;
          }
          .filter-controls-modern > div select,
          .filter-controls-modern > div button {
            width: 100%;
          }
          .evaluators-stats-bar {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }
          .stat-item {
            padding: 1rem 0.75rem;
          }
          .stat-label {
            font-size: 0.75rem;
          }
          .stat-value {
            font-size: 1.5rem;
          }
          table.papers-table-professional {
            font-size: 0.85rem;
          }
          .table-wrapper-professional {
            border-radius: 8px;
            overflow-x: auto;
          }
          .action-btn {
            padding: 0.4rem 0.6rem;
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 600px) {
          #dashboard .dashboard-header h2 {
            font-size: 1.3rem;
          }
          .page-title-section h1 {
            font-size: 1.4rem;
          }
          .evaluators-stats-bar {
            grid-template-columns: 1fr;
          }
          table.papers-table-professional {
            font-size: 0.75rem;
            min-width: 100% !important;
          }
          .evaluator-table-professional thead {
            display: none;
          }
          .evaluator-table-professional tbody,
          .evaluator-table-professional tr,
          .evaluator-table-professional td {
            display: block;
            width: 100%;
          }
          .evaluator-table-professional tr {
            margin-bottom: 1rem;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 1rem;
          }
          .evaluator-table-professional td {
            text-align: right;
            padding: 0.5rem 0;
            border: none;
          }
          .evaluator-table-professional td:before {
            content: attr(data-label);
            float: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.7rem;
            color: #666;
          }
          .evaluator-table-professional td:first-child {
            display: flex;
            justify-content: flex-start;
            padding: 0 0 0.5rem 0;
          }
          .evaluator-table-professional input[type="checkbox"] {
            margin-right: 0.5rem;
          }
          .actions-cell {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .action-btn {
            padding: 0.3rem 0.5rem;
            font-size: 0.7rem;
          }
        }
      `}</style>
      {/* Top Header */}
      <header className="dashboard-header">
        <button className={`sidebar-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h2>Manage Papers {loading && '(Loading...)'}</h2>
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
          <div className="upload-modal assignment-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
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
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pending Assignment</span>
              <span className="stat-value">{stats.pending}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Under Evaluation</span>
              <span className="stat-value">{stats.underEvaluation}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{stats.completed}</span>
            </div>
          </div>

          {/* Papers Table with Infinite Scroll */}
          <section className="table-section-professional" ref={tableRef}>
            {/* Scroll Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
              <span>Showing {visiblePapers.length} of {filteredPapers.length} papers</span>
              {displayedCount < filteredPapers.length && <span>Scroll down to load more...</span>}
            </div>

            {visiblePapers.length > 0 ? (
              <div className="table-wrapper-professional" style={{ overflowX: 'auto' }}>
                <table className="evaluator-table-professional papers-table-professional" style={{ minWidth: '1200px' }}>
                  <thead>
                    <tr>
                      <th>Paper ID</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Department</th>
                      <th>Submitted</th>
                      <th>Evaluator</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePapers.map(paper => {
                      if (!paper) return null
                      const statusInfo = getStatusBadge(paper.status || 'pending_assignment')
                      const keywords = Array.isArray(paper.keywords) ? paper.keywords : []
                      return (
                        <tr key={paper.id || Math.random()}>
                          <td data-label="Paper ID">#{paper.id || 'N/A'}</td>
                          <td data-label="Title" className="paper-title-cell">
                            <div className="paper-title-content">
                              {paper.title || 'Untitled'}
                            </div>
                          </td>
                          <td data-label="Author">{paper.author || 'N/A'}</td>
                          <td data-label="Department">{paper.department || 'N/A'}</td>
                          <td data-label="Submitted">{paper.submittedDate || 'N/A'}</td>
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
                            <span className={`status-badge-modern status-${paper.status || 'pending'}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td data-label="Actions" className="actions-cell">
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button 
                                onClick={() => assignUsingSelectedEvaluator(paper)}
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

            {/* Infinite scroll sentinel */}
            {visiblePapers.length < filteredPapers.length && (
              <div data-sentinel style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                {loading ? 'Loading more...' : 'Scroll to load more papers'}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}