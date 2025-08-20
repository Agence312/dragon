import React from 'react'
export default function StatBar({ label, value, max=100 }){
  const pct = Math.round((value/max)*100)
  return (
    <div className="stat">
      <div className="stat-top"><span>{label}</span><span>{value}/{max}</span></div>
      <div className="bar"><div className="fill" style={{ width: pct+'%' }}/></div>
    </div>
  )
}