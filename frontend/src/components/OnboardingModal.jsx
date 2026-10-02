import React, { useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { GENRES } from '../genres.js'

export default function OnboardingModal({ open, onClose }) {
  const { token, refreshUser } = useAuth()
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  function toggle(genre) {
    setSelected((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  async function submit() {
    if (selected.length < 3) { setError('Pick at least 3 genres, or skip.'); return }
    setBusy(true)
    setError('')
    try {
      await api.onboarding({ genres: selected }, token)
      await refreshUser()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function skip() {
    setBusy(true)
    try {
      await api.onboarding({ skip: true }, token)
      await refreshUser()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-back">
      <div className="modal" style={{ maxWidth: 420 }}>
        <h3>What do you like to read?</h3>
        <p>Pick at least 3 — we'll use these to pull in your first recommendations. You can always shape this more later just by rating books.</p>

        <div className="chip-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              className={`chip ${selected.includes(genre) ? 'on' : ''}`}
              onClick={() => toggle(genre)}
            >
              {genre}
            </button>
          ))}
        </div>

        {error && <p style={{ color: 'var(--rust)', fontSize: '0.82rem', marginBottom: 12 }}>{error}</p>}

        <div className="row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={skip} disabled={busy}>
            Skip for now
          </button>
          <button type="button" className="btn btn-gold btn-sm" onClick={submit} disabled={busy}>
            {busy ? 'Setting up…' : `Continue (${selected.length} picked)`}
          </button>
        </div>
      </div>
    </div>
  )
}