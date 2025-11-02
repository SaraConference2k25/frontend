const API_BASE = import.meta.env.VITE_API_BASE || 'http://98.70.26.80:8069'

console.log('👥 Evaluators API Base URL:', API_BASE)

/**
 * Get all evaluators for management
 */
export async function getAllEvaluators() {
  try {
    console.log('📥 Fetching all evaluators...')
    const res = await fetch(`${API_BASE}/api/admin/evaluators/all`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    console.log('✅ Evaluators fetched:', data)
    return data
  } catch (err) {
    console.error('❌ Error fetching evaluators:', err)
    throw err
  }
}

/**
 * Get evaluators for management view
 */
export async function getEvaluatorsForManagement() {
  try {
    console.log('📥 Fetching evaluators for management...')
    const res = await fetch(`${API_BASE}/api/admin/evaluators/manage`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    console.log('✅ Management evaluators fetched:', data)
    return data
  } catch (err) {
    console.error('❌ Error fetching management evaluators:', err)
    throw err
  }
}

/**
 * Get evaluator by ID
 */
export async function getEvaluatorById(id) {
  try {
    console.log(`📥 Fetching evaluator ${id}...`)
    const res = await fetch(`${API_BASE}/api/admin/evaluators/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    console.log(`✅ Evaluator ${id} fetched:`, data)
    return data
  } catch (err) {
    console.error(`❌ Error fetching evaluator ${id}:`, err)
    throw err
  }
}

/**
 * Create a new evaluator
 * Expects: { username, email, password, department, expertise, ... }
 */
export async function createEvaluator(evaluatorData) {
  try {
    console.log('📤 Creating evaluator:', { ...evaluatorData, password: '***' })
    const res = await fetch(`${API_BASE}/api/admin/evaluators/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evaluatorData)
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    console.log('✅ Evaluator created successfully:', data)
    return data
  } catch (err) {
    console.error('❌ Error creating evaluator:', err)
    throw err
  }
}

/**
 * Update an existing evaluator
 */
export async function updateEvaluator(id, evaluatorData) {
  try {
    console.log(`📤 Updating evaluator ${id}:`, evaluatorData)
    const res = await fetch(`${API_BASE}/api/admin/evaluators/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evaluatorData)
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    console.log(`✅ Evaluator ${id} updated successfully:`, data)
    return data
  } catch (err) {
    console.error(`❌ Error updating evaluator ${id}:`, err)
    throw err
  }
}

/**
 * Delete an evaluator
 */
export async function deleteEvaluator(id) {
  try {
    console.log(`📤 Deleting evaluator ${id}...`)
    const res = await fetch(`${API_BASE}/api/admin/evaluators/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    console.log(`✅ Evaluator ${id} deleted successfully:`, data)
    return data
  } catch (err) {
    console.error(`❌ Error deleting evaluator ${id}:`, err)
    throw err
  }
}

/**
 * Get evaluator statistics summary
 */
export async function getEvaluatorStats() {
  try {
    console.log('📥 Fetching evaluator stats...')
    const res = await fetch(`${API_BASE}/api/admin/evaluators/stats/summary`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    console.log('✅ Evaluator stats fetched:', data)
    return data
  } catch (err) {
    console.error('❌ Error fetching evaluator stats:', err)
    throw err
  }
}

export default {
  getAllEvaluators,
  getEvaluatorsForManagement,
  getEvaluatorById,
  createEvaluator,
  updateEvaluator,
  deleteEvaluator,
  getEvaluatorStats
}
