import React from 'react'

export default function Cover({ book, className = '' }) {
  if (book.cover_image_url) {
    return (
      <div className={`cover has-image ${className}`}>
        <img src={book.cover_image_url} alt={book.title} loading="lazy" />
      </div>
    )
  }
  const bg = `linear-gradient(155deg, ${book.cover_color_from}, ${book.cover_color_to})`
  return (
    <div className={`cover ${className}`} style={{ background: bg }}>
      <div className="genre-tag">{book.genre}</div>
      <div className="cov-title">{book.title}</div>
    </div>
  )
}