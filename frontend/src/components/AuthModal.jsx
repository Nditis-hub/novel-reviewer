import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthModal({ open, onClose }) {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!open) return null

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else await signup(name, email, password)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'login' ? 'Log in' : 'Create your account'}</h3>
        <p>{mode === 'login' ? 'Welcome back.' : 'Takes a few seconds to get started.'}</p>
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {error && <p style={{ color: 'var(--rust)', fontSize: '0.82rem' }}>{error}</p>}
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Need an account?' : 'Have an account?'}
            </button>
            <button type="submit" className="btn btn-gold btn-sm" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}