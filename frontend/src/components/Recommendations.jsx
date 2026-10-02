import React from 'react'
import Cover from './Cover.jsx'
import Stars from './Stars.jsx'

export default function Recommendations({ note, books, loggedIn, onOpenBook }) {
  return (
    <section className="section" id="recommendations">
      <div className="wrap">
        <div className="section-head"><div><h2>Recommendations</h2></div></div>
        <div className="rec-note">
          {loggedIn ? note : 'Sign in and pick a few genres (or add books to your shelf) to get matched picks — no AI, just your own reading history.'}
        </div>
        <div className="h-row">
          {books.length === 0 ? (
            <div className="empty-note">Nothing to recommend yet.</div>
          ) : books.map((b) => (
            <div key={b.id} className="rec-card" onClick={() => onOpenBook(b.id)}>
              <Cover book={b} />
              <h4>{b.title}</h4>
              <div className="by">{b.author}</div>
              <Stars avg={b.avg_rating} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}