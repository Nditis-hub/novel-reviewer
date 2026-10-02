const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = (data && (data.detail || JSON.stringify(data))) || `Request failed (${res.status})`
    throw new Error(message)
  }
  return data
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),
  updateMe: (payload, token) => request('/auth/me', { method: 'PATCH', body: payload, token }),
  deleteAccount: (token) => request('/auth/me', { method: 'DELETE', token }),
  onboarding: (payload, token) => request('/auth/onboarding', { method: 'POST', body: payload, token }),

  listBooks: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
    return request(`/books${q ? `?${q}` : ''}`)
  },
  trending: (genre, limit = 10) => {
    const q = new URLSearchParams()
    if (genre) q.set('genre', genre)
    q.set('limit', limit)
    return request(`/books/trending?${q.toString()}`)
  },
  genres: () => request('/books/genres'),
  searchExternal: (q, source = 'google', maxResults = 8) => {
    const params = new URLSearchParams({ q, source, max_results: maxResults })
    return request(`/books/search-external?${params.toString()}`)
  },
  importBook: (payload, token) => request('/books/import', { method: 'POST', body: payload, token }),
  bookDetail: (id) => request(`/books/${id}`),
  postReview: (id, payload, token) => request(`/books/${id}/reviews`, { method: 'POST', body: payload, token }),

  getShelf: (token) => request('/shelf', { token }),
  upsertShelf: (bookId, status, token) =>
    request('/shelf', { method: 'POST', body: { book_id: bookId, status }, token }),
  patchShelf: (bookId, payload, token) =>
    request(`/shelf/${bookId}`, { method: 'PATCH', body: payload, token }),
  removeShelf: (bookId, token) => request(`/shelf/${bookId}`, { method: 'DELETE', token }),

  recommendations: (token) => request('/recommendations', { token }),
}