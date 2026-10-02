import React from 'react'
import Cover from './Cover.jsx'

export default function CurrentRead({ shelf, onOpenBook, onProgressChange }) {
  const items = shelf.filter((s) => s.status === 'reading')

  return (
    <section className="section" id="currentread">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>Current read</h2>
            <p className="hint">Progress bar under each book — update your page count any time.</p>
          </div>
        </div>
        <div className="h-row">
          {items.length === 0 ? (
            <div className="empty-note">Nothing in progress — mark a book "Currently reading" from its detail page to track it here.</div>
          ) : items.map((item) => {
            const pages = item.book.pages || 1
            const pct = Math.min(100, Math.round((item.progress / pages) * 100))
            return (
              <div key={item.book.id} className="current-card">
                <div onClick={() => onOpenBook(item.book.id)}><Cover book={item.book} /></div>
                <div className="meta">
                  <h4>{item.book.title}</h4>
                  <div className="by">{item.book.author}</div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                  <div className="progress-label">
                    <span>{item.progress}/{item.book.pages} pg</span>
                    <input
                      className="progress-input"
                      type="number"
                      min={0}
                      max={item.book.pages}
                      value={item.progress}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onProgressChange(item.book.id, Math.max(0, Math.min(item.book.pages, parseInt(e.target.value, 10) || 0)))}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}