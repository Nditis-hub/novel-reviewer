import React, { useEffect, useState, useCallback } from 'react'
import { api } from './api.js'
import { useAuth } from './context/AuthContext.jsx'
import Header from './components/Header.jsx'
import ReadingList from './components/ReadingList.jsx'
import CurrentRead from './components/CurrentRead.jsx'
import Recommendations from './components/Recommendations.jsx'
import BookPanel from './components/BookPanel.jsx'
import AuthModal from './components/AuthModal.jsx'
import OnboardingModal from './components/OnboardingModal.jsx'
import SettingsModal from './components/SettingsModal.jsx'

export default function App() {
  const { token, user } = useAuth()

  const [genres, setGenres] = useState([])
  const [trendingGenre, setTrendingGenre] = useState('')
  const [trendingBooks, setTrendingBooks] = useState([])

  const [shelf, setShelf] = useState([])
  const [recNote, setRecNote] = useState('')
  const [recBooks, setRecBooks] = useState([])

  const [openBookId, setOpenBookId] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => { api.genres().then(setGenres).catch(() => {}) }, [])

  const loadTrending = useCallback(() => {
    api.trending(trendingGenre || undefined).then(setTrendingBooks).catch(() => {})
  }, [trendingGenre])
  useEffect(() => { loadTrending() }, [loadTrending])

  const loadShelf = useCallback(() => {
    if (!token) { setShelf([]); return }
    api.getShelf(token).then(setShelf).catch(() => {})
  }, [token])
  useEffect(() => { loadShelf() }, [loadShelf])

  const loadRecs = useCallback(() => {
    if (!token) { setRecBooks([]); setRecNote(''); return }
    api.recommendations(token).then((data) => { setRecNote(data.note); setRecBooks(data.books) }).catch(() => {})
  }, [token])
  useEffect(() => { loadRecs() }, [loadRecs])

  useEffect(() => { loadTrending() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  function shelfStatusFor(bookId) {
    const item = shelf.find((s) => s.book.id === bookId)
    return item ? item.status : null
  }

  async function handleShelfChange(bookId, status) {
    if (status === null) await api.removeShelf(bookId, token)
    else await api.upsertShelf(bookId, status, token)
    loadShelf()
    loadRecs()
  }

  async function handleRemoveFromList(bookId) {
    await api.removeShelf(bookId, token)
    loadShelf()
    loadRecs()
  }

  async function handleProgressChange(bookId, progress) {
    await api.patchShelf(bookId, { progress }, token)
    loadShelf()
  }

  const showOnboarding = !!user && !user.onboarding_completed

  return (
    <>
      <Header
        genres={genres}
        trendingGenre={trendingGenre}
        onGenreChange={setTrendingGenre}
        trendingBooks={trendingBooks}
        onOpenBook={setOpenBookId}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <section className="hero">
        <div className="wrap">
          <h1>Keep a record worth rereading.</h1>
          <p>Log what you're reading, rate it honestly, and find the next book by matching genres and history — no black box, just your own shelf talking back to you.</p>
        </div>
      </section>

      <main>
        <ReadingList shelf={shelf} onOpenBook={setOpenBookId} onRemove={handleRemoveFromList} />
        <CurrentRead shelf={shelf} onOpenBook={setOpenBookId} onProgressChange={handleProgressChange} />
        <Recommendations note={recNote} books={recBooks} loggedIn={!!user} onOpenBook={setOpenBookId} />
      </main>

      <BookPanel
        bookId={openBookId}
        shelfStatus={openBookId ? shelfStatusFor(openBookId) : null}
        onClose={() => setOpenBookId(null)}
        onShelfChange={handleShelfChange}
        onRequireAuth={() => setAuthOpen(true)}
        onReviewPosted={() => { loadTrending(); loadRecs() }}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <OnboardingModal open={showOnboarding} onClose={() => { loadTrending(); loadRecs() }} />
    </>
  )
}