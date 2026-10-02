import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('hazina_token') || null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!token)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    api.me(token)
      .then(setUser)
      .catch(() => { setToken(null); localStorage.removeItem('hazina_token') })
      .finally(() => setLoading(false))
  }, [token])

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password })
    localStorage.setItem('hazina_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const signup = useCallback(async (name, email, password) => {
    const data = await api.signup({ name, email, password })
    localStorage.setItem('hazina_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('hazina_token')
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!token) return
    const fresh = await api.me(token)
    setUser(fresh)
    return fresh
  }, [token])

  return (
    <AuthContext.Provider value={{ token, user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}