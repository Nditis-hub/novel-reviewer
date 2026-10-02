import React, { useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function SettingsModal({ open, onClose }) {
  const { user, token, refreshUser, logout } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!open) return null

  async function saveName() {
    setBusy(true)
    setError('')
    try {
      await api.updateMe({ name }, token)
      await refreshUser()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteAccount() {
    setBusy(true)
    setError('')
    try {
      await api.deleteAccount(token)
      logout()
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <h3>Settings</h3>
        <p>Hazina follows your device's light/dark setting automatically.</p>

        {user ? (
          <>
            <label style={{ fontSize: '0.8rem', color: 'var(--ink-dim)', display: 'block', marginBottom: 4 }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <label style={{ fontSize: '0.8rem', color: 'var(--ink-dim)', display: 'block', marginBottom: 4 }}>Email</label>
            <input value={user.email} disabled style={{ opacity: 0.6 }} />

            {error && <p style={{ color: 'var(--rust)', fontSize: '0.82rem' }}>{error}</p>}

            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 22 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
              <button type="button" className="btn btn-gold btn-sm" onClick={saveName} disabled={busy}>
                {busy ? 'Saving…' : 'Save name'}
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <p style={{ color: 'var(--rust)', fontSize: '0.85rem', marginBottom: 10 }}>Danger zone</p>
              {!confirmDelete ? (
                <button type="button" className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--rust)', color: 'var(--rust)' }} onClick={() => setConfirmDelete(true)}>
                  Delete my account
                </button>
              ) : (
                <>
                  <p style={{ fontSize: '0.82rem', marginBottom: 10 }}>
                    This permanently deletes your account, shelf, and reviews. This can't be undone.
                  </p>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
                    <button type="button" className="btn btn-sm" style={{ background: 'var(--rust)', color: '#fff' }} onClick={deleteAccount} disabled={busy}>
                      {busy ? 'Deleting…' : 'Yes, delete it'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}