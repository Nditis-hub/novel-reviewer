import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Cover from './Cover.jsx'
import Stars from './Stars.jsx'

export default function BookPanel({ bookId, shelfStatus, onClose, onShelfChange, onRequireAuth, onReviewPosted }) {
  const { token } = useAuth()
  const [book, setBook] = useState(null)
  const [reviewSort, setReviewSort] = useState('highest')
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!bookId) return
    setBook(null)
    setRating(0)
    setText('')
    setError('')
    api.bookDetail(bookId).then(setBook).catch((e) => setError(e.message))
  }, [bookId])

  if (!bookId) return null

  async function submitReview() {
    if (!token) { onRequireAuth(); return }
    if (!rating) { setError('Pick a star rating first.'); return }
    setPosting(true)
    setError('')
    try {
      await api.postReview(bookId, { rating, text: text.trim() }, token)
      const fresh = await api.bookDetail(bookId)
      setBook(fresh)
      setText('')
      setRating(0)
      onReviewPosted()
    } catch (e) {
      setError(e.message)
    } finally {
      setPosting(false)
    }
  }

  function toggleStatus(status) {
    if (!token) { onRequireAuth(); return }
    onShelfChange(bookId, shelfStatus === status ? null : status)
  }

  const reviews = book ? [...book.reviews].sort((a, b) =>
    reviewSort === 'highest' ? b.rating - a.rating : new Date(b.created_at) - new Date(a.created_at)
  ) : []

  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <div className="panel">
        <button className="panel-close" onClick={onClose}>&times;</button>
        {!book ? (
          <p>Loading…</p>
        ) : (
          <div>
            <Cover book={book} />
            <h2>{book.title}</h2>
            <div className="by">by {book.author}</div>
            <div className="facts">
              <span>{book.year}</span><span>{book.pages} pages</span><span>ISBN {book.isbn}</span>
            </div>
            <Stars avg={book.avg_rating} count={book.review_count} />

            <p className="desc">{book.description}</p>

            <div className="shelf-btn-row">
              <button className={`shelf-btn ${shelfStatus === 'want' ? 'on' : ''}`} onClick={() => toggleStatus('want')}>Want to read</button>
              <button className={`shelf-btn ${shelfStatus === 'reading' ? 'on' : ''}`} onClick={() => toggleStatus('reading')}>Currently reading</button>
              <button className={`shelf-btn ${shelfStatus === 'read' ? 'on' : ''}`} onClick={() => toggleStatus('read')}>Read</button>
            </div>

            <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>Rate it</h3>
            <div className="rate-row">
              <div className="star-input">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}>★</span>
                ))}
              </div>
            </div>
            <div className="review-form">
              <textarea placeholder="What did you think?" value={text} onChange={(e) => setText(e.target.value)} />
              {error && <p style={{ color: 'var(--rust)', fontSize: '0.82rem', marginTop: 6 }}>{error}</p>}
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-gold btn-sm" onClick={submitReview} disabled={posting}>
                  {posting ? 'Posting…' : 'Post review'}
                </button>
              </div>
            </div>

            <div className="sort-reviews">
              <button className={`chip ${reviewSort === 'highest' ? 'on' : ''}`} onClick={() => setReviewSort('highest')}>Highest rated</button>
              <button className={`chip ${reviewSort === 'newest' ? 'on' : ''}`} onClick={() => setReviewSort('newest')}>Newest</button>
            </div>

            {reviews.map((r) => (
              <div key={r.id} className="review-item">
                <div className="rhead"><span>{r.author_name}</span><span>{new Date(r.created_at).toLocaleDateString()}</span></div>
                <div className="rstars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                <div>{r.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}