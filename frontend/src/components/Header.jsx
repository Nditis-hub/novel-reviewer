import React, { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Cover from './Cover.jsx'
import { GENRES } from '../genres.js'

export default function Header({ genres, trendingGenre, onGenreChange, trendingBooks, onOpenBook, onOpenAuth, onOpenSettings }) {
  const { user, logout, token } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [externalResults, setExternalResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) { setResults([]); setExternalResults([]); setShowResults(false); return }
    const handle = setTimeout(async () => {
      setSearching(true)
      try {
        const local = await api.listBooks({ search: q })
        setResults(local.slice(0, 8))
        if (local.length === 0) {
          const external = await api.searchExternal(q)
          setExternalResults(external.filter((b) => !b.already_in_library).slice(0, 6))
        } else {
          setExternalResults([])
        }
      } catch {
        setResults([])
        setExternalResults([])
      } finally {
        setSearching(false)
        setShowResults(true)
      }
    }, 250)
    return () => clearTimeout(handle)
  }, [query])

  async function addExternalBook(candidate) {
    if (!token) { onOpenAuth(); return }
    try {
      const { book } = await api.importBook(candidate, token)
      onOpenBook(book.id)
      setShowResults(false)
      setQuery('')
    } catch (err) {
      alert(err.message)
    }
  }

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowResults(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <header>
      <div className="wrap header-row1">
        <div className="logo"></div>

        <div className="search-wrap" ref={wrapRef}>
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder="Search title or author…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && setShowResults(true)}
              autoComplete="off"
            />
          </div>
          {showResults && (
            <div className="search-results">
              {results.map((b) => (
                <div key={b.id} className="sr-item" onClick={() => { onOpenBook(b.id); setShowResults(false) }}>
                  <Cover book={b} />
                  <div className="sr-meta">
                    <div className="sr-title">{b.title}</div>
                    <div className="sr-by">{b.author} · {b.genre}</div>
                  </div>
                </div>
              ))}
              {results.length === 0 && externalResults.length === 0 && !searching && (
                <div className="sr-empty">No books match "{query.trim()}".</div>
              )}
              {externalResults.length > 0 && (
                <>
                  <div className="sr-empty" style={{ borderBottom: '1px solid var(--border)' }}>Not in your library yet — tap to add:</div>
                  {externalResults.map((b) => (
                    <div key={b.external_id} className="sr-item" onClick={() => addExternalBook(b)}>
                      <Cover book={b} />
                      <div className="sr-meta">
                        <div className="sr-title">{b.title}</div>
                        <div className="sr-by">{b.author} · {b.genre}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="cat-inline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="12" y2="18" />
          </svg>
          <select value={trendingGenre} onChange={(e) => onGenreChange(e.target.value)}>
            <option value="">All categories</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

               <div className="header-actions">
          <button className="icon-btn" onClick={onOpenSettings} aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>


          {user ? (
            <button className="profile-btn" onClick={logout} title="Click to log out">
              <span className="avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
              {user.name}
            </button>
          ) : (
            <button className="profile-btn" onClick={onOpenAuth}>
              <span className="avatar">?</span>
              Sign in
            </button>
          )}
        </div>
      </div>

      <div className="wrap header-row2">
        <TrendingCarousel books={trendingBooks} onOpenBook={onOpenBook} />
      </div>

      <div className="wrap quicknav">
        <a href="#readinglist">Reading list</a>
        <a href="#currentread">Current read</a>
        <a href="#recommendations">Recommendations</a>
      </div>
    </header>
  )
}

function TrendingCarousel({ books, onOpenBook }) {
  const trackRef = useRef(null)
  function scroll(dir) {
    trackRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' })
  }
  return (
    <div className="carousel">
      <button className="car-arrow" onClick={() => scroll(-1)} aria-label="Scroll trending left">‹</button>
      <div className="carousel-track" ref={trackRef}>
        {books.length === 0 ? (
          <div className="empty-note">No books here yet — search for one, or sign up and pick some genres to get started.</div>
        ) : books.map((b) => (
          <div key={b.id} className="car-item" onClick={() => onOpenBook(b.id)}>
            <Cover book={b} />
            <div className="car-title">{b.title}</div>
          </div>
        ))}
      </div>
      <button className="car-arrow" onClick={() => scroll(1)} aria-label="Scroll trending right">›</button>
    </div>
  )
}