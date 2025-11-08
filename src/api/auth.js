const API_BASE = import.meta.env.VITE_API_URL || 'http://saraconference-production.up.railway.app:8069'

console.log('🔐 Auth API Base URL:', API_BASE)

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = (data && data.message) || res.statusText || 'Request failed'
    const error = new Error(err)
    error.status = res.status
    error.body = data
    throw error
  }
  return data
}

/**
 * Register a new user
 * Backend expects: AuthRequest { username, email, password, role }
 * Returns: AuthResponse { message, success, ... }
 */
export async function register({ username, email, password, role }) {
  const payload = { username, email, password, role }
  console.log('🌐 API: Sending register request with payload:', { ...payload, password: '***' })
  return postJson('/api/auth/register', payload)
}

/**
 * Login user
 * Backend expects: LoginRequest { email, password, role }
 * Returns: LoginResponse { message, email, role }
 */
export async function login({ email, password, role }) {
  const payload = { email, password, role }
  console.log('🌐 API: Sending login request with payload:', { ...payload, password: '***' })
  const response = await postJson('/api/auth/login', payload)
  console.log('🌐 API: Received login response:', response)
  return response
}

export default { login, register }