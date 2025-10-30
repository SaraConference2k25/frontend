const API_BASE = import.meta.env.VITE_API_BASE || ''

/**
 * Helper function to handle API responses
 */
async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText || 'Request failed')
  }
  
  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return await res.json()
  }
  return await res.blob() // For file downloads
}

/**
 * Submit a new paper
 * Expects FormData with: name, email, contactNo, department, collegeName, paperTitle, paperAbstract, paperFile
 */
export async function submitPaper(formData) {
  console.log('📤 Submitting paper to backend...')
  
  const res = await fetch(`${API_BASE}/api/papers/submit`, {
    method: 'POST',
    body: formData // Don't set Content-Type header, let browser set it with boundary
  })
  
  const data = await handleResponse(res)
  console.log('✅ Paper submitted successfully:', data)
  return data
}

/**
 * Get all papers
 */
export async function getAllPapers() {
  const res = await fetch(`${API_BASE}/api/papers/all`)
  return await handleResponse(res)
}

/**
 * Get paper by ID
 */
export async function getPaperById(id) {
  const res = await fetch(`${API_BASE}/api/papers/${id}`)
  return await handleResponse(res)
}

/**
 * Download paper file
 */
export async function downloadPaper(id) {
  console.log('🌐 API: Downloading paper with ID:', id)
  console.log('🌐 API: Download URL:', `${API_BASE}/api/papers/download/${id}`)
  
  const res = await fetch(`${API_BASE}/api/papers/download/${id}`)
  
  console.log('🌐 API: Response status:', res.status, res.statusText)
  console.log('🌐 API: Response headers:', {
    contentType: res.headers.get('content-type'),
    contentDisposition: res.headers.get('content-disposition')
  })
  
  if (!res.ok) {
    // Try to get error message from response
    const contentType = res.headers.get('content-type')
    let errorMessage = 'Failed to download paper'
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (e) {
        // If JSON parsing fails, try text
        errorMessage = await res.text()
      }
    } else {
      errorMessage = await res.text()
    }
    
    console.error('❌ API: Download failed:', errorMessage)
    throw new Error(errorMessage || res.statusText)
  }
  
  // Get blob from response
  const blob = await res.blob()
  
  // Get filename from Content-Disposition header
  const contentDisposition = res.headers.get('Content-Disposition')
  let filename = 'paper.pdf'
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '')
    }
  }
  
  console.log('✅ API: Downloaded blob:', { size: blob.size, type: blob.type, filename })
  
  return { blob, filename }
}

/**
 * Search papers by title
 */
export async function searchPapers(query) {
  const res = await fetch(`${API_BASE}/api/papers/search?query=${encodeURIComponent(query)}`)
  return await handleResponse(res)
}

/**
 * Get papers by department
 */
export async function getPapersByDepartment(department) {
  const res = await fetch(`${API_BASE}/api/papers/department/${encodeURIComponent(department)}`)
  return await handleResponse(res)
}

/**
 * Get papers by email
 */
export async function getPapersByEmail(email) {
  const res = await fetch(`${API_BASE}/api/papers/email/${encodeURIComponent(email)}`)
  return await handleResponse(res)
}

/**
 * Delete paper
 */
export async function deletePaper(id) {
  const res = await fetch(`${API_BASE}/api/papers/${id}`, {
    method: 'DELETE'
  })
  return await handleResponse(res)
}

export default {
  submitPaper,
  getAllPapers,
  getPaperById,
  downloadPaper,
  searchPapers,
  getPapersByDepartment,
  getPapersByEmail,
  deletePaper
}
