import React from 'react'

export function starString(avg) {
  const full = Math.round(avg || 0)
  let s = ''
  for (let i = 1; i <= 5; i++) s += i <= full ? '★' : '☆'
  return s
}

export default function Stars({ avg, count }) {
  return (
    <div className="stars">
      {starString(avg)}
      <span className="count">{(avg || 0).toFixed(1)}{count != null ? ` (${count})` : ''}</span>
    </div>
  )
}