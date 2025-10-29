const API_BASE = import.meta.env.VITE_API_BASE || ''

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
 * Backend expects: AuthRequest { fullName, email, password, role }
 * Returns: AuthResponse { message, success, ... }
 */
export async function register({ fullName, email, password, role }) {
  const payload = { fullName, email, password, role }
  console.log('🌐 API: Sending register request with payload:', { ...payload, password: '***' })
  return postJson('/api/auth/register', payload)
}

/**
 * Login user
 * Backend expects: LoginRequest { email, password, role }
 * Returns: LoginResponse { token?, user?, message?, ... }
 */
export async function login({ email, password, role }) {
  return postJson('/api/auth/login', { email, password, role })
}

export default { login, register }
