import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sampleEvaluators, samplePapers } from '../data/sampleData'
import { getAllPapers, assignEvaluatorToPaper, updatePaperStatus } from '../api/papers'
import { getEvaluators } from '../api/evaluators'

const API_BASE = import.meta.env.VITE_API_URL

export default function AdminPapers() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showPaperDetailsModal, setShowPaperDetailsModal] = useState(false)
  const [selectedPaperForView, setSelectedPaperForView] = useState(null)
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [papers, setPapers] = useState(samplePapers)
  const [evaluators, setEvaluators] = useState(sampleEvaluators)
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  // Evaluator search and filter states
  const [evaluatorSearch, setEvaluatorSearch] = useState('')
  const [evaluatorDepartmentFilter, setEvaluatorDepartmentFilter] = useState('all')
  // Infinite scroll state
  const [displayedCount, setDisplayedCount] = useState(20)
  const tableRef = React.useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Memoize filtered papers early - needed for infinite scroll effect
  const filteredPapers = useMemo(() => {
    return (Array.isArray(papers) ? papers : []).filter(paper => {
      // Filter by status
      if (filterStatus !== 'all' && paper.status !== filterStatus) return false
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const searchFields = [
          paper.paperTitle || paper.name || '',
          paper.email || '',
          paper.department || '',
          paper.paperId || ''
        ]
        return searchFields.some(field => field.toLowerCase().includes(query))
      }
      
      return true
    })
  }, [papers, filterStatus, searchQuery])

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
          // Keep sample data on failure
          setPapers(samplePapers)
        }
        
        console.log('👤 Evaluator data status:', evaluatorData.status)
        if (evaluatorData.status === 'fulfilled') {
          console.log('✅ Evaluators loaded:', evaluatorData.value)
          // Handle both array and object responses
          const evalList = Array.isArray(evaluatorData.value) ? evaluatorData.value : evaluatorData.value?.data || []
          setEvaluators(evalList)
        } else {
          console.log('❌ Evaluators failed:', evaluatorData.reason)
          // Keep sample data on failure
          setEvaluators(sampleEvaluators)
        }
      } catch (e) {
        console.error('Error loading data', e)
        // Keep sample data as fallback
        setPapers(samplePapers)
        setEvaluators(sampleEvaluators)
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

  const openPaperDetailsModal = (paper) => {
    setSelectedPaperForView(paper)
    setShowPaperDetailsModal(true)
  }

  const closePaperDetailsModal = () => {
    setShowPaperDetailsModal(false)
    setSelectedPaperForView(null)
  }

  const downloadPaper = (paper) => {
    // Create a link to download the paper
    const link = document.createElement('a')
    // Use fileName from paper data, or generate one
    const fileName = paper.fileName || `paper_${paper.paperId}.pdf`
    // For now, just trigger a download with sample URL
    // In production, this would be the actual paper file URL from backend
    link.href = `${API_BASE}/api/papers/${paper.paperId}/download` // Adjust URL as needed
    link.download = fileName
    link.click()
  }

  const assignEvaluator = async (evaluatorId) => {
    // assign single paper (from modal)
    if (!selectedPaper) return
    setLoading(true)
    try {
      // Send request to backend
      await assignEvaluatorToPaper(selectedPaper.paperId, evaluatorId)
      
      // Refresh papers list from backend to get actual updated data
      const updatedPapers = await getAllPapers()
      setPapers(updatedPapers)
      
      alert(`Paper assigned successfully!`)
      closeAssignModal()
    } catch (e) {
      console.error('Assignment failed', e)
      alert('Failed to assign evaluator: ' + (e.message || e))
    } finally {
      setLoading(false)
    }
  }

  const openStatusUpdateModal = (paper) => {
    setSelectedPaperForView(paper)
    setNewStatus(paper.status || '')
    setShowStatusUpdateModal(true)
  }

  const closeStatusUpdateModal = () => {
    setShowStatusUpdateModal(false)
    setNewStatus('')
  }

  const handleUpdatePaperStatus = async () => {
    if (!selectedPaperForView || !newStatus.trim()) {
      alert('Please select a status')
      return
    }
    
    setLoading(true)
    try {
      console.log(`📝 Updating paper ${selectedPaperForView.paperId} status to ${newStatus}`)
      const updatedPaper = await updatePaperStatus(selectedPaperForView.paperId, newStatus)
      console.log('✅ Status updated:', updatedPaper)
      
      // Refresh papers list from backend to get actual updated data
      const updatedPapers = await getAllPapers()
      setPapers(updatedPapers)
      
      alert(`✅ Paper status updated to "${newStatus}" successfully!`)
      closeStatusUpdateModal()
      setShowPaperDetailsModal(false)
    } catch (e) {
      console.error('❌ Status update failed', e)
      alert('Failed to update paper status: ' + (e.message || e))
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
    // Show whatever status comes from backend - no mapping
    // Just return styling based on common status types
    const statusLower = status ? status.toLowerCase() : 'unknown'
    
    let color = '#f3f4f6'
    let textColor = '#374151'
    
    // Color code based on keywords in status
    if (statusLower.includes('completed') || statusLower.includes('accepted')) {
      color = '#d1fae5'
      textColor = '#065f46'
    } else if (statusLower.includes('assigned') || statusLower.includes('evaluator')) {
      color = '#dbeafe'
      textColor = '#1e40af'
    } else if (statusLower.includes('pending') || statusLower.includes('rejected')) {
      color = '#fef3c7'
      textColor = '#b45309'
    }
    
    return { text: status || 'Unknown', color, textColor }
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

  // Memoize filtered and searched evaluators
  const filteredEvaluators = useMemo(() => {
    return evaluators.filter(evaluator => {
      // Search filter
      const searchTerm = evaluatorSearch.toLowerCase()
      const matchesSearch = !searchTerm || 
        (evaluator.name && evaluator.name.toLowerCase().includes(searchTerm)) ||
        (evaluator.username && evaluator.username.toLowerCase().includes(searchTerm)) ||
        (evaluator.email && evaluator.email.toLowerCase().includes(searchTerm))
      
      // Department filter
      const matchesDepartment = evaluatorDepartmentFilter === 'all' || 
        evaluator.department === evaluatorDepartmentFilter
      
      return matchesSearch && matchesDepartment
    })
  }, [evaluators, evaluatorSearch, evaluatorDepartmentFilter])

  // Get unique departments for filter dropdown
  const uniqueDepartments = useMemo(() => {
    const depts = new Set()
    evaluators.forEach(ev => {
      if (ev.department) {
        depts.add(ev.department)
      }
    })
    return Array.from(depts).sort()
  }, [evaluators])

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
          <div className="upload-modal assignment-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Assign Evaluator to Paper</h3>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Select an evaluator from the list below</p>
              </div>
              <button className="close-btn" onClick={closeAssignModal} style={{ color: 'white', fontSize: '2rem' }}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              {selectedPaper && (
                <div style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '1.25rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(102, 126, 234, 0.2)', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Paper ID
                      </p>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', color: '#333', fontWeight: '700' }}>#{selectedPaper.paperId || 'N/A'}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        Author Name
                      </p>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', color: '#333', fontWeight: '600' }}>{selectedPaper.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <path d="m22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                        Email
                      </p>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#666' }}>{selectedPaper.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h4 style={{ margin: '0 0 1.25rem 0', color: '#333', fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  Find Evaluator
                </h4>
                
                {/* Search and Filter Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Search name, email..."
                      value={evaluatorSearch}
                      onChange={(e) => setEvaluatorSearch(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.65rem 0.9rem',
                        border: '2px solid #f0f0f0',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        transition: 'all 0.3s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#f0f0f0'}
                    />
                    <button
                      onClick={() => setEvaluatorSearch('')}
                      style={{
                        padding: '0.65rem 1rem',
                        background: '#f0f0f0',
                        border: '2px solid #f0f0f0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#666',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#667eea'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#667eea'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f0f0f0'
                        e.currentTarget.style.color = '#666'
                        e.currentTarget.style.borderColor = '#f0f0f0'
                      }}
                    >
                      ✕ Clear
                    </button>
                  </div>

                  {uniqueDepartments.length > 0 && (
                    <select
                      value={evaluatorDepartmentFilter}
                      onChange={(e) => setEvaluatorDepartmentFilter(e.target.value)}
                      style={{
                        padding: '0.65rem 0.9rem',
                        border: '2px solid #f0f0f0',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        background: 'white',
                        color: '#333',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#f0f0f0'}
                    >
                      <option value="all">All Departments</option>
                      {uniqueDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Results count */}
                <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#667eea', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  <p style={{ margin: 0 }}>
                    Showing <strong>{filteredEvaluators.length}</strong> of <strong>{evaluators.length}</strong> evaluators
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {filteredEvaluators.length > 0 ? (
                    filteredEvaluators.map(evaluator => (
                      <div 
                        key={evaluator.id} 
                        style={{ 
                          border: '1px solid #e8e8e8', 
                          borderRadius: '12px', 
                          padding: '1.25rem', 
                          background: '#fff',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.15)'
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.borderColor = '#667eea'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.borderColor = '#e8e8e8'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div>
                            <h5 style={{ margin: 0, color: '#333', fontSize: '1rem', fontWeight: '700' }}>
                              {evaluator.name || evaluator.username || 'Unknown'}
                            </h5>
                            <p style={{ margin: '0.35rem 0 0 0', color: '#999', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="m22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                              </svg>
                              {evaluator.email || 'N/A'}
                            </p>
                          </div>
                          <div style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white', 
                            borderRadius: '50%', 
                            width: '45px', 
                            height: '45px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                          }}>
                            {(evaluator.name || evaluator.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        </div>

                        <div style={{ marginBottom: '1rem', borderTop: '1px solid #f5f5f5', paddingTop: '1rem' }}>
                          {evaluator.department && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                  <polyline points="9 22 9 12 15 12 15 22"/>
                                </svg>
                                Department
                              </p>
                              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.9rem', color: '#333', fontWeight: '500' }}>{evaluator.department}</p>
                            </div>
                          )}
                          <div style={{ marginBottom: '0.75rem' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                              </svg>
                              Workload
                            </p>
                            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.9rem', color: '#333', fontWeight: '500' }}>
                              <strong>{evaluator.workload || 0}</strong> papers assigned
                            </p>
                          </div>
                          {Array.isArray(evaluator.expertise) && evaluator.expertise.length > 0 && (
                            <div>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                  <circle cx="9" cy="10" r="1"/>
                                  <circle cx="12" cy="10" r="1"/>
                                  <circle cx="15" cy="10" r="1"/>
                                </svg>
                                Expertise
                              </p>
                              <div style={{ margin: '0.5rem 0 0 0', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {evaluator.expertise.slice(0, 3).map((skill, idx) => (
                                  <span 
                                    key={idx}
                                    style={{ 
                                      background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                                      color: '#667eea', 
                                      padding: '0.35rem 0.65rem', 
                                      borderRadius: '16px', 
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      border: '1px solid #667eea30'
                                    }}
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {evaluator.expertise.length > 3 && (
                                  <span style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#999', fontWeight: '600' }}>
                                    +{evaluator.expertise.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => assignEvaluator(evaluator.id)}
                          style={{
                            width: '100%',
                            padding: '0.8rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                            letterSpacing: '0.5px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)'
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                          }}
                        >
                          SELECT EVALUATOR
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', borderRadius: '12px', border: '2px dashed #667eea' }}>
                      <p style={{ color: '#667eea', margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                        {evaluators.length === 0 
                          ? 'No evaluators available. Please create evaluators first.'
                          : 'No evaluators match your search or filter criteria.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paper Details Modal - Compact & Professional */}
      {showPaperDetailsModal && selectedPaperForView && (
        <div className="upload-modal-overlay" onClick={closePaperDetailsModal}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '85vw', maxHeight: '90vh', overflowY: 'auto', width: '100%', borderRadius: '16px' }}>
            
            {/* Header - Compact */}
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '1.2rem 1.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px 16px 0 0', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Paper #{selectedPaperForView.paperId}</h2>
              </div>
              <button className="close-btn" onClick={closePaperDetailsModal} style={{ color: 'white', fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.8 }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>&times;</button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              
              {/* Section 1: Author Information - Horizontal Layout */}
              <div style={{ marginBottom: '1.8rem' }}>
                <h3 style={{ fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.85rem', color: '#667eea' }}>
                  👤 Author Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#f9fafb', padding: '1.2rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Name</label>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#1f2937', fontWeight: '600' }}>{selectedPaperForView.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Email</label>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563', wordBreak: 'break-word' }}>{selectedPaperForView.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Contact</label>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#1f2937', fontWeight: '500' }}>{selectedPaperForView.contactNo || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>College</label>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#1f2937', fontWeight: '500' }}>{selectedPaperForView.collegeName || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Department</label>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#1f2937', fontWeight: '500' }}>{selectedPaperForView.department || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Submitted At</label>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563' }}>{selectedPaperForView.submittedAt ? new Date(selectedPaperForView.submittedAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Paper Information */}
              <div style={{ marginBottom: '1.8rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#667eea', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📄 Paper Information
                </h3>
                {selectedPaperForView.paperTitle && (
                  <div style={{ marginBottom: '0.8rem', background: '#f9fafb', padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <label style={{ fontSize: '0.65rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Title</label>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#1f2937', fontWeight: '600', lineHeight: '1.5' }}>{selectedPaperForView.paperTitle}</p>
                  </div>
                )}
                {selectedPaperForView.paperAbstract && (
                  <div style={{ background: '#f0f4ff', padding: '1rem', borderRadius: '10px', border: '1px solid #e0e7ff', borderLeft: '3px solid #667eea' }}>
                    <label style={{ fontSize: '0.65rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Abstract</label>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151', lineHeight: '1.6', maxHeight: '120px', overflowY: 'auto' }}>{selectedPaperForView.paperAbstract}</p>
                  </div>
                )}
              </div>

              {/* Section 3: File & Status Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.8rem' }}>
                {/* File Info */}
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#667eea', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🗂️ File Details
                  </h3>
                  <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <div style={{ marginBottom: '0.8rem' }}>
                      <label style={{ fontSize: '0.65rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.3rem', opacity: 0.8 }}>File Name</label>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563', wordBreak: 'break-word' }}>{selectedPaperForView.paperFileName || selectedPaperForView.fileName || 'N/A'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.3rem', opacity: 0.8 }}>Paper ID</label>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#1f2937', fontWeight: '600' }}>#{selectedPaperForView.paperId}</p>
                    </div>
                  </div>
                </div>

                {/* Status Info */}
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#667eea', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⏱️ Status & Assignment
                  </h3>
                  <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <div style={{ marginBottom: '0.8rem' }}>
                      <label style={{ fontSize: '0.65rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem', opacity: 0.8 }}>Current Status</label>
                      {(() => {
                        const statusInfo = getStatusBadge(selectedPaperForView.status)
                        return (
                          <span style={{ display: 'inline-block', padding: '0.35rem 0.75rem', borderRadius: '16px', fontSize: '0.75rem', fontWeight: '700', background: statusInfo.color, color: statusInfo.textColor }}>
                            {statusInfo.text}
                          </span>
                        )
                      })()}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.3rem', opacity: 0.8 }}>Evaluator</label>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: selectedPaperForView.evaluatorName ? '#1f2937' : '#f5576c', fontWeight: '600' }}>{selectedPaperForView.evaluatorName || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
                <button
                  onClick={() => downloadPaper(selectedPaperForView)}
                  style={{
                    padding: '0.7rem 1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.2)'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => openStatusUpdateModal(selectedPaperForView)}
                  style={{
                    padding: '0.7rem 1.5rem',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.2)'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14m7-7H5"/>
                  </svg>
                  Update Status
                </button>
                <button
                  onClick={closePaperDetailsModal}
                  style={{
                    padding: '0.7rem 1.5rem',
                    background: '#ffffff',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#667eea'
                    e.currentTarget.style.color = '#ffffff'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff'
                    e.currentTarget.style.color = '#667eea'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusUpdateModal && selectedPaperForView && (
        <div className="upload-modal-overlay" onClick={closeStatusUpdateModal}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', borderRadius: '16px' }}>
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px 16px 0 0' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>Update Paper Status</h2>
              <button className="close-btn" onClick={closeStatusUpdateModal} style={{ color: 'white', fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.8 }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>&times;</button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.8rem' }}>Paper ID: #{selectedPaperForView.paperId}</label>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{selectedPaperForView.name}</p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.8rem' }}>Current Status</label>
                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#1f2937', fontWeight: '600' }}>{selectedPaperForView.status || 'N/A'}</p>
                </div>

                <label style={{ fontSize: '0.75rem', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.8rem' }}>New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <option value="">-- Select a status --</option>
                  <option value="PENDING_ASSIGNMENT">Pending Assignment</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeStatusUpdateModal}
                  style={{
                    padding: '0.7rem 1.5rem',
                    background: '#f0f0f0',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#667eea'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f0f0f0'
                    e.currentTarget.style.color = '#667eea'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePaperStatus}
                  disabled={loading}
                  style={{
                    padding: '0.7rem 1.5rem',
                    background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {loading ? 'Updating...' : 'Update Status'}
                </button>
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

          {/* Loading Screen */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '2rem' }}>
              {/* Animated Spinner */}
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
                <p style={{ margin: 0, color: '#718096', fontSize: '0.95rem' }}>Fetching paper data from the server...</p>
              </div>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {/* Stats Overview - Compact - Show only when not loading */}
          {!loading && (
          <div className="evaluators-stats-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
            <div className="stat-item" style={{ padding: '1rem', background: 'white', borderRadius: '8px', textAlign: 'center', color: '#667eea', boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)', borderLeft: '4px solid #667eea' }}>
              <span className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', display: 'block', color: '#667eea' }}>{stats.total}</span>
              <span className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem', display: 'block', color: '#666' }}>Total</span>
            </div>
            <div className="stat-item" style={{ padding: '1rem', background: 'white', borderRadius: '8px', textAlign: 'center', color: '#f5576c', boxShadow: '0 2px 8px rgba(245, 87, 108, 0.15)', borderLeft: '4px solid #f5576c' }}>
              <span className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', display: 'block', color: '#f5576c' }}>{stats.pending}</span>
              <span className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem', display: 'block', color: '#666' }}>Pending</span>
            </div>
            <div className="stat-item" style={{ padding: '1rem', background: 'white', borderRadius: '8px', textAlign: 'center', color: '#00f2fe', boxShadow: '0 2px 8px rgba(79, 172, 254, 0.15)', borderLeft: '4px solid #4facfe' }}>
              <span className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', display: 'block', color: '#4facfe' }}>{stats.underEvaluation}</span>
              <span className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem', display: 'block', color: '#666' }}>Evaluating</span>
            </div>
            <div className="stat-item" style={{ padding: '1rem', background: 'white', borderRadius: '8px', textAlign: 'center', color: '#43e97b', boxShadow: '0 2px 8px rgba(67, 233, 123, 0.15)', borderLeft: '4px solid #43e97b' }}>
              <span className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 'bold', display: 'block', color: '#43e97b' }}>{stats.completed}</span>
              <span className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem', display: 'block', color: '#666' }}>Completed</span>
            </div>
          </div>
          )}

          {/* Papers Table with Infinite Scroll - Show only when not loading */}
          {!loading && (
          <section className="table-section-professional" ref={tableRef}>
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
                  placeholder="Search by title, email, department, ID..."
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

              {/* Status Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#666' }}>Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
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
                  <option value="all">All Papers</option>
                  <option value="PENDING_ASSIGNMENT">Pending Assignment</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

            </div>

            {/* Scroll Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
              <span>Showing {visiblePapers.length} of {filteredPapers.length} papers</span>
              {displayedCount < filteredPapers.length && <span>Scroll down to load more...</span>}
            </div>

            {visiblePapers.length > 0 ? (
              <div className="table-wrapper-professional" style={{ overflowX: 'auto' }}>
                <table className="evaluator-table-professional papers-table-professional" style={{ minWidth: '1100px', width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f7fa', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: '700', fontSize: '0.85rem', color: '#2d3748', letterSpacing: '0.05em', textTransform: 'uppercase' }}>ID</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: '700', fontSize: '0.85rem', color: '#2d3748', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Title</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: '700', fontSize: '0.85rem', color: '#2d3748', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: '700', fontSize: '0.85rem', color: '#2d3748', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Dept</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: '700', fontSize: '0.85rem', color: '#2d3748', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Submitted</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: '700', fontSize: '0.85rem', color: '#2d3748', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Evaluator</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: '700', fontSize: '0.85rem', color: '#2d3748', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: '700', fontSize: '0.85rem', color: '#2d3748', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePapers.map(paper => {
                      if (!paper) return null
                      const statusInfo = getStatusBadge(paper.status || 'pending_assignment')
                      const keywords = Array.isArray(paper.keywords) ? paper.keywords : []
                      return (
                        <tr key={paper.paperId || Math.random()} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}>
                          <td data-label="ID" style={{ padding: '0.65rem 0.75rem', fontSize: '0.9rem', color: '#2d3748', fontWeight: '600' }}>#{paper.paperId || 'N/A'}</td>
                          <td data-label="Title" style={{ padding: '0.65rem 0.75rem', fontSize: '0.9rem', color: '#2d3748', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={paper.name || 'N/A'}>
                            {paper.name || 'N/A'}
                          </td>
                          <td data-label="Author" style={{ padding: '0.65rem 0.75rem', fontSize: '0.9rem', color: '#2d3748', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={paper.email || 'N/A'}>{paper.email || 'N/A'}</td>
                          <td data-label="Dept" style={{ padding: '0.65rem 0.75rem', fontSize: '0.9rem', color: '#2d3748', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={paper.department || 'N/A'}>{paper.department || 'N/A'}</td>
                          <td data-label="Submitted" style={{ padding: '0.65rem 0.75rem', fontSize: '0.9rem', color: '#2d3748' }}>
                            {paper.submittedAt ? new Date(paper.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                          </td>
                          <td data-label="Evaluator" style={{ padding: '0.65rem 0.75rem', fontSize: '0.9rem', color: '#2d3748' }}>
                            {paper.evaluatorName ? (
                              <span style={{ fontWeight: '500', color: '#667eea' }}>{paper.evaluatorName}</span>
                            ) : (
                              <span style={{ color: '#ef5350', fontWeight: '500' }}>Not assigned</span>
                            )}
                          </td>
                          <td data-label="Status" style={{ padding: '0.65rem 0.75rem', fontSize: '0.9rem' }}>
                            {(() => {
                              const statusInfo = getStatusBadge(paper.status)
                              return (
                                <span style={{ display: 'inline-block', padding: '0.35rem 0.75rem', borderRadius: '16px', fontSize: '0.75rem', fontWeight: '700', background: statusInfo.color, color: statusInfo.textColor }}>
                                  {statusInfo.text}
                                </span>
                              )
                            })()}
                          </td>
                          <td data-label="Action" style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button 
                                onClick={() => assignUsingSelectedEvaluator(paper)}
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.05)'
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)'
                                  e.currentTarget.style.boxShadow = 'none'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="12 4 12 20"></polyline>
                                  <polyline points="4 12 12 12 20 12"></polyline>
                                </svg>
                                Assign
                              </button>
                              <button 
                                onClick={() => openPaperDetailsModal(paper)}
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  background: '#f0f0f0',
                                  color: '#667eea',
                                  border: '2px solid #667eea',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#667eea'
                                  e.currentTarget.style.color = 'white'
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#f0f0f0'
                                  e.currentTarget.style.color = '#667eea'
                                  e.currentTarget.style.boxShadow = 'none'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
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
            ) : papers.length > 0 && filteredPapers.length === 0 ? (
              <div className="empty-state">
                <p>No papers found matching your filters.</p>
              </div>
            ) : papers.length === 0 ? (
              <div className="empty-state">
                <p>Loading papers...</p>
              </div>
            ) : null}

            {/* Infinite scroll sentinel */}
            {visiblePapers.length < filteredPapers.length && (
              <div data-sentinel style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                {loading ? 'Loading more...' : 'Scroll to load more papers'}
              </div>
            )}
          </section>
          )}
        </div>
      </main>
    </div>
  )
}