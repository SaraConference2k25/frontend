const API_BASE = import.meta.env.VITE_API_URL || 'http://98.70.26.80:8069'

console.log('👤 Evaluators API Base URL:', API_BASE)

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
  return await res.text()
}

/**
 * Get authorization token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem('authToken')
}

/**
 * Get headers with authorization
 */
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  }
}

/**
 * Create a new evaluator
 * @param {Object} evaluatorData - { email, username, password, department }
 */
export async function createEvaluator(evaluatorData) {
  console.log('➕ Creating new evaluator...', evaluatorData)
  
  // Validate password before sending
  if (!evaluatorData.password || evaluatorData.password.trim() === '') {
    console.error('❌ Password is empty!', evaluatorData)
    throw new Error('Password is required and cannot be empty')
  }
  
  if (!evaluatorData.email || evaluatorData.email.trim() === '') {
    console.error('❌ Email is empty!', evaluatorData)
    throw new Error('Email is required and cannot be empty')
  }
  
  if (!evaluatorData.username || evaluatorData.username.trim() === '') {
    console.error('❌ Username is empty!', evaluatorData)
    throw new Error('Username is required and cannot be empty')
  }
  
  const requestBody = {
    email: evaluatorData.email.trim(),
    username: evaluatorData.username.trim(),
    password: evaluatorData.password,
    department: (evaluatorData.department || '').trim()
  }
  
  const jsonBody = JSON.stringify(requestBody)
  console.log('📤 Request body (JSON):', jsonBody)
  console.log('📤 Request body (parsed):', requestBody)
  console.log('📋 Request headers:', getHeaders())
  console.log('🔗 Request URL:', `${API_BASE}/api/admin/evaluators/create`)
  
  const res = await fetch(`${API_BASE}/api/admin/evaluators/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: jsonBody
  })
  
  const data = await handleResponse(res)
  console.log('✅ Evaluator created successfully:', data)
  return data
}

/**
 * Get all evaluators for management
 */
export async function getEvaluators() {
  console.log('📋 Fetching evaluators from backend...')
  
  const res = await fetch(`${API_BASE}/api/admin/evaluators/manage`, {
    method: 'GET',
    headers: getHeaders()
  })
  
  const data = await handleResponse(res)
  console.log('✅ Evaluators fetched successfully:', data)
  return data
}

/**
 * Get all evaluators (alternative endpoint)
 */
export async function getAllEvaluators() {
  console.log('📋 Fetching all evaluators...')
  
  const res = await fetch(`${API_BASE}/api/admin/evaluators/all`, {
    method: 'GET',
    headers: getHeaders()
  })
  
  const data = await handleResponse(res)
  console.log('✅ All evaluators fetched successfully:', data)
  return data
}

/**
 * Get evaluator by ID
 */
export async function getEvaluatorById(id) {
  console.log(`📋 Fetching evaluator ${id}...`)
  
  const res = await fetch(`${API_BASE}/api/admin/evaluators/${id}`, {
    method: 'GET',
    headers: getHeaders()
  })
  
  return await handleResponse(res)
}

/**
 * Update an evaluator
 */
export async function updateEvaluator(id, evaluatorData) {
  console.log(`📝 Updating evaluator ${id}...`, evaluatorData)
  
  const res = await fetch(`${API_BASE}/api/admin/evaluators/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(evaluatorData)
  })
  
  return await handleResponse(res)
}

/**
 * Delete an evaluator
 */
export async function deleteEvaluator(id) {
  console.log(`🗑️ Deleting evaluator ${id}...`)
  
  const res = await fetch(`${API_BASE}/api/admin/evaluators/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  
  return await handleResponse(res)
}

/**
 * Get evaluator statistics
 */
export async function getEvaluatorStats() {
  console.log('📊 Fetching evaluator statistics...')
  
  const res = await fetch(`${API_BASE}/api/admin/evaluators/stats/summary`, {
    method: 'GET',
    headers: getHeaders()
  })
  
  return await handleResponse(res)
}
