import React, { useState } from 'react'
import StatBar from './StatBar.jsx'

export default function CarePanel({ state, onCare, onSpeak }){
  const [text, setText] = useState('')
  return (
    <div className="panel">
      <div className="grid2">
        <StatBar label="Affection" value={state.affection} max={30} />
        <StatBar label="Tempérament" value={state.temper} max={30} />
      </div>
      <div className="grid2" style={{ marginTop:8 }}>
        <StatBar label="Faim" value={state.hunger} />
        <StatBar label="Hygiène" value={state.hygiene} />
        <StatBar label="Fun" value={state.fun} />
        <StatBar label="Repos" value={state.rest} />
      </div>
      <div className="badges">
        <span className="badge">Énergie {state.energy}/10</span>
        <span className={"badge "+(state.mood<40?'warn':'')}>Humeur {Math.round(state.mood)}</span>
      </div>
      <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
        <button onClick={()=>onCare('feed')}>Nourrir</button>
        <button onClick={()=>onCare('wash')}>Laver</button>
        <button onClick={()=>onCare('play')}>Jouer</button>
        <button onClick={()=>onCare('sleep')}>Coucher</button>
      </div>
      <div className="composer">
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if (e.key==='Enter'){ onSpeak(text); setText('') }}} placeholder="Parle à ton dragon… (tu peux changer son élément: feu, eau, vent, terre, lumière, ombre)"/>
        <button className="primary" onClick={()=>{ onSpeak(text); setText('') }}>Parler</button>
      </div>
    </div>
  )
}
