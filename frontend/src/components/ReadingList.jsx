import React, { useState } from 'react'
import Cover from './Cover.jsx'

export default function ReadingList({ shelf, onOpenBook, onRemove }) {
  const [tab, setTab] = useState('want')
  const items = shelf.filter((s) => s.status === tab)

  return (
    <section className="section" id="readinglist">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>Reading list</h2>
            <p className="hint">{tab === 'want' ? 'Books saved to read later.' : "Books you've marked as finished."}</p>
          </div>
          <div className="mini-tabs">
            <button className={`mini-tab ${tab === 'want' ? 'active' : ''}`} onClick={() => setTab('want')}>Want to read</button>
            <button className={`mini-tab ${tab === 'read' ? 'active' : ''}`} onClick={() => setTab('read')}>Already read</button>
          </div>
        </div>
        <div className="h-row">
          {items.length === 0 ? (
            <div className="empty-note">
              {tab === 'want' ? 'Nothing saved yet — open any book and add it to "Want to read."' : 'No finished books yet.'}
            </div>
          ) : items.map((item) => (
            <div key={item.book.id} className="shelf-card">
              <div className="cov-wrap">
                <div onClick={() => onOpenBook(item.book.id)}><Cover book={item.book} /></div>
                <button className="remove-x" title="Remove" onClick={() => onRemove(item.book.id)}>&times;</button>
              </div>
              <h4>{item.book.title}</h4>
              <div className="by">{item.book.author}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}